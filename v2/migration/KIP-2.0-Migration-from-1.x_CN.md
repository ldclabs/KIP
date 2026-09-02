# KIP 1.x 至 KIP 2.0 迁移指南

**[English](./KIP-2.0-Migration-from-1.x.md) | [中文](./KIP-2.0-Migration-from-1.x_CN.md)**

## 规范状态

**工程迁移操作指南 / 对应 KIP 2.0 规范第 103 节的参考性配套文档**

本文档阐述如何将生产环境中的 KIP 1.x 部署安全平稳地迁移至 KIP 2.0。

规范性的迁移不变式属于 Specification §103 与附录 I，完整收录于 [`KIP-2.0-Optional-Profiles-and-Migration_CN.md`](../KIP-2.0-Optional-Profiles-and-Migration_CN.md)。若本指南与其发生冲突，以伴随规范为准。

---

# 0. 迁移核心思想

KIP 1.x 与 KIP 2.0 在语义模型上存在本质区别。

KIP 1.x 以自描述的“概念-命题”知识图谱为中心。而 KIP 2.0 将以下维度正交解耦：

```text
语义内涵 (meaning)
认识信念 (belief)
客观证据 (evidence)
历史溯源 (provenance)
记忆状态 (mnemonic state)
生命周期留存 (retention)
安全治理 (Governance)
模式权威性 (Schema authority)
```

因此，迁移不是简单地重命名字段，而是一次**语义解构与重组（semantic decomposition）**。

> **核心原则：完整保留旧大脑实际掌握并记录的信息，绝不伪造 KIP 1.x 从未存储过的细粒度认知区分。**

# 1. 迁移目标

在不臆造缺失的认识论结构的前提下，完整迁移以下内容：
语义内涵、安全的既有唯一标识、历史主张陈述、信息来源标注、时间线信息、隐私意图、情景记忆、承诺事项、既有的经验（Experience）与技能（Skill）资产，以及全流程可审计性。

# 2. 非设计目标

迁移过程**严禁**凭空捏造以下信息：

```text
经核实的强身份标识
信息源信任度评级
从未存在过的具体 Evidence 证据
行动者的鉴权凭证
精确的观测事件血统链
从未记录过的历史 Assertion 修订演变
独立多方佐证关系
系统治理层面的执行权限
```

对语义模糊的历史数据，必须显式保持其模糊性，严禁主观推断。

# 3. 资产清点 (Inventory)

在执行转换前，全面清点源系统资产：

```text
KIP 1.x 具体修订版本
Concept 类型列表
Proposition 类型列表
Concept 与 Proposition 存量统计
元数据键（metadata keys）分布
保留的下划线 `_` 元数据使用情况
Domain（领域）划分
Person / $self / $system 结构定义
Event / Preference / Insight / Commitment / SleepTask 节点
既有的 Experience / Skill 扩展结构
access_level 权限级别使用情况
confidence 置信度分布及含义
置信度定时衰减任务
可恢复的 MERGE 合并历史
DELETE 与 TTL 策略
历史 EXPORT / UPSERT 胶囊文件
自定义 Schema 扩展定义
```

割接前必须生成完整的清点审计报告。

# 4. 数据冻结与备份

推荐操作流程：

```text
1. 暂停破坏性的后台维护任务
2. 捕获一致性源快照
3. 导出原始源状态全量数据
4. 抓取旧版 Schema 与元定义图
5. 记录源引擎类型与版本号
6. 计算输入数据哈希并归档
```

如果旧版 `EXPORT` 会省略用于迁移诊断的底层引擎记账数据，则不能仅依赖旧版 `EXPORT`。

# 5. 目标记忆空间 (Target MemorySpace)

迁移后的每个持久化元素都必须归属于确定的目标 MemorySpace。

典型的个人单租户部署：

```text
单个 KIP 1.x Nexus → 单个默认个人 MemorySpace
```

严禁仅凭语义 Domain（领域）直接推导 Space 边界：

```text
Domain（业务领域） ≠ MemorySpace（安全边界）
```

若源图中混杂了多个安全主体的记忆，必须在数据迁移前制定明确的治理分区方案。

# 6. 主体与行动者迁移 (Principal & Actor)

旧图中的 `$self`、`$system` 和 Person 节点属于认知内容中的语义行动者（Actor），绝不是经过密码学鉴权的 Principal（主体）。

必须在治理平面单独配置：

```text
PrincipalRecord（主体记录）
ActorBinding（行动者绑定）
Space 所有权与成员关系
Grants（授权）
Policies（策略）
```

严禁仅因为源图中包含 `$system` 节点就直接授予管理员特权。

# 7. 模式迁移 (Schema Migration)

KIP 1.x 的权威模式通过图内的 `$ConceptType` 和 `$PropositionType` 节点表达；而 KIP 2.0 的权威 Schema 属于不可变的 Schema Package（模式包）。

迁移流程应为：

```text
读取旧版 Schema 图节点
规范化类型与谓词定义
分配包命名空间与版本号
转换字段约束
转换名称别名
记录迁移描述符
发布不可变的 Schema Package
在 Governance 治理层激活生效
```

旧的 Schema 概念节点可作为镜像或溯源记录保留，但**严禁**将其作为 2.0 运行时的权威 Schema。

# 8. 模式包策略 (Package Strategy)

初次迁移时可发布兼容模式包，例如：

```text
kip://legacy/<deployment-id>@1.0.0
```

严禁将遗留的应用自定义类型直接写入 `kip://core` 命名空间。

对于语义与标准认知记忆完全吻合的类型，应直接对齐并迁移至：

```text
kip://profiles/cognitive-memory@2.0.0
```

# 9. 概念迁移 (Concept Migration)

```text
v1 Concept → v2 Concept
```

在迁移血统记录中完整保留源系统的局部 ID。仅当目标系统能够保证不破坏原生 ID 规范时，方可复用原 ID。

若 v1 依赖 `(type, name)` 作为唯一性依据，应在合理情况下生成稳定的 v2 `key`。严禁将显示名称直接提升为全局 `canonical_id`。

# 10. 属性迁移 (Attributes)

当属性值属于元素局部的展现信息且无需独立的认识论生命周期时，保持为 Concept 的 attributes（例如显示提示、紧凑运行状态、计数器或非涉真的普通对象/数组）。

当属性值具备独立来源/置信度、存在潜在冲突、具有时序演变、需要生效时间约束、依赖证据佐证或作为涉真陈述对外交换时，应将其提升为 Proposition + Assertion。迁移过程支持循序渐进。

# 11. 命题迁移 (Proposition Migration)

针对每个陈述事实的 v1 命题：

```text
v1 命题 (Proposition)
→ 规范化 v2 命题 (Proposition)
+ 迁移生成的正面断言 (positive Assertion)
```

v2 Proposition 本身是价值中立的。迁移生成的 Assertion 负责承载旧系统的断言意图。

必须使用系统已注册的原生 Assertion 模式（mode）。迁移来源应记录在 Activity 或导入溯源信息中，严禁凭空捏造未注册的 mode 值。

# 12. `author` 与 `asserted_by` 映射

旧系统的 `author` 语义模糊，可能指代说话人、写入方应用程序或记账主体。

仅在语义明确时进行映射：

```text
明确的语义来源 Person → asserted_by Person
仅为系统写入程序       → 记入迁移溯源信息，不作为 asserted_by
未知字符串             → 作为遗留标注或 Evidence 来源文本保留
```

严禁凭空捏造 ActorBinding。

# 13. 置信度迁移 (Confidence Migration)

仅当旧系统的 `metadata.confidence` 明确代表认知确信度时，才映射为 Assertion 的 confidence。

若其代表的是可提取性、重要性或时效性，应分类重构：

```text
真值支持度 (truth support)     → Assertion confidence
记忆遗忘/提取度 (access)       → MnemonicState.memory_strength
显著性/重要度 (importance)     → MnemonicState.salience
时效性/过期 (staleness)        → 认识投影的时效策略
语义混合/含义不明 (unknown)    → 保留原值并进行保守的原生字段初始化
```

# 14. 旧版置信度衰减处理

若旧系统通过周期性维护任务对置信度进行了机械衰减，原始的认知置信度可能已不可考。

正确的迁移策略：

```text
保留当前的遗留数值
记录语义模糊警告 (ambiguity warning)
保守初始化原生 confidence 与 memory_strength
彻底终止后续通用的置信度机械衰减任务
```

严禁将衰减后的数值直接盲目赋给 Assertion confidence 并继续对其执行衰减。

# 15. 来源与证据 (Source & Evidence)

尽可能将可解析的来源实体转化为显式的 Evidence / Activity：

```text
消息 ID
工具调用结果
测量数据
原始文档
调用链 Trace ID
人类反馈
```

诸如 `"web"` 或 `"conversation"` 等泛型字符串不能自动构成为具体的 Evidence。若无法还原精确事件，应将其作为遗留标注或外部引用保留。

# 16. 时间戳映射

```text
observed_at（观测时间）   → Evidence.observed_at
valid_from / valid_until  → Assertion.valid_time
expires_at（过期时间）    → retention.expires_at
```

旧系统的 `created_at` 属于内容历史溯源。原生 `_system.created_at` 代表新引擎中的事实写入时间（除非使用受保护的底层灾备恢复机制）。

# 17. 生命周期映射

仅当能够准确还原特定行动者发起的信念修订时，旧系统的 `superseded`、`superseded_at`、`superseded_by` 方可转换为 Assertion 的生命周期状态。

若旧系统的生命周期标记直接挂在 Proposition 上且行动者未知，应作为遗留生命周期标注保留，避免伪造特定主体的废弃历史。

# 18. DELETE 操作迁移

按业务意图分类映射：

```text
不再采信 (no longer believed)    → 撤回 (retraction) / 废弃替代 (supersession)
不再常规召回 (not recalled)      → 归档 (archive) / 记忆强度调整
逻辑删除 (logically deleted)     → 墓碑标记 (tombstone)
物理擦除 (must physically erase) → 治理管控下的物理清除 (purge)
清理孤立节点 (cleanup orphan)    → 安全的垃圾回收策略 (GC)
```

严禁将旧系统粗暴的 DETACH 级联删除作为原生系统的默认记忆管理策略。

# 19. MERGE 合并历史迁移

旧版合并通常直接重定向边、拷贝属性并物理删除源节点。而 v2 的原生合并是非破坏性的实体对齐操作。

对于历史遗留的合并记录，应读取 `_merged_from` 与变更日志，仅在信息可靠时重建别名血统。若源节点数据已彻底丢失，严禁虚构完美的历史源节点。

所有后续的新合并均必须采用 v2 非破坏性语义。

# 20. Domain 迁移

旧版 Domain 属于业务语义分类。应保留相关的主题 Concept 及类似 `belongs_to_domain` 的语义关系。

严禁直接将 Domain 机械映射为 MemorySpace，除非该 Domain 在旧系统中确实充当了严格的安全隔离边界且该判定经过了明确核实。

# 21. 隐私与 `access_level`

旧版的 `access_level` 缺乏原生强隔离执行机制。

迁移时应清点存量值，制定密级映射规范，配置受保护的 Space 策略与授权（Grants），并可选择性地将旧 `access_level` 作为遗留认知属性保留。

典型映射参考：

```text
public    → public
internal  → internal
private   → private
sensitive → sensitive
```

但每个具体项目必须结合实际业务语义校验。

# 22. Event 迁移

旧版 Event 节点通常映射至 Profile Event。将摘要、时间、参与者、结果和主题迁移至 Profile 结构中。涉真的元数据与命题仍按标准流程分解为 Assertion / Evidence。

# 23. Experience 与 Skill 迁移

若部署环境已使用了早期实验性 Experience 扩展，应将其对齐至 Cognitive Memory Profile 2.0。

关键转换规则：

```text
metadata.memory_strength   → MnemonicState.memory_strength
metadata.confidence        → 分类重构；严禁盲目保留在 Profile metadata 中
has_step 与 index 属性     → 转换为有序 has_step 边拓扑（边索引，移除 step 内的序号属性）
caused_by 谓词             → Profile caused_by Proposition + 迁移生成的正面 Assertion
derived_insight            → 在可恢复时建立 derived_from 结构血统（Insight → Experience）
compiled_to / derived_from → 在可恢复时建立 compiled_from + 编译 Activity
```

当精确转换存在不确定性时，应保留原始表示作为溯源依据。

# 24. Preference 迁移

旧版 Preference 常将断言、模式总结、证据计数、置信度及观测时间揉杂在一起。

迁移时必须解耦：

```text
涉真偏好断言 → Proposition + Assertion(s)
总结与稳定性 → Preference Profile Concept
具体观测事实 → Evidence（在可恢复时）
记忆状态     → MnemonicState
```

# 25. Insight 迁移

旧版 Insight 映射至 Profile Insight。若其内容属于可复用的陈述性规律，且映射关系明确可靠，可补充生成 Proposition 与迁移 Assertion，并保留来源 Event / Experience 的血统引用。

# 26. Commitment 迁移

将发起人、受益人、摘要、到期时间（`due_at`）及状态映射至 Profile Commitment。严禁将 `due_at` 映射为存储的 `retention.expires_at`。

# 27. SleepTask 迁移

将遗留维护工单映射至 Profile SleepTask。`assigned_to = $system` 绝不自动转化为系统的操作权限。

# 28. `$self` 迁移

在合理情况下将旧 `$self` 保留为语义层面的自身标识，随后单独建立本地 Principal 记录、ActorBinding 与 Space 所有权。

跨系统常规导入时，**严禁**自动将源系统的 `$self` 映射为目标系统的 `$self`。

# 29. `$system` 迁移

旧 `$system` 可保留为语义维护行动者，但实际具备鉴权能力的 Maintenance Principal 需独立配置。该名称本身不具备任何安全特权。

# 30. 旧版 EXPORT 处理

KIP 1.x 基于 UPSERT 的导出脚本属于旧序列化产物。

处理方案：

```text
保留兼容性导入器
转换为原生 Cognitive Capsule（认知胶囊）
基于迁移后的 v2 状态重新导出
```

除非按 Capsule 规范完成转换与校验，否则严禁声称旧脚本具备原生 Capsule 的摘要、签名与身份语义。

# 31. 胶囊割接 (Capsule Cutover)

推荐最佳路径：

```text
迁移源系统数据
在目标系统完成校验
导出生成全新的原生快照胶囊 (Snapshot Capsule)
```

以此建立干净、可移植的 v2 基线。

# 32. 兼容性适配层 (Compatibility Adapter)

运行时可根据需要提供特定于实现的 KIP 1 兼容适配层以支持渐进式割接。

典型行为：

```text
v1 事实读取     → 映射为已采信的 v2 认识投影兼容视图
v1 命题写入     → 写入 Proposition + 正面 Assertion
遗留元数据      → 映射至原生字段并附带警告
遗留导出        → 生成兼容制品或转换后的 Capsule
```

适配层绝不能篡改原生 KIP 2.0 的核心语义。对语义不明确的操作应输出显式警告或错误。

依赖数字错误码分支的 v1 客户端还需要一份错误码映射：KIP 2.0 的错误码是稳定的名称，而非 `KIP_xxxx` 数字（规范 §87）。

```text
KIP_1001 InvalidSyntax       → InvalidSyntax
KIP_1002 InvalidIdentifier   → InvalidIdentifier
KIP_2001 TypeMismatch        → SchemaSymbolNotFound（类型/谓词未定义）
KIP_2002 ConstraintViolation → ConstraintViolation；写入 `_` 元数据时为 ProtectedSystemField
KIP_2003 InvalidValueType    → TypeMismatch
KIP_3001 ReferenceError      → ReferenceError
KIP_3002 NotFound            → NotFoundOrNotVisible
KIP_3003 DuplicateExists     → IdentityConflict；合并场景为 IdentityMergeConflict
KIP_3004 ImmutableTarget     → ProtectedSystemField | ProtectedSchemaState | ImmutableField
KIP_3005 VersionConflict     → VersionConflict
KIP_4001 ExecutionTimeout    → ExecutionTimeout
KIP_4002 ResourceExhausted   → ResourceExhausted | ResultLimitExceeded
KIP_4003 InternalError       → InternalError
```

该映射并非一一对应：v2 按成因拆分了若干 v1 错误码，且 `NotFoundOrNotVisible` 刻意不区分“不存在”与“对你不可见”。

# 33. 双读验证 (Dual Read)

迁移期间，对比源系统 v1 读取与等效 v2 投影的结果。重点核验实体标识、事实问答、时效性、归属、隐私、Event 召回、Commitment 状态及 Profile 记忆。

因 v2 更严谨的认识论模型导致的差异应进行分类判定，而非直接归类为 Bug。

# 34. 双写策略 (Dual Write)

由于 v1 与 v2 语义差异较大，双写存在较高风险。若阶段性采用，必须指定唯一的权威写入路径，派生另一侧数据，绑定稳定的事件标识与幂等键，并持续监控数据一致性。严禁针对同一输入由 LLM 分别独立生成 v1 和 v2 指令。

# 35. 事务分批策略

严禁将大规模知识库作为单一超大事务整体迁移。必须划分为内聚的原子单元进行分批提交：例如单个实体标识簇、一组 Proposition+Assertion+Evidence、单个 Experience 及其 Steps、单个 Commitment 或单次 Schema 激活变更。

# 36. 迁移活动记录 (Migration Activity)

完整记录迁移溯源信息：

```text
activity_class = schema_migration 或 import
源系统与版本
源快照数据摘要
迁移工具与版本
映射规则 Profile 与版本
迁移警告汇总摘要
```

迁移 Activity 仅记录数据搬迁过程，绝不构成证明旧主张客观为真的证据。

# 37. 幂等性保障

迁移过程必须支持安全重试与断点续跑。维护稳定的源到目标映射：

```text
(source nexus, source element id) → target element id
```

重试执行严禁导致 Assertion、Evidence 或 Experience 重复创建。

# 38. 预检机制 (Preview)

正式提交前必须生成预检报告：

```json
{
  "source": {"version": "1.x", "snapshot_digest": "..."},
  "counts": {"concepts": 0, "propositions": 0},
  "mapping": {
    "concepts": 0,
    "propositions_to_assertions": 0,
    "evidence_created": 0,
    "legacy_facets": 0
  },
  "warnings": [],
  "governance_changes": [],
  "schema_packages": []
}
```

预检操作不会占用标识、权限或修改持久化状态。

# 39. 不确定映射的显式告警

定义明确的告警分类：

```text
legacy_author_ambiguous                （旧 author 语义不明）
legacy_confidence_semantics_mixed      （旧置信度含义混杂）
legacy_source_unresolvable             （旧来源不可解析）
legacy_merge_history_missing           （旧合并历史缺失）
legacy_access_level_ambiguous          （旧权限级别语义不明）
legacy_timestamp_semantics_unknown     （旧时间戳类型未知）
legacy_schema_constraint_unrepresentable（旧 Schema 约束无法表达）
```

在安全的前提下，将无法映射的原始数据保留在带命名空间的遗留 Facet 中。

# 40. 遗留 Facet (Legacy Facet)

兼容包可定义 `LegacyKIP1` Facet 存放未映射字段。该 Facet 必须包含命名空间、通过 Schema 校验、不具备特权，且严禁覆盖 Core、Governance 或 `_system` 字段。

# 41. 割接前全量校验

执行 Core、Schema、Epistemic、Governance、History、Migration 与 Profile 全套一致性测试，并完成数据对账：

```text
源与目标数量核对
标识映射完整性校验
未映射元数据报告审查
隐私策略映射审计
抽样事实等效性核对
历史版本抽检
Event 与 Commitment 完整性核验
```

# 42. 迁移一致性验证项

最低要求核验：

```text
旧 Concept → v2 Concept
旧事实 Proposition → Proposition + 正面 Assertion
置信度挂载于 Assertion，而非 Proposition
source 与 author 准确解耦
observed_at 转换为合法的 Evidence 时间
valid_from/until 转换为 Assertion valid_time
expires_at 转换为 retention
access_level 转换为 Governance 策略
无原生置信度机械衰减
采用非破坏性合并语义
旧版 export 与原生 Capsule 明确区分
```

# 43. 历史时间线语义

迁移会在目标系统中开启全新的事务历史。严禁伪造源系统与目标系统时间线完全同一的假象。

必须将源系统的历史时间戳/ID/版本元数据、迁移执行时间戳以及目标系统事务序列号作为三套独立的坐标维度清晰保存。

# 44. 灾难恢复与普通迁移的界限

同大脑的同构灾备恢复具备更强的连续性要求，与跨系统数据迁移截然不同。严禁利用通用迁移流程绕过主体身份与权限控制。精确的身份与历史恢复必须通过受保护的底层专用流程执行。

# 45. 回滚策略 (Rollback)

工程回滚预案：

```text
源系统保持只读冻结状态
备份数据安全留存
在目标系统验收通过前严禁清理源数据
迁移映射表版本化保存
割接前允许直接销毁并重建目标 Space
割接后通过补偿性 v2 事务进行修正
```

KIP 的事务回滚无法自动撤销外部业务系统的割接动作。

# 46. 割接上线检查清单 (Cutover Checklist)

```text
[ ] 目标 Schema Environment 激活就绪
[ ] Governance 治理策略审计完成
[ ] 行动者与 Principal 绑定关系审计完成
[ ] 实体标识映射表完整无遗漏
[ ] 陈述性事实命题完成映射
[ ] 旧版置信度完成分类与重构
[ ] 存储留存策略映射就绪
[ ] 隐私策略与权限完成转换
[ ] Profile 认知记忆完成迁移
[ ] 未完结的 Commitment 校验无误
[ ] 迁移警告清单逐项复核
[ ] 一致性测试全部通过
[ ] 原始备份安全归档
[ ] 回滚预案演练完毕
```

# 47. 示例：简单事实迁移

旧版数据：

```text
Concept Alice
Proposition Alice --timezone--> "+08:00"
metadata.author = "Alice"
metadata.confidence = 0.9
metadata.source = "message-123"
```

目标系统生成：

```text
Concept Alice
Proposition (Alice, timezone, "+08:00")
Evidence 来源 message-123（若可解析）
Assertion 支持该命题:
    asserted_by = Alice（若有依据）
    confidence = 0.9
    mode = stated（或兼容的原生 mode）
Migration Activity 建立源记录 → 目标记录的血统关联
```

目标系统中的 Proposition 本身不包含置信度属性。

# 48. 示例：旧遗忘机制处理

旧版数据：

```text
confidence = 0.43（每周定期衰减从 0.9 降至 0.43）
```

目标系统无法断定 `0.43` 究竟代表客观确信度低、检索可提取性差还是时效已过期。

正确做法：保留该数值并记录警告，保守初始化原生信号，并彻底停止后续的置信度衰减。

# 49. 示例：旧合并历史迁移

旧版数据：

```text
JS 合并至 JavaScript
JS 节点被物理删除
所有关联边重定向至 JavaScript
```

若存在 `_merged_from` 或日志，保留别名与历史标注及目标规范节点。若历史信息已彻底丢失，严禁虚构历史源节点。后续合并统一采用 v2 非破坏性语义。

# 50. 迁移核心不变式

1. 保持语义保真，重于维持字节形式一致。
2. 严禁捏造缺失的认识论结构。
3. 旧事实命题转换为 v2 Proposition + Assertion。
4. Proposition 绝不继承置信度。
5. 未知元数据显式标记为遗留数据。
6. 来源字符串不自动等同于 Evidence。
7. 作者字符串不自动等同于 Principal。
8. `$self` 绝不是鉴权主体 Principal。
9. `$system` 绝不自动拥有管理员特权。
10. Domain 绝不直接等同于 MemorySpace。
11. `expires_at` 代表物理留存，非现实生效时间。
12. 机械置信度衰减不能作为原生真值衰减延续。
13. 旧版破坏性合并与原生合并语义不同。
14. 旧版 export 脚本与原生 Capsule 严格区分。
15. 图内 Schema 节点不是原生权威 Schema。
16. 迁移过程必须具备幂等性。
17. 预检操作不提交任何持久化状态。
18. 源系统与目标系统的历史时间线严格独立。
19. 所有不确定映射必须显式暴露告警。
20. 迁移成功的标准是语义一致，而非仅仅记录数相等。

# 51. 终极准则

> **迁移成功的标志是：KIP 2.0 大脑能够清晰解释其认知的来源，同时绝不宣称旧大脑拥有超出其实际记录精度的确定性。**
