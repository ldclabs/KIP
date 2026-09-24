# KIP v2 记忆设计审查清单 —— 2026-09-23

> **历史记录。** 本文记录其所指名的特定修订版本。后来的[记忆-大脑修订](./KIP-2.0-Memory-Brain-Resolution_CN.md)移除了保留的草案包（仅保留单一 `cognitive-memory@2.0.0`），将《认知一致性》伴随文档解构并入规范正文与 `brain/` 伴随文档中，并替换了 TrialState 和 DerivationState。

所有者确认的工作范围：完成并提交 **KIP 仓库** 的变更；下游 Anda Brain / AndaDB 的工作另行记录。本轮修改仅限规范源码，不修改已冻结的设计备忘、v1 实现或下游源文件。

当前记忆模式草案包为 **2.2.0**。原 **2.1.0 包字节与其六项锁定的 Schema 资源严格按原样保留**，保持原有身份标识不变。当前 Schema ID 均包含 `2026-09-23` 修订标记；绝不静默替换经由旧摘要认证的资源。核心类别（Core kinds）与现有的符号谱系保持不变。此修订为未发布的协议修订，不代表已部署或已验证的学习收益。

## 清单项处理决策

以下各项均已在 KIP 层完成处理。“契约 / 模型”指包含具型记录与可执行契约检查的规范性契约，并不代表外部引擎已将其实现。[可靠性测试场景](conformance/KIP-2.0-Reliability-Tests.md)是外部引擎必须独立满足的验收义务。

| 原始清单项 | KIP 变更 / 决策 | 验证方式与下游边界 |
| --- | --- | --- |
| P0-1 选择依赖 (Selection dependencies) | DependencyBasis 捕获实际的 belief/slot/query 读取、缺失项、结果摘要与变更令牌（change token）；在无法进行精确追踪时保守重新求值 | REL-002；引擎必须追踪新插入的对立记录（opposition）与查询幻影（phantoms） |
| P0-2 提取修复 (Extraction repair) | 受保护的 RecordingRepair 包含源摘要 / 定位符、记录者权限、CAS 以及引擎侧的 recording_validity；完整保留源与行动者历史 | REL-004；新增受保护的引擎操作与权限 |
| P0-3 因果成型 (Causal formation) | 宿主 SourceOrder 与前驱屏障（predecessor barriers）；可重入队列模型；MemorySession 完整保留所有未完成回执 | REL-005/013 及因果 IntakeLedger 测试；Anda Brain 已实现成型串行化，新绑定必须验证因果回执 |
| P0-4 前瞻性对照 (Prospective controls) | 默认仍采用固定基准；prospective_trials 必须先冻结入组名单，并在评估时冻结实际对照群组 | REL-006；Anda 现有的配对方案属于有效的基准优先方案，而非并发随机试验 |
| P0-5 时间戳 (Timestamps) | 共享的严格 Timestamp Schema 与 parseTimestamp 会拒绝非规范或无效输入；当前测试用例已全部对齐 | REL-001；锁定的遗留 Schema 刻意保留其原始契约 |
| P0-6 外部隔离围栏 (External fencing) | 严格区分原生准入与接收方接受；receiver_fencing 依赖实际效果归属方的强制执行 | REL-007；保留 Anda 现有的持久化原生准入与对账机制 |
| P1-7 召回覆盖范围 (Recall coverage) | RecallPlan 锁定选择器、精确 / 近似检索方式、作用域与水位线；强制精确通道独立于相似度检索 | REL-008；近似计划的检索完成绝不代表语义完备 |
| P1-8 失效开销 (Invalidation cost) | 相关平面锁定与输出认证；始终校验生命周期与控制有效性；可复用计算获得真实的最新结果基线 | REL-003；引擎正向测试必须证明无关写入不会触发失效 |
| P1-9 作用域 (Scope) | MemoryScope 伴随承载内容的源文件及衍生工件；WorkingState 键值包含 actor/task/context；共享 Proposition 保持规范且中立于作用域 | REL-009/014；宿主与引擎必须在所有衍生工件中完整传递作用域 |
| P1-10 隐式存在 (Hidden existence) | LIST DEPENDENTS 截断仅针对已授权的可见遍历；全局闭包需要独立的授权 | REL-010；双世界无干扰场景（two-world noninterference） |
| P1-11 交换与恢复 (Exchange/restore) | 保留源坐标与重放字节，使用声明的引用路径与映射工件；将历史证据与当前校验 / 权限严格分离 | REL-016；真实的跨引擎数据交换仍属于下游关卡 |
| P1-12 可运行的默认 Brain (Runnable default Brain) | 纠正审查意见：生产级 Brain 已存在。补充具体的默认策略与实现证据，而非另建一套 Brain / 评估器 | Anda Brain 库：538 项测试通过；由模型供应商驱动的行为收益仍待实测 |
| S1 精简接口 (Small interface) | 宿主 MemorySession 辅助工具与作用域化的 ASSERT context；机械重试 / 数据源 / 分页职责仍由宿主承担 | REL-013/014；五大意图保持不变，未新增核心类别 |
| S2 可重建状态 (Rebuildable state) | 定级与时效性从不可变记录及当前指针中校验或重建；不存在第二套可写的真实性生命周期 | REL-017；下游可保留兼容性物化视图 |
| S3 懒衰减 (Lazy decay) | 声明基数、锚点与策略，有效强度为只读计算值；可选声明 lazy_mnemonic_strength 能力 | REL-011；宣传节省效果前必须进行基准测试；留存与纠错工作保持显式执行 |
| S4 谱系重复 (Lineage duplication) | Activity 与 DependencyBasis 具有权威性；冗余谱系通过生成或校验得到；具型 reference_paths 避免字符串替换 | REL-016/017；引擎在提交时强制校验对应关系 |
| S5 共享定义 (Shared definitions) | Timestamp、ProjectionBasis 与 ArtifactPin 通过引用复用；摘要锁定覆盖其完整闭包 | REL-001/015 及隔离的校验器测试；旧资源保持不变 |
| S6 适用性评估与改进采纳 (Applicability vs improvement) | ProcedureAssessment 仅作参考建议，不能直接晋升；保留单一的 Skill 生命周期与对比采纳要求 | REL-012；刻意维持严格标准，不放宽经由验证的学习要求 |
| G1 真实实现证据 (Actual implementation evidence) | 审查并运行现有的 Anda Brain 全特性库测试；补充全新引擎场景并保留外部 MIB 行为工作流 | [证据报告](conformance/Brain-Implementation-Evidence.md)；不伪造真实模型结果或 2.2.0 一致性结论 |

## 下游实现顺序

> **已被取代。** 2.2.0 包、保留的 2.1.0 资源与契约修订均已不存在。当前的下游工作见[记忆-大脑修订](./KIP-2.0-Memory-Brain-Resolution_CN.md#下游工作-downstream-work)；下文的 REL 场景仍是有效的验收义务。

1. **AndaDB / Nexus：** 将 2.2.0 锁定资源与 2.1.0 分开加载；强制校验严格时间戳；若原生解析文本，实现带作用域的 ASSERT 脱糖；实现选择依赖、语义输出平面、记录修复以及中立于存在性的依赖列表（existence-neutral dependents）。在真实引擎上运行 REL-001～004、REL-010、REL-014～015。
2. **Anda Brain / Worker 绑定：** 在摄入、执行、重试与恢复全过程中保持宿主 SourceOrder 与 MemoryScope；携带精确的 RecallPlan 并自动建立会话屏障。保留现有的串行化写入准入与如实预算。运行 REL-005、REL-008～009 与 REL-013。仅在完整支持时才声明确切的契约修订版本；仅安装了词汇表并不代表支持。
3. **可选的学习与执行能力：** 保持固定配对方案可用；仅在对外声明时才实现前瞻性入组与对照群组校验。增加适用性评估但不直接采纳。明确声明工具绑定是原生准入还是接收方隔离围栏，并对延迟的旧 Worker 进行测试。运行 REL-006～007、REL-012 与 REL-017。
4. **数据交换与开销：** 在 Rust 与 Worker 之间交换包含源映射与显式标记不可用工件的完整嵌套过程 / 依赖 Capsule；在同一语料库下对比懒衰减与扫描清理模式。运行 REL-011/016。严禁自动赋予历史效力或自动迁移权限。
5. **行为验证：** 使用现有的外部 MIB 集成，锁定模型供应商、留出集、开销、消融实验以及独立观测的结果。在取得实测数据前保持 not_run 状态。这并不影响将语法 / 模型测试判定为 PASS。

不得仅因协议仓库测试通过就将现有的已部署或已发布引擎标记为兼容。对不支持的新能力必须显式报错；现行有效的固定基准与原生准入路径依然有效。

## 验证

针对本次修订执行的校验：

| 校验项 | 结果 |
| --- | --- |
| 英文工具链 / 契约测试套件 | 229 项通过，0 项失败；跳过 1 项中文镜像比对（共注册 230 项） |
| 形式化运行器 Node 契约子集 | 67 项通过，0 项失败 |
| 可用的 Python 模型 | 治理、文法、生命周期、Watch 与清理检查通过，包含配置的故障见证 |
| Alloy / TLC | 未执行：缺少 JAR 前置依赖；形式化运行器退出码为 3 |
| 当前工件摘要 | 5 项已验证；包含当前完整的 Schema 锁定 |
| 保留的旧工件 | 两个早期包文件及全部六项 2.1.0 Schema 资源均保持字节级一致 |
| VS Code 客户端 | 类型检查通过 |
| 实际 Anda Brain 库 | 提交 f723f96 下 538 项通过，0 项失败；不代表新契约认证 |
| 新的外部引擎 REL 适配器 / 真实模型行为实验 | 未运行；已明确划入下游工作 |
| 空白字符 / 排除源文件 | 保持干净 diff；中文镜像、已冻结设计备忘及 v1 均未改动 |

复现 KIP 检查命令：

```sh
KIP_DOC_LANG=en pnpm --filter @ldclabs/kip-lang test
node conformance/update-digests.mjs
node conformance/run.mjs --suite reliability --list
pnpm --filter vscode-kip lint
bash formal/run.sh
```

形式化运行器同样会执行可靠性测试。缺少 Alloy/TLC 前置依赖时将返回退出码 3，而非完整证明。当前的参考模型均为有界示例；引擎一致性与行为改进仍属于独立的断言。
