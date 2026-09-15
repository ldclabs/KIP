---------------------------- MODULE KipTransactions ----------------------------
(***************************************************************************)
(* KIP 2.0 transaction runtime — TLA+ model of                             *)
(*   §32   Transactions (atomic commit, no_effect)                         *)
(*   §33   Commit Record (ordered, state-changing only)                    *)
(*   §34   Idempotency (retained outcomes, same key ⇒ same outcome)        *)
(*   §35   EXPECT VERSION preconditions, version increments                *)
(*   §36   Change Stream (space_seq dense and monotone)                    *)
(*                                                                         *)
(* The commit itself is modeled as one atomic step (that is §32.1's        *)
(* engine obligation, assumed here). What the model verifies is the        *)
(* protocol logic layered on that assumption, under full concurrency of   *)
(* several clients:                                                        *)
(*                                                                         *)
(*   LogExpectationsConsistent — every committed guarded write observed    *)
(*       exactly the version it expected (no lost update).                 *)
(*   AnswersConsistent — one idempotency key never yields two different    *)
(*       successful outcomes (§34.3, including no_effect outcomes §32.8).  *)
(*   SeqDense — space_seq is allocated densely, only by state-changing     *)
(*       commits, and equals the Commit Record index (§33.1, §36).         *)
(*   IdemUniqueCommit — at most one Commit Record per idempotency key.     *)
(*                                                                         *)
(* Two CONSTANT switches inject documented implementation bugs:           *)
(*   CommitTimeValidation = FALSE  — validate EXPECT VERSION against the   *)
(*       prepare-time snapshot instead of commit-time state (a TOCTOU      *)
(*       bug; §32.3 phase 12 forbids this). Expected: TLC finds a lost     *)
(*       update violating LogExpectationsConsistent.                       *)
(*   RetainNoEffect = FALSE — do not retain no_effect outcomes under the   *)
(*       idempotency key (a plausible misreading of §32.8 "not state-      *)
(*       changing" + §33.1 "state-changing commits append records").       *)
(*       Expected: TLC shows the same key answering no_effect and then     *)
(*       committed — violating §34.3.                                      *)
(***************************************************************************)
EXTENDS Naturals, Sequences, FiniteSets, TLC

CONSTANTS Clients, Elements, Vals, Keys,
          CommitTimeValidation, RetainNoEffect

NoReq   == [key |-> "none"]
Unset   == "unset"

(* all non-empty partial write maps over Elements *)
WriteMaps == UNION { [D -> Vals] : D \in (SUBSET Elements \ {{}}) }

VARIABLES
  ver,       \* Elements -> Nat        : _system.version (0 = never written)
  val,       \* Elements -> Vals+Unset : current value
  spaceSeq,  \* Nat                    : §5.4 space sequence
  log,       \* Seq of commit records  : §33.1 (state-changing only)
  idem,      \* Keys -> retained outcome or "none" : §34 retention store
  keyReq,    \* Keys -> first request digest bound to the key (or "none")
  answers,   \* Keys -> set of outcomes ever returned for the key
  pc,        \* Clients -> "idle" | "ready"
  req        \* Clients -> prepared request or NoReq

vars == <<ver, val, spaceSeq, log, idem, keyReq, answers, pc, req>>

TypeOK ==
  /\ ver \in [Elements -> Nat]
  /\ val \in [Elements -> Vals \cup {Unset}]
  /\ spaceSeq \in Nat
  /\ pc \in [Clients -> {"idle", "ready"}]

Init ==
  /\ ver = [e \in Elements |-> 0]
  /\ val = [e \in Elements |-> Unset]
  /\ spaceSeq = 0
  /\ log = <<>>
  /\ idem = [k \in Keys |-> "none"]
  /\ keyReq = [k \in Keys |-> "none"]
  /\ answers = [k \in Keys |-> {}]
  /\ pc = [c \in Clients |-> "idle"]
  /\ req = [c \in Clients |-> NoReq]

(***************************************************************************)
(* Prepare: client builds a request. If guarded, EXPECT VERSION values are *)
(* the versions read from the snapshot at prepare time (part of the        *)
(* request bytes). A key already bound must be reused with the identical   *)
(* request (§34.3 same key / same request; §34.4 conflict case omitted).   *)
(***************************************************************************)
Prepare(c) ==
  /\ pc[c] = "idle"
  /\ \E k \in Keys, w \in WriteMaps, g \in BOOLEAN :
       LET exp == IF g THEN [e \in DOMAIN w |-> ver[e]] ELSE "none"
           d   == ToString(<<k, w, g, exp>>)   \* request digest (string)
       IN /\ keyReq[k] \in {"none", d}
          /\ req' = [req EXCEPT ![c] =
                       [key |-> k, w |-> w, g |-> g, exp |-> exp]]
          /\ keyReq' = [keyReq EXCEPT ![k] = d]
          /\ pc' = [pc EXCEPT ![c] = "ready"]
  /\ UNCHANGED <<ver, val, spaceSeq, log, idem, answers>>

(***************************************************************************)
(* Submit: one atomic transaction attempt (§32.3 phases fused).            *)
(***************************************************************************)

ValidationOK(r) ==
  IF r.g = FALSE THEN TRUE
  ELSE IF CommitTimeValidation
       THEN \A e \in DOMAIN r.w : r.exp[e] = ver[e]        \* §32.3 phase 12
       ELSE TRUE   \* BUG: exp was copied from the snapshot, so
                   \* snapshot-time validation is vacuously true

NoEffect(r) == \A e \in DOMAIN r.w : val[e] = r.w[e]        \* §32.8

Replay(c, r) ==     \* §34.3: same key, same request ⇒ retained outcome
  /\ idem[r.key] /= "none"
  /\ answers' = [answers EXCEPT ![r.key] = @ \cup {idem[r.key]}]
  /\ UNCHANGED <<ver, val, spaceSeq, log, idem, keyReq>>

Abort(c, r) ==      \* precondition failed: no durable effect, not retained
  /\ idem[r.key] = "none"
  /\ ~ValidationOK(r)
  /\ answers' = [answers EXCEPT ![r.key] = @ \cup {"aborted"}]
  /\ UNCHANGED <<ver, val, spaceSeq, log, idem, keyReq>>

NoEffectCommit(c, r) ==   \* §32.8: unchanged state, no space_seq, no record
  /\ idem[r.key] = "none"
  /\ ValidationOK(r)
  /\ NoEffect(r)
  /\ answers' = [answers EXCEPT ![r.key] = @ \cup {"no_effect"}]
  /\ idem' = IF RetainNoEffect
               THEN [idem EXCEPT ![r.key] = "no_effect"]
               ELSE idem      \* BUG variant: outcome not retained
  /\ UNCHANGED <<ver, val, spaceSeq, log, keyReq>>

EffectCommit(c, r) ==     \* atomic commit: apply all writes, one seq, one record
  /\ idem[r.key] = "none"
  /\ ValidationOK(r)
  /\ ~NoEffect(r)
  /\ val' = [e \in Elements |-> IF e \in DOMAIN r.w THEN r.w[e] ELSE val[e]]
  /\ ver' = [e \in Elements |->
               IF e \in DOMAIN r.w THEN ver[e] + 1 ELSE ver[e]]   \* §35.5
  /\ spaceSeq' = spaceSeq + 1
  /\ log' = Append(log, [key  |-> r.key,
                         elems|-> DOMAIN r.w,
                         g    |-> r.g,
                         exp  |-> r.exp,
                         seq  |-> spaceSeq + 1])
  /\ idem' = [idem EXCEPT ![r.key] = "committed"]
  /\ answers' = [answers EXCEPT ![r.key] = @ \cup {"committed"}]
  /\ UNCHANGED keyReq

Submit(c) ==
  /\ pc[c] = "ready"
  /\ LET r == req[c] IN
       \/ Replay(c, r)
       \/ Abort(c, r)
       \/ NoEffectCommit(c, r)
       \/ EffectCommit(c, r)
  /\ pc' = [pc EXCEPT ![c] = "idle"]
  /\ req' = [req EXCEPT ![c] = NoReq]

Next == \E c \in Clients : Prepare(c) \/ Submit(c)

Spec == Init /\ [][Next]_vars

----------------------------------------------------------------------------
(* Invariants *)

(* §35: every committed guarded write observed the version it expected;    *)
(* equivalently the k-th commit writing element e expected version k-1.    *)
VersionBefore(i, e) == Cardinality({ j \in 1..(i-1) : e \in log[j].elems })

LogExpectationsConsistent ==
  \A i \in 1..Len(log) :
    log[i].g => \A e \in log[i].elems : log[i].exp[e] = VersionBefore(i, e)

(* §34.3 + §32.8: one key never yields two different successful outcomes *)
AnswersConsistent ==
  \A k \in Keys : Cardinality(answers[k] \cap {"committed", "no_effect"}) <= 1

(* §33.1/§36: dense gapless sequencing by state-changing commits only *)
SeqDense ==
  /\ spaceSeq = Len(log)
  /\ \A i \in 1..Len(log) : log[i].seq = i

(* §34: at most one Commit Record per idempotency key *)
IdemUniqueCommit ==
  \A k \in Keys : Cardinality({ i \in 1..Len(log) : log[i].key = k }) <= 1

(* versions only reflect committed writes *)
VersionsMatchLog ==
  \A e \in Elements : ver[e] = Cardinality({ i \in 1..Len(log) : e \in log[i].elems })

StateBound ==
  /\ spaceSeq <= 3
  /\ \A e \in Elements : ver[e] <= 3

============================================================================
