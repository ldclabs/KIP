# KIP 2.0 Invariant Registry

**[English](./KIP-2.0-Invariants.md) | [中文](./KIP-2.0-Invariants_CN.md)**

## Status

**Normative companion to [KIP-2.0-SPECIFICATION.md](./KIP-2.0-SPECIFICATION.md) and [profiles/CognitiveMemoryProfile-2.0.md](./profiles/CognitiveMemoryProfile-2.0.md), version 2.0-draft**

This is the one list of the invariants KIP 2.0 requires. Part A carries the 38 cross-cutting Core invariants that Specification §102 requires of every conforming implementation; Part B carries the 35 invariants of the Cognitive Memory Profile (Profile §23), binding on an implementation that claims the Profile. Numbering is stable: a Core invariant keeps the number §102 gave it, so `§102 invariant 17` and the conformance suite's coverage matrix (§27) keep resolving; a Profile invariant is `P` plus the number Profile §23 gave it.

Each row names the section that establishes the invariant — a bare `§` is the Core Specification, `Profile §` the Cognitive Memory Profile — and the conformance vectors that pin it. A Core invariant without a vector does not exist: the coverage matrix in [conformance/KIP-2.0-Conformance-Tests.md](./conformance/KIP-2.0-Conformance-Tests.md) §27 is authoritative for Part A and is repeated here only for reading. A Profile invariant marked `—` is required by the Profile's prose and is not yet pinned by a portable vector.

An invariant is added here when a Specification or Profile revision creates one, never by this document alone; the establishing section changes first, the row second.

---

## Part A. Core invariants (Specification §102)

A conforming native KIP 2.0 implementation MUST preserve these cross-cutting invariants.

| # | Invariant | Established by | Pinned by |
|---|---|---|---|
| 1 | Proposition existence is truth-neutral. | §12, §21 | CORE-001, KML-004, EPI-001 |
| 2 | Assertion confidence is not Brain belief. | §22.1 | CORE-006, EPI-007 |
| 3 | Search relevance is not confidence. | §66 | EPI-008, META-008, X-003 |
| 4 | Missing visible match is not falsehood. | §24, §30.4 | EPI-025, KQL-009, KQL-013 |
| 5 | `insufficient` is distinct from `rejected`. | §21.5, §21.8 | EPI-001, EPI-025 |
| 6 | Contradictory Assertions can coexist. | §13, §25 | EPI-005, X-002 |
| 7 | Proposition tuple is immutable. | §12.5 | CORE-002 |
| 8 | Assertion historical epistemic payload is append-oriented. | §13.7, §57 | CORE-007, CORE-008, KML-017, X-018 |
| 9 | Evidence correction does not overwrite original Evidence. | §15.5, §57.2 | CORE-009, CORE-010 |
| 10 | Derived cognition does not create independent corroboration. | §23 | EPI-015, EPI-018 |
| 11 | Provenance does not grant Governance authority. | §22.3, §29.6 | GOV-006, GOV-020 |
| 12 | Principal and semantic actor are distinct. | §28.2, §28.3 | GOV-002, GOV-003, GOV-027, X-015 |
| 13 | Cognitive content cannot self-grant authority. | §28.1, §31.3 | GOV-005, GOV-018 |
| 14 | Current Governance controls historical visibility. | §30, §68.2 | GOV-014, HIST-006 |
| 15 | Memory strength is distinct from epistemic confidence. | §22.1; Profile §6.1 | CORE-018, X-011 |
| 16 | Read does not automatically reinforce memory. | §21.2 | EPI-009, EPI-022 |
| 17 | Merge does not rewrite raw historical identity. | §11, §12.3, §61 | CORE-020, CORE-021, HIST-008 |
| 18 | Source `$self` does not automatically become destination `$self`. | §38, §39 (Capsule companion) | CAP-009 |
| 19 | Capsule signature does not imply truth/trust. | §37, §41.4 (Capsule companion) | CAP-005 |
| 20 | Capsule import does not inherit source authority automatically. | §31.4, §41.4 | CAP-012, CAP-013 |
| 21 | Embedded Schema does not auto-activate. | §20, §41 | SCHEMA-011, CAP-011 |
| 22 | Batch is not transaction unless explicitly atomic. | §75 | TX-023, TX-025, RT-008, RT-033 |
| 23 | Request ID, idempotency key, and tx_id are distinct. | §34, §72 | TX-014, TX-015, RT-014, RT-015 |
| 24 | Timeout does not prove abort. | §80 | TX-016, TX-019, RT-023 |
| 25 | Progress does not prove commit. | §84 | RT-024, RT-025 |
| 26 | Preview does not reserve/commit state. | §69 | META-015, CAP-018 |
| 27 | Current revocation overrides stale cursor/snapshot/delegation assumptions. | §28.6, §30 | GOV-015, GOV-016, GOV-017 |
| 28 | Cursors are opaque and non-interchangeable across operation families. | §44, §87.7 | KQL-017, KQL-018, RT-016, RT-030 |
| 29 | External URLs are not auto-fetched as artifacts. | §85 | CAP-020, RT-027 |
| 30 | External world actions are outside KIP rollback semantics. | §62 | X-014 |
| 31 | `ASSERT` commits exactly the semantics of its normative desugaring. | §55.1 | KML-031 |
| 32 | A served materialized projection discloses its policy identity and snapshot basis. | §21.9 | EPI-027 |
| 33 | Runtime-ingested Evidence preserves the transport-supplied payload without model re-typing. | §71.1 | RT-031 |
| 34 | Payload purge destroys Evidence bytes, never the Evidence record's identity, citations, or provenance topology. | §60.6 | KML-034 |
| 35 | Revising a provenance root does not silently retract or rewrite cognition derived from it. | §57.5 | EPI-028, META-025 |
| 36 | An actor's self-report about its own action's result is never Outcome Evidence. | §15.7 | X-017, GOV-026, CAP-023 |
| 37 | A task family finds comparable consequences; only a provenance link from the decision to the outcome attributes one, and a grading tally changes only through that link. | §15.7, §29.8 | X-016 |
| 38 | Schema symbol identity is lineage: elements written under different versions of one package remain one population for matching, keys, and Proposition identity, while each validates against its exact version. | §20.14 | SCHEMA-017, SCHEMA-018, SCHEMA-019 |

---

## Part B. Cognitive Memory Profile invariants (Profile §23)

An implementation that claims the Cognitive Memory Profile MUST additionally preserve these; a Brain that follows the Profile relies on them.

| # | Invariant | Established by | Pinned by |
|---|---|---|---|
| P1 | Experience and Skill are Profile concepts, not Core kinds. | Profile §0, §3 | — |
| P2 | Structural References do not automatically become Propositions. | Profile §7 | CORE-016 |
| P3 | `memory_strength` is not Assertion confidence. | Profile §6.1 | CORE-018, X-011 |
| P4 | `salience` is not source trust. | Profile §6.1 | — |
| P5 | `utility` is not execution authority. | Profile §6.1, §14 | — |
| P6 | Person is not Principal. | Profile §5.1 | GOV-002 |
| P7 | SelfModel is not Governance. | Profile §5.10 | GOV-018 |
| P8 | SleepTask assignment is not permission. | Profile §5.9 | — |
| P9 | Failed Experiences are valid memory. | Profile §11 | — |
| P10 | One success does not prove a general Skill. | Profile §13, §14 | — |
| P11 | Derived summaries do not create independent Evidence roots. | Profile §8, §8.2 | EPI-015 |
| P12 | Event and Experience are not interchangeable. | Profile §5.2, §5.3 | — |
| P13 | Temporal order does not imply causality. | Profile §7 | — |
| P14 | Hidden chain-of-thought is not required. | Profile §0 | — |
| P15 | Explicit correction preserves history. | Profile §3 | X-001 |
| P16 | Imported Skill remains non-authoritative by default. | Profile §21 | GOV-021, CAP-012, X-006 |
| P17 | Commitment expiry and retention expiry are distinct. | Profile §5.7, §19 | — |
| P18 | Read frequency is not a required mnemonic signal. | Profile §18 | EPI-009 |
| P19 | Profile Facets cannot override Core fields. | Profile §6 | CORE-017 |
| P20 | Brain algorithms remain outside Profile conformance. | Profile §22 | — |
| P21 | A fired Watch grants nothing; it creates attention, not action. | Profile §5.11 | X-019 |
| P22 | Deliberate silence at the action gate is a recordable outcome. | Profile §6.6, §9 | — |
| P23 | DerivationState is review state; stale is not retracted. | Profile §6.3, §8.2 | EPI-028 |
| P24 | WorkingState is a derived view; it is never Evidence and never corroborates its inputs. | Profile §5.12, §8.2 | — |
| P25 | utility is the admission bet, revised by outcomes; it is not truth, salience, or permission. | Profile §6.1, §8.1 | — |
| P26 | The acting model never writes the Outcome Evidence that grades its own action. | Profile §8.1 | GOV-026, X-017 |
| P27 | A Skill enters trial only with a task_family; an ungradable pattern is not procedural memory. | Profile §14 | — |
| P28 | Lifecycle transitions are deterministic verdicts over graded outcomes, recorded and recomputable. | Profile §9, §14 | X-016 |
| P29 | Revocation is never harder than adoption. | Profile §14 | — |
| P30 | Adoption is provisional; an adopted Skill remains under its outcome stream. | Profile §14 | — |
| P31 | Lifecycle standing does not survive import; an imported Skill enters proposed. | Profile §14, §21 | GOV-021, CAP-023 |
| P32 | A task family finds comparable consequences; it never attributes one. | Profile §8.1 | X-016 |
| P33 | A tally, a verdict, or a utility calibration changes only through an outcome linked to the decision that applied the cognition. | Profile §8.1 | X-016, GOV-026 |
| P34 | A trial's basis is recorded in TrialState before any outcome is counted against it. | Profile §6.5, §14 | — |
| P35 | A DecisionRecord records what the gate decided; it is never authorization to act. | Profile §6.6 | — |

---

## Reading the two parts together

```text
Core invariant     protocol truth: holds in every Space, under every Profile
Profile invariant  memory truth: holds where the Cognitive Memory Profile is active
```

Several Profile rows restate a Core row in the Profile's vocabulary — P3 and 15, P11 and 10, P26 and 36, P32/P33 and 37 — on purpose: the Core row binds the runtime, the Profile row binds the Brain that writes through it. A Core row never depends on a Profile row.
