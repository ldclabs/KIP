# 直接 KIP：维护速查卡 (Direct KIP: Maintenance card)

**[English](./KIPMaintenance.md) | [中文](./KIPMaintenance_CN.md)**

面向实现 [Brain Maintenance](./BrainMaintenance_CN.md) 的模型。仅使用实际声明的能力与权限。加载召回/形成速查卡用于共享操作，仅在不常用操作需要时加载完整语法手册。

- 基础记忆 (Basic memory)：巩固获得支持的主张、审查矛盾/依赖项、留存有用证据并保持处理回执诚实真实。
- 经验 (Experience)：重构过程轨迹并编译不可变的未经证实候选。
- 学习 (Learning)：仅在有 memory_learning / 全 Profile 支持时，针对独立尝试与留存的试验输入排定经授权的确定性评估。
- 持久工作 (Durable work)：仅在具备 worker 能力时，认领/续订带防护令牌 (fenced) 的租约、消费完整的 Watch 水位线，并在崩溃后调和同一个外部尝试。
- 交换/擦除 (Exchange/erasure)：使用受治理的计划并验证覆盖范围；不存在任何隐式权限。

源头修订保留历史不变，并改变计算得出的依赖有效性。通过有界、设检查点的遍历审查所有必需的依赖项：

```kip
LIST DEPENDENTS :revised_root DEPTH 2 LIMIT 100
```

按需跟进后续页面/深度。第一页绝非完整的审查。存储的 DerivationState 仅为审查记录，绝不能凌驾于计算得出的有效性或动作网关的当前检查之上。

记忆状态（Mnemonic state）可以在不改变真值置信度的情况下改变：

```kip
UPDATE :element
SET FACET "MnemonicState" {
  memory_strength: :new_strength, last_metabolized_at: :cycle_start
}
EXPECT VERSION :mnemonic_version OF FACET "MnemonicState"
```

使用有界策略与稳定的周期标识；发生冲突时重新读取。基于时间的扫描绝不能重写 Assertion 置信度。效用校准必须指明其证据与归因方法，而非仅凭检索暴露度。

技能行为的变更须创建/选定新的 SkillRevision。试验与评估是不可变的；当前计数缓存其确切的修订版本/评估。切勿手写 adopted 状态。裁决所修改的所有平面均在单个事务中受防护保护。缺乏学习支持的基础部署仅保留未经证实的经验。

从钉住的基线为对应的行动者/任务/上下文刷新 WorkingState。在任何紧凑记忆结果背后保留完整基线。处于 available 状态的处理回执记录了一个历史完成地平线；后续的更正、策略变更与擦除依然控制当前可被召回的内容。

归档（Archive）保留历史。载荷清除（Payload purge）、语义擦除（semantic erasure）与撤回（retraction）含义各不相同。显式汇报部分完成/被阻断的计划以及不可用的重放输入。切勿为了美化健康指标而将未决输入标记为已处理或将部分擦除标记为已完成。
