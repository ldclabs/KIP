# KIP v2 设计审查决议 (Design Review Resolution)

**2026-09-06 — 本仓库已全面解决十二项设计审查意见。**

范围说明：包括当前的英文规范文档、标准 Profile 包、参考 Brain 策略、语言工具包、Schema、测试固件（fixtures）、契约预言机（contract oracles）、有限模型、适配器运行器（runner）以及 CI。中文镜像文档与冻结的设计说明保持同步更新。本次修订属于草案契约层面的演进，并不代表外部 Nexus 引擎的部署，也不代表对 Brain 已经获得行为学习成效的经验性断言。

## 决议映射表 (Resolution map)

| 意见项 | 决议说明 | 主要工件 | 验收依据 |
| --- | --- | --- | --- |
| R1 | 最终 BELIEF 包含适用的槽位冲突；候选状态属于诊断信息 | [一致性 §1](./KIP-2.0-Cognitive-Consistency_CN.md#1-冲突完备信念-conflict-complete-belief), [投影 Schema](./schemas/kip-projection.schema.json) | MEM-001；修订 SCHEMA-020；接地/非功能预言机用例 |
| R2 | 稳定技能选择不可变的 SkillRevision；资格、评分与权限绑定至特定修订版本/摘要 | [Profile](./profiles/CognitiveMemoryProfile-2.0_CN.md), [2.1.0 模式包](./profiles/cognitive-memory-2.1.0.schema.json) | MEM-002；修订版本重置与授权规则检查 |
| R3 | 决策、尝试（Attempt）与观察（Observation）拥有独立身份；配额基于独立尝试聚合进行计数 | [一致性 §5](./KIP-2.0-Cognitive-Consistency_CN.md#5-修订版本尝试试用与评估标识-revision-attempt-trial-and-evaluation-identities), [记录 Schema](./schemas/kip-cognitive-records.schema.json) | MEM-003；观察扩散（observation fan-out）故障注入 |
| R4 | 受保护的评估策略；显式可比对照组、抽样/相关性、缺失度与不确定性 | [一致性 §6](./KIP-2.0-Cognitive-Consistency_CN.md#6-可比的学习而非单纯可复现的算术-comparable-learning-not-just-repeatable-arithmetic) | MEM-004/019/022；聚合反转、分层缺失与未授权规则测试 |
| R5 | 不可变的 TrialRecord/EvaluationRecord 与保留的精确回放工件；可变状态仅为指针/缓存 | [Profile §6](./profiles/CognitiveMemoryProfile-2.0_CN.md#6-标准切面-standard-facets) | MEM-005/020；迟到结果、重新试用、更正与保留回放检查 |
| R6 | 产出/校验 Activity 锁定读取输入；虚拟依赖有效性在维护前进行门控使用 | [一致性 §3](./KIP-2.0-Cognitive-Consistency_CN.md#3-不重写历史的依赖健全性-dependency-validity-without-rewriting-history) | MEM-006；即时更正、替代支持与隐藏/不可用源检查 |
| R7 | 完备的 ProjectionBasis、精确上下文匹配与左闭右开区间 | [一致性 §2](./KIP-2.0-Cognitive-Consistency_CN.md#2-投影基线上下文与挂钟时钟-projectionbasis-context-and-clocks) | MEM-007；精确边界、无效区间、上下文与缓存坐标测试 |
| R8 | 受保护且带版本防护的实体识别决策撤回；保留提供的引用与歧义审查集 | [一致性 §4](./KIP-2.0-Cognitive-Consistency_CN.md#4-可修复的身份标识与可移植键-repairable-identity-and-portable-keys) | MEM-008；修复预言机与合并指针写入拒绝 |
| R9 | Watch 世代/覆盖范围、租约/围栏、持久意图与同尝试对齐 | [一致性 §7](./KIP-2.0-Cognitive-Consistency_CN.md#7-持久化注意力工作与外部行动-durable-attention-work-and-external-actions), [维护](./brain/BrainMaintenance_CN.md) | MEM-009；Watch 有限模型与重启/围栏/恢复契约用例 |
| R10 | 压缩遗漏/重新编码、分离召回通道、覆盖范围与语义 ErasurePlan | [一致性 §8](./KIP-2.0-Cognitive-Consistency_CN.md#8-编码召回覆盖率与数据擦除-encoding-recall-coverage-and-erasure) | MEM-010/023/024；部分/保留擦除与具型覆盖/擦除记录 |
| R11 | 可移植数值域；严格的 JSON/JCS 安全规范化与固化工件摘要 | [canonical.ts](../packages/kip-lang/src/canonical.ts), [lower.ts](../packages/kip-lang/src/lower.ts), [摘要工具](./conformance/update-digests.mjs) | MEM-011；精确数值、下溢、Unicode、重复键、属性保留与工件金样检查 |
| R12 | 规范化 Profile 地位、完备的不变量至向量映射、具型工件、适配器与独立学习门禁 | [一致性指南](./conformance/README.md), [Brain 评估](./brain/BrainEvaluation_CN.md) | MEM-012–025；向量/报告/Schema 检查与 CI |

目前目录库包含 **356 个可移植向量**、**43 项 Core 不变量** 与 **46 项 Profile 不变量**。每项 Profile 不变量均有明确对应的向量；该映射并不蕴含所有向量已在外部引擎上运行通过。

## 兼容性与实现边界 (Compatibility and implementation boundary)

- Core 核心层依然仅有五类元素类型。新的过程契约使用 Concepts、Activities 与 Facets，以及既有的 KQL/KML 句型；未增加任何新的非具型变更语言。
- 当前包标识为 `kip://profiles/cognitive-memory@2.1.0`。原 2.0.0 工件按字节完全保留以供迁移参考。精确包引用绝不会被不同内容覆盖。旧版技能数据不会被赋予虚构的修订版本、试用登记或经过验证的当前资格。
- `kip-jcs-safe-v1` 属于新的显式规范化身份。先前的草案摘要需要显式的旧版验证器；仅对其重命名不属于合规迁移。
- 超出 `±9007199254740991` 的整数值数值以及非零下溢现在会直接失败，而不是隐式改变数值。更大的精确数值使用声明的 string/value 对象 Schema。这收紧了先前的语言草案，依赖旧数值域的客户端必须对此进行适配处理。
- `identity_repair` 与 `durable_brain_runtime` 属于对外宣称的能力（advertised capabilities）；标准记忆 Profile 要求依赖有效性验证。不支持的契约显式报错失败。记录/Schema 校验与受保护的评估策略属于引擎的执行责任，绝非仅凭 Activity 类名就能提供的证明。

外部 Rust/Cloudflare 实现需要针对本次修订提供各自的适配器测试结果。本仓库中的预言机与有限模型并不代表生产级 Nexus 实现，也绝不能被汇报为生产级实现。Brain 评估模板仍保持为 `not_run` 且无实测得分；真实任务上的能力提升需要独立的对照实验来验证。

## 验证 (Verification)

关于具体的检查项与显式跳过的项目，请参阅[一致性验证报告](./formal/CONSISTENCY-REPORT_CN.md)。本地命令与引擎适配器要求请参阅 [conformance/README.md](./conformance/README.md)。

## commit 6437e96 的后续审查 (Follow-up review of commit 6437e96)

五个后续审查发现已在未发布的 2.1.0 草案中得到修正。既有已发布的 2.0.0 字节保持不变；当前包与 Golden Capsule 钉固值同步重新生成。

| 审查发现 | 修正方案 | 回归测试覆盖 |
| --- | --- | --- |
| 缺少可传递验证 Schema 锁定 | 根据实际 `$id`（包括 HTTPS Change Envelope ID）生成完备的本地引用闭包；校验锁定与 Capsule 依赖包及工件摘要 | 全新的 Ajv 实例仅编译清单锁定的 Schema；解析器处理传递引用/环依赖并拒绝缺失资源；强化 MEM-012 |
| 未评分的技能被程序性召回排除 | 处于 proposed/trialed 状态且无 GradingState 的技能保持为未证实的候选者；既有评分必须与所选修订版本及验证后的评估相匹配；不可验证的采纳声明不能成为经证实的推荐 | 召回预言机覆盖缺失/当前/陈旧评分、缺失评估与已撤销警告；强化 MEM-023 |
| 监控错误地要求重新晋升 | 编码合法的状态对，将同状态监控与 trialed → adopted 晋升解耦；保留采纳状态仍需识别其试用并在授权策略下保留先前的采纳证据 | Schema 接受稀疏/样本不足的监控，同时拒绝样本不足/重复或无试用的晋升；有界模型检测到了旧的监控配额缺陷 |
| 已撤销技能可直接晋升 | 晋升必须要求当前处于 trialed 资格；已撤销后重新准入必须在再次采纳前选择新的试用 | Schema 状态对矩阵、晋升预言机与有界模型拒绝直接对 proposed/revoked 状态进行采纳，并保留重新试用后可达的晋升路径；强化 MEM-018 |
| 模式包约束保留了过时的评分语义 | TrialRecord 冻结比对基准；TrialState 仅是指针/缓存。任务族成员资格既不确立归属也不确立控制成员资格，效用需要记录实际使用的归属 | 模式包约束、提示以及当前架构/学习范例保持对齐；独立尝试、修订版本/试用与保留回放检查保持通过 |

有限生命周期模型此前包含相同的晋升/监控捷径；该模型现在覆盖了全部四个起始状态，并针对二者均引入了故障注入模式。这属于契约与模型验证，绝非对外部 Brain 学习成效的实测。
