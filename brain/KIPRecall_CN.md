# 直接 KIP：召回速查卡 (Direct KIP: Recall card)

**[English](./KIPRecall.md) | [中文](./KIPRecall_CN.md)**

面向实现 Brain Recall 的模型。[Recall 策略](./BrainRecall_CN.md)负责选择与解释；[Core 核心规范](../SPECIFICATION_CN.md)定义语义。使用只读执行路径。任何读取均不会改变记忆强度 (strength)、置信度 (confidence) 或评分 (grades)。

从已授权的上下文和在线词汇表开始：

```kip
DESCRIBE PRIMER MODE "compact"
```

接地不熟悉的实体，保留歧义性。关键字搜索是基线；仅在声明支持时使用语义/混合搜索。搜索未命中并非规范意义上的不存在。

```kip
SEARCH CONCEPT :query MODE "keyword" LIMIT 10
```

当需要在单次读取中同时完成实体接地与信念查询时，可在查询内部绑定匹配项；模式上的 LIMIT 约束候选数量，得分仅代表相关性，绝非置信度：

```kip
FIND(?person.name, ?home)
WHERE {
  ?person SEARCH CONCEPT :query WITH TYPE "Person" LIMIT 10
  ?home BELIEF SLOT (?person, "lives_in")
}
WITH EPISTEMIC {context_refs: :contexts, purpose: "answer_user", policy: "kip:memory-default"}
LIMIT 5
```

使用最终 BELIEF 查询事实。以下所有参数均为完整绑定的具体值与确切已知引用；上下文由外部提供，绝不能盲目假定为全局通用。

```kip
FIND(?belief)
WHERE { ?belief BELIEF (:subject, :predicate, :object) }
WITH EPISTEMIC {context_refs: :contexts, purpose: "answer_user", explanation: "summary"}
```

使用槽位（slot）检查备选值。两种形式均充分核算适用的冲突。在 `kip:memory-default` 下，任务范围内的取值在其任务中优先于通用取值，本人的陈述优先于传闻；被排挤的取值为 `uncertain`，绝非 `rejected`。发生变迁的取值不是冲突：其继承替代者会终结它，而在变迁之前的 `FOR TIME` 依然会返回旧取值。

```kip
FIND(?slot)
WHERE { ?slot BELIEF SLOT (:subject, :predicate) }
FOR TIME :world_time
WITH EPISTEMIC {context_refs: :contexts, purpose: "answer_user", explanation: "ledger"}
```

原始历史仅用于源头核查，绝非通往已采纳信念的捷径：

```kip
FIND(?assertion)
WHERE { ?assertion ASSERTION {proposition: :proposition} }
LIMIT 20
```

`AS OF SEQ` 选择留存的认知历史；`FOR TIME` 选择现实世界有效性。游标是不透明的，当前授权依然适用。遍历每个必需的分页，否则须披露覆盖不完整。对于会话恢复，使用任务范围的 WorkingState 外加直到声明水位线的增量变更，同时验证所有计算依赖项。

返回必要事实、约束、冲突、失败教训、候选与未知项。在使用派生认知前检查虚拟依赖有效性。即使输出简短也必须保留适用警告；基线或排序得分绝非执行权限。未决的记忆接口 after 屏障不能仅靠崭新的索引得到满足。仅在需要时展开证据；完整的 ProjectionBasis / RecallCoverage 保持附加于结果或受治理的绑定句柄上。切勿捏造不可用的历史。

[完整语法手册](../KIPSyntax_CN.md)适用于聚合、路径查询以及不常用的 META 操作。进行日常召回时无需加载完整手册。
