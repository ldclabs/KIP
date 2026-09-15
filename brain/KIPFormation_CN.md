# 直接 KIP：形成速查卡 (Direct KIP: Formation card)

**[English](./KIPFormation.md) | [中文](./KIPFormation_CN.md)**

面向实现 [Brain Formation](./BrainFormation_CN.md) 的模型。宿主捕获源字节、源标识、授权任务范围与重试标识。从在线 Primer 获取确切的 Schema/元素引用；切勿捏造谓词或行动者。

对于通用的、未限定范围的归因主张，可直接引用运行时摄入的 `:evidence`，而无需重新输入其载荷内容。允许省略置信度 (confidence)。

```kip
ASSERT (:subject, :predicate, :object) {by: :actor, mode: "stated", evidence: :evidence}
```

ASSERT 语法糖没有 context 成员。对于限定范围的主张，请使用显式形式；适配器会自动为限定任务范围的记忆接口输入选择此形式。

```kip
MUTATE {
  ENSURE PROPOSITION ?p (:subject, :predicate, :object)
  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key
    SET FIELDS {
      proposition: ?p, asserted_by: :actor, stance: "support", mode: "stated",
      context_refs: :contexts
    }
    SET STRUCTURAL { ("evidence", :evidence) {role: "support"} }
  }
}
```

在发生认知转换的地方创建 Activity 溯源及其真实的 DependencyBasis。宿主捕获实际的读取钉住版本与摘要；它无法猜测你使用了哪些源。未知行动者/模式素材可保留为仅限证据（Evidence-only），且必须在披露未解析解释的前提下保持在召回中可达。

更正（correction）替换某个行动者有误的断言；现实世界变更（world change）则关闭先前的有效区间并创建新的区间。切勿仅仅因为不同意就废弃替代另一行动者的主张。将每一次连贯的修订保持在单个 MUTATE 中。

```kip
MUTATE {
  ASSERT ?closed (:subject, :predicate, :old_value) {
    by: :actor, mode: "stated", evidence: :evidence,
    valid: {from: :old_from, until: :changed_at}
  } SUPERSEDING :old_assertion
  ASSERT (:subject, :predicate, :new_value) {
    by: :actor, mode: "stated", evidence: :evidence, valid: {from: :changed_at}
  }
}
```

此示例未限定范围。限定范围的修订使用 CREATE ASSERTION 形式保留显式的 context_refs。未知的变更时间应保持为未知；切勿凭空捏造具体时刻。

仅记录所观测到、由外部提供的过程。反馈保持其真实来源：自述绝非可评分的客观结果。普通事实与反馈无需试验。切勿为了填满可选字段而人为编造置信度、显著性或效用。

超时并非中止。重试前先解析既有的幂等键；切勿仅仅因为响应丢失就将提取流程作为新证据重新运行。

记忆接口处理回执区分了 recorded、processed 与 available。仅仅提交了 Evidence 元素本身并不是形成已完成的证明。对于不常用的变更使用[完整语法手册](../KIPSyntax_CN.md)，切勿将其作为每次日常写入的默认提示词。
