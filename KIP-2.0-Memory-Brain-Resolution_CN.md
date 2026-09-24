# KIP v2 记忆-大脑修订决议 —— 2026-09-23

本文记录了旨在解决“KIP 2.0 是否足以让 AI Agent 拥有真正的记忆大脑”这一设计审查意见的决议过程。审查确认底层基础是健全的 —— 真值中立的 Proposition、带归属的 Assertion、读取时判定的信念（read-time belief）、无需模型重新键入的 Evidence 捕获机制、受保护的 Governance 治理；但也发现日常记忆能力偏弱：世界变迁需要繁琐的三步废弃替代仪式、粗粒度日期无处安放、大脑无法表达任何未被已安装包定义的关系、检索无法与信念计算组合、主动注意力无法触达 Agent，且规范草案膨胀速度超出了任何引擎或评测所能跟进的程度。

范围说明：包括英文规范源、机器工件、语言工具包、编辑器语法、形式化模型以及 CI。中文镜像文档在本次修订中未同步，仅保证 `KIPSyntax_CN.md` 可执行代码块严格对齐以保持 CI 测试通过。未修改下游仓库代码；引擎测试套件从 anda-db 只读导入。

## 所有者决策 (Owner decisions)

| 决策项 | 实施说明 |
| --- | --- |
| 不保留历史草案包 | `cognitive-memory@2.0.0` 为唯一步进包；彻底删除 2.0.0/2.1.0 草案文件及 6 个 `legacy-2.1` Schema；Schema ID 统一定为 `urn:kip:2.0:schema:*`；草案修订版本由内容摘要唯一标识（规范 Status，AGENTS.md） |
| 冻结 2.0 范围 | 只有伴随引擎证据（真实引擎通过的引擎套件测试用例）或经测量的 Brain 行为结果，新契约才可进入草案（规范 Status，AGENTS.md “Scope gate”） |
| 变更时态语义 | 时间继承（Temporal succession）成为所有策略通用的 Core 核心世界时间语义（§25.4），并附带有限状态模型与五种故障注入模式 |
| 运行时与学习伴随文档归入 `brain/` | `brain/KIP-2.0-Brain-Runtime.md` 与 `brain/KIP-2.0-Validated-Learning.md` 作为正式的规范性伴随文档 |

## 清单项处理决策 (Checklist disposition)

| # | 意见项 | 决议说明 | 验收依据 |
| --- | --- | --- | --- |
| 1 | 世界变迁被记录为“原主张是错的” | `until: null` 表示“未声明结束时刻”；同一行动者在同一时序上稍后开始的新值在其起点处结束旧值（§25.4）。世界变迁只需单条 Assertion；被结束的值表现为同一行动者的相反立场。废弃替代（supersession）仅用于更正（§14.2, F.2） | MEM-026a–j, EPI-031, 不变量 44, `formal/temporal` T1–T8 |
| 2 | “你听错了”缺乏接口处理路径 | `revise.change_kind: "misrecorded"` 路由至录入修复（recording repair）；若不支持，适配器报错 `UnsupportedCapability` 或予以隔离，绝不映射为更正（记忆接口 §4） | MIF-017, `routeRevision` 模型测试, 不变量 49 |
| 3 | 粗粒度时间无处安放 | `valid_time` 端点支持时间界限 `{earliest, latest}`；投影采用三值逻辑，不确定的支持判定为 `uncertain`（§25.5）；`kip-common` 引入 `TimeBound`/`TimePoint`；工具包实现 `parseTimePoint` | MEM-027a, EPI-032, 不变量 45 |
| 4 | 偏好变更导致新旧偏好同时被采纳 | 引入 `functional_by: "object_type"`（§20.15）；`prefers` 在每种选项类别内部具有函数性，因此较新的偏好继承结束同一类别下的旧偏好 | MEM-028a, SCHEMA-021, P47, MIF-016 |
| 5 | 结构化基准无法消解冲突，且加权策略各引擎实现不一 | 确立 `kip:memory-default`（§21.13, `profiles/policy-memory-default.json`）：任务上下文特异性优先，其次本人第一人称陈述优先（绝不压过观测）；被压过的值判定为 `uncertain` | MEM-029a–d, EPI-033, 不变量 46, `formal/temporal` P1–P2 |
| 6 | 大脑无法扩展自身词汇 | 引入 Space 局部草稿词汇：`propose_schema` 权限下支持 `DEFINE PREDICATE` / `DEFINE CONCEPT TYPE`，仅追加、独立提交、无封闭世界或 `complete` 声明（§20.16）；`review_schema` 维护任务；最小通用领域包 `kip://domains/general@1.0.0` | SCHEMA-022, GOV-031, 不变量 47；解析器、降级、格式化器与 EBNF 测试 |
| 7 | 主动注意力无法触达 Agent | `recall` 的 `attention` 模式配合宿主保留的游标返回已触发的 Watch 与到期的 Commitment；`resume` 携带这些提醒项；注意力项不赋予执行权限（记忆接口 §4） | MIF-019, `attentionAfter` 模型测试, P49 |
| 8 | 检索无法与信念计算组合；`SEARCH COGNITION` 语义未定义 | 引入 KQL 检索模式 `?x SEARCH <KIND> … LIMIT <k>`（§43.8），禁止在 `NOT` 或变更选择内部使用；彻底移除未定义的 `COGNITION` | KQL-032, KQL-033, META-028, 不变量 48 |
| 9 | 记忆强化需要每次读取都执行写入 | 引入曝光日志（exposure log，§66.8）：非认知状态、仅追加、受治理；维护阶段将其折叠为受守卫的显式写入 | RT-035, 不变量 49 |
| 10 | 存在两套描述过时的词汇 | 移除 DerivationState；最新性由引擎动态计算虚拟字段 `_system.dependency_validity`（§57.6）；复审排入 `review_derived` 睡眠任务队列 | 修订 EPI-028, P23 |
| 11 | 对不可变记录建立可写缓存 | 移除 TrialState（由技能的 `current_trial` 指针替代）；GradingState 转为基于 `current_evaluation` 的只读计算视图（§18.2 计算字段） | MEM-020, REL-017, contracts 测试 |
| 12 | 存在三种血统表达形式 | Activity 来源记录为唯一步进凭据；`derived_from`、`compiled_from`、`compiled_by`、`consolidated_to` 均为只读计算字段（Profile §7） | contracts 测试, LIST DEPENDENTS 文本（§63.5） |
| 13 | 机械扫盘衰减与凭空捏造的 `0.5` 缺省值 | 衰减根据基准值、时间锚点与钉住的策略动态计算（`effective_strength`）；缺失强度时判定为未知；移除所有 `COALESCE(…, 0.5)` 示例（§59.1, Profile §6.1, §18） | REL-011 转为强制要求, P48 |
| 14 | 记忆协议内部混杂了执行运行时 | 持久化注意力、租约、调度分发与接收端隔离保护移入 `brain/KIP-2.0-Brain-Runtime.md` 伴随文档 | MEM-009, REL-007 |
| 15 | Profile 内部包含了临床级学习规范 | 试验、执行尝试、评估、前瞻性招募与可比学习移入 `brain/KIP-2.0-Validated-Learning.md` 伴随文档；Profile 保留生命周期表、声誉状态视图与六条核心规则 | MEM-002–005, MEM-018, REL-006, REL-012 |
| 16 | 核心语义散落在伴随文档中 | 《认知一致性》§1–§4 并入规范正文（§11.5–§11.6, §21.11–§21.13, §25.2–§25.5, §48.6, §57.6–§57.8, §60.7）；§8 并入 Profile、记忆接口与胶囊伴随文档（§41.7）；原文件转为保留锚点的重定向索引 | 链接与锚点检查 |
| 17 | 存在三套一致性分类法 | 简化为两个级别：KIP-Core 与 KIP-CognitiveMemory（§89）；领域仅用于诊断说明；能力注册表仅列出可省略项（§67.4）；记忆接口级别标明其运行所需的 Nexus 等级；`memory_basic` 无需试验、打分或持久工作进程 | `memory-bundles.json`, MIF-001 |
| 18 | 单个 Agent 拥有三十多项权限 | 确立单智能体预设配置：划分 agent、maintenance、instrument 与 owner 四个主体及其权限授予（§30.5） | GOV-031 |
| 19 | 父测试套件不可执行 | 包含 21 个固件、362 个用例的双引擎共享测试套件导入至 `conformance/engine-suite/`，并配备运行器（`--suite engine`）、来源清单及自测；341 个父向量中有 37 个拥有引擎用例。其余父向量仍为文字说明并汇报为未执行 | `engine-suite.test.mjs` |
| 20 | 混用小写形式的模糊要求关键词 | §0 全面采纳 BCP 14 (RFC 8174)：仅大写关键词构成规范要求；记忆接口及两份新伴随文档均使用大写关键词表达要求 | 重写文本审查 |
| 21 | 缺乏对记忆质量的正向验收用例 | 补充 MIF-013–020：可召回事实、更正、跨时间世界变迁、类别内偏好、误录处理、非索求约束、注意力提醒、未知不代表否定 | 20 个接口测试向量，符合 Schema |
| 22 | 版本维度过多 | 统一为一个协议版本（`2.0-draft`）、一个模式包（`2.0.0`）、稳定 Schema ID，移除带日期的契约修订版本字段（移除 `requires_contract` 与 `contract_revision`） | 摘要校验 |

## 新模型发现的缺陷 (Defect found by the new model)

时序模型的次序无关性检查（T2）发现：当两个后继断言拥有相同的最小起始键时，§25.4 早期草案会由到达顺序决定哪一个后继断言结束前驱断言。现已在规范正文、JavaScript 预言机及 Python 模型中修改该规则，使并列的后继断言按边界逐项合并；到达次序缺陷注入模式能够稳定复现此问题。

## 验证 (Validation)

| 检查项 | 结果 |
| --- | --- |
| 工具包、契约、记忆接口、可靠性、引擎套件与语法测试（`KIP_DOC_LANG=en`） | 261 项通过，0 项失败 |
| 双语速查卡完整套件（CI 配置） | 263 项通过，0 项失败 |
| 工件内容摘要 | 7 项核验通过（记忆包及其完整 Schema 锁、通用领域包及其依赖钉固、memory-default 策略、两个测试包、测试策略、金样胶囊） |
| EBNF 文法 | KQL、KML 与 META 文法良构，全部规则可达，无意外跨文法漂移 |
| VS Code 插件 | 代码检查 (lint)、12 项测试与打包构建均通过 |
| 形式化套件（配置 Alloy 6、TLC 与 JRE 17 运行 `formal/run.sh`） | exit 0，全部九个套件运行通过 |
| 针对真实引擎运行引擎测试套件 | 本处未运行：当前引擎实现的是上一版草案；从 anda-db 运行 `--suite engine` |
| 行为学习评测 | 未运行；`brain/BrainEvaluation.md` 依然是正式发布关卡 |

形式化细节：Alloy C1–C7 UNSAT，见证模式 R1–R4 SAT；TLC 事务规范通过，两种缺陷配置均成功产生反例；治理、文法、生命周期（规范、变体与九种缺陷模式）、Watch（规范、两种变体、两种缺陷模式）与 purge（规范与三种缺陷模式）均通过；新的世界时间模型详尽检验了 336 条断言、112,896 个配对与 40,000 个采样三元组，T1–T8 与 P1–P2 均成立，其五种缺陷模式均能命中反例；Node 契约子集 94 项测试通过。这些是有限模型，非引擎实测结果。

## 第二轮审查 —— 新时态语义的边界 (Second pass)

针对上述修订以相同问题进行第二轮审查，发现了新世界时间规则与日常记忆工作结合时的四个缺陷、第一轮遗留的一组一致性缺口以及更多可予精简的内容。所有问题均在本次修订中一并解决。

| # | 发现项 | 决议说明 | 验收依据 |
| --- | --- | --- | --- |
| 1 | 同一主体的两次推理被误读为世界变迁：时序仅以主体和上下文为键，导致大脑从文档 B 推导出的新推理静默结束了此前从文档 A 得出的旧推理 | 时间继承仅反映行动者自身的直接叙述：断言的模式必须为 `stated` 或 `observed`，或者显式写明了 `from`，才参与时序继承；未显式写明起点的 `inferred` 推理断言不在时序线上（§25.4）。两者的分歧作为冲突保留给策略消解 | MEM-026k–m, 时序 T9 与 `--infer-succeeds` 缺陷模式, `world-time.json` |
| 2 | 迟延记录的旧主张获得了今天的起始键：`at` 缺省为事务时间，且缺失的 `from` 回退到该时间 | `asserted_at` 为行动者陈述主张的时刻（源数据中观测到的时间），绝非大脑将其记录的时刻（§13.2, §55.1）；适配器从源数据中提取并设置该时间（记忆接口 §5.1）；工具包的 `KIP_2102` 诊断会标记引用了 Evidence 却省略 `at` 的 `ASSERT` | MEM-029g, MIF-015 (`late_history_displaces=false`), 跨行动者时序 T6, kip-lang 测试 |
| 3 | 未标注 `from` 的断言被解释为“下无界”：2026 年所说的“我住在上海”会导致 2020 年的查询也返回上海 | 缺失 `from` 时解释为时间界限 `{latest: asserted_at}` —— 即该事实成立的时间不晚于主张陈述之时（§25.2, §25.5）；一般现在时陈述完全无需标注 `valid` | MEM-026n, 扩展时序 T8, `world-time.json` |
| 4 | 陈旧的观测与新鲜的陈述陷入永恒的 `contested` 争议：`kip:memory-default` 在第一人称陈述之后缺乏裁决规则 | 引入规则 3（时间就近）：合格支撑证据中起始键最大者胜出；平局保持 `contested`；规则 1 和规则 2 优先，因此较新的传闻绝不会战胜当事人本人的陈述（§21.13, `policy-memory-default.json`） | MEM-026l, MEM-029e–g, 时序 P3 与 `--recency-first` 缺陷模式, `world-time.json` |
| 5 | `prefers` 按选项类型进行分区，但原先仅有 `Place`、`Organization` 和 `Topic` 等通用类型，导致所有日常偏好挤在同一分区 | 选项必须是具体类别下的 Concept，来自领域模式包或通过 `DEFINE CONCEPT TYPE` 声明，禁止使用宽泛类型（§20.15, Profile §5.5, §7, 记忆成型卡）；引擎固件的选项通过内联 `Option` 包具型化并按此记录 | MIF-016 文本, `world-time.json` (`ColorScheme`, `Editor`) |
| 6 | “你听错了”需要 `repair_recording` 或 `quarantine` 权限，但单智能体预设未向 Agent 分配这两项权限 | 在通告了 `recording_repair` 的系统上，向 agent 主体赋予 `repair_recording` 权限，受 §57.8 限制仅能修复自身由源数据支持的输出（§30.5）；KIP-CognitiveMemory 强制要求支持录入修复（§89, §67.4） | MIF-017 |
| 7 | `AttentionItem` 定义了没有生产者触发的 `commitment_due` 和 `task_ready` 类型，且其 `raised_seq` 无法由自然流逝的到期时间提供 | 所有注意力项均由提交显式触发 —— `watch_fire` 或 `commitment_review` Activity —— 其 `space_seq` 即为 `raised_seq`；保留 `watch_fired` 与 `commitment_due` 类型；移除 `task_ready`（记忆接口 §4, Profile §5.7, §17, `kip-memory.schema.json`） | MIF-019, `attentionAfter` 模型测试 |
| 8 | §96–§99 仍残留有“完整/高级 Profile 增加项”清单，与 §89 的双级别模型相抵触（`FOR TIME`、BELIEF SLOT、LIST DEPENDENTS、PURGE PAYLOAD 既是必选项又是可选项） | 每个领域仅保留一份统一要求清单；仅将纯能力项列入能力要求；§92 明确保留继承、时间界限、上下文匹配与 `kip:memory-default` | 审查 §90–§99 |
| 9 | `memory_basic` 声称运行在 KIP-Core 之上，但注意力召回与 `prefers` 属于 Profile 符号 | `memory_basic` 运行在激活了 `cognitive-memory@2.0.0` 模式包的 KIP-Core 之上，不需要启用 KIP-CognitiveMemory 专属的引擎特性（记忆接口 §2, `memory-bundles.json`） | MIF-001 |
| 10 | 草稿符号的提升原先声明为“由已安装包完成”，但安装包无法预知特定 Space 内的草稿符号 | 提升操作归为 `manage_schema` 权限下的模式环境迁移记录（§20.16） | SCHEMA-022 文本 |
| 11 | 字面量值的 Predicate 上声明 `functional_by` 时缺乏分区依据 | 宾语必须声明为 Concept；模式包 Schema 拒绝在包含 `literal_types` 的谓词上声明 `functional_by`（§20.15） | SCHEMA-021, contracts 测试 |
| 12 | 范围门禁阻止了在新契约被未修复引擎实现之前对其进行修正 | 测试固件允许标记为 `pending_engine` 并记录在清单中进入仓库；正式发布要求所有固件经由真实引擎验证（Status, AGENTS.md, engine-suite README） | `world-time.json`, 运行器 `pending_engine` 披露 |
| 13 | 草稿包每次调用 `DEFINE` 都生成一个新版本号 | 统一固定引用为 `kip://local/draft@0.0.0`；但 `schema_environment_version` 依然递增（§20.16） | SCHEMA-022 |
| 14 | 召回覆盖范围要求每个基础 Brain 都报告七个通道，其中三个通道基础级别根本不具备 | 未通告级别对应的通道在设计上直接标记为 `not_applicable`（记忆接口 §6） | MIF-001 |
| 15 | `Preference` 原作为与 `prefers` 断言并列的概念类型，其包含的可变摘要会被召回误当成答案 | 移除独立的 Preference 类型：偏好本身即断言，稳定的偏好模式是关于该选项类别的 Insight（Profile §5.5, §15; 包 Schema, 规范 §6.1, §18.3, 角色卡） | contracts 测试, 导入时修订引擎固件 |
| 16 | `memory_durable` 与 `memory_exchange` 将能力误作为级别 | 保留三个核心级别；持久工作进程与胶囊交换恢复为其本来所属的独立能力（记忆接口 §2, `memory-bundles.json`, `kip-memory.schema.json`） | MIF-001 |
| 17 | 时序模型原先仅覆盖单一上下文、单一分区和有见证的主张 | 针对采样的三元组扩展验证域（推理断言、`until` 边界、上下文集合）；补充 T9、P3 及两种缺陷模式；在 `written()` 中补充缺失起点的缺省规则 | `formal/temporal` |
| 18 | 过期文本清理：Profile §4 遗留 `2.2.0`；MEM-005 提及 `TrialState`；§66.8 称曝光日志为唯一步进通道但 §59.1 指明有两个；策略工件将 `expired` 列为存储状态；§25.4 重复 §13.3 | 全部修正完成 | — |

导入的引擎测试套件在另外两处进行了调整并记录在清单中：选项 Concept 通过内联 `Option` 包具型化为 `Option`（Profile 中不再有 Preference 类型）；预期过期值状态为 `rejected` 的边界用例现更正为预期 `insufficient`（§14.3, §21.5）。`world-time.json` 是第一个 `pending_engine` 固件：针对本次修订的行为编写了 24 个用例，依据规范与预言机设计，尚待真实引擎验证。

## 下游工作 (Downstream work)

1. **anda-db (Rust 与 kip-do)**：加载修订后的 `cognitive-memory@2.0.0`（移除 TrialState、DerivationState 与 Preference，实现 GradingState 与血统字段的动态计算，支持 `current_trial`/`current_evaluation`，带 `functional_by` 的 `prefers`，`review_schema` 任务）；实现时间继承及其参与规则、缺失 `from` 的缺省规则、时间界限、`functional_by`、带时间就近的 `kip:memory-default` 策略、`DEFINE` 语法与固定的草稿包引用、检索模式（Search Pattern）、计算型记忆强度与可选曝光日志；移除 `SEARCH COGNITION`；直接基于本仓库运行 `node conformance/run.mjs --suite engine`（包含处于 pending 状态的 `world-time.json`），不再使用固件的私有副本。
2. **anda-brain**：支持 `revise.change_kind: "misrecorded"`；实现带游标和由提交触发项的 attention 模式召回；世界变迁作为单条 Assertion 写入并从源数据中提取 `asserted_at`；选项按类别具型化；以及无需机械扫盘的计算型衰减。
3. **中文镜像文档**：同步此处修改的所有英文源文档；`KIP-2.0-Cognitive-Consistency_CN.md` 像英文版本一样转为重定向索引表。
4. **证据验收**：真实引擎通过 `world-time.json`，随后按范围门禁要求，通过记忆接口执行 LongMemEval/LoCoMo 风格的实测基准。
