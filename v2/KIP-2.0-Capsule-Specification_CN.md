# KIP 2.0 认知胶囊规范 (Capsule Specification)

**[English](./KIP-2.0-Capsule-Specification.md) | [中文](./KIP-2.0-Capsule-Specification_CN.md)**

## 规范状态

**[KIP-2.0-SPECIFICATION_CN.md](./KIP-2.0-SPECIFICATION_CN.md) 的规范性伴随文档，版本 2.0-draft**

本文档承载 KIP 2.0 规范的 §37–§41 和 §95：认知胶囊（Cognitive Capsule）工件、其身份模型、导入模式、闭包与外部引用、导出/导入流水线以及胶囊能力要求。章节编号与主规范保持一致，因此在核心规范、认知记忆 Profile 或一致性测试套件中对 §37.7 或 §41.4 等引用的解析保持不变。未指明文档名称的章节引用均指向核心规范，其中保留了胶囊所依赖的各项基础设施：元素模型（§6–§16）、模式包（§20）、治理面（§28–§31）、事务（§32–§36）以及流水线语句 `VERIFY CAPSULE` / `VALIDATE CAPSULE` / `PREVIEW IMPORT` / `EXPORT CAPSULE`（§64, §69）。

不支持胶囊的实现可忽略本文档，且既不通告 `capsule_export` 也不通告 `capsule_import`（§67.4）；胶囊支持是一项能力，而非 Profile（§89）。支持胶囊的实现则受本文档的严格约束，如同受核心规范约束一样。

---

# 37. 认知胶囊 (Cognitive Capsule)

## 37.1 定义

**认知胶囊（Cognitive Capsule）**是一种可移植的、不可变的、可审查的人工制品，承载跨系统或跨空间迁移的认知状态或状态变更增量。

胶囊绝不是可执行的变更授权。

---

## 37.2 核心不变量

```text
胶囊字节数据 (Capsule bytes)
    ≠
目标系统的写入权限 (destination mutation authority)
```

---

## 37.3 胶囊分类

基线分类：

```text
snapshot (快照胶囊)
delta    (增量胶囊)
```

---

## 37.4 快照胶囊 (Snapshot Capsule)

表示在源系统某一特定快照时所选取的认知状态集合。

---

## 37.5 增量胶囊 (Delta Capsule)

表示在源系统同一血统谱系上介于以下两点之间的有序变更序列：

```text
base_seq   (基准序列号)
target_seq (目标序列号)
```

增量胶囊的应用要求目标系统具备兼容的基准点/检查点。

---

## 37.6 逻辑结构

胶囊在概念上**应当**包含：

```text
payload (载荷)
  manifest            (清单)
  source              (来源信息)
  schema dependencies (模式依赖项)
  records             (记录集)
  external_refs       (外部引用)
  blobs               (二进制大对象)
  handling            (处理策略指示)

integrity (完整性)
  content_digest      (内容摘要)
  proofs/signatures   (证明/数字签名)
```

---

## 37.7 规范化表示 (Canonical representation)

原生胶囊格式**应当**具备确定性的规范化序列化形式，以适用于哈希计算与签名验签。

基线规范化 Profile 为 `kip-draft-canonical-json-v1`，现已包含在发布的模式包工件的 `integrity.digest_profile` 字段中：

```text
编码 (encoding)         UTF-8，无字节顺序标记 (BOM)
对象 (objects)          键递归按 Unicode 码点升序排序；严禁重复键
分隔符 (separators)     "," 与 ":" 之后无任何空白字符
字符串 (strings)        仅转义控制字符以及 '"' 与 ''；其余字符直接输出原生 UTF-8
数值 (numbers)          仅限有限数值；整数不带指数或小数部分；其他数值采用最短往返表达
                        (§9.6 规范化值) —— 严禁 NaN、Infinity、-0
缺省字段 (absent)       直接省略，绝不输出为 null (null 本身是有语义的值，§9.5)
摘要 (digest)           对除 integrity 以外的所有顶层字段的规范化字节进行 sha256 计算，
                        格式化为 "sha256:<小写十六进制串>"
```

`sha256` 为强制要求的摘要算法；运行时**可以**在命名空间下注册其他算法与签名套件，且**必须**显式拒绝其无法识别其 `digest_profile` 或摘要算法的工件，严禁宽松放行。

---

## 37.8 签名语义

胶囊签名证明了签名者对该内容摘要及范围进行了公证确认。

签名绝不证明：

```text
真理性 (truth)
安全性 (safety)
实用性 (utility)
受信度 (trust)
执行权限 (authority)
目标系统适用性 (destination applicability)
```

---

# 38. 胶囊身份模型 (Capsule Identity Model)

## 38.1 三类身份标识

导入处理必须明确区分：

```text
胶囊局部引用 (capsule-local reference)
源系统元素引用 (source element reference)
目标系统局部元素 ID (destination local element ID)
```

源系统的元素 ID **绝不能**自动成为目标系统的本地主 ID。

---

## 38.2 身份解析

推荐的保守解析顺序：

```text
1. 既有已验证的导入映射 (prior verified import mapping)
2. 受信的 canonical_id
3. 经显式审批确认的映射 (explicitly approved mapping)
4. 模式定义的可移植标识 (符号谱系 + key，§20.14)
5. 创建新 Concept
```

---

## 38.3 名称不代表合并身份

```text
相同名称 (same name)
    ≠
同一身份 (same identity)
```

---

## 38.4 `$self` 身份隔离

源系统的 `$self` **绝不能**自动成为目标系统的 `$self`。

普通智能体间的数据共享，将源系统的 self 映射为源智能体的语义行动者身份。

---

## 38.5 恢复例外

在经过严格校验的 restore 模式下，仅当 Governance 验证满足以下条件时，**方可**将源系统的 `$self` 映射为目标系统的 `$self`：

```text
同一拥有者 (same owner)
同一 Brain/self 身份标识
备份恢复谱系 (backup lineage)
显式授予的恢复权限 (explicit restore authority)
```

---

# 39. 胶囊导入模式 (Capsule Import Modes)

推荐模式：

```text
preview (预览)
isolate (隔离)
merge   (合并)
restore (恢复)
```

---

## 39.1 预览 (Preview)

只读模拟。

不创建任何目标系统的认知状态。

---

## 39.2 隔离 (Isolate)

导入至隔离审查状态（quarantine/review state），而非进入常规 Recall 召回状态。

---

## 39.3 合并 (Merge)

在目标系统的身份与 Governance 治理策略管辖下，将另一源系统的认知合并入目标系统。

---

## 39.4 恢复 (Restore)

在更严格的身份校验约束下，恢复同一 Brain/拥有者谱系的历史状态。

---

## 39.5 源系统信任度不自动迁移

目标系统**必须**应用自身的策略体系：

```text
信任策略 (trust)
密级分类 (classification)
执行权限 (authority)
模式定义 (Schema)
治理规则 (Governance)
```

---

# 40. 胶囊闭包与外部引用 (Capsule Closure and External References)

## 40.1 外部引用 (ExternalRef)

对于被省略的外部依赖项，**应当**采用显式结构表达，而非留下不透明的悬空 ID。

推荐类型：

```text
source_element     (源系统元素引用)
canonical_identity (规范化身份)
semantic_locator   (语义定位符)
external_artifact  (外部人工制品)
redacted           (已脱敏隐藏)
unavailable        (不可用/缺失)
```

---

## 40.2 脱敏（Redacted）与不可用（Unavailable）的区别

在策略允许的情况下，这两者**必须**保持可区分：

```text
redacted (已脱敏)
    源系统有意隐匿/扣留

unavailable (不可用)
    源系统并未持有或未能提供
```

---

## 40.3 闭包声明 (Closure)

胶囊**应当**显式声明其闭包类型，例如：

```text
closed      (完全闭合)
referential (引用闭合)
selective   (选择性闭合)
```

并**可以**分别描述：

```text
语义闭包 (semantic closure)
证据闭包 (Evidence closure)
溯源闭包 (provenance closure)
结构闭包 (structural closure)
```

---

# 41. 胶囊导出/导入流水线 (Capsule Export/Import Pipeline)

## 41.1 导出

导出操作**必须**保持快照一致性（snapshot-consistent）。

大规模导出**应当**使用固定的源快照/导出专用会话。

传输层分块分片**严禁**创建多个语义独立的胶囊，除非显式表示为胶囊集（Capsule Set）。

---

## 41.2 导入流水线

原生导入流水线在概念上遵循：

```text
VERIFY (签名与完整性核验)
→ VALIDATE (合法性校验)
→ PREVIEW / 身份解析
→ Governance 治理分析
→ 构建 Import Plan
→ 执行原子 Import 事务
```

---

## 41.3 内嵌模式定义

内嵌的 Schema Package **可以**仅用于校验目的。

它们**绝不能**自动激活生效。

---

## 41.4 导入技能的权限

导入的技能（Skill）默认处于非激活/不可执行状态，除非目标系统 Governance 显式提升其权限。

---

## 41.5 外部大对象 (External blobs)

胶囊**可以**引用基于内容寻址的外部大对象。

导入流程**严禁**自动向任意外部 URL 发起网络拉取。

网络数据抓取需要独立的运行时/工具层权限授权。

---

## 41.6 导入的后果证据 (Imported outcomes)

导入会为元素分配全新的本地 `_system.origin`（§41.2），并在 `origin.import_id` 中记录导入事实。对于 `outcome` 类证据，这具有决定性意义：目标系统从未授权过最初编写该结果的测量仪器，因此导入的结果仅作为可供阅读的普通证据，**绝不能作为本地的评级打分**。任何后果打分消费者**必须**排除设置了 `origin.import_id` 的结果（§15.7），且导入技能的原有评分统计数据不随之转移（§31.4）。

---

# 95. 胶囊能力要求 (Capsule Capability Requirements)

通告 `capsule_export` 或 `capsule_import`（§67.4）要求具备：

```text
规范化工件序列化
快照胶囊 (snapshot Capsule)
内容摘要生成与核验
模式依赖项标识
源/目标身份严格分离
ExternalRef 外部引用表示
闭包范围显式声明
verify / validate / preview 完整流水线
目标系统本地导入授权控制
```

增量胶囊 (Delta)、恢复模式 (restore) 与数字签名可作为高级子 Profile 实现。
