# 直接 KIP：形成速查卡 (Direct KIP: Formation card)

**[English](./KIPFormation.md) | [中文](./KIPFormation_CN.md)**

面向实现 [Brain Formation](./BrainFormation_CN.md) 的模型。宿主捕获源字节、源标识、授权任务范围与重试标识。从在线 Primer 获取确切的 Schema/元素引用；切勿捏造谓词或行动者。

对于通用的、未限定范围的归因主张，可直接引用运行时摄入的 `:evidence`，而无需重新输入其载荷内容。允许省略置信度 (confidence)。`at` 是行动者提出该主张的时间 —— 亦即源数据的观测时间 —— 绝非本次写入执行的时间：它是该主张的起始键，因此即使是很晚才处理的旧消息也必须携带其旧时间。

```kip
ASSERT (:subject, :predicate, :object) {by: :actor, mode: "stated", at: :observed_at, evidence: :evidence}
```

对于限定作用域的主张，请使用 `ASSERT ... {context: :contexts}`。它精确脱糖为 `context_refs`；适配器负责提供规范的任务/上下文集合。等价的显式形式依然可用：

```kip
MUTATE {
  ENSURE PROPOSITION ?p (:subject, :predicate, :object)
  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key
    SET FIELDS {
      proposition: ?p, asserted_by: :actor, stance: "support", mode: "stated",
      asserted_at: :observed_at, context_refs: :contexts
    }
    SET STRUCTURAL { ("evidence", :evidence) {role: "support"} }
  }
}
```

在发生认知转换的地方创建 Activity 溯源及其真实的 DependencyBasis。宿主捕获实际的读取钉住版本与摘要；它无法猜测你使用了哪些源。从某份文档中提取的事实，若其作者并非可解析的行动者，则属于你的推断：`by: :self, mode: "inferred"` 并引用该 Evidence —— 绝不要针对你凭空捏造的行动者创建 `stated` 主张。两条此类推断绝不能互相终止；该人本人的陈述优先级高于推断。未知 Schema 素材可保留为仅限证据（Evidence-only），且必须在披露未解析解释的前提下保持在召回中可达。

三类修订看起来相似，但写法各不相同。更正（correction）—— 行动者早先的主张有误 —— 将其废弃替代（supersedes）。仅更正数值时显式保留 `valid` 中的更正区间，若原始起点缺失则物化为 `{latest: <原 asserted_at>}`；`at` 仍是此次更正的时间。现实世界变迁（world change）—— 该主张在其所处时期是真实的 —— 是一条从变迁开始时起算的新 Assertion；时间继承（temporal succession）会自然终止旧主张，且旧主张在其生效时间内仍可作答。录入错误（misrecording）—— 你记下了行动者从未说过的话 —— 属于录入修复（recording repair），绝不要代表他们撤回。替换断言恢复原始来源的主张时间，绝不取修复请求的时间。切勿仅仅因为你不同意就废弃替代另一行动者的主张。

```kip
ASSERT (:subject, :predicate, :new_value) {
  by: :actor, mode: "stated", at: :observed_at, evidence: :evidence, valid: {from: :changed_at}
}
```

未知的变更时间应保持为未知：完全不要写 `valid` —— 缺失起点已然代表“不晚于该主张”，让 `at` 携带陈述的时间；绝不要凭空捏造时刻。某项取值仅仅停止适用，则由同一行动者记录一条从截止时起算的 `stance: "reject"`。限定作用域的修订在 ASSERT 上保留 `context: :contexts`。

偏好是一条 `prefers` 主张，其选项为按类别分类的 Concept（如 `ColorScheme`、`Editor`）：同一类别的新偏好将继承替代旧偏好。当已安装的类型中没有对应类别时，先使用 `DEFINE CONCEPT TYPE`；切勿使用 `Topic` 这种包罗万象的类别来为选项分类，否则每项偏好都会与其他所有偏好相互竞争。

当部署环境授予了 `propose_schema` 权限时，未在任何 package 中定义的关系统一通过 `DEFINE PREDICATE`（规范 §20.16）添加一次：在使用它的 MUTATE 之前单独发出请求，随后以 `CLIENT KEY "review_schema:PredicateType:<ref>"` 排入一个 `review_schema` 睡眠任务；`SchemaSymbolConflict` 表示它已存在。否则将该素材保留为仅限证据，并排入一个指名所缺关系的 `review_schema` 睡眠任务交给所有者。切勿强行扭曲无关的 Predicate 来迁就数据。

仅记录所观测到、由外部提供的过程。反馈保持其真实来源：自述绝非可评分的客观结果。普通事实与反馈无需试验。切勿为了填满可选字段而人为编造置信度、显著性或效用。

超时并非中止。重试前先解析既有的幂等键；切勿仅仅因为响应丢失就将提取流程作为新证据重新运行。

记忆接口处理回执区分了 recorded、processed 与 available。仅仅提交了 Evidence 元素本身并不是形成已完成的证明。对于不常用的变更使用[完整语法手册](../KIPSyntax_CN.md)，切勿将其作为每次日常写入的默认提示词。
