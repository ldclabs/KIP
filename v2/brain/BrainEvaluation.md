# Brain Evaluation and Release Gates

**[English](./BrainEvaluation.md) | [中文](./BrainEvaluation_CN.md)**

**Reference evaluation workflow; report integrity is normative for learning claims.**

Protocol conformance, reliable execution and improved behavior are separate gates.
A pass on one never substitutes for another. No empirical result is supplied by this
repository revision; the shipped report template is explicitly `not_run`.

## 1. Protocol and artifact gate

Run the English language/contract tests, artifact digest validation, finite models
and the applicable engine adapter vectors. Record the engine/version, package and
schema digests, supported capabilities, harness version and actual coverage.
Unsupported required capabilities, model-only results, skipped checks and adapter
errors remain visible. A partial vector runner cannot declare a whole Profile PASS.

## 2. Reliable-runtime gate

Use an isolated test Space and controlled external executor. Inject process/network
failure at: intent committed, before dispatch, after effect, before Outcome commit,
lease takeover, Watch re-arm, stream replay/truncation, trust/authorization update,
root correction and concurrent cache update. Verify:

- same attempt reconciled, no unacknowledged duplicate external effect;
- replacement worker resumes, old fence cannot write/dispatch;
- no false silence before complete authorized deadline coverage;
- no stale accepted derivation or cross-context/cross-authorization cache reuse;
- erasure includes semantic copies, replay inputs and controlled backups;
- bounded memory, backlog, replay cost and p50/p95 latency under sustained input.

Specify limits and alert/recovery criteria before a run. Do not send real external
messages or execute live irreversible actions as benchmark side effects.

## 3. Behavioral-learning gate

Hold the business model/version, task environment, tool policy and total budget
constant. Compare these conditions with repeated seeds and paired tasks:

```text
no persistent memory
retained source records / ordinary vector retrieval
semantic KIP memory
semantic + Experience
semantic + Experience + immutable Skill revisions
relevant memory ablated
irrelevant/shuffled memory control
```

Count encoding, maintenance, retrieval, tool and evaluation costs in the budget;
a large hidden consolidation budget cannot be presented as an equal-cost comparison.
Create memory only from training interactions. Freeze the evaluation holdout before
learning and exclude test labels/outcomes from admission, retrieval and compilation.
Independent instrumentation measures the acting policy; a model's own account is
never ground truth. Pin observer configuration and ownership/control assumptions.

Measure separately:

| Capability | Test | Failure to catch |
| --- | --- | --- |
| retention and updates | multi-session facts, explicit correction and exact time boundary | stale answer or invented certainty |
| implicit constraints | later task does not explicitly ask for the old constraint | top-k loses an important preference/obligation |
| procedural transfer | related held-out task with new surface form | memorized trace mistaken for reusable skill |
| applicability | change tool/environment/preconditions | negative transfer from an adopted procedure |
| failure avoidance | previously observed failure and counterexample | repeated avoidable mistake |
| causal utility | relevant ablation versus matched full-memory condition | retrieval exposure mistaken for improvement |
| selectivity | raw-retained vs compressed-only, re-encoding and omitted detail | unmeasured information loss |
| prospective memory | due/matching/no-match cases with restarts | missed obligation or false interruption |
| erasure | recall/re-export/replay after scoped deletion | deleted bytes survive as semantic memory |

Public benchmark versions may be additional test sets, never the whole gate.
LongMemEval targets long-term interactive recall, temporal reasoning, updates and
abstention; LoCoMo-Plus emphasizes latent constraints; LongMemEval-V2 adds environment
state, workflows, gotchas and premise awareness. Pin exact dataset/artifact versions
and inspect task/label quality rather than assuming a benchmark name proves coverage.
Sources: [LongMemEval](https://arxiv.org/abs/2410.10813),
[LoCoMo-Plus](https://aclanthology.org/2026.acl-long.1150/),
[LongMemEval-V2](https://arxiv.org/abs/2605.12493).

## 4. Statistical and cost reporting

Predeclare comparison metric, practical improvement margin, confidence interval
method, repetitions, stratification/pairing, missingness and stopping rules. Report
per-context outcomes as well as totals; changing task mix cannot establish improvement.
Report uncertainty, failed/aborted/unknown attempts and negative transfer, not only
successes. Controlled interventions are preferred when feasible; an observational
comparison must state its remaining confounding and cannot claim randomization.

A learning gate passes only if held-out improvement meets the declared practical and
uncertainty requirements without breaching safety/negative-transfer or budget limits.
A result can remain advisory/insufficient. Failures should drive a new immutable
Skill revision and a new trial, never a rewritten benchmark or old verdict.

## 5. Report contract and reproducibility

Use `../schemas/kip-brain-evaluation.schema.json` and the template
`../conformance/fixtures/brain-evaluation-not-run.json`. Preserve model/tool versions,
corpus and observer digests, condition definitions, seeds, budgets, independent
attempt counts, metrics/intervals and trace artifact refs under Governance.

`not_run` requires no measured scores and zero completed runs. `completed` requires
actual runs and measurements; it means the experiment finished, not that learning
passed. Every released learning claim links the report and its predeclared criterion.
Erased/withheld traces reduce reproducibility and must be reported honestly.

## 6. Interface-cost experiment

Compare direct KQL/KML/META with the optional Memory Interface over the **same**
Nexus, input corpus, memory policy, business model and tool authority. Both conditions
must preserve identical observable source, scope, belief, revision and erasure
semantics. An apparent saving obtained by omitting evidence/coverage checks fails.
Count Adapter/model work, intake, background processing, retrieval, retries and
evidence expansion in the total budget, including work hidden from the caller.

Use paired scenarios: a new fact; a world change versus correction; a task-only
instruction; unresolved actor/Schema source recall; unfinished-task resume; feedback;
and scoped forgetting. Include delayed/out-of-order formation, changed authority,
an expired result handle, limited output and network retries. Use the same retained
sources and deterministically controlled worker delays across the two conditions.

Measure first-attempt semantic correctness, business-Agent calls, internal KIP calls,
total input/output tokens under a pinned tokenizer, p50/p95 latency, recovery success,
pending processing duration and unsupported automatic-action rate. Record the cards
and instruction/tokenizer versions each condition loaded. Do not infer lower cost
from card line count or fewer visible calls. Report measured differences with
uncertainty; this repository supplies the experiment contract, not measured results.
