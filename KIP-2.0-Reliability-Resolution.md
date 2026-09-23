# KIP v2 memory design checklist — 2026-09-23

> **Historical record.** It describes the revision it names. The later [memory-brain revision](./KIP-2.0-Memory-Brain-Resolution.md) removed the retained draft packages (a single `cognitive-memory@2.0.0` remains), dissolved the Cognitive Consistency companion into the Specification and the `brain/` companions, and replaced TrialState and DerivationState.

Scope confirmed by the owner: complete and commit the **KIP repository** changes;
record downstream Anda Brain/AndaDB work separately. English sources only. No Chinese
mirrors, frozen design notes, v1 implementation or downstream source files are changed.

The current draft memory package is **2.2.0**. Existing **2.1.0 package bytes and its
six pinned schema resources are retained exactly**, under their original identities.
Current Schema IDs include the `2026-09-23` revision; they do not silently replace a
resource authenticated under an old digest. Core kinds and existing symbol lineages
are unchanged. This is an unreleased protocol revision, not a deployment or learning claim.

## Checklist disposition

Each item below is handled at the KIP layer. “Contract/model” means an implementable
normative contract with typed records and executable contract checks; it does not mean
an external engine has implemented it. The [reliability scenarios](conformance/KIP-2.0-Reliability-Tests.md)
are the independent engine acceptance obligations.

| Original item | KIP change / decision | Verification / downstream boundary |
| --- | --- | --- |
| P0-1 Selection dependencies | DependencyBasis captures actual belief/slot/query reads, absence, result digest and change token; conservative re-evaluation when precise tracking is unavailable | REL-002; engine must track inserted opposition and query phantoms |
| P0-2 Extraction repair | Protected RecordingRepair with source digest/locator, recorder authority, CAS and engine recording_validity; preserves source and actor history | REL-004; new protected engine operation and permission |
| P0-3 Causal formation | Host SourceOrder and predecessor barriers; restartable queue model; MemorySession preserves all outstanding receipts | REL-005/013 plus causal IntakeLedger test; Anda Brain already serializes Formation, new binding must attest causal receipts |
| P0-4 Prospective controls | Fixed baseline remains the default; prospective_trials freezes enrollment first and actual cohort at evaluation | REL-006; existing Anda paired plan is valid baseline-first, not a concurrent randomized trial |
| P0-5 Timestamps | Shared strict Timestamp schema and parseTimestamp reject noncanonical/invalid inputs; current fixtures aligned | REL-001; legacy pinned schemas deliberately retain their original contract |
| P0-6 External fencing | Distinguish native admission from receiver acceptance; receiver_fencing needs actual effect-owner enforcement | REL-007; preserve existing Anda durable native admission and reconciliation |
| P1-7 Recall coverage | RecallPlan pins selectors, exact/approximate method, scope and watermarks; mandatory exact channels are independent of similarity | REL-008; approximate plan completion never certifies semantic exhaustiveness |
| P1-8 Invalidation cost | Relevant-plane pins and output certifications; lifecycle/control validity always checked; reusable computation gets a truthful fresh result basis | REL-003; engine positive tests must show irrelevant writes do not invalidate |
| P1-9 Scope | MemoryScope follows content-bearing source/products; WorkingState key includes actor/task/context; shared Propositions remain canonical and scope-neutral | REL-009/014; host and engine must preserve scope through all products |
| P1-10 Hidden existence | LIST DEPENDENTS truncation is relative to authorized visible traversal; global closure requires separate authority | REL-010; two-world noninterference scenario |
| P1-11 Exchange/restore | Preserve source coordinates and replay bytes, use declared reference paths and a mapping artifact; separate historical evidence from current validation/authority | REL-016; real cross-engine exchange remains a downstream gate |
| P1-12 Runnable default Brain | Correct the review: a production Brain exists. Add concrete default policy and implementation evidence instead of another Brain/evaluator | Anda Brain library: 538 passing tests; provider-driven behavioral gains remain unmeasured |
| S1 Small interface | Host MemorySession helper and scoped ASSERT context; mechanical retry/source/paging responsibilities remain host-owned | REL-013/014; five intents unchanged, no Core kind added |
| S2 Rebuildable state | Grading/currentness are checked or reconstructed from immutable records and current pointers; no second writable truth lifecycle | REL-017; downstream may preserve compatibility materializations |
| S3 Lazy decay | Declared base/anchor/policy, read-only effective strength; optional lazy_mnemonic_strength | REL-011; benchmark savings before advertising them, retention/correction work stays explicit |
| S4 Lineage duplication | Activity/DependencyBasis are authoritative; redundant lineage is generated or validated; typed reference_paths avoid string replacement | REL-016/017; engines enforce correspondence at commit |
| S5 Shared definitions | Timestamp, ProjectionBasis and ArtifactPin reused through refs; digest lock covers their complete closure | REL-001/015 plus isolated validator tests; old resources unchanged |
| S6 Applicability vs improvement | ProcedureAssessment remains advisory and cannot promote; keep one Skill lifecycle and the comparative adoption requirement | REL-012; deliberate decision not to weaken validated learning |
| G1 Actual implementation evidence | Inspect and run existing Anda Brain all-feature library tests; add new engine scenarios and preserve the external MIB behavioral workflow | [Evidence report](conformance/Brain-Implementation-Evidence.md); no fake real-model or 2.2.0 conformance result |

## Downstream implementation order

1. **AndaDB / Nexus:** load the 2.2.0 pinned resources separately from 2.1.0; enforce
   strict timestamps; scoped ASSERT lowering if parsing text natively; selection
   dependencies, semantic output planes, recording repair and existence-neutral
   dependents. Run REL-001–004, REL-010, REL-014–015 on the real engine.
2. **Anda Brain / Worker binding:** retain host SourceOrder and MemoryScope across
   intake, work, retry and resume; carry exact RecallPlans and automatic session
   barriers. Preserve the existing serialized writer admission and honest budgets.
   Run REL-005, REL-008–009 and REL-013. Advertise the exact contract revision only
   when supported; installed vocabulary alone is insufficient.
3. **Optional learning/execution:** keep fixed paired plans working; implement
   prospective enrollment/cohort checking only when advertised. Add applicability
   assessment without adoption. Declare native-admission versus receiver-fenced
   tool bindings and test delayed old workers. Run REL-006–007, REL-012 and REL-017.
4. **Exchange and cost:** exchange a complete nested procedural/dependency Capsule
   between Rust and Worker with source mapping and explicit unavailable artifacts;
   compare lazy decay with sweeps under the same corpus. Run REL-011/016. No automatic
   historical standing or authority migration is permitted.
5. **Behavior:** use the existing external MIB integration with a pinned provider,
   holdout, costs, ablations and independently observed outcomes. Keep not_run until
   actual measurements exist. This is not required to call a syntax/model test PASS.

Existing deployed/published engines must not be labeled compatible merely because
the protocol repository has passed its tests. Unsupported new capabilities fail
explicitly; the working fixed-baseline and native-admission paths remain valid.

## Validation

Executed against this revision:

| Check | Result |
| --- | --- |
| English toolkit/contract suite | 229 passed, 0 failed; 1 Chinese mirror comparison skipped (230 registered) |
| Formal runner Node contract subset | 67 passed, 0 failed |
| Available Python models | Governance, grammar, lifecycle, Watch and purge checks passed, including configured fault witnesses |
| Alloy / TLC | Not executed: JAR prerequisites unavailable; formal runner exits 3 |
| Current artifact digests | 5 verified; includes the complete current schema lock |
| Retained artifacts | Both earlier package files and all six 2.1.0 schema resources byte-identical |
| VS Code consumer | Type-check passed |
| Actual Anda Brain library | 538 passed, 0 failed at f723f96; not new-contract certification |
| New external-engine REL adapters / real-model behavioral experiment | Not run; explicitly assigned downstream |
| Whitespace / excluded sources | Clean diff; Chinese mirrors, frozen design notes and v1 unchanged |

Reproduce the KIP checks with:

```sh
KIP_DOC_LANG=en pnpm --filter @ldclabs/kip-lang test
node conformance/update-digests.mjs
node conformance/run.mjs --suite reliability --list
pnpm --filter vscode-kip lint
bash formal/run.sh
```

The formal runner also executes reliability tests. Missing Alloy/TLC prerequisites
produce exit 3, not a full proof. Current reference models are bounded examples;
engine conformance and behavioral improvement remain separate claims.

Co-authored-by: Codex <noreply@openai.com>
