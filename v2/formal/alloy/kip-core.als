// ===========================================================================
// KIP 2.0 Core Data Model — Alloy 6 temporal model
// ===========================================================================
// Models the operational semantics of KIP-2.0-SPECIFICATION.md:
//   §5.3  Same-Space closure
//   §11   Concept Merge (non-destructive, canonical resolution)
//   §12   Proposition (immutable tuple, canonical uniqueness)
//   §13   Assertion (one proposition, immutable payload)
//   §14   Assertion Lifecycle (active/retracted/superseded/expired)
//   §23   Epistemic Independence (root conservation, no evidence
//         multiplication)
//   §29.6 derive (authority non-amplification)
//   §31.4 Imported Skills default inactive
//   §31.5 Origin-Bound Authority
//
// Element tuple fields (subject/predicate/object, derivedFrom, roots,
// importedFrom, space, origin) are modeled as *static* Alloy fields:
// spec-mandated immutability (§12.5, §13.7, §6.3) holds by construction.
// Mutable state (lifecycle, merge pointers, authority, the set of created
// elements) is modeled with `var` and evolves via events.
//
// Commands at the bottom encode the verification obligations. `check`
// commands are theorems expected to hold; `run` commands are expected-SAT
// witness traces (including one demonstrating an underspecification
// finding: merge cycles are not prohibited by §11 as written).
// ===========================================================================

module kip_core

// ---------------------------------------------------------------------------
// Static universe
// ---------------------------------------------------------------------------

sig Space {}
sig Principal {}
sig Predicate {}
sig Literal {}
sig Root {}                     // §23.3 provenance roots (external epistemic mass)
sig Capsule { capRoot: one Root } // one corroboration group per import capsule (§23.4)

// capsule roots are never local-observation roots
fact CapsuleRootsDistinct { all disj c1, c2: Capsule | c1.capRoot != c2.capRoot }

abstract sig AuthorityClass { rank: one Int }
one sig Descriptive, Advisory, Behavioral, Executable extends AuthorityClass {}
fact AuthorityRanks {
  Descriptive.rank = 0 and Advisory.rank = 1 and
  Behavioral.rank = 2 and Executable.rank = 3
}

abstract sig Status {}
one sig Active, Retracted, Superseded, Expired extends Status {}

// ---------------------------------------------------------------------------
// Cognitive Elements (§6.1)
// ---------------------------------------------------------------------------

abstract sig Element {
  space: one Space,               // §5.2 one home Space
  origin: one Principal,          // §6.3 engine origin — static ⇒ non-author-writable
  derivedFrom: set Element,       // §16 provenance inputs, fixed at creation
  importedFrom: lone Capsule,     // present iff element entered via capsule import
  var authority: one AuthorityClass  // §31.3 memory authority class
}

sig Concept extends Element {
  var merged_into: lone Concept   // §11.1
}

sig Proposition extends Element {
  subject: one Concept,           // §8.4 subject MUST NOT be a Literal
  predicate: one Predicate,
  objC: lone Concept,
  objL: lone Literal
}
fact PropositionObjectIsExactlyOne {
  all p: Proposition |
    (one p.objC and no p.objL) or (no p.objC and one p.objL)
}

sig Assertion extends Element {
  proposition: one Proposition,   // §13.1 exactly one Proposition
  evidence: set Evidence,         // §13.2 evidence (initial, immutable §13.7)
  var status: one Status,
  var superseded_by: lone Assertion
}

sig Evidence extends Element {
  roots: set Root                 // §23 independent roots this Evidence transmits
}

// created elements; grows monotonically (physical purge out of scope)
var sig Live in Element {}
// audit set of authority elevations (§29 `elevate_authority`)
var sig Elevated in Element {}

// ---------------------------------------------------------------------------
// Canonical resolution (§11)
// ---------------------------------------------------------------------------

fun canon[c: Concept]: set Concept {
  { x: Concept | x in c.*merged_into and no x.merged_into }
}

// two live Propositions collide on the same canonical tuple (§12.3/§11.4)
pred dupCanonTuple {
  some disj p, q: Proposition & Live {
    p.space = q.space
    p.predicate = q.predicate
    canon[p.subject] = canon[q.subject]
    some canon[p.subject]
    (some p.objC and some q.objC and canon[p.objC] = canon[q.objC] and some canon[p.objC])
      or (some p.objL and p.objL = q.objL)
  }
}

// creation-time guard: proposition p would not duplicate an existing tuple
pred freshCanonTuple[p: Proposition] {
  no q: Proposition & Live {
    q.space = p.space
    q.predicate = p.predicate
    canon[q.subject] = canon[p.subject]
    (some q.objC and some p.objC and canon[q.objC] = canon[p.objC])
      or (some q.objL and some p.objL and q.objL = p.objL)
  }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

pred frameLive      { Live' = Live }
pred frameElevated  { Elevated' = Elevated }
pred frameStatus    { status' = status }
pred frameSuperseded{ superseded_by' = superseded_by }
pred frameMerge     { merged_into' = merged_into }
pred frameAuthority { authority' = authority }

pred stutter {
  frameLive and frameElevated and frameStatus
  and frameSuperseded and frameMerge and frameAuthority
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

fact Init {
  no Live
  no Elevated
  all a: Assertion | a.status = Active and no a.superseded_by
  all c: Concept | no c.merged_into
  all e: Element | e.authority = Descriptive
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

// local primary Concept creation
pred createConcept[c: Concept] {
  c not in Live
  no c.importedFrom
  no c.derivedFrom
  Live' = Live + c
  some x: AuthorityClass | authority' = authority ++ c -> x
  frameElevated and frameStatus and frameSuperseded and frameMerge
}

// canonical Proposition creation (§12.4 uniqueness at creation)
pred createProposition[p: Proposition] {
  p not in Live
  no p.importedFrom
  no p.derivedFrom
  p.subject in Live
  p.subject.space = p.space                      // §5.3
  some p.objC implies (p.objC in Live and p.objC.space = p.space)
  freshCanonTuple[p]
  Live' = Live + p
  authority' = authority ++ p -> Descriptive
  frameElevated and frameStatus and frameSuperseded and frameMerge
}

// primary Assertion creation (§13)
pred createAssertion[a: Assertion] {
  a not in Live
  no a.importedFrom
  no a.derivedFrom
  a.proposition in Live
  a.proposition.space = a.space                  // §5.3
  a.evidence in Live
  all ev: a.evidence | ev.space = a.space        // §5.3
  Live' = Live + a
  authority' = authority ++ a -> Descriptive
  frameElevated and frameStatus and frameSuperseded and frameMerge
}

// primary local Evidence: one fresh root (§23.3 direct observation)
pred createPrimaryEvidence[e: Evidence] {
  e not in Live
  no e.importedFrom
  no e.derivedFrom
  one e.roots
  no (e.roots & (Live & Evidence).roots)         // fresh
  no (e.roots & Capsule.capRoot)
  Live' = Live + e
  some x: AuthorityClass | authority' = authority ++ e -> x
  frameElevated and frameStatus and frameSuperseded and frameMerge
}

// derivation (§16 Activity output; §29.6 derive):
//   - roots conserved (§23.1/§23.2)
//   - authority non-amplification
pred createDerived[e: Element] {
  e not in Live
  no e.importedFrom
  some e.derivedFrom
  e.derivedFrom in Live
  all i: e.derivedFrom | i.space = e.space       // §5.3
  e in Concept + Evidence + Assertion
  e in Evidence implies e.roots in (e.derivedFrom & Evidence).roots
  // Same-Space closure must be revalidated on the DERIVED write path too:
  // guarding only primary createAssertion is insufficient (§5.3 + §32.3
  // phase 10). Removing the two space guards below lets the model checker
  // produce a derived Assertion whose proposition lives in a foreign Space
  // (this was found by an earlier C4 counterexample).
  e in Assertion implies {
    e.proposition in Live
    e.evidence in Live
    e.proposition.space = e.space
    all ev: e.evidence | ev.space = e.space
  }
  some x: AuthorityClass {
    all i: e.derivedFrom | x.rank =< i.authority.rank
    authority' = authority ++ e -> x
  }
  Live' = Live + e
  frameElevated and frameStatus and frameSuperseded and frameMerge
}

// ADVERSARIAL variant: derivation that ignores input authority
// (models an implementation that violates §29.6 authority non-amplification)
pred createDerivedBuggy[e: Element] {
  e not in Live
  no e.importedFrom
  some e.derivedFrom
  e.derivedFrom in Live
  all i: e.derivedFrom | i.space = e.space
  e in Concept + Evidence
  e in Evidence implies e.roots in (e.derivedFrom & Evidence).roots
  some x: AuthorityClass | authority' = authority ++ e -> x   // unconstrained!
  Live' = Live + e
  frameElevated and frameStatus and frameSuperseded and frameMerge
}

// capsule import (§37–41): imported cognition arrives attributed and
// epistemically collapsed to its capsule root (§23.4); authority floor (§31.4)
pred importElement[e: Element] {
  e not in Live
  some e.importedFrom
  no e.derivedFrom
  e in Concept + Evidence
  e in Evidence implies e.roots = e.importedFrom.capRoot
  Live' = Live + e
  authority' = authority ++ e -> Descriptive     // §31.4 default inactive/low
  frameElevated and frameStatus and frameSuperseded and frameMerge
}

// explicit authorized elevation (§29 `elevate_authority`, §31.5)
pred elevate[e: Element] {
  e in Live
  some x: AuthorityClass {
    x.rank > e.authority.rank
    authority' = authority ++ e -> x
  }
  Elevated' = Elevated + e
  frameLive and frameStatus and frameSuperseded and frameMerge
}

// assertion lifecycle (§14)
pred retract[a: Assertion] {
  a in Live
  a.status = Active
  status' = status ++ a -> Retracted
  frameLive and frameElevated and frameSuperseded and frameMerge and frameAuthority
}

pred expire[a: Assertion] {
  a in Live
  a.status = Active
  status' = status ++ a -> Expired
  frameLive and frameElevated and frameSuperseded and frameMerge and frameAuthority
}

pred supersede[old, new: Assertion] {
  old != new
  old in Live and new in Live
  old.status = Active
  new.status = Active
  new.proposition = old.proposition              // §14.2 compatible revision lineage
  status' = status ++ old -> Superseded
  superseded_by' = superseded_by + old -> new
  frameLive and frameElevated and frameMerge and frameAuthority
}

// concept merge exactly as §11 states it: "If Concept A is merged into
// Concept B: A remains addressable, A becomes merged, A.merged_into = B".
// The spec text imposes NO acyclicity guard — see run R2.
pred mergeConcepts[a, b: Concept] {
  a != b
  a in Live and b in Live
  a.space = b.space
  no a.merged_into                               // A not already merged
  merged_into' = merged_into + a -> b
  frameLive and frameElevated and frameStatus and frameSuperseded and frameAuthority
}

// repaired merge: forbids creating a resolution cycle
pred mergeConceptsGuarded[a, b: Concept] {
  a != b
  a in Live and b in Live
  a.space = b.space
  no a.merged_into
  a not in b.*merged_into                        // the missing guard
  merged_into' = merged_into + a -> b
  frameLive and frameElevated and frameStatus and frameSuperseded and frameAuthority
}

// ---------------------------------------------------------------------------
// Traces
// ---------------------------------------------------------------------------

pred coreStep {
  (some c: Concept | createConcept[c]) or
  (some p: Proposition | createProposition[p]) or
  (some a: Assertion | createAssertion[a]) or
  (some e: Evidence | createPrimaryEvidence[e]) or
  (some e: Element | createDerived[e]) or
  (some e: Element | importElement[e]) or
  (some e: Element | elevate[e]) or
  (some a: Assertion | retract[a]) or
  (some a: Assertion | expire[a]) or
  (some old, new: Assertion | supersede[old, new]) or
  stutter
}

pred specTrace        { always ( coreStep or (some a, b: Concept | mergeConcepts[a, b]) ) }
pred guardedTrace     { always ( coreStep or (some a, b: Concept | mergeConceptsGuarded[a, b]) ) }
pred noMergeTrace     { always coreStep }
pred buggyDeriveTrace { always ( coreStep or (some a, b: Concept | mergeConcepts[a, b])
                                          or (some e: Element | createDerivedBuggy[e]) ) }

// ---------------------------------------------------------------------------
// Verification obligations
// ---------------------------------------------------------------------------

// imported ancestry (self-or-transitive provenance input that came via capsule)
fun taintedAncestors[e: Element]: set Element {
  ({e} + e.^derivedFrom) & { x: Element | some x.importedFrom }
}

pred authorityInvariant {
  all e: Element & Live |
    (e.authority != Descriptive and some taintedAncestors[e])
      implies some (({e} + e.^derivedFrom) & Elevated)
}

pred sameSpaceClosure {
  all a: Assertion & Live {
    a.proposition.space = a.space
    all ev: a.evidence | ev.space = a.space
  }
  all p: Proposition & Live {
    p.subject.space = p.space
    some p.objC implies p.objC.space = p.space
  }
  all e: Element & Live | e.derivedFrom.space in e.space
}

// --- Theorems (expected: no counterexample) --------------------------------

// C1 §12.4 canonical uniqueness is an invariant in the absence of merges
check C1_CanonicalUniquenessWithoutMerge {
  noMergeTrace implies always not dupCanonTuple
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 3 Concept, 3 Proposition, 2 Assertion, 2 Evidence,
      7 steps

// C2 history is monotone: nothing ever disappears (purge excluded by scope)
check C2_LiveMonotone {
  specTrace implies always (Live in Live')
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 3 Concept, 2 Proposition, 3 Assertion, 2 Evidence,
      7 steps

// C3 §14 lifecycle: no resurrection of retracted/superseded/expired
check C3_NoLifecycleResurrection {
  specTrace implies
    always (all a: Assertion & Live |
      a.status != Active implies after a.status != Active)
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 3 Concept, 2 Proposition, 3 Assertion, 2 Evidence,
      7 steps

// C4 §5.3 same-space closure is preserved by every operation
check C4_SameSpaceClosure {
  specTrace implies always sameSpaceClosure
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 3 Concept, 3 Proposition, 3 Assertion, 3 Evidence,
      7 steps

// C5 the guarded merge repair restores acyclicity
check C5_GuardedMergeIsAcyclic {
  guardedTrace implies always (no c: Concept | c in c.^merged_into)
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 4 Concept, 2 Proposition, 2 Assertion, 2 Evidence,
      7 steps

// C6 §31.5/§29.6: no element with imported ancestry rises above Descriptive
// authority unless an explicit elevation occurred somewhere in its lineage
// scope note: sized to the minimal laundering chain (import → derive →
// derive → elevate) plus merge interaction; larger scopes exceed practical
// SAT budgets for this temporal property (see REPORT.md §2)
check C6_AuthorityRequiresElevation {
  specTrace implies always authorityInvariant
} for 4 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      3 Root, 1 Capsule, 2 Concept, 1 Proposition, 1 Assertion, 3 Evidence,
      6 steps

// C7 §23.1/§23.2: derivation never mints new epistemic roots
check C7_DerivedEvidenceRootConservation {
  specTrace implies
    always (all e: (Live' - Live) & Evidence |
      some e.derivedFrom implies e.roots in (Live & Evidence).roots)
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 2 Concept, 2 Proposition, 2 Assertion, 4 Evidence,
      6 steps

// --- Witness traces (expected: SAT) ----------------------------------------

// R1 §11.4 is reachable: a merge really can make two live Propositions
// collide on one canonical tuple (why the MAY-consolidate clause exists)
run R1_MergeInducedCollision {
  specTrace and eventually dupCanonTuple
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 4 Concept, 3 Proposition, 2 Assertion, 2 Evidence,
      8 steps

// R2 FINDING: §11 as written permits a merge cycle (A→B then B→A),
// which makes canonical resolution undefined (canon[] becomes empty)
run R2_MergeCycleReachable {
  specTrace and eventually (some c: Concept | c in c.^merged_into)
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 3 Concept, 2 Proposition, 2 Assertion, 2 Evidence,
      6 steps

// R3 necessity of §29.6: with a derive that ignores input authority,
// imported content is laundered into Executable authority with no elevation
run R3_LaunderingUnderBuggyDerive {
  buggyDeriveTrace and eventually not authorityInvariant
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 3 Concept, 2 Proposition, 2 Assertion, 3 Evidence,
      5 steps

// R4 §23.1 works: three supporting Evidence items can collapse to a single
// independent root (copy chains manufacture no corroboration)
run R4_CorroborationCollapse {
  specTrace and eventually (some p: Proposition & Live {
    #{ e: Evidence & Live | some a: Assertion & Live |
         a.proposition = p and a.status = Active and e in a.evidence } >= 3
    #{ r: Root | some a: Assertion & Live |
         a.proposition = p and a.status = Active and r in a.evidence.roots } = 1
  })
} for 5 but 2 Space, 2 Principal, 2 Predicate, 2 Literal,
      4 Root, 1 Capsule, 2 Concept, 2 Proposition, 2 Assertion, 4 Evidence,
      8 steps
