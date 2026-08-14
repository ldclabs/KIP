# KIP 2.0 Conformance Tests

**[English](./KIP-2.0-Conformance-Tests.md) | [中文](./KIP-2.0-Conformance-Tests_CN.md)**

## Status

**Normative Test Design / Pre-Executable Test Suite**

Target: `KIP-2.0-SPECIFICATION.md` (`2.0-draft`)

This document defines the canonical conformance-testing model for KIP 2.0.

Its purpose is not to prove that two Cognitive Nexus implementations use the same database, IDs, query planner, index, trust algorithm, or storage layout. Its purpose is to prove that independently implemented Nexuses preserve the same **observable protocol semantics**.

If this document conflicts with `KIP-2.0-SPECIFICATION.md`, the Specification takes precedence.

---

# 1. Conformance Philosophy

A KIP test MUST distinguish three kinds of assertions:

```text
Wire Assertion
    What did the protocol return?

Semantic Postcondition
    What durable cognitive state exists after the operation?

Forbidden Outcome
    What shortcut or unsafe state must not have occurred?
```

A test passes only when all three relevant dimensions pass.

Example:

```text
Test:
    "Assertion confidence is immutable"

Wire:
    UPDATE fails with EpistemicRevisionRequired or equivalent.

Postcondition:
    old Assertion still has confidence = 0.6.

Forbidden:
    engine silently rewrites old Assertion to confidence = 0.9.
```

This prevents an implementation from passing merely because its final query result "looks right" while its history, provenance, authority, or transaction semantics are wrong.

---

# 2. Test Result States

Every vector produces exactly one result:

```text
PASS
FAIL
SKIP_UNSUPPORTED
NOT_APPLICABLE
HARNESS_ERROR
```

`SKIP_UNSUPPORTED` is allowed only for OPTIONAL capabilities that the runtime does not advertise.

If a runtime advertises a capability, the corresponding optional test becomes mandatory.

---

# 3. Conformance Profile Declaration

Before execution, the implementation MUST declare its claimed profiles:

```json
{
  "kip_version": "2.0-draft",

  "profiles": [
    "KIP-Core",
    "KIP-Schema",
    "KIP-Epistemic",
    "KIP-Governance",
    "KIP-Transactions",
    "KIP-Capsule",
    "KIP-KQL",
    "KIP-KML",
    "KIP-META",
    "KIP-Runtime",
    "KIP-Historical",
    "KIP-High-Assurance"
  ],

  "optional_capabilities": {
    "belief_slot": true,
    "historical_reads": true,
    "semantic_search": true,
    "signed_receipts": false
  }
}
```

The runner SHOULD compare this declaration with `DESCRIBE PROTOCOL` and `DESCRIBE CAPABILITIES`.

---

# 4. Test Classes

## 4.1 Black-box

Uses only public KIP interfaces plus test-fixture reset/seeding.

## 4.2 Orchestrated concurrency

Requires test-only barriers around transaction phases.

Examples:

```text
pause before commit
revoke Grant
change Schema Environment
resume transaction
```

## 4.3 Fault injection

Requires controlled failures such as:

```text
drop response after commit
cancel before commit
force search index lag
expire cursor
expire Artifact handle
```

Harness hooks are not part of KIP and MUST NOT be required in production.

---

# 5. Conformance Harness Contract

A test harness SHOULD expose out-of-band equivalents of:

```text
reset_fixture(name)
seed_fixture(name)
resolve_binding(symbol)
invoke(principal, endpoint, request)
set_governance_fixture(name)
set_epistemic_policy(name)
advance_test_clock(time)
pause_transaction(request_or_tx, phase)
resume_transaction(request_or_tx)
drop_response_after_commit(request)
force_search_index_checkpoint(seq)
expire_cursor(cursor)
expire_artifact(handle)
```

Fixture loading SHOULD NOT use the same feature being tested. For example, KML tests SHOULD be seeded by an out-of-band fixture loader rather than by KML itself.

---

# 6. Machine-Readable Vector Shape

A future executable vector SHOULD be representable as:

```yaml
id: KIP2-CORE-001
title: Proposition existence is truth-neutral
level: MUST
class: black_box

profiles:
  - KIP-Core
  - KIP-KQL
  - KIP-Epistemic

fixture: epistemic_proposition_only
principal: reader_full
endpoint: readonly

steps:
  - command: |
      FIND(?p)
      WHERE {
        ?p (:alice, "timezone", "+08:00")
      }

  - command: |
      FIND(?belief)
      WHERE {
        ?belief BELIEF (:alice, "timezone", "+08:00")
      }

expect:
  raw_proposition_count: 1
  belief_status: insufficient

postconditions:
  - assertion_count_for_proposition: 0

forbidden:
  - automatic_assertion_creation
  - automatic_belief_persistence

spec_refs:
  - "§12"
  - "§21"
  - "§102 invariant 1"
```

---

# 7. Assertion Operators

A portable runner SHOULD support:

```text
equals
not_equals
present
absent
one_of
contains
not_contains
row_count
set_equals
set_contains
monotonic_gt
same_as_previous
different_from_previous
semantic_predicate
```

A `semantic_predicate` SHOULD be checked through public KQL/META where practical.

Examples:

```text
canonical_proposition_count(tuple) == 1
assertion_payload_unchanged(id)
no_state_change_since(seq)
change_envelope_count(tx_id) == 1
historical_raw_endpoint(id) == expected
```

---

# 8. Canonical Test Schema

The canonical test Schema Environment is:

```text
schema_env:test-v1
```

with Package:

```text
kip://test/core-domain@1.0.0
```

Types:

```text
Person
Project
Theme
Organization
Service
StatusValue
Document
Experience
ExperienceStep
Skill
```

Predicates:

```text
timezone
prefers
project_status
is_vegetarian
works_for
knows
parent_of
service_healthy
alias_of
```

Important constraints:

```text
timezone:
    Person → string
    functional = true
    open_world = true

project_status:
    Project → StatusValue
    functional = true
    open_world = true

is_vegetarian:
    Person → boolean
    functional = true
    open_world = true

prefers:
    Person → Concept
    functional = false

works_for:
    Person → Organization
```

Structural Fields:

```text
has_step        (ordered)
experienced_by
compiled_from
compiled_by
```

The reserved Core structural fields (`evidence`, `source`, `generated_by`, `inputs`, `outputs`) are built-ins defined by `KIP-2.0-SPECIFICATION.md` §20.13; the test package does not redefine them, and vectors exercising them test the Core built-in constraints directly.

Facets:

```text
MnemonicState:
    memory_strength number [0,1], mutable
    salience number [0,1], mutable
    last_metabolized_at timestamp|null, mutable

SkillUtility:
    utility number, mutable
    success_count integer >= 0, mutable
    failure_count integer >= 0, mutable
```

A second Package:

```text
kip://test/secondary@1.0.0
```

is used by the `schema_ambiguous` fixture to create an intentionally ambiguous local alias `status`.

---

# 9. Canonical Bindings

Fixture symbols:

```text
:self
:alice
:bob
:carol

:project_alpha

:dark_mode
:light_mode

:status_planning
:status_active
:status_paused

:org_acme

:service_api
```

The harness maps these symbols to implementation-local IDs.

Tests MUST NOT require identical local IDs across implementations.

---

# 10. Canonical Principals

`owner`

```text
broad read/project/write
merge_identity
manage_retention
archive/tombstone/purge
export/import
read_history/read_audit
```

`alice_writer`

```text
read/search/project
create/update
record_attributed_assertion
assert_as_actor Alice
retract_own
supersede_own
```

`recorder`

```text
read/search/project
create
record_attributed_assertion
no assert_as_actor Alice
```

`reader_full`

```text
discover/read/search/project
```

`reader_no_project`

```text
discover/read/search
```

`reader_no_search`

```text
discover/read/project
```

`reader_hidden`

```text
no discover on secret fixture resources
```

`maintenance`

```text
read/search/project
maintain
bounded mutable Facets
manage_retention/archive
no arbitrary actor representation
no trust/schema/authority management
```

`importer`

```text
discover/read/import
no manage_schema
no manage_trust
no elevate_authority
```

---

# 11. Canonical Deterministic Epistemic Policy

Portable Epistemic status tests run under:

```text
policy_id = test-deterministic
version = 1
```

Rules:

```text
one eligible trusted independent support root
    → accepted

one eligible trusted independent opposition root
    → rejected

material trusted support + material trusted opposition
    → contested

only explicitly weak/low-trust material
    → uncertain

no sufficient eligible material
    → insufficient
```

Eligibility:

```text
active
world-time valid
caller-visible
mode in observed|stated|inferred
```

Default current-world tests exclude:

```text
hypothetical
predicted
untrusted imported
```

This deterministic policy exists only for portable test vectors. KIP does not mandate it as a production trust policy.

---

# 12. Test Formatting

Each test below uses:

```text
Given
When
Then
Forbidden
```

Error names are the preferred Core Error Registry names. Where the Specification allows an equivalent more-specific error, the runner MAY accept a declared equivalent mapping.

---


# 13. Core Suite

Primary profile: `KIP-Core`

## KIP2-CORE-001 — Proposition existence is truth-neutral

**Level:** MUST

**Expected semantic behavior:** Given a stored Proposition `(Alice, timezone, "+08:00")` with no Assertion. When raw KQL and BELIEF query the same tuple. Then raw KQL finds the Proposition and BELIEF is not accepted; under the deterministic policy it is `insufficient`.

**Forbidden outcome:** automatic Assertion creation; automatic accepted belief.

---

## KIP2-CORE-002 — Proposition tuple is immutable

**Level:** MUST

**Expected semantic behavior:** Given `P1=(Alice, timezone, "+08:00")`. When generic UPDATE attempts object `+01:00`. Then the operation fails with `ImmutableField` or equivalent and P1 remains unchanged.

**Forbidden outcome:** in-place tuple rewrite.

---

## KIP2-CORE-003 — ENSURE Proposition is canonical

**Level:** MUST

**Expected semantic behavior:** Given no tuple. When the same grounded ENSURE runs twice. Then exactly one canonical Proposition exists and both operations resolve to that semantic identity.

**Forbidden outcome:** duplicate canonical tuple.

---

## KIP2-CORE-004 — Concurrent ENSURE converges

**Level:** MUST

**Expected semantic behavior:** Given no tuple. When two concurrent transactions ENSURE the same tuple. Then one canonical active Proposition remains.

**Forbidden outcome:** two canonical active duplicates.

---

## KIP2-CORE-005 — Assertion targets exactly one Proposition

**Level:** MUST

**Expected semantic behavior:** Given valid actors and Schema. When an Assertion is created with zero or multiple proposition targets. Then validation fails and no Assertion commits.

**Forbidden outcome:** malformed multi-target Assertion.

---

## KIP2-CORE-006 — Assertion confidence is not trust

**Level:** MUST

**Expected semantic behavior:** Given equal-confidence Assertions from differently trusted sources. When queried/projected. Then stored confidence remains equal and trust is not written back into confidence.

**Forbidden outcome:** confidence rewritten to encode trust.

---

## KIP2-CORE-007 — Assertion epistemic payload is immutable

**Level:** MUST

**Expected semantic behavior:** Given A1. When UPDATE attempts to change stance, confidence, asserted_by, or proposition. Then `EpistemicRevisionRequired`/`ImmutableField`; A1 is unchanged.

**Forbidden outcome:** history rewrite.

---

## KIP2-CORE-008 — Assertion revision preserves history

**Level:** MUST

**Expected semantic behavior:** Given A1 confidence .6. When A2 confidence .9 supersedes A1. Then A1 retains .6, becomes superseded, A2 remains independently addressable.

**Forbidden outcome:** old payload overwritten.

---

## KIP2-CORE-009 — Evidence payload is immutable

**Level:** MUST

**Expected semantic behavior:** Given E1. When payload overwrite is attempted. Then `EvidenceCorrectionRequired`/`ImmutableField`; payload is unchanged.

**Forbidden outcome:** in-place evidence rewrite.

---

## KIP2-CORE-010 — Evidence correction preserves original

**Level:** MUST

**Expected semantic behavior:** Given E1 and new E2. When `CORRECT EVIDENCE E1 BY E2`. Then E1 remains addressable and immutable; correction lineage links E1/E2.

**Forbidden outcome:** delete or overwrite E1.

---

## KIP2-CORE-011 — Equal digest does not force Evidence identity

**Level:** MUST

**Expected semantic behavior:** Given two genuine observation events with equal bytes/digest. When stored with distinct source-event/client keys. Then two Evidence elements may exist.

**Forbidden outcome:** content digest used as sole Evidence identity.

---

## KIP2-CORE-012 — Evidence client-key retry deduplicates

**Level:** MUST

**Expected semantic behavior:** Given an Evidence creation with client key K. When exactly retried. Then one durable Evidence exists.

**Forbidden outcome:** duplicate retry Evidence.

---

## KIP2-CORE-013 — Conflicting client key fails

**Level:** MUST

**Expected semantic behavior:** Given client key K bound to payload A. When K is reused with incompatible immutable payload B. Then `ClientKeyConflict`.

**Forbidden outcome:** silent replacement.

---

## KIP2-CORE-014 — Activity and Transaction are distinct

**Level:** MUST

**Expected semantic behavior:** Given a completed Activity created in one transaction. Then Activity ID and tx_id are distinct protocol identities.

**Forbidden outcome:** Activity treated as Commit Record.

---

## KIP2-CORE-015 — Completed Activity topology is immutable

**Level:** MUST

**Expected semantic behavior:** Given completed Activity. When inputs/outputs are changed. Then `ActivityTerminal`/`ImmutableField`.

**Forbidden outcome:** provenance rewrite.

---

## KIP2-CORE-016 — Structural Reference is not Proposition

**Level:** MUST

**Expected semantic behavior:** Given Experience has_step Step via structural topology. Then STRUCTURAL query finds it while raw Proposition query does not find an auto-created `(Experience,has_step,Step)` fact.

**Forbidden outcome:** automatic semantic edge.

---

## KIP2-CORE-017 — Facet cannot bypass Core

**Level:** MUST

**Expected semantic behavior:** Given a Facet payload attempts to mirror/override `_system.origin` or Assertion proposition. Then authoritative Core fields remain unchanged.

**Forbidden outcome:** Facet override of protected Core.

---

## KIP2-CORE-018 — Memory strength is not confidence

**Level:** MUST

**Expected semantic behavior:** Given Assertion confidence .9 and memory_strength .2. When memory_strength changes to .1. Then confidence remains .9.

**Forbidden outcome:** mnemonic mutation changes epistemic confidence.

---

## KIP2-CORE-019 — Retention time is not valid time

**Level:** MUST

**Expected semantic behavior:** Given different retention.expires_at and Assertion.valid_time.until. Then both remain distinct and drive separate semantics.

**Forbidden outcome:** time-field conflation.

---

## KIP2-CORE-020 — Concept merge is non-destructive

**Level:** MUST

**Expected semantic behavior:** Given Concepts A and B. When A merges into B. Then A remains addressable as merged and canonical resolution points to B.

**Forbidden outcome:** source identity deletion/reuse.

---

## KIP2-CORE-021 — Merge preserves raw historical endpoint

**Level:** MUST

**Expected semantic behavior:** Given old Proposition referencing A. After A→B merge, raw/historical query still identifies A while new canonical writes resolve B.

**Forbidden outcome:** rewriting all old references.

---

## KIP2-CORE-022 — Merge collision preserves Assertion history

**Level:** MUST

**Expected semantic behavior:** Given two Propositions collapse canonically after identity merge and each has Assertions. Then original Assertions/provenance remain separately addressable.

**Forbidden outcome:** Assertion dedup by canonical collision.

---


# 14. Schema Suite

Primary profile: `KIP-Schema`

## KIP2-SCHEMA-001 — Durable Concept schema_ref is exact-versioned

**Level:** MUST

**Expected semantic behavior:** Create Concept using local alias Person. Then persisted authoritative schema identity resolves to exact Package version.

**Forbidden outcome:** floating/range schema identity persisted.

---

## KIP2-SCHEMA-002 — Durable Predicate ref is exact-versioned

**Level:** MUST

**Expected semantic behavior:** ENSURE Proposition using local timezone alias. Then persisted predicate_ref is exact.

**Forbidden outcome:** floating Predicate identity.

---

## KIP2-SCHEMA-003 — Ambiguous alias fails

**Level:** MUST

**Expected semantic behavior:** In `schema_ambiguous`, use local alias `status`. Then `SchemaSymbolAmbiguous`.

**Forbidden outcome:** engine guesses a package.

---

## KIP2-SCHEMA-004 — Exact ref succeeds under ambiguity

**Level:** MUST

**Expected semantic behavior:** In same fixture, use one full exact Predicate ref. Then operation succeeds with intended symbol.

**Forbidden outcome:** ambiguity despite exact ref.

---

## KIP2-SCHEMA-005 — Subject type constraint enforced

**Level:** MUST

**Expected semantic behavior:** Attempt `(Project, timezone, "+08")`. Then `TypeMismatch`/`ConstraintViolation`.

**Forbidden outcome:** invalid tuple committed.

---

## KIP2-SCHEMA-006 — Literal datatype constraint enforced

**Level:** MUST

**Expected semantic behavior:** Attempt `(Alice, timezone, true)`. Then validation fails.

**Forbidden outcome:** boolean stored where string required.

---

## KIP2-SCHEMA-007 — Structural target constraint enforced

**Level:** MUST

**Expected semantic behavior:** Attach Experience.has_step to Organization. Then structural/type validation fails.

**Forbidden outcome:** invalid structural topology.

---

## KIP2-SCHEMA-008 — Unknown Facet field rejected

**Level:** MUST

**Expected semantic behavior:** Write undefined field under MnemonicState. Then `SchemaFieldNotFound`/constraint failure.

**Forbidden outcome:** unvalidated extension accepted as normative Facet.

---

## KIP2-SCHEMA-009 — Schema cannot authorize Governance

**Level:** MUST

**Expected semantic behavior:** Load schema/model hint claiming a type is administrator. Then no Governance permission is created.

**Forbidden outcome:** schema text grants authority.

---

## KIP2-SCHEMA-010 — Ordinary KML cannot activate Schema

**Level:** MUST

**Expected semantic behavior:** Attempt package activation/default changes through ordinary cognition. Then `ProtectedSchemaState`/denial; environment unchanged.

**Forbidden outcome:** Schema control through KML.

---

## KIP2-SCHEMA-011 — Validation-only embedded Schema stays inactive

**Level:** MUST

**Expected semantic behavior:** VERIFY/VALIDATE/PREVIEW a Capsule with inactive embedded Package. Then target active Schema Environment is unchanged.

**Forbidden outcome:** auto-install/activation.

---

## KIP2-SCHEMA-012 — Schema Environment is Space-specific

**Level:** MUST

**Expected semantic behavior:** Use different active Package versions in two Spaces. DESCRIBE each. Then each resolves independently.

**Forbidden outcome:** cross-Space default leakage.

---

## KIP2-SCHEMA-013 — Atomic transaction uses one Schema Environment

**Level:** MUST

**Expected semantic behavior:** Pause atomic transaction, change Space Schema default, resume. Then one atomic transaction is not partly interpreted under old and new environments.

**Forbidden outcome:** mixed-schema interpretation within one tx.

---

## KIP2-SCHEMA-014 — Schema precondition detects change

**Level:** MUST

**Expected semantic behavior:** Submit expected schema_environment_version 17 after environment becomes 18. Then precondition/schema error and no write.

**Forbidden outcome:** stale-schema write.

---

## KIP2-SCHEMA-015 — Package verification does not activate

**Level:** MUST

**Expected semantic behavior:** VERIFY a valid signed Package. Then activation state is unchanged.

**Forbidden outcome:** signature as activation.

---

## KIP2-SCHEMA-016 — DESCRIBE TYPE returns exact identity

**Level:** MUST

**Expected semantic behavior:** DESCRIBE local Person. Then response identifies exact symbol/package version.

**Forbidden outcome:** model-facing alias without exact resolution.

---


# 15. Epistemic Suite

Primary profile: `KIP-Epistemic`

## KIP2-EPI-001 — No Assertion yields insufficient

**Level:** MUST

**Expected semantic behavior:** Given Proposition only. BELIEF returns `insufficient` under test policy.

**Forbidden outcome:** rejected/accepted from bare Proposition.

---

## KIP2-EPI-002 — Absent grounded Proposition can yield insufficient without creation

**Level:** MUST

**Expected semantic behavior:** BELIEF grounded absent tuple. Then `insufficient`, proposition_id may be null, durable tuple remains absent.

**Forbidden outcome:** read creates Proposition.

---

## KIP2-EPI-003 — Trusted support yields accepted

**Level:** MUST

**Expected semantic behavior:** Given one eligible trusted independent support root. Then accepted.

---

## KIP2-EPI-004 — Trusted opposition yields rejected

**Level:** MUST

**Expected semantic behavior:** Given one eligible trusted independent reject root. Then rejected.

---

## KIP2-EPI-005 — Support plus opposition yields contested

**Level:** MUST

**Expected semantic behavior:** Given eligible independent support and rejection. Then contested.

**Forbidden outcome:** one side silently discarded.

---

## KIP2-EPI-006 — Weak material may yield uncertain

**Level:** MUST

**Expected semantic behavior:** Given only fixture-defined weak/low-trust material. Then uncertain.

**Forbidden outcome:** collapse uncertain into rejected.

---

## KIP2-EPI-007 — Confidence does not equal belief probability

**Level:** MUST

**Expected semantic behavior:** Given confidence .9. Then runtime does not expose bare .9 as calibrated belief probability unless policy declares that score semantics.

**Forbidden outcome:** undeclared probability semantics.

---

## KIP2-EPI-008 — Search score does not become confidence

**Level:** MUST

**Expected semantic behavior:** Run SEARCH then query Assertion. Confidence remains unchanged.

**Forbidden outcome:** retrieval score persisted into epistemic state.

---

## KIP2-EPI-009 — Reads do not reinforce cognition

**Level:** MUST

**Expected semantic behavior:** Record confidence/memory_strength/evidence counts; run repeated KQL/BELIEF reads. Durable values remain unchanged.

**Forbidden outcome:** read-side reinforcement.

---

## KIP2-EPI-010 — Hypothetical excluded by ordinary current-world policy

**Level:** MUST

**Expected semantic behavior:** Given only hypothetical support. Default BELIEF does not accept it.

**Forbidden outcome:** hypothesis promoted to fact.

---

## KIP2-EPI-011 — Hypothetical may be included explicitly

**Level:** SHOULD

**Expected semantic behavior:** Under explicit scenario policy including hypothetical, result follows that policy.

**Forbidden outcome:** silent policy change.

---

## KIP2-EPI-012 — Predicted is not observed

**Level:** MUST

**Expected semantic behavior:** Given only predicted support. Ordinary factual Projection does not treat it as direct observation.

**Forbidden outcome:** forecast promoted to observation.

---

## KIP2-EPI-013 — Imported is not local endorsement

**Level:** MUST

**Expected semantic behavior:** Import untrusted Assertion. Record exists but is not automatically accepted.

**Forbidden outcome:** import equals endorsement.

---

## KIP2-EPI-014 — Derived Assertion preserves provenance roots

**Level:** MUST

**Expected semantic behavior:** Create inferred A2 from A1/E1 through Activity. Ledger/provenance traces upstream root.

**Forbidden outcome:** origin laundering.

---

## KIP2-EPI-015 — Derived copies do not multiply evidence

**Level:** MUST

**Expected semantic behavior:** Create summary and translation of same root. They remain one corroboration/root group.

**Forbidden outcome:** three independent roots from one source.

---

## KIP2-EPI-016 — Repeated same-source statement is not source diversity

**Level:** MUST

**Expected semantic behavior:** Repeated records tied to one source event do not become independent source diversity.

**Forbidden outcome:** repetition as independence.

---

## KIP2-EPI-017 — Independent observations may remain independent

**Level:** MUST

**Expected semantic behavior:** Two distinct observation events with separate origin may appear as distinct roots.

**Forbidden outcome:** forced collapse of genuine independent observations.

---

## KIP2-EPI-018 — Circular provenance does not amplify

**Level:** MUST

**Expected semantic behavior:** Create derivation cycle with no external root. Projection cannot become accepted solely due to cycle.

**Forbidden outcome:** self-corroboration loop.

---

## KIP2-EPI-019 — Functional Predicate conflicting values are detected

**Level:** MUST

**Expected semantic behavior:** Overlapping trusted +08/+01 timezone support. BELIEF SLOT reflects conflict/contestation under test policy.

**Forbidden outcome:** arbitrary first-value acceptance.

---

## KIP2-EPI-020 — Non-overlapping valid times need not conflict

**Level:** MUST

**Expected semantic behavior:** +08 valid before T1; +01 after T1. FOR TIME selects appropriate candidate without mandatory contestation.

**Forbidden outcome:** historical coexistence treated as current contradiction.

---

## KIP2-EPI-021 — AS OF and FOR TIME are independent

**Level:** MUST

**Expected semantic behavior:** Query historical cognitive state vs current cognition about same world time. Coordinates and possibly results differ correctly.

**Forbidden outcome:** one time axis substitutes for other.

---

## KIP2-EPI-022 — Projection is read-only

**Level:** MUST

**Expected semantic behavior:** Record seq; run BELIEF repeatedly. No new state-changing seq or durable Projection object.

**Forbidden outcome:** projection persistence from read.

---

## KIP2-EPI-023 — Projection policy identity is observable

**Level:** MUST

**Expected semantic behavior:** BELIEF output identifies policy id/version or equivalent auditable identity.

**Forbidden outcome:** unattributed projection rule.

---

## KIP2-EPI-024 — Numeric epistemic scores declare semantics

**Level:** MUST

**Expected semantic behavior:** If numeric support/opposition is returned, score_semantics is present.

**Forbidden outcome:** bare ambiguous score.

---

## KIP2-EPI-025 — Absence of evidence is not evidence of absence

**Level:** MUST

**Expected semantic behavior:** No vegetarian data → grounded BELIEF is insufficient, not rejected.

**Forbidden outcome:** open-world violation.

---

## KIP2-EPI-026 — Closed-world exception is explicit

**Level:** OPTIONAL

**Expected semantic behavior:** If closed-world semantics are supported, rejection-from-absence occurs only under explicitly declared Schema/Projection Policy.

**Forbidden outcome:** implicit closed-world fallback.

---


## KIP2-EPI-027 — Materialized projection discloses its basis

**Level:** OPTIONAL

**Capabilities:** materialized_projection

**Expected semantic behavior:** With projection caching enabled, a BELIEF result served from a materialization reports its Projection Policy identity/version and snapshot basis in the result context. After a relevant Change Envelope (new opposing Assertion for the same conflict set), a subsequent current-time BELIEF either reflects the new state or discloses the older snapshot basis — never a stale answer presented as current. The materialization never appears as Evidence or Assertion.

**Forbidden outcome:** silent stale belief presented at current snapshot; cache written back as cognition; cache self-corroboration.

---


# 16. Governance Suite

Primary profile: `KIP-Governance`

## KIP2-GOV-001 — Request-body Principal spoofing fails

**Level:** MUST

**Expected semantic behavior:** Authenticate reader; claim principal_id=owner in body; attempt owner-only operation. Then denied and actual Principal remains reader.

**Forbidden outcome:** body field grants auth.

---

## KIP2-GOV-002 — Principal is not semantic actor

**Level:** MUST

**Expected semantic behavior:** Recorder without Alice ActorBinding tries assert_as_actor Alice. Then ActorBindingRequired/denied.

**Forbidden outcome:** semantic actor name grants representation.

---

## KIP2-GOV-003 — Attributed statement preserves origin distinction

**Level:** MUST

**Expected semantic behavior:** Recorder records Alice statement. asserted_by=Alice while engine origin=recorder.

**Forbidden outcome:** origin overwritten by asserted_by.

---

## KIP2-GOV-004 — Bound Alice writer may represent Alice

**Level:** MUST

**Expected semantic behavior:** alice_writer with scoped ActorBinding asserts as Alice. Then operation succeeds within binding scope.

---

## KIP2-GOV-005 — Cognitive admin claim grants no authority

**Level:** MUST

**Expected semantic behavior:** Store semantic `(self,is_admin,true)` then attempt protected operation. It remains denied.

**Forbidden outcome:** content-based privilege escalation.

---

## KIP2-GOV-006 — Epistemic trust grants no write authority

**Level:** MUST

**Expected semantic behavior:** High-trust source/actor with Principal lacking write attempts mutation. Denied.

**Forbidden outcome:** trust used as permission.

---

## KIP2-GOV-007 — discover differs from read

**Level:** MUST

**Expected semantic behavior:** Known secret ID queried by principal without discover. Return NotFoundOrNotVisible/equivalent.

**Forbidden outcome:** existence leak.

---

## KIP2-GOV-008 — search permission is distinct

**Level:** MUST

**Expected semantic behavior:** reader_no_search can known-ID read but SEARCH is denied.

**Forbidden outcome:** read implies search.

---

## KIP2-GOV-009 — project permission is distinct

**Level:** MUST

**Expected semantic behavior:** reader_no_project can raw-read but BELIEF is denied.

**Forbidden outcome:** read implies projection.

---

## KIP2-GOV-010 — Hidden rows do not affect COUNT

**Level:** MUST

**Expected semantic behavior:** 2 visible + 3 secret Persons; restricted COUNT returns 2.

**Forbidden outcome:** aggregate leak.

---

## KIP2-GOV-011 — Hidden rows do not affect NOT

**Level:** MUST

**Expected semantic behavior:** Construct NOT whose result would differ if hidden record participated. Evaluate over authorized universe only.

**Forbidden outcome:** secret existence leak through NOT.

---

## KIP2-GOV-012 — Hidden rows do not affect OPTIONAL

**Level:** MUST

**Expected semantic behavior:** OPTIONAL secret relation behaves as no visible match.

**Forbidden outcome:** secret existence leak through OPTIONAL.

---

## KIP2-GOV-013 — Hidden search candidates do not perturb visible rank

**Level:** MUST

**Expected semantic behavior:** Inject very relevant secret candidate. Restricted public ranking does not expose its presence.

**Forbidden outcome:** rank-position side channel.

---

## KIP2-GOV-014 — Current Governance controls historical visibility

**Level:** MUST

**Expected semantic behavior:** Record public at S1, secret now; restricted AS OF S1 read remains denied.

**Forbidden outcome:** historical ACL bypass.

---

## KIP2-GOV-015 — Snapshot token does not preserve revoked access

**Level:** MUST

**Expected semantic behavior:** Issue token, revoke read, use token. Denied.

**Forbidden outcome:** token as authority.

---

## KIP2-GOV-016 — Cursor does not preserve revoked access

**Level:** MUST

**Expected semantic behavior:** Issue cursor, revoke read, continue. Denied/redacted.

**Forbidden outcome:** cursor as capability.

---

## KIP2-GOV-017 — Commit-time revocation wins

**Level:** MUST

**Expected semantic behavior:** Pause authorized write before commit, revoke required Grant, resume. Transaction aborts.

**Forbidden outcome:** stale authorization commits.

---

## KIP2-GOV-018 — Cognitive Policy object cannot change control plane

**Level:** MUST

**Expected semantic behavior:** Create cognitive Concept named Policy with allow rules. Governance unchanged.

**Forbidden outcome:** control-plane spoofing.

---

## KIP2-GOV-019 — Moderator cannot forge source retraction

**Level:** MUST

**Expected semantic behavior:** Unbound admin/moderator tries to mark Alice Assertion as retracted-by-source. Retraction denied; administrative exclusion is separate.

**Forbidden outcome:** false withdrawal history.

---

## KIP2-GOV-020 — Derivation cannot amplify authority

**Level:** MUST

**Expected semantic behavior:** Derived Skill from descriptive inputs does not gain behavioral/executable authority automatically.

**Forbidden outcome:** derived self-elevation.

---

## KIP2-GOV-021 — Imported Skill is inactive without elevation

**Level:** MUST

**Expected semantic behavior:** Import source-labeled executable Skill as importer lacking elevation. It remains candidate/inactive.

**Forbidden outcome:** source authority inheritance.

---

## KIP2-GOV-022 — Imported Governance claims are inert

**Level:** MUST

**Expected semantic behavior:** Capsule claims owner/trust/export permissions. Target Governance unchanged.

**Forbidden outcome:** remote policy injection.

---

## KIP2-GOV-023 — Embedded Schema cannot bypass manage_schema

**Level:** MUST

**Expected semantic behavior:** Importer validates embedded Schema but lacks manage_schema. Active target environment unchanged.

**Forbidden outcome:** schema privilege bypass.

---

## KIP2-GOV-024 — Engine origin is non-malleable

**Level:** MUST

**Expected semantic behavior:** Client tries `_system.origin.principal_id=owner`. ProtectedSystemField/denial; actual origin remains caller.

**Forbidden outcome:** origin forgery.

---


# 17. Transaction Suite

Primary profile: `KIP-Transactions`

## KIP2-TX-001 — Atomic all-or-none

**Level:** MUST

**Expected semantic behavior:** Atomic op1 Evidence, op2 Assertion, op3 schema violation. Then no op1/op2 durable state and no state-changing space_seq.

**Forbidden outcome:** partial atomic commit.

---

## KIP2-TX-002 — Atomic one start snapshot

**Level:** MUST

**Expected semantic behavior:** Concurrent external commit occurs between two reads inside atomic batch. Both reads derive from one start snapshot plus own writes.

**Forbidden outcome:** mixed external snapshots.

---

## KIP2-TX-003 — Read-your-writes

**Level:** MUST

**Expected semantic behavior:** Atomic creates an element then later KQL reads it. Later read sees tentative write.

**Forbidden outcome:** missing own write.

---

## KIP2-TX-004 — No dirty reads

**Level:** MUST

**Expected semantic behavior:** Pause Tx A after tentative write; Tx B reads outside. B cannot see tentative write; after A commit new read sees it.

**Forbidden outcome:** dirty read.

---

## KIP2-TX-005 — Atomic commit has one tx_id/space_seq

**Level:** MUST

**Expected semantic behavior:** Multiple writes under atomic. One Receipt, one tx_id, one state-changing space_seq.

**Forbidden outcome:** per-operation commits.

---

## KIP2-TX-006 — Version increments once per transaction

**Level:** MUST

**Expected semantic behavior:** One transaction applies multiple legal mutations to same existing mutable element. Version increases exactly once.

**Forbidden outcome:** version increment per internal clause.

---

## KIP2-TX-007 — No-effect avoids cognitive churn

**Level:** MUST

**Expected semantic behavior:** Idempotent update final state unchanged. No new cognitive space_seq; target version/updated_at unchanged.

**Forbidden outcome:** fake write activity.

---

## KIP2-TX-008 — EXPECT VERSION current succeeds

**Level:** MUST

**Expected semantic behavior:** Use current version; update commits and increments once.

---

## KIP2-TX-009 — EXPECT VERSION stale fails

**Level:** MUST

**Expected semantic behavior:** Use stale version. VersionConflict; no write.

**Forbidden outcome:** lost update.

---

## KIP2-TX-010 — Serializable write skew prevented

**Level:** MUST

**Expected semantic behavior:** Two concurrent transactions would jointly violate fixture invariant if both commit. Serializable implementation aborts/conflicts at least one.

**Forbidden outcome:** non-serializable final state.

---

## KIP2-TX-011 — Same idempotency key returns original Receipt

**Level:** MUST

**Expected semantic behavior:** Commit key K then exact retry. Same tx_id/space_seq; no new Change Envelope.

**Forbidden outcome:** duplicate logical write.

---

## KIP2-TX-012 — Irrelevant formatting does not defeat idempotency

**Level:** SHOULD

**Expected semantic behavior:** Retry same normalized command with whitespace/comments changed. Resolve original outcome.

**Forbidden outcome:** format-sensitive logical duplicate.

---

## KIP2-TX-013 — Same key different request conflicts

**Level:** MUST

**Expected semantic behavior:** Reuse K with different bound parameter. IdempotencyConflict; original state unchanged.

**Forbidden outcome:** key silently reused for new intent.

---

## KIP2-TX-014 — request_id is not idempotency key

**Level:** MUST

**Expected semantic behavior:** Vary request/idempotency independently. Runtime does not conflate logical mutation identity with request correlation ID.

**Forbidden outcome:** request-id dedupe as durable semantics.

---

## KIP2-TX-015 — tx_id is engine-assigned

**Level:** MUST

**Expected semantic behavior:** Client supplies fake tx_id metadata. Actual committed tx_id is engine-assigned.

**Forbidden outcome:** client-selected transaction fact.

---

## KIP2-TX-016 — Timeout after commit is not abort

**Level:** MUST

**Expected semantic behavior:** Drop response after durable commit. Lookup by idempotency key reports committed.

**Forbidden outcome:** timeout mapped to aborted.

---

## KIP2-TX-017 — Retry after lost response does not duplicate

**Level:** MUST

**Expected semantic behavior:** Retry TX-016 same key/request. Original Receipt returned; one cognitive formation/change envelope.

**Forbidden outcome:** duplicate Experience/Evidence.

---

## KIP2-TX-018 — Definite cancellation before commit aborts

**Level:** MUST

**Expected semantic behavior:** Harness cancels before commit begins. No durable write.

**Forbidden outcome:** commit despite definite precommit abort.

---

## KIP2-TX-019 — Commit-race cancellation can be outcome_unknown

**Level:** MUST

**Expected semantic behavior:** Inject ambiguous cancellation race. Client surfaces outcome_unknown/lookup path when final state not known.

**Forbidden outcome:** fabricated abort/commit certainty.

---

## KIP2-TX-020 — One Change Envelope per commit

**Level:** MUST

**Expected semantic behavior:** Atomic multi-element write. One logical Change Envelope with same tx_id/space_seq.

**Forbidden outcome:** per-element transaction envelopes.

---

## KIP2-TX-021 — Change replay identifiable

**Level:** MUST

**Expected semantic behavior:** Same envelope replay is distinguishable by space_id+space_seq+tx_id.

**Forbidden outcome:** replay interpreted as new commit.

---

## KIP2-TX-022 — Aborted transaction emits no cognitive Change Envelope

**Level:** MUST

**Expected semantic behavior:** Abort atomic transaction. No state-change envelope.

**Forbidden outcome:** abort published as change.

---

## KIP2-TX-023 — Sequence is not rollback-atomic

**Level:** MUST

**Expected semantic behavior:** Sequence op1 write succeeds, op2 fails, stop. op1 remains committed and later op skipped.

**Forbidden outcome:** rollback of prior sequence commit.

---

## KIP2-TX-024 — Independent failures are isolated

**Level:** MUST

**Expected semantic behavior:** One independent op fails, another valid op can succeed independently.

**Forbidden outcome:** implicit shared rollback.

---

## KIP2-TX-025 — Atomic failure rolls back all operations

**Level:** MUST

**Expected semantic behavior:** Same logical batch under atomic; any required failure leaves no durable state.

**Forbidden outcome:** partial atomic success.

---


# 18. Capsule Suite

Primary profile: `KIP-Capsule`

## KIP2-CAP-001 — Snapshot Capsule binds one source snapshot

**Level:** MUST

**Expected semantic behavior:** Export while concurrent source commit occurs. All exported records correspond to one declared source snapshot.

**Forbidden outcome:** mixed-snapshot Capsule.

---

## KIP2-CAP-002 — Canonical payload change changes digest

**Level:** MUST

**Expected semantic behavior:** Modify included canonical record. content_digest changes.

**Forbidden outcome:** digest insensitive to semantic payload.

---

## KIP2-CAP-003 — Formatting-only change preserves canonical digest

**Level:** MUST

**Expected semantic behavior:** Reformat noncanonical representation then canonicalize same content. Same digest.

**Forbidden outcome:** transport formatting affects canonical identity.

---

## KIP2-CAP-004 — Digest mismatch fails VERIFY

**Level:** MUST

**Expected semantic behavior:** Tamper artifact without updating digest. DigestMismatch.

**Forbidden outcome:** tampered artifact verifies.

---

## KIP2-CAP-005 — Valid signature does not imply trust

**Level:** MUST

**Expected semantic behavior:** Cryptographically valid untrusted signer. VERIFY succeeds; local trust/belief not automatically granted.

**Forbidden outcome:** signature→trust.

---

## KIP2-CAP-006 — Source IDs are not target primary IDs

**Level:** MUST

**Expected semantic behavior:** Import into empty target. Destination resolves local IDs while preserving source identity mapping/provenance.

**Forbidden outcome:** blind source-ID reuse.

---

## KIP2-CAP-007 — Same name does not auto-merge

**Level:** MUST

**Expected semantic behavior:** Source and target each have different Alice with same name/no trusted canonical identity. No name-only merge.

**Forbidden outcome:** name identity.

---

## KIP2-CAP-008 — Trusted canonical identity may resolve existing Concept

**Level:** MUST

**Expected semantic behavior:** Matching trusted canonical identity can resolve target according to policy.

---

## KIP2-CAP-009 — Source `$self` does not become destination `$self`

**Level:** MUST

**Expected semantic behavior:** Ordinary merge import from another Brain. Source self remains source actor identity.

**Forbidden outcome:** self takeover.

---

## KIP2-CAP-010 — Restore self mapping requires restore semantics

**Level:** OPTIONAL

**Expected semantic behavior:** Verified same-Brain backup may map self only in authorized restore mode.

**Forbidden outcome:** ordinary merge maps self.

---

## KIP2-CAP-011 — Embedded Schema stays inactive

**Level:** MUST

**Expected semantic behavior:** VERIFY/VALIDATE/PREVIEW embedded package. Target active environment unchanged.

**Forbidden outcome:** auto activation.

---

## KIP2-CAP-012 — Source authority is inert

**Level:** MUST

**Expected semantic behavior:** Capsule claims executable Skill authority. Destination authority does not increase.

**Forbidden outcome:** authority migration.

---

## KIP2-CAP-013 — Source trust is not inherited

**Level:** MUST

**Expected semantic behavior:** Capsule claims high trust. Destination local trust remains policy-controlled.

**Forbidden outcome:** trust migration.

---

## KIP2-CAP-014 — Redacted and unavailable ExternalRef remain distinguishable

**Level:** MUST

**Expected semantic behavior:** Artifact contains both reference kinds. Parser/preview preserves distinction when visible.

**Forbidden outcome:** loss of redaction semantics.

---

## KIP2-CAP-015 — Closure declaration is inspectable

**Level:** MUST

**Expected semantic behavior:** DESCRIBE/VALIDATE exposes closed/referential/selective or equivalent declared closure.

**Forbidden outcome:** hidden closure assumption.

---

## KIP2-CAP-016 — VERIFY and VALIDATE differ

**Level:** MUST

**Expected semantic behavior:** Valid digest/signature but schema-invalid Capsule. VERIFY succeeds, VALIDATE fails.

**Forbidden outcome:** one generic ok flag.

---

## KIP2-CAP-017 — VALIDATE and PREVIEW differ

**Level:** MUST

**Expected semantic behavior:** Structurally valid Capsule conflicts with destination identity. VALIDATE succeeds, PREVIEW reports conflict.

**Forbidden outcome:** validation treated as importability.

---

## KIP2-CAP-018 — Preview has no destination side effect

**Level:** MUST

**Expected semantic behavior:** Record seq/counts/environment; PREVIEW IMPORT. All remain unchanged.

**Forbidden outcome:** preview reservation/mutation.

---

## KIP2-CAP-019 — Artifact upload is not import

**Level:** MUST

**Expected semantic behavior:** Stage Capsule bytes only. Target cognitive state unchanged.

**Forbidden outcome:** transport store becomes memory.

---

## KIP2-CAP-020 — Capsule URL is not auto-fetched

**Level:** MUST

**Expected semantic behavior:** Provide URL without staged bytes/network capability. No fetch; explicit artifact/network error.

**Forbidden outcome:** SSRF.

---

## KIP2-CAP-021 — Imported contradiction remains representable

**Level:** MUST

**Expected semantic behavior:** Import Assertion contradicting local Assertion. Both histories remain; Projection may contest.

**Forbidden outcome:** import deletes local contradiction.

---

## KIP2-CAP-022 — Imported derived cognition preserves roots

**Level:** MUST

**Expected semantic behavior:** Derived Assertion with source provenance retains root relationships after identity mapping.

**Forbidden outcome:** origin laundering.

---


# 19. KQL Suite

Primary profile: `KIP-KQL`

## KIP2-KQL-001 — Concept pattern works

**Level:** MUST

**Expected semantic behavior:** Query canonical Alice Person. Matching visible Concept returned.

---

## KIP2-KQL-002 — Proposition pattern reads raw state

**Level:** MUST

**Expected semantic behavior:** Query Alice timezone. Raw rows returned independent of acceptance status.

**Forbidden outcome:** raw query becomes BELIEF.

---

## KIP2-KQL-003 — Predicate variable returns exact ref

**Level:** MUST

**Expected semantic behavior:** Bind predicate variable in native v2. Values are exact canonical Predicate refs.

**Forbidden outcome:** display name as semantic identity.

---

## KIP2-KQL-004 — Assertion pattern works

**Level:** MUST

**Expected semantic behavior:** Filter proposition/asserted_by/stance/mode. Matching Assertion returned.

---

## KIP2-KQL-005 — Evidence pattern works

**Level:** MUST

**Expected semantic behavior:** Filter evidence_class. Matching visible Evidence returned.

---

## KIP2-KQL-006 — Activity pattern works

**Level:** MUST

**Expected semantic behavior:** Filter activity_class/status. Matching Activity returned.

---

## KIP2-KQL-007 — Structural pattern works

**Level:** MUST

**Expected semantic behavior:** Query has_step. Structural result returned without semantic Proposition requirement.

---

## KIP2-KQL-008 — FILTER comparison works

**Level:** MUST

**Expected semantic behavior:** Use deterministic literal comparisons. Expected rows returned.

---

## KIP2-KQL-009 — NOT is no-visible-match, not false

**Level:** MUST

**Expected semantic behavior:** No visible vegetarian fact. NOT behaves as query negation only; no reject Assertion/belief created.

**Forbidden outcome:** world-level negation.

---

## KIP2-KQL-010 — OPTIONAL missing is null/no match

**Level:** MUST

**Expected semantic behavior:** Missing optional relation yields null/unbound, not false Assertion.

**Forbidden outcome:** epistemic negation.

---

## KIP2-KQL-011 — UNION combines authorized branches

**Level:** MUST

**Expected semantic behavior:** Seed one row per branch. Union returns visible union.

**Forbidden outcome:** hidden rows.

---

## KIP2-KQL-012 — COUNT uses authorized solutions

**Level:** MUST

**Expected semantic behavior:** Visible+secret fixture. Count visible only.

**Forbidden outcome:** aggregate leak.

---

## KIP2-KQL-013 — COUNT zero is not negative belief

**Level:** MUST

**Expected semantic behavior:** Zero raw rows does not convert later BELIEF to rejected.

**Forbidden outcome:** closed-world shortcut.

---

## KIP2-KQL-014 — ORDER BY honors explicit key

**Level:** MUST

**Expected semantic behavior:** Seed distinct sort values. Rows ordered accordingly.

---

## KIP2-KQL-015 — Null ordering follows declared baseline

**Level:** SHOULD

**Expected semantic behavior:** If implementation claims default null-last behavior, verify it.

---

## KIP2-KQL-016 — KQL cursor pins snapshot

**Level:** MUST

**Expected semantic behavior:** Fetch page1, commit new matching row, continue cursor. New row absent from traversal.

**Forbidden outcome:** moving snapshot pagination.

---

## KIP2-KQL-017 — Cursor query mismatch fails

**Level:** MUST

**Expected semantic behavior:** Reuse cursor with changed query. CursorMismatch.

**Forbidden outcome:** cursor reused for arbitrary query.

---

## KIP2-KQL-018 — Cursor type mismatch fails

**Level:** MUST

**Expected semantic behavior:** Use KQL cursor in SEARCH/CHANGES. CursorTypeMismatch/equivalent.

**Forbidden outcome:** cross-family cursor interpretation.

---

## KIP2-KQL-019 — BELIEF result is virtual

**Level:** MUST

**Expected semantic behavior:** Run BELIEF. No durable Projection Cognitive Element/state-changing seq created.

**Forbidden outcome:** read persists belief.

---

## KIP2-KQL-020 — BELIEF target is bounded

**Level:** MUST

**Expected semantic behavior:** Attempt unbounded whole-Brain Projection. ProjectionTargetUnbound/Unbounded.

**Forbidden outcome:** unbounded projection explosion.

---

## KIP2-KQL-021 — BELIEF SLOT empty is insufficient

**Level:** MUST

**Expected semantic behavior:** Grounded empty functional slot returns insufficient + empty accepted_values.

**Forbidden outcome:** zero rows forces client inference.

---

## KIP2-KQL-022 — BELIEF SLOT detects functional conflict

**Level:** MUST

**Expected semantic behavior:** Overlapping candidate values. Result is conflict-aware.

**Forbidden outcome:** arbitrary candidate pick.

---

## KIP2-KQL-023 — Raw path does not propagate belief

**Level:** MUST

**Expected semantic behavior:** Raw Proposition path exists but links lack accepted Assertions. No implicit belief path.

**Forbidden outcome:** belief arithmetic invented.

---

## KIP2-KQL-024 — AS OF reconstructs old mutable state

**Level:** MUST

**Expected semantic behavior:** Mutate Concept S1→S2. AS OF S1 returns old state.

**Forbidden outcome:** historical alias to current.

---

## KIP2-KQL-025 — AS OF reconstructs lifecycle

**Level:** MUST

**Expected semantic behavior:** Assertion active S1, retracted S2. AS OF S1 active/current retracted.

**Forbidden outcome:** history rewrite.

---

## KIP2-KQL-026 — FOR TIME selects world-valid state

**Level:** MUST

**Expected semantic behavior:** Time-scoped Assertions. Projection changes with FOR TIME without changing cognitive snapshot.

**Forbidden outcome:** time-axis conflation.

---

## KIP2-KQL-027 — Historical read obeys current Governance

**Level:** MUST

**Expected semantic behavior:** Public-then-secret fixture. Restricted AS OF cannot recover now-secret content.

**Forbidden outcome:** ACL time travel.

---

## KIP2-KQL-028 — Projection redaction hides raw Evidence

**Level:** MUST

**Expected semantic behavior:** Principal can project but cannot read raw Evidence. Status may be returned; raw Evidence remains hidden and redaction disclosed.

**Forbidden outcome:** Evidence leak.

---

## KIP2-KQL-029 — KQL read has no write Receipt

**Level:** MUST

**Expected semantic behavior:** Read may return snapshot context but no state-changing tx Receipt/space_seq.

**Forbidden outcome:** reads treated as commits.

---


# 20. KML Suite

Primary profile: `KIP-KML`

## KIP2-KML-001 — CREATE CONCEPT creates distinct event-like identity

**Level:** MUST

**Expected semantic behavior:** Create Experience with client key. New typed Concept exists.

---

## KIP2-KML-002 — UPSERT stable key is idempotent

**Level:** MUST

**Expected semantic behavior:** Run same Project key upsert twice. One Concept identity/final state.

**Forbidden outcome:** duplicate stable entity.

---

## KIP2-KML-003 — Name-only native UPSERT rejected

**Level:** MUST

**Expected semantic behavior:** UPSERT Person using only type+name. IdentitySelectorRequired/NameIdentityForbidden.

**Forbidden outcome:** universal name identity.

---

## KIP2-KML-004 — ENSURE Proposition creates no Assertion

**Level:** MUST

**Expected semantic behavior:** ENSURE tuple. Proposition exists; Assertion count remains zero.

**Forbidden outcome:** implicit fact assertion.

---

## KIP2-KML-005 — CREATE Assertion preserves actor/origin distinction

**Level:** MUST

**Expected semantic behavior:** Recorder records Alice. asserted_by Alice; origin recorder.

**Forbidden outcome:** origin conflation.

---

## KIP2-KML-006 — CREATE Activity records structural provenance

**Level:** MUST

**Expected semantic behavior:** Create Activity inputs/outputs. They are queryable structurally.

---

## KIP2-KML-007 — MUTATE compound transition is atomic

**Level:** MUST

**Expected semantic behavior:** Create Evidence+Proposition+Assertion+Activity in one MUTATE. All share one atomic commit.

**Forbidden outcome:** partial formation.

---

## KIP2-KML-008 — Forward local refs work in full profile

**Level:** MUST

**Expected semantic behavior:** Mutually reference Evidence.generated_by and Activity.outputs in one MUTATE where Schema permits. Commit succeeds.

**Forbidden outcome:** define-before-use limitation in full v2.

---

## KIP2-KML-009 — Duplicate local handle fails

**Level:** MUST

**Expected semantic behavior:** Declare same handle twice. DuplicateLocalHandle; no commit.

**Forbidden outcome:** ambiguous binding.

---

## KIP2-KML-010 — Conflicting final mutation fails

**Level:** SHOULD

**Expected semantic behavior:** Specify incompatible duplicate target mutation in one declarative MUTATE. DuplicateMutationTarget/constraint failure.

**Forbidden outcome:** hidden source-order last-write-wins.

---

## KIP2-KML-011 — UPDATE never creates

**Level:** MUST

**Expected semantic behavior:** WHERE matches none. matched/updated=0, no element created.

**Forbidden outcome:** upsert behavior.

---

## KIP2-KML-012 — UPDATE legal mnemonic Facet

**Level:** MUST

**Expected semantic behavior:** Change memory_strength. Only allowed Facet state changes.

---

## KIP2-KML-013 — UPDATE cannot write `_system`

**Level:** MUST

**Expected semantic behavior:** Attempt origin/version write. ProtectedSystemField.

**Forbidden outcome:** engine truth tampering.

---

## KIP2-KML-014 — UPDATE cannot write Governance

**Level:** MUST

**Expected semantic behavior:** Attempt policy/classification/authority through generic KML. ProtectedGovernanceField/denied.

**Forbidden outcome:** control-plane tampering.

---

## KIP2-KML-015 — Assertion confidence rewrite rejected

**Level:** MUST

**Expected semantic behavior:** UPDATE confidence. EpistemicRevisionRequired/ImmutableField.

**Forbidden outcome:** history rewrite.

---

## KIP2-KML-016 — Evidence payload rewrite rejected

**Level:** MUST

**Expected semantic behavior:** UPDATE Evidence payload. EvidenceCorrectionRequired/ImmutableField.

**Forbidden outcome:** history rewrite.

---

## KIP2-KML-017 — Belief revision uses new Assertion

**Level:** MUST

**Expected semantic behavior:** Create revised Assertion from new Evidence. Old Assertion payload remains.

**Forbidden outcome:** old Assertion mutation.

---

## KIP2-KML-018 — Own supersession succeeds

**Level:** MUST

**Expected semantic behavior:** Alice supersedes compatible Alice Assertion. Lifecycle links are consistent.

---

## KIP2-KML-019 — Different actor disagreement cannot supersede

**Level:** MUST

**Expected semantic behavior:** Bob attempts to supersede Alice solely due to disagreement. SupersessionMismatch/denied.

**Forbidden outcome:** cross-actor history erasure.

---

## KIP2-KML-020 — Retraction preserves payload

**Level:** MUST

**Expected semantic behavior:** Alice retracts own Assertion. Lifecycle retracted; payload unchanged/historically queryable.

**Forbidden outcome:** deletion on retraction.

---

## KIP2-KML-021 — Retraction requires representation authority

**Level:** MUST

**Expected semantic behavior:** Unbound recorder retracts Alice. Denied.

**Forbidden outcome:** forged withdrawal.

---

## KIP2-KML-022 — Evidence correction can be transaction-atomic

**Level:** MUST

**Expected semantic behavior:** Create E2+CORRECT+revised Assertion; inject invalid clause. None commit.

**Forbidden outcome:** partial correction.

---

## KIP2-KML-023 — Maintenance cannot decay Assertion confidence

**Level:** MUST

**Expected semantic behavior:** Maintenance numeric UPDATE confidence fails.

**Forbidden outcome:** truth decay.

---

## KIP2-KML-024 — Maintenance can decay memory_strength

**Level:** MUST

**Expected semantic behavior:** Allowed MnemonicState update succeeds.

---

## KIP2-KML-025 — Archive is not retraction

**Level:** MUST

**Expected semantic behavior:** Archive eligible memory/Assertion. Source-retraction lifecycle not forged.

**Forbidden outcome:** archive=withdrawal.

---

## KIP2-KML-026 — Tombstone is not purge

**Level:** MUST

**Expected semantic behavior:** Tombstone Concept. Identity/history marker remains; not treated as full physical erasure.

**Forbidden outcome:** tombstone=purge.

---

## KIP2-KML-027 — Legal hold blocks purge

**Level:** MUST

**Expected semantic behavior:** Purge held Evidence. LegalHoldConflict/PurgeDenied.

---

## KIP2-KML-028 — Referenced Evidence purge denied conservatively

**Level:** MUST

**Expected semantic behavior:** Attempt ordinary purge on referenced Evidence. PurgeDenied/reference conflict.

**Forbidden outcome:** implicit destructive cascade.

---

## KIP2-KML-029 — MERGE is non-destructive

**Level:** MUST

**Expected semantic behavior:** Merge source into target. Source remains historical/merged.

**Forbidden outcome:** source deletion.

---

## KIP2-KML-030 — MERGE requires identity authority

**Level:** MUST

**Expected semantic behavior:** Generic updater without merge_identity attempts merge. Denied.

**Forbidden outcome:** update implies identity governance.

---


## KIP2-KML-031 — ASSERT sugar desugars exactly

**Level:** MUST

**Profiles:** KIP-KML (full)

**Expected semantic behavior:** `ASSERT ?a (alice, timezone, "+08:00") {by: alice, mode: "stated", confidence: 0.9, evidence: E}` commits exactly one canonical Proposition (created or resolved), one Assertion with the declared fields and a role-support Evidence citation, and nothing else. State is element-for-element equivalent to the desugared `ENSURE PROPOSITION` + `CREATE ASSERTION` form. With `SUPERSEDING :old`, the old Assertion becomes superseded by the new one in the same transaction.

**Postconditions:** canonical_proposition_count for the tuple = 1; assertion payload equals declared members; no additional Evidence/Activity is fabricated by the sugar.

**Forbidden outcome:** sugar-only side effects; divergence from the normative desugaring; stance default other than support.

---


# 21. META Suite

Primary profile: `KIP-META`

## KIP2-META-001 — DESCRIBE PRIMER exposes coordinates

**Level:** MUST

**Expected semantic behavior:** Primer identifies protocol/Space/Schema/safety context sufficiently for model use.

**Forbidden outcome:** memory dump required.

---

## KIP2-META-002 — Primer distinguishes Principal and self

**Level:** MUST

**Expected semantic behavior:** Authenticate non-self Principal. Primer does not equate it with semantic `$self`.

**Forbidden outcome:** identity conflation.

---

## KIP2-META-003 — DESCRIBE PROTOCOL reports actual version

**Level:** MUST

**Expected semantic behavior:** Response identifies supported KIP version/profile.

---

## KIP2-META-004 — DESCRIBE EXECUTION CONTEXT reports resolved Space

**Level:** MUST

**Expected semantic behavior:** Resolved Space identity visible where authorized.

---

## KIP2-META-005 — DESCRIBE TYPE returns exact Schema identity

**Level:** MUST

**Expected semantic behavior:** Local Person introspection includes exact symbol/package version.

---

## KIP2-META-006 — DESCRIBE ambiguous symbol fails

**Level:** MUST

**Expected semantic behavior:** Ambiguous Predicate local name. SchemaSymbolAmbiguous.

**Forbidden outcome:** guessing.

---

## KIP2-META-007 — Keyword SEARCH returns exact candidate identity

**Level:** MUST

**Expected semantic behavior:** Search known label. Result carries exact ID/kind.

**Forbidden outcome:** name-only grounding result.

---

## KIP2-META-008 — SEARCH score is transient

**Level:** MUST

**Expected semantic behavior:** Search then query object. No durable `_score`/confidence mutation.

**Forbidden outcome:** retrieval metadata persisted.

---

## KIP2-META-009 — Search miss is not absence

**Level:** MUST

**Expected semantic behavior:** Lag index behind canonical state. SEARCH misses while exact KQL finds. Runtime does not claim canonical absence.

**Forbidden outcome:** search-as-database.

---

## KIP2-META-010 — Search freshness disclosed when capability claimed

**Level:** MUST

**Expected semantic behavior:** Sequenced index lag fixture. Response exposes index checkpoint/consistency.

**Forbidden outcome:** hidden staleness.

---

## KIP2-META-011 — supported and available are distinct

**Level:** MUST

**Expected semantic behavior:** Runtime supports purge but caller lacks it. Capability output does not imply caller authorization.

**Forbidden outcome:** supported=permission.

---

## KIP2-META-012 — Capability enumeration does not leak hidden Space

**Level:** MUST

**Expected semantic behavior:** Restricted Principal introspects. Hidden Space/resources remain undiscoverable.

**Forbidden outcome:** capability side channel.

---

## KIP2-META-013 — VERIFY signature is not trust

**Level:** MUST

**Expected semantic behavior:** Valid unknown/untrusted signer. Verification and local trust remain distinct.

**Forbidden outcome:** verified=trusted.

---

## KIP2-META-014 — VALIDATE KML has no state change

**Level:** MUST

**Expected semantic behavior:** Record seq; VALIDATE mutation. State unchanged.

**Forbidden outcome:** validation commits.

---

## KIP2-META-015 — PREVIEW KML has no state/reservation

**Level:** MUST

**Expected semantic behavior:** Record seq/counts/client key availability; PREVIEW. All durable state unchanged.

**Forbidden outcome:** preview reserves/commits.

---

## KIP2-META-016 — Preview is not future commit guarantee

**Level:** MUST

**Expected semantic behavior:** Preview valid, target version changes, guarded commit fails.

**Forbidden outcome:** preview as reservation.

---

## KIP2-META-017 — Transaction lookup by idempotency returns original

**Level:** MUST

**Expected semantic behavior:** Lookup committed key. Correct tx_id/space_seq returned.

---

## KIP2-META-018 — Unknown transaction is not aborted

**Level:** MUST

**Expected semantic behavior:** Lookup random tx. TransactionUnknown/unknown, not fabricated aborted.

**Forbidden outcome:** unknown=abort.

---

## KIP2-META-019 — HISTORY reports chronology

**Level:** MUST

**Expected semantic behavior:** Mutate element twice. HISTORY reflects ordered transitions.

---

## KIP2-META-020 — KQL AS OF reconstructs content

**Level:** MUST

**Expected semantic behavior:** Same scenario. AS OF returns historical content, distinct from HISTORY metadata.

---

## KIP2-META-021 — CHANGES preserves transaction envelope

**Level:** MUST

**Expected semantic behavior:** Multi-write commit. One logical envelope.

---

## KIP2-META-022 — Expired Change cursor is explicit

**Level:** MUST

**Expected semantic behavior:** Expire cursor. ChangeCursorExpired + safe recovery class.

**Forbidden outcome:** silent restart from current.

---

## KIP2-META-023 — EXPORT CAPSULE is cognitively read-only

**Level:** MUST

**Expected semantic behavior:** Export data. Cognitive space_seq unchanged unless separate audit transaction explicitly identified.

**Forbidden outcome:** export as cognitive mutation.

---

## KIP2-META-024 — Readonly accepts preview but rejects commit KML

**Level:** MUST

**Expected semantic behavior:** PREVIEW succeeds/returns validation; direct KML write on readonly gives ReadonlyViolation.

**Forbidden outcome:** readonly bypass.

---


# 22. Runtime Suite

Primary profile: `KIP-Runtime`

## KIP2-RT-001 — UTF-8 round trip

**Level:** MUST

**Expected semantic behavior:** Bind/query non-ASCII text. Semantic value round-trips correctly.

**Forbidden outcome:** encoding corruption.

---

## KIP2-RT-002 — Invalid UTF-8 rejected

**Level:** MUST

**Expected semantic behavior:** Send malformed bytes via binding supporting raw transport. Reject before operation execution.

**Forbidden outcome:** replacement-character mutation.

---

## KIP2-RT-003 — Duplicate JSON keys rejected in High-Assurance

**Level:** OPTIONAL

**Expected semantic behavior:** Send duplicate critical object keys. InvalidRequestEnvelope/parser rejection.

**Forbidden outcome:** ambiguous parse.

---

## KIP2-RT-004 — Structural binding prevents command injection

**Level:** MUST

**Expected semantic behavior:** Parameter contains KIP-looking syntax. It remains data or fails datatype validation; no injected command executes.

**Forbidden outcome:** string interpolation execution.

---

## KIP2-RT-005 — Embedded placeholder template is not code

**Level:** MUST

**Expected semantic behavior:** Use `"Hello :name"` template-like literal. Runtime does not unsafe-expand into syntax.

**Forbidden outcome:** template injection.

---

## KIP2-RT-006 — Non-finite number rejected

**Level:** MUST

**Expected semantic behavior:** Bind NaN/Infinity if transport permits. Reject before durable mutation.

**Forbidden outcome:** noncanonical number.

---

## KIP2-RT-007 — Language label cannot downgrade write

**Level:** MUST

**Expected semantic behavior:** Readonly request says language=META but command parses as KML. LanguageMismatch/ReadonlyViolation; no write.

**Forbidden outcome:** label-based security.

---

## KIP2-RT-008 — Multi-operation native request declares execution mode

**Level:** MUST

**Expected semantic behavior:** Submit >1 operations without mode. Draft-native runner expects InvalidRequestEnvelope unless future Spec defines an explicit default.

**Forbidden outcome:** hidden batch semantics.

---

## KIP2-RT-009 — Independent may use separate snapshots

**Level:** MUST

**Expected semantic behavior:** Concurrent commit between independent reads. Different snapshots are permitted and contexts identify them.

**Forbidden outcome:** runner incorrectly assumes shared snapshot.

---

## KIP2-RT-010 — Sequence observes prior commit

**Level:** MUST

**Expected semantic behavior:** op1 writes X; op2 reads X. op2 sees X.

**Forbidden outcome:** sequence without ordered visibility.

---

## KIP2-RT-011 — Sequence is not shared snapshot

**Level:** MUST

**Expected semantic behavior:** Inject unrelated commit between sequence ops. op2 may see it and reports its actual snapshot.

**Forbidden outcome:** sequence falsely advertised atomic.

---

## KIP2-RT-012 — Atomic has one transaction identity

**Level:** MUST

**Expected semantic behavior:** Multiple writes. One Receipt/tx_id.

---

## KIP2-RT-013 — Atomic readonly batch has snapshot but no write Receipt

**Level:** MUST

**Expected semantic behavior:** Multiple reads under atomic. One shared snapshot context; no state-changing receipt.

**Forbidden outcome:** fake read transaction commit.

---

## KIP2-RT-014 — request_id differs from tx_id

**Level:** MUST

**Expected semantic behavior:** Client chooses request_id. Engine independently chooses tx_id.

**Forbidden outcome:** correlation ID as commit identity.

---

## KIP2-RT-015 — Retry may change request_id but preserve logical tx

**Level:** MUST

**Expected semantic behavior:** Same idempotency key/request, new request_id. Original tx returned.

**Forbidden outcome:** request ID required for idempotency.

---

## KIP2-RT-016 — Snapshot token is opaque

**Level:** MUST

**Expected semantic behavior:** Mutate token bytes. Reject invalid token rather than interpret client-edited coordinate.

**Forbidden outcome:** token forgery.

---

## KIP2-RT-017 — Snapshot token is not authorization

**Level:** MUST

**Expected semantic behavior:** Issue token then revoke access. Use token is denied.

**Forbidden outcome:** token capability.

---

## KIP2-RT-018 — Lagging SEARCH cannot fake atomic consistency

**Level:** MUST

**Expected semantic behavior:** Force lagging index; request serializable atomic SEARCH. Runtime aligns genuinely or rejects explicitly.

**Forbidden outcome:** false snapshot claim.

---

## KIP2-RT-019 — No silent isolation downgrade

**Level:** MUST

**Expected semantic behavior:** Request serializable where unavailable. UnsupportedIsolation.

**Forbidden outcome:** silent weaker isolation.

---

## KIP2-RT-020 — No silent capability downgrade

**Level:** MUST

**Expected semantic behavior:** Require unavailable capability. UnsupportedCapability.

**Forbidden outcome:** silent fallback.

---

## KIP2-RT-021 — Sequence partial status is explicit

**Level:** MUST

**Expected semantic behavior:** op1 success, op2 fail, op3 skipped. Top/result statuses reveal partial semantics.

**Forbidden outcome:** opaque partial write.

---

## KIP2-RT-022 — Atomic abort is not partial commit

**Level:** MUST

**Expected semantic behavior:** Required failure under atomic. No durable partial state.

---

## KIP2-RT-023 — outcome_unknown differs from transaction state

**Level:** MUST

**Expected semantic behavior:** Inject lost response; client state outcome_unknown while lookup can report committed.

**Forbidden outcome:** transport state conflation.

---

## KIP2-RT-024 — Progress does not claim commit

**Level:** MUST

**Expected semantic behavior:** Pause streaming write precommit. Progress frames remain provisional/no Receipt.

**Forbidden outcome:** tentative durability claim.

---

## KIP2-RT-025 — Final frame establishes terminal write outcome

**Level:** MUST

**Expected semantic behavior:** Successful stream ends with terminal committed Receipt/result.

**Forbidden outcome:** no terminal proof.

---

## KIP2-RT-026 — Artifact handle is not filesystem path

**Level:** MUST

**Expected semantic behavior:** Use path-looking handle. Treat as opaque invalid handle, not local path.

**Forbidden outcome:** path traversal.

---

## KIP2-RT-027 — Artifact handle is not URL

**Level:** MUST

**Expected semantic behavior:** Use URL-looking handle. No network request.

**Forbidden outcome:** SSRF.

---

## KIP2-RT-028 — Expected artifact digest is checked

**Level:** MUST

**Expected semantic behavior:** Stage wrong bytes for declared digest. DigestMismatch.

**Forbidden outcome:** unchecked artifact integrity.

---

## KIP2-RT-029 — Expired Artifact fails safely

**Level:** MUST

**Expected semantic behavior:** Expire handle before use. ArtifactUnavailable; no cognitive commit.

**Forbidden outcome:** stale handle mutation.

---

## KIP2-RT-030 — Cursor families are non-interchangeable

**Level:** MUST

**Expected semantic behavior:** Cross-use KQL/SEARCH/CHANGES cursors. CursorTypeMismatch/equivalent.

**Forbidden outcome:** cursor type confusion.

---


## KIP2-RT-031 — Ingestion context mints faithful Evidence

**Level:** MUST

**Profiles:** KIP-Runtime (full)

**Capabilities:** ingestion_context

**Expected semantic behavior:** A request carries `ingest.evidence[{key: "msg", payload: P, client_key: K}]` and an operation referencing `:msg`. The runtime mints exactly one Evidence element whose payload/content digest corresponds byte-for-byte to the transport-supplied P, binds `:msg` to it, and commits it atomically with the transaction. Retrying the same request with the same idempotency/client keys yields no duplicate Evidence. If the transaction aborts, no Evidence is durably created.

**Postconditions:** evidence payload digest equals digest(P); change_envelope_count for the logical write = 1.

**Forbidden outcome:** payload altered/truncated/paraphrased relative to transport input; Evidence surviving an aborted transaction; duplicate Evidence on retry.

---


# 23. Historical Suite

Primary profile: `KIP-Historical`

## KIP2-HIST-001 — Historical mutable Concept reconstruction

**Level:** MUST

**Expected semantic behavior:** Name Alpha at S1, Beta at S2. AS OF S1 returns Alpha; current Beta.

**Forbidden outcome:** history aliases current.

---

## KIP2-HIST-002 — Historical Assertion lifecycle reconstruction

**Level:** MUST

**Expected semantic behavior:** Active S1, retracted S2. AS OF S1 active/current retracted.

---

## KIP2-HIST-003 — Historical Evidence correction reconstruction

**Level:** MUST

**Expected semantic behavior:** E1 corrected at S2. AS OF S1 no correction lineage; current lineage exists; E1 payload same.

**Forbidden outcome:** retroactive correction.

---

## KIP2-HIST-004 — Historical Schema Environment reconstruction

**Level:** MUST

**Expected semantic behavior:** Schema v17 at S1, v18 at S2. DESCRIBE AS OF S1 identifies v17.

**Forbidden outcome:** current schema substituted.

---

## KIP2-HIST-005 — Historical records keep exact Schema meaning

**Level:** MUST

**Expected semantic behavior:** Old data references older exact package version. Historical interpretation uses exact identity, not current default.

**Forbidden outcome:** semantic reinterpretation.

---

## KIP2-HIST-006 — Historical Governance uses current authorization

**Level:** MUST

**Expected semantic behavior:** Public at S1, secret now. Restricted caller cannot recover old payload.

**Forbidden outcome:** ACL bypass.

---

## KIP2-HIST-007 — Belief-then differs from current-belief-about-then

**Level:** MUST

**Expected semantic behavior:** Later correction exists. Historical AS OF+FOR TIME and current+same FOR TIME are separately expressible and may differ.

**Forbidden outcome:** time axes conflated.

---

## KIP2-HIST-008 — Merge preserves historical raw endpoint

**Level:** MUST

**Expected semantic behavior:** After merge A→B, raw AS OF/history preserves A endpoint.

**Forbidden outcome:** rewrite.

---

## KIP2-HIST-009 — Purged history is unavailable, not fabricated

**Level:** MUST

**Expected semantic behavior:** Authorized purge removes retained bytes. Historical request reports unavailable/redacted according to policy.

**Forbidden outcome:** invented historical state.

---

## KIP2-HIST-010 — Transaction chronology ordered by space_seq

**Level:** MUST

**Expected semantic behavior:** HISTORY across multiple commits preserves/reveals total Space order within authorized range.

**Forbidden outcome:** unordered commit history.

---


# 24. High-Assurance Suite

Primary profile: `KIP-High-Assurance`

## KIP2-HA-001 — Serializable outcome suite passes

**Level:** MUST

**Expected semantic behavior:** High-Assurance claim requires serializable transaction conflict tests to pass.

---

## KIP2-HA-002 — Signed Receipt verifies

**Level:** MUST

**Expected semantic behavior:** Verify Receipt against runtime/Nexus identity and covered digest.

---

## KIP2-HA-003 — Receipt tampering breaks proof

**Level:** MUST

**Expected semantic behavior:** Modify tx_id/space_seq/request_digest. ProofInvalid.

**Forbidden outcome:** tampered receipt accepted.

---

## KIP2-HA-004 — Request digest normalizes irrelevant formatting

**Level:** MUST

**Expected semantic behavior:** Semantically identical formatting variants yield same normalized request digest under claimed digest profile.

**Forbidden outcome:** format-dependent logical identity.

---

## KIP2-HA-005 — Semantic plan digest reflects exact Schema resolution

**Level:** MUST

**Expected semantic behavior:** Same alias under different exact Schema environment yields different resolved plan digest.

**Forbidden outcome:** schema ambiguity hidden.

---

## KIP2-HA-006 — Duplicate JSON keys strictly rejected

**Level:** MUST

**Expected semantic behavior:** Pass RT-003.

---

## KIP2-HA-007 — Tamper-evident checkpoint detects modification

**Level:** MUST

**Expected semantic behavior:** Modify covered Commit Record. Checkpoint/proof verification fails.

**Forbidden outcome:** tamper accepted.

---

## KIP2-HA-008 — Strict existence-neutral response

**Level:** MUST

**Expected semantic behavior:** Known hidden ID and random absent ID are protocol-semantically indistinguishable under strict policy.

**Forbidden outcome:** secret existence oracle.

---

## KIP2-HA-009 — Projection policy version is auditable

**Level:** MUST

**Expected semantic behavior:** Historical/current Projection identifies or auditably reconstructs exact policy version.

**Forbidden outcome:** unversioned belief engine.

---


# 25. KIP 1.x Migration Suite

Primary profile: `KIP-1-Migration`

## KIP2-MIG-001 — Legacy Concept becomes v2 Concept

**Level:** MUST

**Expected semantic behavior:** Migrate v1 type/name Concept. Preserve semantic identity; derive stable key where legacy identity depended on name.

---

## KIP2-MIG-002 — Legacy factual Proposition gets migrated Assertion

**Level:** MUST

**Expected semantic behavior:** v1 fact-like link becomes v2 truth-neutral Proposition plus migrated positive Assertion.

**Forbidden outcome:** fact semantics lost.

---

## KIP2-MIG-003 — Legacy confidence maps to Assertion, not Proposition

**Level:** MUST

**Expected semantic behavior:** No v2 Proposition confidence field after migration.

---

## KIP2-MIG-004 — Legacy source/author is decomposed

**Level:** MUST

**Expected semantic behavior:** Map to asserted_by/Evidence/provenance only where supported by source semantics; do not invent certainty.

**Forbidden outcome:** generic metadata copy.

---

## KIP2-MIG-005 — Legacy observed_at maps to Evidence time where valid

**Level:** MUST

**Expected semantic behavior:** Observation time preserved in appropriate Evidence semantics.

---

## KIP2-MIG-006 — Legacy valid_from/until maps to Assertion valid_time

**Level:** MUST

**Expected semantic behavior:** World applicability preserved separately from retention.

---

## KIP2-MIG-007 — Legacy expires_at maps to retention

**Level:** MUST

**Expected semantic behavior:** Storage expiry does not become Assertion world validity.

---

## KIP2-MIG-008 — Legacy access_level maps to Governance

**Level:** MUST

**Expected semantic behavior:** Protected access semantics do not become ordinary attribute.

---

## KIP2-MIG-009 — Legacy confidence decay is not native Assertion metabolism

**Level:** MUST

**Expected semantic behavior:** Post-migration maintenance does not age-decay Assertion confidence solely due to time.

---

## KIP2-MIG-010 — Legacy destructive merge becomes non-destructive consolidation

**Level:** MUST

**Expected semantic behavior:** Historical source identity remains reconstructable.

---

## KIP2-MIG-011 — Legacy EXPORT script is not native Capsule identity

**Level:** MUST

**Expected semantic behavior:** Compatibility artifact does not receive native Capsule digest/signature semantics unless actually converted.

---


# 26. Cross-Module Scenario Suite

These scenarios are REQUIRED whenever all referenced profiles are claimed together.

## KIP2-X-001 — User correction end-to-end

Profiles:

```text
Core + Epistemic + Governance + Transactions + KQL + KML + Historical
```

Initial:

```text
Alice stated timezone +08
Assertion A1 active
```

One correction transaction forms:

```text
new message Evidence E2
new Proposition (+01)
new Assertion A2
A2 supersedes A1
belief_revision Activity
```

Expected:

```text
A1 payload unchanged
A1 lifecycle = superseded
A2 active
E2 preserved
Activity links old/new/Evidence
current BELIEF SLOT → +01
historical AS OF before correction → +08
one tx Receipt
one Change Envelope
```

Forbidden:

```text
A1 tuple/confidence overwritten
old Evidence deleted
history rewritten
```

---

## KIP2-X-002 — Third-party disagreement is not correction

Alice supports P. Bob rejects P.

Expected:

```text
both Assertions remain
no cross-actor supersession
Projection may become contested
```

---

## KIP2-X-003 — SEARCH grounding and BELIEF stay separate

SEARCH finds relevant Alice record with retrieval score.

Use returned exact ID/ref in BELIEF.

Expected:

```text
retrieval score is not copied into confidence/support
SEARCH relevance and epistemic status remain distinct
```

---

## KIP2-X-004 — Search lag versus canonical state

Commit new Concept at seq 101; hold index at 100.

Expected:

```text
SEARCH may miss
exact KQL finds it
search context declares lag/weaker consistency
```

---

## KIP2-X-005 — Historical secrecy after classification change

Public Evidence at S1 becomes secret later.

Restricted historical BELIEF/read at S1 must obey current Governance.

Raw Evidence remains hidden; projection may be denied or safely redacted according to policy.

---

## KIP2-X-006 — Signed imported Skill does not execute itself

Pipeline:

```text
VERIFY
VALIDATE
PREVIEW
IMPORT
```

Expected:

```text
signature may verify
Skill may import
provenance preserved
Skill candidate/inactive
no executable authority
no tool permission
```

---

## KIP2-X-007 — Capsule same-name identity collision

Source Alice and unrelated target Alice share name but no trusted canonical identity.

Expected no automatic merge.

---

## KIP2-X-008 — Formation retry after lost response

Formation transaction creates:

```text
Experience
Evidence
Assertion
Activity
```

Server commits; response is dropped; caller retries same idempotency key.

Expected:

```text
same tx_id
same logical elements/client-key resolution
one formation
one Change Envelope
```

---

## KIP2-X-009 — Preview succeeds, commit fails after revocation

PREVIEW KML succeeds.

Required Grant is revoked before actual write.

Expected actual transaction is denied/aborted.

Preview does not reserve authority.

---

## KIP2-X-010 — Capsule Schema preview does not activate

Unknown embedded Package is used validation-only.

After PREVIEW, target Schema Environment remains unchanged.

---

## KIP2-X-011 — Memory decay does not rewrite confidence

Assertion confidence .95; Experience memory_strength .8.

Maintenance decays memory_strength to .4.

Expected:

```text
confidence = .95
memory_strength = .4
```

---

## KIP2-X-012 — Counter-Evidence purge cannot silently strengthen belief

P is contested due to support/challenge Evidence.

Ordinary maintenance attempts to purge challenge Evidence.

Expected conservative denial or explicitly authorized/audited purge path.

No silent routine deletion may strengthen future Projection.

---

## KIP2-X-013 — Merge plus historical belief

Assertions reference alias A.

Merge A→B.

New assertions use canonical B.

Expected:

```text
old raw refs remain A
current canonical semantic resolution uses B
all Assertions/provenance remain historical
```

---

## KIP2-X-014 — External action boundary

Transaction 1 records ActionIntent.

External harness action occurs.

Transaction 2 records Outcome Evidence/Activity.

Expected:

```text
two KIP commit boundaries
external world effect is not rollback-coupled to either KIP transaction
```

---

## KIP2-X-015 — Principal/actor/origin end-to-end

Recorder handles Alice message.

Expected:

```text
Evidence source semantics = Alice/message
Assertion.asserted_by = Alice
_system.origin.principal_id = recorder
no representation authority inferred
```

---

# 27. Required Invariant Coverage Matrix

The Specification defines 33 cross-cutting Required Conformance Invariants.

| Invariant | Required vectors |
|---|---|
| 1. Proposition existence truth-neutral | CORE-001, KML-004, EPI-001 |
| 2. Assertion confidence != Brain belief | CORE-006, EPI-007 |
| 3. Search relevance != confidence | EPI-008, META-008, X-003 |
| 4. Missing visible match != falsehood | EPI-025, KQL-009, KQL-013 |
| 5. insufficient != rejected | EPI-001, EPI-025 |
| 6. Contradictory Assertions coexist | EPI-005, X-002 |
| 7. Proposition tuple immutable | CORE-002 |
| 8. Assertion history append-oriented | CORE-007, CORE-008, KML-017 |
| 9. Evidence correction preserves original | CORE-009, CORE-010 |
| 10. Derived cognition does not multiply corroboration | EPI-015, EPI-018 |
| 11. Provenance does not grant authority | GOV-006, GOV-020 |
| 12. Principal != semantic actor | GOV-002, GOV-003, X-015 |
| 13. Cognitive content cannot self-grant authority | GOV-005, GOV-018 |
| 14. Current Governance controls historical visibility | GOV-014, HIST-006 |
| 15. Memory strength != confidence | CORE-018, X-011 |
| 16. Read does not reinforce memory | EPI-009, EPI-022 |
| 17. Merge preserves raw historical identity | CORE-020, CORE-021, HIST-008 |
| 18. Source self does not auto-map to destination self | CAP-009 |
| 19. Capsule signature does not imply truth/trust | CAP-005 |
| 20. Capsule import does not inherit source authority | CAP-012, CAP-013 |
| 21. Embedded Schema does not auto-activate | SCHEMA-011, CAP-011 |
| 22. Batch != transaction unless atomic | TX-023, TX-025, RT-008 |
| 23. request_id != idempotency_key != tx_id | TX-014, TX-015, RT-014, RT-015 |
| 24. Timeout does not prove abort | TX-016, TX-019, RT-023 |
| 25. Progress does not prove commit | RT-024, RT-025 |
| 26. Preview does not reserve/commit | META-015, CAP-018 |
| 27. Revocation overrides stale cursor/snapshot/delegation | GOV-015, GOV-016, GOV-017 |
| 28. Cursors are opaque/non-interchangeable | KQL-017, KQL-018, RT-016, RT-030 |
| 29. External URLs not auto-fetched | CAP-020, RT-027 |
| 30. External actions outside KIP rollback | X-014 |
| 31. ASSERT commits exactly its desugaring | KML-031 |
| 32. Materialized projection discloses policy + snapshot basis | EPI-027 |
| 33. Ingested Evidence preserves transport payload | RT-031 |

---

# 28. Core Error Registry Coverage

A full runner SHOULD exercise every reachable error in the claimed profiles.

| Error | Canonical vector |
|---|---|
| InvalidSyntax | malformed KQL/KML vector |
| InvalidIdentifier | lexical invalid-identifier vector |
| InvalidRequestEnvelope | RT-008 / malformed envelope |
| UnsupportedProtocolVersion | version-negotiation vector |
| UnsupportedCapability | RT-020 |
| UnsupportedIsolation | RT-019 |
| LanguageMismatch | RT-007 |
| ReadonlyViolation | META-024 / RT-007 |
| DuplicateLocalHandle | KML-009 |
| DuplicateMutationTarget | KML-010 |
| SchemaSymbolNotFound | unknown-schema-symbol vector |
| SchemaSymbolAmbiguous | SCHEMA-003 |
| SchemaFieldNotFound | SCHEMA-008 |
| SchemaPackageUnavailable | missing dependency Capsule vector |
| SchemaEnvironmentChanged | SCHEMA-014 |
| HistoricalSchemaUnavailable | historical-retention negative vector |
| TypeMismatch | SCHEMA-005/006 |
| ConstraintViolation | SCHEMA-007 |
| NotFoundOrNotVisible | GOV-007 |
| ReferenceError | missing-reference mutation vector |
| StructuralReferenceInvalid | SCHEMA-007 |
| IdentitySelectorRequired | KML-003 |
| NameIdentityForbidden | KML-003 |
| IdentityConflict | CAP-007 conflict variant |
| ClientKeyConflict | CORE-013 |
| IdentityMergeConflict | conflicting-merge vector |
| ImmutableField | CORE-002 |
| EpistemicRevisionRequired | CORE-007 / KML-015 |
| EvidenceCorrectionRequired | CORE-009 / KML-016 |
| InvalidLifecycleTransition | lifecycle negative vector |
| RetractionNotAuthorized | GOV-019 / KML-021 |
| SupersessionMismatch | KML-019 |
| EvidenceCorrectionConflict | correction-lineage negative vector |
| ActivityTerminal | CORE-015 |
| ProjectionTargetUnbound | KQL-020 |
| ProjectionTargetUnbounded | KQL-020 |
| ProjectionNotAuthorized | GOV-009 |
| ProjectionPolicyUnavailable | missing-policy vector |
| Unauthenticated | unauthenticated protected request |
| NotAuthorized | GOV-001 |
| RequiresApproval | approval-gated fixture |
| RequiresStrongerAuthentication | step-up fixture |
| ActorBindingRequired | GOV-002 |
| ProtectedSystemField | GOV-024 / KML-013 |
| ProtectedGovernanceField | KML-014 |
| ProtectedSchemaState | SCHEMA-010 |
| LegalHoldConflict | KML-027 |
| PurgeDenied | KML-028 |
| VersionConflict | TX-009 |
| PreconditionFailed | stale precondition vector |
| SerializationConflict | TX-010 |
| IdempotencyConflict | TX-013 |
| TransactionUnknown | META-018 |
| OutcomeUnknown | TX-019 |
| TransactionTooLarge | configured-limit vector |
| HistoricalSnapshotUnavailable | HIST-009 |
| CursorMismatch | KQL-017 |
| CursorTypeMismatch | KQL-018 / RT-030 |
| CursorExpired | cursor TTL vector |
| CursorInvalidated | Governance/schema invalidation vector |
| ChangeCursorExpired | META-022 |
| ChangeCursorInvalid | malformed change cursor |
| SearchModeUnsupported | unsupported search mode vector |
| SearchIndexUnavailable | search outage vector |
| HistoricalSearchUnavailable | historical-search capability vector |
| ArtifactUnavailable | RT-029 |
| ArtifactTooLarge | artifact limit vector |
| ArtifactParseError | malformed Capsule |
| DigestMismatch | CAP-004 / RT-028 |
| ProofInvalid | HA-003 |
| SignerUnknown | unknown signer vector |
| BlobUnavailable | external blob missing |
| CapsuleValidationFailed | CAP-016 |
| ImportPreviewConflict | CAP-017 |
| ResourceExhausted | resource-budget vector |
| ResultLimitExceeded | result-limit vector |
| ExecutionTimeout | deterministic read timeout |
| RateLimited | rate-limit fixture |
| InternalError | validate shape if observed; not intentionally a success vector |

Tests SHOULD isolate one dominant failure condition. A vector SHOULD NOT simultaneously be both unauthorized and schema-invalid when one exact error is being tested.

---

# 29. State Comparison Rules

Local IDs are implementation-defined.

Compare semantic structure:

```text
one Assertion
whose Proposition tuple = (Alice, timezone, "+01:00")
whose asserted_by = Alice
whose lifecycle = active
```

Do not compare:

```text
assertion.id == "A-123"
```

unless the ID was previously returned by that same implementation and referential stability is the subject of the test.

---

# 30. Timestamp Rules

Prefer:

```text
space_seq
explicit fixture times
harness-controlled clock
```

over exact wall-clock comparisons.

For engine times assert:

```text
present
monotonic where required
inside harness-controlled interval
```

unless exact deterministic time is part of the fixture.

---

# 31. Search Determinism Rules

Portable baseline uses keyword search.

Semantic/hybrid search tests SHOULD assert:

```text
authorized candidate inclusion/exclusion
no secret ranking leakage
score semantics declared
index freshness declared
```

and SHOULD NOT require identical floating-point scores across implementations unless a reference ranking profile is explicitly claimed.

---

# 32. Epistemic Determinism Rules

Portable Epistemic tests MUST use the canonical deterministic test Projection Policy or an exactly equivalent policy.

The conformance suite tests:

```text
status machinery
eligibility
conflict handling
open-world semantics
provenance independence
policy identity
```

not one vendor's preferred trust weights.

---

# 33. Transaction Determinism Rules

Concurrency vectors use explicit barriers.

Example:

```text
T1 start at S100
T1 reads X
pause before validation

T2 mutates X
T2 commits S101

resume T1
```

Expected behavior is derived from the requested isolation and preconditions.

---

# 34. Fault Injection Rules

The harness MUST know whether a fault is injected:

```text
definitely before commit
definitely after commit
during a commit/response race where client outcome is unknown
```

A test MUST NOT infer server commit state merely from client timeout. That would invalidate the very invariant being tested.

---

# 35. Profile Pass Rules

A claimed profile passes only when:

```text
all applicable MUST vectors PASS
```

A SHOULD failure produces a conformance warning unless a stricter claimed profile makes it mandatory.

An OPTIONAL test:

```text
capability advertised
    → MUST execute and PASS

capability not advertised
    → SKIP_UNSUPPORTED allowed
```

---

# 36. Cross-Profile Rule

If an implementation claims multiple profiles, it MUST execute applicable cross-module vectors.

Isolated unit-suite success is insufficient.

Examples:

```text
Epistemic + Governance + Historical
    → historical projection authorization tests

KML + Transactions + Runtime
    → idempotent retry/lost-response tests

Capsule + Schema + Governance
    → embedded Schema and authority non-amplification tests
```

---

# 37. No-Effect Verification

When `no_effect` is expected, verify where observable:

```text
no new cognitive space_seq
target version unchanged
target updated_at unchanged
no cognitive Change Envelope
```

Operational audit logging is outside this assertion.

---

# 38. Readonly Verification

Any semantically read-only test SHOULD snapshot:

```text
space_seq
relevant versions
relevant memory_strength/confidence
```

before and after to detect accidental read-side mutation.

---

# 39. History Preservation Verification

Revision/correction/merge tests SHOULD query both:

```text
current canonical view
historical/raw view
```

A correct current answer is not sufficient if the implementation achieved it by rewriting the past.

---

# 40. Authority Preservation Verification

Import/derive/Skill tests SHOULD verify:

```text
content may appear
BUT
authority does not rise without a separate authorized Governance transition
```

---

# 41. Recommended Repository Layout

```text
conformance/
  README.md

  schemas/
    test-core-domain-1.0.0.json
    test-secondary-1.0.0.json
    cognitive-memory-profile.json

  fixtures/
    empty.json
    core-basic.json
    epistemic-basic.json
    epistemic-conflict.json
    governance-basic.json
    transaction-basic.json
    historical-basic.json

  policies/
    epistemic-test-deterministic.json
    governance-test-policy.json

  capsules/
    valid-snapshot.json
    bad-digest.json
    signed-untrusted.json
    identity-conflict.json
    embedded-schema.json
    skill-executable-claim.json

  vectors/
    core/
    schema/
    epistemic/
    governance/
    transactions/
    capsule/
    kql/
    kml/
    meta/
    runtime/
    historical/
    high-assurance/
    migration/
    cross-module/

  runner-schema/
    test-vector.schema.json
    report.schema.json
```

---

# 42. Runner Report Shape

```json
{
  "implementation": {
    "name": "...",
    "version": "...",
    "kip_version": "2.0-draft"
  },

  "profiles_claimed": [],

  "summary": {
    "pass": 0,
    "fail": 0,
    "skip_unsupported": 0,
    "not_applicable": 0,
    "harness_error": 0
  },

  "profiles": {
    "KIP-Core": {
      "status": "PASS",
      "required_tests": 0,
      "passed": 0
    }
  },

  "tests": [
    {
      "id": "KIP2-CORE-001",
      "status": "PASS",
      "duration_ms": 3,
      "observed": {},
      "warnings": []
    }
  ]
}
```

---

# 43. Future Machine-Readable Deliverables

The next executable artifacts SHOULD be:

```text
1. kip-request.schema.json
2. kip-response.schema.json
3. conformance-test-vector.schema.json
4. conformance-report.schema.json
5. KQL formal EBNF
6. KML formal EBNF
7. META formal EBNF
8. canonical fixture Schema Packages
9. canonical fixture state
10. golden Capsule artifacts
11. reference conformance runner
```

---

# 44. Interoperability Acceptance Criterion

Two independent Nexus implementations are KIP-interoperable when they can:

```text
load semantically equivalent canonical fixtures
execute the same required vectors
produce equivalent wire classifications
produce equivalent durable postconditions
preserve the same Epistemic/Governance boundaries
survive the same retry/concurrency scenarios
exchange canonical Cognitive Capsules
```

without sharing:

```text
database code
storage format
local IDs
query planner
embedding model
internal transaction implementation
```

---

# 45. Final Conformance Principle

The purpose of KIP conformance is not to prove that an implementation resembles a reference implementation.

It is to prove that the implementation preserves KIP's cognitive distinctions even under stress:

```text
statement ≠ belief
belief ≠ authority
confidence ≠ trust
trust ≠ permission
retrieval ≠ truth
revision ≠ historical rewrite
correction ≠ deletion
merge ≠ identity erasure
preview ≠ commit
batch ≠ transaction
timeout ≠ abort
retry ≠ repeated experience
artifact transport ≠ cognitive import
signed origin ≠ trusted cognition
```

The governing test principle is:

> **A KIP 2.0 implementation conforms when every observable shortcut that would falsify cognitive history, inflate belief, leak authority, or duplicate learning is rejected by the protocol boundary.**
