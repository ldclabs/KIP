# KIP 2.0 可选 Profile 与迁移规范 (Optional Profiles and Migration)

**[English](./KIP-2.0-Optional-Profiles-and-Migration.md) | [中文](./KIP-2.0-Optional-Profiles-and-Migration_CN.md)**

## 规范状态

**[KIP-2.0-SPECIFICATION_CN.md](./KIP-2.0-SPECIFICATION_CN.md) 的规范性伴随文档，版本 2.0-draft**

本文档承载 KIP 2.0 规范中核心实现可能不需要的四个部分：§100 历史一致性（Historical Conformance）与 §101 高保障一致性（High-Assurance Conformance）—— 两个可选的一致性 Profile —— 以及 §103 KIP 1.x 迁移（KIP 1.x Migration）及其附录 I 兼容性概要（Compatibility Summary）。章节编号采用规范自身的编号，因此外部引用保持不变，未指定文档名称的章节引用均指向核心规范。操作层面的迁移指南请参阅 [migration/KIP-2.0-Migration-from-1.x_CN.md](./migration/KIP-2.0-Migration-from-1.x_CN.md)；若该指南与 §103 发生分歧，以 §103 为准。

实现通过 `DESCRIBE CAPABILITIES`（§67）声明支持历史或高保障 Profile，并受对应章节约束；未声明这两个 Profile 且无 KIP 1.x 遗留数据的系统，不受本文档任何条款约束。

---

# 100. 历史读取 (Historical Reads)

`historical_reads` 能力（§67.4）在系统通告的历史留存范围内，要求支持：

```text
AS OF SEQ                (按序列号的时间旅行读取)
lifecycle reconstruction (生命周期状态历史重构)
historical Schema Environment (历史生效模式环境解析)
historical cognitive read     (历史认知状态一致性读取)
current authorization         (基于当前权限的访问控制)
transaction chronology        (事务时间序列编年史)
```

---

# 101. 高保证加固 (High-Assurance Hardening)

可能要求满足（当客户端需要依赖时，每一项均作为能力通告，§67.4）：

```text
serializable transactions    (严格可串行化事务)
signed Receipts              (带数字签名的提交回执)
canonical request/plan digests (规范化请求/计划摘要)
strict duplicate-JSON-key rejection (严格拒绝重复 JSON 键)
exact historical Schema      (精确历史模式追溯)
tamper-evident checkpoints   (防篡改检查点)
strict existence-neutral behavior (严格的存在性中立行为)
strong proof registries      (强证明注册表)
auditable Projection policy versions (可审计的认知投影策略版本)
```

---

# 103. KIP 1.x 迁移 (KIP 1.x Migration)

## 103.1 迁移目标

迁移**应当**忠实保留遗留语义与历史，而不应假装 KIP 1.x 存储了其原本并不具备的认知区分。

---

## 103.2 遗留 Concept 迁移

KIP 1 的 Concept **应当**迁移为 v2 的 Concept。

在 v1 依赖 `(type, name)` 充当唯一标识的场景中，迁移流程**可以**从遗留标识派生出稳定的 v2 `key`。

---

## 103.3 遗留 Proposition 迁移

v1 事实性 Proposition **应当**迁移为：

```text
规范化 v2 Proposition
+
迁移生成的肯定性 Assertion
```

以保留其遗留的事实语义。

---

## 103.4 遗留元数据映射

遗留元数据**必须**进行语义分类归属：

```text
confidence (置信度)
    → 在语义有效的前提下映射为 Assertion confidence

source / author (来源/作者)
    → Evidence / asserted_by / 溯源信息

observed_at (观测时间)
    → Evidence 观测时间

valid_from / valid_until (有效时间区间)
    → Assertion valid_time

expires_at (过期时间)
    → retention 留存配置

access_level (访问等级)
    → Governance 映射

operational markers (运维标记)
    → Profile 切面 (Facet)

unknown legacy fields (未知遗留字段)
    → 在安全的前提下放入带命名空间的遗留 Facet
```

---

## 103.5 遗留置信度衰减迁移

v1 的周期性置信度衰减**绝不应当**直接迁移为原生 Assertion 置信度衰减。

应根据实际业务意图分别映射：

```text
遗忘 (forgetting)
    → memory_strength (记忆强度衰减)

陈旧 (staleness)
    → Epistemic Projection 新鲜度判定

新证据 (new evidence)
    → 新 Assertion 版本的修订
```

---

## 103.6 遗留 DELETE 迁移

原生迁移**应当**优先选用：

```text
archive (归档)
tombstone (逻辑墓碑)
explicit purge (显式清除)
Assertion lifecycle (断言生命周期转移)
```

而非重新引入通用的破坏性 DETACH 级联删除语义。

---

## 103.7 遗留 MERGE 迁移

遗留的破坏性“重指向边后删除源节点”的合并逻辑，**应当**迁移为 v2 的非破坏性身份统合机制。

---

## 103.8 遗留 EXPORT 迁移

KIP 1 的 UPSERT 导出脚本属于遗留产物。

原生 v2 的可移植性基于认知胶囊（Cognitive Capsule）。

v2 运行时**可以**提供兼容性的导入/导出转换器。

---

## 103.9 遗留模式节点迁移

KIP 1 在图中自描述的图类型节点，**应当**迁移为权威的 Schema Package 或兼容性模式包。

在原生 v2 中，普通的认知图节点**绝对不能**直接成为权威的 Schema 状态。

---

# 附录 I. 兼容性概要 (Compatibility Summary)

KIP 1 → KIP 2 的核心语义转变总结如下：

```text
v1 Concept 标识:
    type + name 往往充当标识
v2:
    不可变 id / key; name 仅用于接地与展示

v1 Proposition:
    关系/事实 + 元数据黑盒
v2:
    价值中立的 Proposition + Assertion + Evidence

v1 元数据置信度:
    存储在边/链接上
v2:
    Assertion confidence (断言强度)、Projection belief (投影信念)、memory_strength (记忆强度) 三者严格分离

v1 泛型元数据:
    通用万能黑盒字典
v2:
    明确划分的语义平面 (semantic planes)

v1 合并:
    重指向边并删除源节点
v2:
    非破坏性的身份统合机制 (保留历史端点，规范化解析)

v1 删除/解绑:
    常规图操作
v2:
    区分归档 (archive) / 逻辑墓碑 (tombstone) / 物理清除 (purge)

v1 导出:
    幂等的 UPSERT 脚本
v2:
    具备防伪校验的认知胶囊 (Cognitive Capsule) 工件

v1 查询链接:
    直接视同客观事实
v2:
    查询原始 Proposition，除非显式使用 BELIEF 进行认知投影

v1 命令批处理:
    遗留的隐式执行逻辑
v2:
    显式声明 independent / sequence / atomic 执行模式
```
