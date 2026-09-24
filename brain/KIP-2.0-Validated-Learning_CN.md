# KIP 2.0 已验证学习 (Validated Learning)

**[SPECIFICATION_CN.md](../SPECIFICATION_CN.md) 与[认知记忆 Profile](../profiles/CognitiveMemoryProfile-2.0_CN.md) 的规范性配套规范，版本 2.0-draft。**

本配套规范定义了程序性记忆如何挣得**已验证资格地位 (validated standing)**：不可变修订版本、预注册尝试、受控检测结果、锁定的试验及可重放评估。它约束声明支持记忆接口级别 `memory_learning`（以及对 Skill 进行打分的完整 `KIP-CognitiveMemory` Profile）的实现。若无该机制，Skill 仅能作为未经证实的候选：可被召回、可用于深思熟虑，但绝不能被提升晋级。

规范性关键词遵循规范 §0。本配套规范不增加 Core 类别：此处记录的每一项均为标准 Profile 包中的 Concept、Activity 或 Facet，其传输线格式位于 `schemas/kip-cognitive-records.schema.json`。

## 1. 范围与资格地位 (Scope and standing)

Profile 中 Skill 的生命周期为：

```text
proposed → trialed → adopted → revoked
```

召回上报**资格地位 (standing)**，即该生命周期的视图：`proposed` 与 `trialed` 属于 `unproven`，带有匹配的已验证评估的 `adopted` 属于 `validated`，其评估无法验证的 `adopted` 属于 `unverifiable`，而 `revoked` 属于 `revoked`（Profile §14）。除撤回操作（`proposed → revoked`，任何经授权的策略均可记录）外，仅有本配套规范能将 Skill 推进至 `proposed` 之外。

已验证资格地位绝非执行权限。执行权限属于 Governance 范畴（规范 §31.3），严格绑定到确切的修订版本与行为摘要。

## 2. 修订版本、决策与尝试 (Revisions, decisions and attempts)

**SkillRevision 拥有行为。** Profile 的不可变 `SkillRevision` Concept 在 `behavior_digest` 下持有 `task_family`、适用性、先决条件、规程（procedure）、成功准则及恢复逻辑。`Skill` 是其稳定的实体标识，持有 `current_revision` 及展示状态。更改行为必须创建新的 SkillRevision，并在同一个受防护事务中选定它、将当前资格地位重置为 `proposed` 并清空 `current_trial` 与 `current_evaluation`。选定不等于晋级；对旧修订版本的裁决保持完好。注解与 `MnemonicState` 的变更不会重置资格地位。绑定到修订版本 ID 与行为摘要的权限，绝不会通过稳定的 Skill ID 传递给被编辑后的行为。

**DecisionRecord 分离检索与使用。** `action_gate` Activity 的不可变 DecisionRecord（Profile §6.4）明确区分 `retrieved_refs`、`used_refs` 与 `applied_revisions`；每个被应用的修订版本必须（MUST）同时出现在该 Activity 的 `inputs` 中。仅被检索的内容不会获得自动信用记入。共同使用的多个修订版本构成干预组合包（treatment bundle），除非记录的归因方法将它们分离；共享决策并不能证明单个修订版本的因果效用。

**AttemptRecord 在派发前固定抽样单元。** 带有不可变 AttemptRecord 的 `action_attempt` Activity 在实际派发**之前**标识每一次尝试：在 Space 内唯一的 `attempt_id`、`decision_ref`、被应用的修订版本引用、可为空的 `trial_ref`、上下文、环境与工具标识、选择策略及先决条件评估。事后记录的行动记录仍是有效的审计凭据，但绝不能（MUST NOT）在事后被招募为干预组。试验分配在观测到任何结果之前即已固定。

## 3. 结果 (Outcomes)

结果证据（Outcome Evidence，规范 §15.7）携带不可变的 **OutcomeRecord**：`task_family`、`attempt_ref`（仅针对流观测时为空）、`metric`、`window`、`terminal`、`observation_key`、`observer_config_digest`、`outcome_status`（`success | partial | failure | aborted | unknown`）及可选的 `magnitude`。观测仪器的 `outcome_observation` Activity 将结果与其尝试以及该尝试的决策关联起来；写入上述任一内容均需要 `record_outcome` 权限（规范 §29.8）。

- 观测键用于源事件去重。针对同一次尝试由多个观测仪器进行的测量或多次重复测量，仍作为不同的 Evidence，但属于同一个抽样单元：对于每一次尝试、指标与时间窗口，最多只有一个终态聚合值参与评估。
- 中间状态、未知状态、中止状态及缺失结果均显式建账。相互冲突的终态观测需要锁定的聚合或仲裁规则；绝不能变成两次成功。
- 被更正的结果被排除在新的评级之外；既有的旧评估则精确保留其当时所使用的观测与更正状态。
- 没有尝试关联的结果属于数据流素材。共享任务家族绝不会使其成为基准线，且其缺失归因既不能证明其属于干预组也不能证明属于对照组。
- 导入的结果是可读的证据，绝非本地评分（Capsule §41.6）。

## 4. 试验与评估 (Trials and evaluations)

**TrialRecord 在招募前锁定对比基准。** 开启试验是一项已完成的 `trial_open` Activity，携带不可变的 TrialRecord：修订版本或组合包、基准线、规则与参数制品、可比性策略、`baseline_mode`、确切的基准线尝试与结果引用、分层与权重、以**独立尝试**计量的配额、观测窗口、缺失值处理策略，以及重新运行所需对比输入的不可变副本。Skill 的 `current_trial` 结构化字段选定该试验；该字段是一个指针，重放时绝不读取。重新试验会创建带有新 ID 的新 Activity；迟到的结果归属于其原始试验，绝不能用于满足新试验的配额。在试验开启前做出的决策不能被招募进入该试验。

**EvaluationRecord 使裁决具备可重放性。** 每一个 `lifecycle_verdict` Activity 均携带不可变的 EvaluationRecord：`trial_ref`、修订版本引用、`from_status` 与 `to_status`、规则与参数摘要、截止时间戳 (cutoff)、选定的尝试与结果引用、被剔除及缺失样本的明细账、对比结果，以及持有确切规则、参数、基准与输入值的锁定重放制品 (replay artifact)。摘要依据可用字节进行校验：若名称或哈希缺少可检索的规则或输入，则不能声称具备可重算性。重放制品的治理严格程度至少不低于其实质输入，并受语义擦除约束（规范 §60.7）。重放已保留的评估无需 `historical_reads` 权限。

**裁决事务。** 生命周期状态与 `current_evaluation` 仅在与经过验证的 EvaluationRecord 相同的事务中变更。引擎必须（MUST）验证引用闭包、修订版本与试验匹配、独立尝试的唯一性、合格的仪器来源、规则绑定及确定性裁决。仅仅将 Activity 命名为 `lifecycle_verdict` 本身不能晋级任何内容。该事务写入的每一个平面均受防护。随后计算得出的 `GradingState` 视图（Profile §6.2）反映该新评估；它绝不被写入。

状态流转遵循 Profile §14。仅有 `trialed → adopted` 属于晋级；`proposed → adopted` 与 `revoked → adopted` 均无效，从 `revoked` 重新进入须先开启并选定新的试验。EvaluationRecord 可以（MAY）保持 `from_status == to_status` 用于采纳后监控（§6）。导入的 Skill 与修订版本不具备本地资格地位，且导入的结果不能用于评级。

## 5. 固定基准线、前瞻性招募与适用性 (Fixed baselines, prospective enrollment and applicability)

`baseline_mode` 默认为 `fixed`：TrialRecord 锁定了显式的基准线尝试与结果。宿主可以（MAY）预注册配对任务与选择策略，运行完整基准线，然后开启固定试验；这属于有效的基准线先行设计，绝不能（MUST NOT）汇报为并发随机试验。

声明支持 `prospective_trials`（规范 §67.4）的运行时增加了 `baseline_mode: "prospective"`。此时 TrialRecord 锁定了**招募制品 (enrollment artifact)** —— 总体、单元与分支、分配程序、预先声明的样本上限、可比性、指标、不确定性及终止规则 —— 且其基准线引用为空：它无法引用未来的记录，且已完成的 `trial_open` 绝不更新。每一个合格的对照组与干预组 AttemptRecord 在执行前且在观测到其结果前，通过 `assignment`（其 `unit_id`、`assigned_at` 与试验分支 arm）锁定该招募制品。经认证的宿主依据实际分配记录与所应用的修订版本核实每一次分配；模型自行写入的分支标签绝不能确立分组归属或未经干预的对照组。

对于前瞻性试验，`EvaluationRecord.cohort_artifact` 锁定了贯穿预声明截止时间戳的完整招募队列，包括缺失、中止与未知的尝试、实际结果、分配回执及显式排除项。评估器必须（MUST）检查没有合格的分配凭空消失，且没有尝试发生分支切换、试验切换或修订版本切换；重复观测绝不能增加样本单元。招募或队列覆盖缺失或无法验证时，禁止晋级。

**ProcedureAssessment** 可以（MAY）对照适用性或正确性准则验证修订版本，而不声称具备相对改进。它保持为建议性且未经证明的状态，绝不改变生命周期状态或 `current_evaluation`，且不赋予任何权限：绝对成功检查并不是被重新包装的学习。

## 6. 可比学习 (Comparable learning)

已验证资格地位使用受保护控制状态下由 `manage_policy` 管辖的**评估策略 (evaluation policy)**。它锁定了允许的规则与参数契约、观测仪器控制摘要以及最低证据与不确定性要求。Brain 可以（MAY）提议策略，但作为普通认知内容提供的规则绝不能授权其自身的裁决。TrialRecord 锁定策略的标识、版本与摘要；在裁决时和派发时会重新检查当前策略，而保留的策略则可用于重放。常数采纳规则，或由调用方提供的被削弱的阈值，并不能仅凭被计算了哈希就获得授权。

经授权的规则声明其指标、改进方向、非负的实际改进幅度门槛、最小独立样本要求（晋级为 `adopted` 至少需要两次干预尝试）、不确定性检验、安全约束及降级条件。配额计算的是合格的独立尝试，绝非 Evidence 元素的数量。撤回或紧急策略降级可以（MAY）拥有零个结果，但仍需记录确定性的理由与裁决；晋级则绝不能（MAY NOT）。

基准线归属是显式的，且需检查上下文、环境与工具版本、先决条件满足度、干预或组合包以及观测窗口的可比性。不同的尝试 ID 并不能证明统计独立性：声明的 `sampling_unit` 与 `correlation_policy` 将相关尝试聚类或调整不确定性计算。缺失归因并不能证明其属于未受干预的对照组。缺失、受删失或失败的尝试绝不能（MUST NOT）从成功率的分母中静默消失。观测器代码与配置均被锁定；仅凭独立的 Principal ID 不能证明观测的独立性。自评或未验证的观测流程不能声称获得了经过验证的本地学习，即使开放部署环境为了审计而记录了该过程。

规则可以（MAY）使用配对、分层、随机化或声明的离线策略评估（off-policy estimation）；协议不强制规定具体方法。当规则自身的可比性、覆盖范围或不确定性要求未满足时，必须（MUST）拒绝正向裁决。分层对比使用预先声明的共享权重，而非各分支实际观测到的任务混合比例：在一个层中从 90% 降至 80%，在另一个层中从 40% 降至 30%，无论总体聚合指标如何，都绝非改进。空的基准线或缺失的层属于证据不充分，绝不能捏造 0.5 作为基准。

采纳后监控创建新的评估并保留先前的评估。在授权策略允许维持资格地位的情况下，同状态的 `adopted → adopted` 评估可以（MAY）记录证据不足或无改进（包括合格新尝试为零项）；其重放制品保留先前的采纳依据及监控决策。它不声称获得新的学习成果，且绝不能绕过必要的降级。效用变更记录其归因方法、证据与不确定性；对实用性的假设与经过衡量的改进始终保持明确区分。

## 7. 裁决的 KML 表达 (The verdict, as KML)

一旦试验达到独立合格尝试的配额且其对比取得成功，裁决与状态变更即共同提交。`:evaluation_record` 取值锁定了不可变的试验、修订版本、选定的尝试与结果，以及保留的重放输入：

```prolog
MUTATE {
  CREATE ACTIVITY ?verdict {
    SET FIELDS {
      activity_class: "lifecycle_verdict",
      status: "completed",
      parameters_digest: :parameters_digest
    }
    SET FACET "EvaluationRecord" {
      trial_ref: :trial, revision_refs: [:revision],
      from_status: "trialed", to_status: "adopted",
      rule_digest: :rule_digest, parameters_digest: :parameters_digest,
      cutoff: :now, attempt_refs: [:attempt_a, :attempt_b],
      outcome_refs: [:outcome_a, :outcome_b], excluded_samples: [],
      missing_attempt_refs: [], comparison: :comparison, replay_artifact: :replay_artifact
    }
    SET STRUCTURAL {
      ("inputs", :trial)
      ("inputs", :revision)
      ("inputs", :outcome_a)
      ("inputs", :outcome_b)
      ("outputs", :skill)
    }
  }

  UPDATE :skill
  SET ATTRIBUTES {status: "adopted"}
  SET STRUCTURAL {("current_evaluation", ?verdict)}
  EXPECT VERSION :version OF ATTRIBUTES
  EXPECT VERSION :structural_version OF STRUCTURAL
}
```

该事务在变更当前状态之前，校验不可变的 TrialRecord 与 EvaluationRecord、确切的修订版本、独立聚合的尝试、对比要求以及重放制品。若 Brain 进行了效用重新校准，则属于独立的受防护 `MnemonicState` 写入，并记录其归因方法。

## 8. 验收 (Acceptance)

生命周期与评级契约由 `conformance/KIP-2.0-Cognitive-Tests.md`（MEM-002–MEM-005、MEM-018）、可靠性场景 REL-006、REL-012 与 REL-017，以及有界生命周期模型 `formal/lifecycle/check_lifecycle.py` 锁定。通过这些测试是必要条件，但绝非 Brain 产生学习的证据：行为学习声称遵循 [BrainEvaluation.md](./BrainEvaluation.md)。
