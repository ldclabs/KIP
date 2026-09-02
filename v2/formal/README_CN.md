# KIP 2.0 形式化验证

**[English](./README.md) | [中文](./README_CN.md)**

KIP 2.0 规范的机器检查模型。验证结果、发现与范围限制详见 **[REPORT_CN.md](./REPORT_CN.md)**。

| 套件 | 工具 | 验证目标 |
| --- | --- | --- |
| [`alloy/kip-core.als`](./alloy/kip-core.als) | Alloy 6 (时序) | 核心数据模型：命题 (Proposition) / 断言 (Assertion) / 证据 (Evidence) 生命周期、概念合并 (Concept merge)、同空间闭包 (Same-Space closure)、认识根守恒 (§23)、源头绑定权限 (§31.5) |
| [`tla/KipTransactions.tla`](./tla/KipTransactions.tla) | TLA+ / TLC | 事务：原子提交、`EXPECT VERSION`、幂等性（包括与 `no_effect` 的交互）、`space_seq` / 提交记录 (Commit Record) (§32–§36) |
| [`governance/check_governance.py`](./governance/check_governance.py) | Python (穷举) | §30 治理策略评估：拒绝优先 (deny-overrides)、不变式至高性 (invariant supremacy)、顺序无关性 (order-independence) |
| [`grammar/check_ebnf.py`](./grammar/check_ebnf.py) | Python (静态) | KQL/KML/META EBNF：格式良构性、可达性、跨文法漂移检查 |
| [`lifecycle/check_lifecycle.py`](./lifecycle/check_lifecycle.py) | Python (显式状态穷举) | 后果通道与技能生命周期：依据决策链接归因 vs 任务族对比、计票前校验 TrialState、仅限裁决流转状态、可复算性、导入重置、自评自赞可见性 (规范 §15.7, §29.8, §41.6; Profile §6.2–§6.6, §14, §21) |
| [`watch/check_watch.py`](./watch/check_watch.py) | Python (显式状态穷举) | 两个并发求值者加重新投递下的 Watch 触发：恰好一次触发、仅匹配触发、静默健全性 (Profile §5.11; 规范 §34, §35.1, §36.3) |
| [`purge/check_purge.py`](./purge/check_purge.py) | Python (显式状态穷举) | 擦除操作：引用处理策略、策略前及级联中的法律保全、哈希摘要存根、载荷清除 (规范 §19.1, §60.3, §60.6, 不变量 34) |

运行全部验证（已对预期结果进行断言，包括在注入错误配置中预期的反例）。Python 套件无需 Java；若缺少 JAR 包，Java 套件会被跳过并以退出码 3 结束：

```bash
export ALLOY_JAR=/path/to/org.alloytools.alloy.dist.jar   # Alloy >= 6.2
export TLA_JAR=/path/to/tla2tools.jar
./run.sh
```

这些工件在有界范围内验证了**协议层**。它们没有 —— 也无法 —— 验证认知层的主张（记忆影响、学习）；根据设计，这些属于 Brain 级别的实证基准测试 (Architecture §21.3)。
