# Brain——面向 AI 智能体的自主经验与图记忆

Brain 是一层专用 LLM，代替业务智能体管理 Cognitive Nexus。它把对话和结构化交互轨迹转成持久记忆，在未来决策前重建相关过去，并把反复出现的经验巩固成语义知识和程序性技能。

Brain 不只保存信息，还要让过去的经验参与后续检索、判断和行动。只有当这些记忆能改变未来决策时，系统才发生了学习。

## 实现

https://github.com/ldclabs/anda-brain

## 架构

```text
┌──────────────────────────┐
│      Business Agent      │
│ 消息 / 工具轨迹           │
│ 目标 / 观察               │
└────────────┬─────────────┘
             │ 自然语言 + 结构化轨迹
             ▼
┌──────────────────────────┐
│          Brain           │
│ Formation / Recall /     │
│ Maintenance              │
└────────────┬─────────────┘
             │ KIP（KQL/KML/META）
             ▼
┌──────────────────────────┐
│     Cognitive Nexus      │
│ Concept + Proposition    │
│ Knowledge + Experience   │
│ + Skill                  │
└──────────────────────────┘
```

业务智能体不需要理解 KIP。它只提交普通消息或可观察的执行轨迹；只有 Brain 负责把它们翻译成 KIP 操作。

## 四类记忆产物

| 产物 | 核心问题 | 常见表示 |
| --- | --- | --- |
| **Event** | 发生了什么？ | 情景锚点 / 情境摘要 |
| **Experience** | 追求目标时尝试了什么、观察到什么、学到了什么？ | 有序的状态—行动—观察轨迹 |
| **Knowledge** | 通常什么是真的？ | Concept / Proposition / Insight |
| **Skill** | 在什么条件下，什么做法通常有效？ | 可执行或可落实的流程 / 策略 |

可以这样理解：

```text
Experience ──压缩──> Knowledge
Experience ──编译──> Skill
Experience ──反思──> Insight / Self-model
```

Event 与 Experience 有意分开。Event 可以摘要记录会议、网页访问或部署事故，不必保留智能体如何行动的内部动态；只有当过程本身可能改变未来行为时，才创建 Experience。

## 三种运行模式

| 模式 | 系统提示词 | 用途 | 触发方式 |
| --- | --- | --- | --- |
| **Formation** | [BrainFormation_CN.md](BrainFormation_CN.md) | 编码消息、Event 和有价值的 Experience | 对话或结构化轨迹 |
| **Recall** | [BrainRecall_CN.md](BrainRecall_CN.md) | 检索知识、经验、技能和行动上下文 | 业务查询 / 行动前简报 |
| **Maintenance** | [BrainMaintenance_CN.md](BrainMaintenance_CN.md) | 巩固、比较、编译、修剪和重组记忆 | 定时或阈值触发 |

函数 Schema：

- [RecallFunctionDefinition.json](RecallFunctionDefinition.json)：供业务智能体只读访问记忆的 `recall_memory` Schema。

## 交互流程

### Formation

1. 业务智能体发送对话消息，或包含可观察行动与观察的结构化轨迹。
2. Brain 只提取值得长期保存的语义知识和情景锚点。
3. 当**过程**有复用价值时，再编码 `Experience` 与有序 `ExperienceStep`。
4. Brain 通过 KIP 写入记忆。
5. 如需更深的语义或程序性巩固，创建 `SleepTask`。
6. 返回简短摘要；没有内容达到存储门槛时返回 `skipped`。

Formation 不能尝试保存模型内部思维链。只保存可观察的行动、观察、结果，以及安全、可复用的简洁决策依据。

### Recall

Recall 承担两个不同任务：

1. **记忆问答**：“我们知道或记得什么？”
2. **行动简报**：“过去有哪些内容应该改变我接下来的做法？”

行动简报可以组合：

```text
相关知识
+ 适用 Skill
+ 相似的成功 Experience
+ 相关失败 Experience
+ 当前 Commitment / 约束
→ 交给业务智能体的决策上下文
```

失败经验可能和成功经验一样有价值。Recall 不能机械模仿最相似的轨迹。

### Maintenance（睡眠模式）

Maintenance 是记忆代谢层，同时运行两条巩固管线：

```text
Event / Experience ──> 语义巩固 ──> Knowledge / Insight
Experience         ──> 程序性巩固 ──> Skill
```

此外还负责：

- 发现矛盾，并用 `superseded` 保存状态演变；
- 比较成功和失败 Experience，找出区分结果的行动或条件；
- 验证、增强、减弱、转入复查或废弃 Skill；
- 巩固 `$self` 的自我模型；
- 归档并最终回收显式设置 TTL 的情景存储。

## 经验学习闭环

```text
目标 / 当前状态
       │
       ▼
   智能体行动
       │
       ▼
   可观察轨迹
       │
       ▼
 Experience Formation
       │
       ├────────> 语义巩固 ───> Knowledge
       ├────────> 反思 ───────> Insight / Self
       └────────> 程序性巩固 ─> Skill
                                     │
                                     ▼
                                Action Recall
                                     │
                                     ▼
                                  未来决策
                                     │
                                     └────↺
```

评估这套系统时，应看它是否改变了未来行为，而不只是能否找回旧文本。

## 四个通用元数据维度

| 维度 | 含义 | 常见更新原因 |
| --- | --- | --- |
| `confidence` | 认知证据：现有证据对断言的支持程度 | 独立证据、矛盾、核验 |
| `memory_strength` | 可访问性：这段记忆在召回时有多强的竞争力 | 强化与长期不用 |
| `superseded` | 时间演变：旧状态已被新状态取代 | 状态变化 |
| `expires_at` | 明确约定的存储生命周期 | TTL / 清理策略 |

**不要仅仅因为一条事实长期没有被召回，就降低它的 `confidence`。** 长期不用主要影响 `memory_strength`。稳定事实即使很久没出现，仍可能高度可信。

这些是跨类型通用的元数据。不同记忆产物还有自己的评价字段，例如 Event 的 `salience_score`、Experience 的 `learning_value`，以及 Skill 的 `utility` 和 `maturity`；它们不能互相替代。

Skill 的成功与失败证据也要和真值置信度分开。同一套错误流程执行三次，不会变成三票支持证据。

## 记忆质量原则

1. **宁缺毋滥**：空写入完全合法；过度抽取会增加噪声和维护成本。
2. **使用绝对时间**：编码时解析所有相对时间表达。
3. **Event ≠ Experience**：Event 记录发生了什么；只有轨迹能教会未来行为时才创建 Experience。
4. **只存可观察过程**：保存行动、观察、结果和简洁依据，不要求隐式思维链。
5. **强化 ≠ 证据**：重复可以提高可访问性；只有真正的新证据才应提高认知置信度。
6. **失败是一等记忆**：失败揭示边界、反例或恢复流程时必须保留。
7. **先对照，再编译**：条件允许时，比较成功与失败 Experience 后再提升 Skill。
8. **前瞻记忆是一等产物**：承诺、提醒和截止时间继续作为显式 `Commitment`。
9. **自我连续性来自重建**：`$self` 从证据中巩固，而不是被最近一次对话重写。
10. **无界历史使用节点**：轨迹、里程碑和维护历史不能无限堆进一个属性。
11. **巩固后仍保留来源**：Knowledge 与 Skill 在来源可用时，继续链接支持它的 Experience / Event。
12. **过去必须改变未来**：功能性记忆以行为影响衡量，不以存储量衡量。

## 自我连续性闭环

长期记忆也是连续自我身份的底座：

- **Formation** 捕获与自我有关的纠正、教训和里程碑 Experience。
- **Maintenance** 把这些信号整合成连贯的自我模型。
- **Recall** 在智能体思考身份、价值观、优势、弱点或使命时重建该模型。

这条闭环与程序性学习相关，但并不相同。智能体可以学会一项 Skill 而身份不变；身份发生转变，也不一定产生可复用 Skill。

## 建议评估项

| 能力 | 示例 |
| --- | --- |
| 语义保持 | Brain 能否记住稳定事实？ |
| 时间演变 | 能否区分过去为真与现在为真？ |
| Experience 重建 | 能否重建相关的状态—行动—观察路径？ |
| 程序迁移 | 已学 Skill 能否解决相关的新任务？ |
| 避免重错 | 能否避开已经观察过的失败？ |
| 上下文辨别 | 当前置条件不满足时，能否拒绝套用 Skill？ |
| 记忆的因果影响 | 移除相关记忆后，表现是否下降？ |

推荐消融阶梯：

```text
仅 LLM
LLM + 向量记忆
LLM + 语义 Brain
LLM + Experience 记忆
LLM + Experience + Skill 巩固
```

## 优点

- 业务智能体**不需要了解 KIP**。
- 业务推理与记忆代谢职责分离。
- 使用结构化来源，而不是不可审计的检索文本。
- 同时从成功和失败中学习。
- 程序性记忆可落成工作流、启发式规则、提示词、代码或工具策略。
- 支持多智能体，同时把记忆所有权限定在配置的 `$self` / Cognitive Nexus 内。

## 相关设计文档

- [ExperienceLearningArchitecture_CN.md](ExperienceLearningArchitecture_CN.md)
- [CognitiveMemoryProfile_CN.md](CognitiveMemoryProfile_CN.md)

## 依赖

每份系统提示词都引用同一份 KIP 语法规范：

- **[KIPSyntax.md](../KIPSyntax.md)**：必须与系统提示词一起加载。
- **`execute_kip`**：Formation 与 Maintenance 执行读写操作所需。
- **`execute_kip_readonly`**：Recall 执行只读 KQL 与 META 操作所需。
