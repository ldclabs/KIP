# KIP 2.0 认知一致性规范 —— 已迁移

**资料性重定向说明。本文档不再作为规范性配套规范。**

认知一致性契约已被合并至各自负责的规范文档中，使得 Core 核心语义归入规范主体，可选机制归入 Brain 配套规范。所有规范要求均完整保留。下文各级标题保留了原章节锚点，以保证既有链接正常解析。

在迁移过程中有两项契约发生了调整：移除了 `DerivationState` 与 `TrialState`，改用计算得出的依赖有效性以及 Skill 的 `current_trial` 指针；GradingState 转为计算视图；四个谱系字段转为 Activity 溯源的计算视图。详见[修订记录](./KIP-2.0-Memory-Brain-Resolution_CN.md)。

## 1. 冲突完备信念 (Conflict-complete belief)

现见[规范 §21.11](./SPECIFICATION_CN.md#2111-终态信念与槽位冲突)。

## 2. 投影基线、上下文与挂钟时钟 (ProjectionBasis, context and clocks)

ProjectionBasis 与缓存复用：[规范 §21.12](./SPECIFICATION_CN.md#2112-projectionbasis-投影基线)。上下文匹配：[§25.3](./SPECIFICATION_CN.md#253-上下文匹配)。现实世界时间区间与日期：[§25.2](./SPECIFICATION_CN.md#252-现实世界时间区间)，时间继承见 [§25.4](./SPECIFICATION_CN.md#254-时间继承-temporal-succession)，时间界限见 [§25.5](./SPECIFICATION_CN.md#255-时间界限-time-bounds)。历史控制状态：[§48.6](./SPECIFICATION_CN.md#486-历史控制状态)。

## 3. 不重写历史的依赖健全性 (Dependency validity without rewriting history)

现见[规范 §57.6](./SPECIFICATION_CN.md#576-依赖有效性-dependency-validity)。

### 3.1 选择依赖与精确失效 (Selection dependencies and precise invalidation)

现见[规范 §57.7](./SPECIFICATION_CN.md#577-选择依赖-selection-dependencies)。

## 4. 可修复的身份标识与可移植键 (Repairable identity and portable keys)

现见[规范 §11.5–§11.6](./SPECIFICATION_CN.md#115-身份修复-identity-repair)。

### 4.1 录入修复不同于行动者改变心意 (Recording repair is not an actor's change of mind)

现见[规范 §57.8](./SPECIFICATION_CN.md#578-录入修复-recording-repair)。

## 5. 修订版本、尝试、试验与评估标识 (Revision, attempt, trial and evaluation identities)

现见[已验证学习配套规范](./brain/KIP-2.0-Validated-Learning_CN.md) §2–§4。

### 5.1 固定基准线与前瞻性招募 (Fixed baselines and prospective enrollment)

现见[已验证学习 §5](./brain/KIP-2.0-Validated-Learning_CN.md#5-固定基准线前瞻性招募与适用性-fixed-baselines-prospective-enrollment-and-applicability)。

## 6. 可比学习而非机械算术 (Comparable learning, not just repeatable arithmetic)

现见[已验证学习 §6](./brain/KIP-2.0-Validated-Learning_CN.md#6-可比学习-comparable-learning)。

## 7. 持久注意力、工作与外部行动 (Durable attention, work and external actions)

现见[大脑运行时配套规范](./brain/KIP-2.0-Brain-Runtime_CN.md) §2–§4。

### 7.1 派发准入与外部接受 (Dispatch admission and external acceptance)

现见[大脑运行时 §4](./brain/KIP-2.0-Brain-Runtime_CN.md#4-外部行动-external-actions)。

## 8. 编码、召回覆盖与擦除 (Encoding, recall coverage and erasure)

编码记录：[Profile §10.1](./profiles/CognitiveMemoryProfile-2.0_CN.md#101-编码记录-encoding-records)。召回覆盖：[Profile §20.2](./profiles/CognitiveMemoryProfile-2.0_CN.md#202-召回覆盖与计划-recall-coverage-and-plans)。语义擦除：[规范 §60.7](./SPECIFICATION_CN.md#607-语义擦除-semantic-erasure)。

### 8.1 源因果性与统一任务作用域 (Source causality and uniform task scope)

源顺序：[记忆接口 §5.1](./KIP-2.0-Memory-Interface_CN.md#51-源顺序-source-order)。任务范围：[Profile §20.3](./profiles/CognitiveMemoryProfile-2.0_CN.md#203-记忆范围-memory-scope)。

### 8.2 可验证召回计划 (Verifiable recall plans)

现见[Profile §20.2](./profiles/CognitiveMemoryProfile-2.0_CN.md#202-召回覆盖与计划-recall-coverage-and-plans)。

### 8.3 交换与可重建状态 (Exchange and rebuildable state)

交换与恢复：[Capsule 规范 §41.7](./KIP-2.0-Capsule-Specification_CN.md#417-恢复与引用映射-restore-and-reference-mapping)。可重建缓存与谱系现为计算视图：[Profile §6.2 与 §7](./profiles/CognitiveMemoryProfile-2.0_CN.md#7-标准结构化字段-standard-structural-fields)。

## 9. 验收与部署声明 (Acceptance and deployment claims)

现见 [conformance/README_CN.md](./conformance/README_CN.md) 与[规范 §89](./SPECIFICATION_CN.md#89-一致性模型-conformance-model)。
