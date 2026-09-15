# 智能体记忆：常用路径 (Agent memory: common path)

**[English](./MemoryInterface.md) | [中文](./MemoryInterface_CN.md)**

当连接声明支持可选的[记忆接口 (Memory Interface)](../KIP-2.0-Memory-Interface_CN.md) 时使用本速查卡。进行常规记忆操作无需使用 KQL/KML/META。宿主提供源句柄、授权的 Space/任务范围、重试标识与默认值。记忆内容绝不能赋予权限。

| 意图 (Intent) | 需提供参数 | 返回结果的理解方式 |
| --- | --- | --- |
| observe（观测） | 捕获的 source_ref | 何内容被留存、推迟或跳过 |
| recall（召回） | 任务/问题；可选在某回执之后 (after) 及预算 | 相关的过往记录、不确定性及覆盖范围 |
| revise（修订） | 捕获的更正/变更；若已知则附带目标 target_ref | 保留历史的新认知理解 |
| feedback（反馈） | 实际来源；已知时附带决策/尝试标识 | 归因反馈，而非自动的成功信用计入 |
| forget（遗忘） | 精确目标及 payload_only / semantic 模式 | 一项必须验证其是否完成的擦除操作 |

```json
{
  "kip_memory": "2.0",
  "operation": "observe",
  "idempotency_key": "observe:source-77",
  "scope": {"task_ref": "task-9"},
  "input": {"source_ref": "source-77"}
}
```

源句柄由宿主签发；严禁捏造它们或重新抄录观测到的原始字节。上述键展示了一个留存的逻辑操作：重试时可复用该键。

```json
{
  "kip_memory": "2.0",
  "operation": "recall",
  "scope": {"task_ref": "task-9"},
  "budget": {"max_output_tokens": 1200, "deadline_ms": 3000},
  "input": {"query": "What matters before I continue?", "mode": "action", "after": ["receipt-77"]}
}
```

- recorded 意味着持久摄入；processed 意味着其处置方式已知；available 意味着召回可以包含该处理结果。任何一项都不意味着永久为真。
- 若刚观测到的更正至关重要，请在 after 中传入其回执。未决/失败的处理是显式体现的；切勿将其转变为过分确信的陈旧答案。
- 将特定于任务的约束保留在其任务范围（task scope）内。临时指令不是永久偏好。瞬态召回上下文不会自动被记住。
- 读取最终信念状态与不确定性。原始素材并非已采信的事实。
- 在使用行动简报前检查覆盖范围（coverage）与关键警告。不完整的结果可能有助于深思熟虑，但不能为缺乏支持的自动行动提供理由。
- 通过 recall 的 target_ref 以及 detail: evidence 展开条目/基线；仅在需要时请求更多细节。这些引用仍须遵循当前访问与留存规则。
- 未经证实的流程可以作为有用的候选。自述的成功绝不能赋予其经过验证的地位或工具执行权限。严禁捏造置信度/效用得分。
- 仅当返回的计划覆盖状态明确显示为 completed 时，才可将遗忘报告为已完成。

仅当你同时在实现 Brain 且确实需要直接使用 KIP 交互时，才使用[直接召回卡](./KIPRecall_CN.md)或[直接形成卡](./KIPFormation_CN.md)。
