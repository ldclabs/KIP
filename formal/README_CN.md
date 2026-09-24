# KIP 2.0 形式化验证

套件 9 还运行针对处理屏障（processing barriers）、乱序完成、幂等摄入、任务范围及诚实覆盖的记忆接口（Memory Interface）模式与场景模型检查，以及引擎套件形状测试。这些属于可执行的契约测试，而非穷举证明或生产环境 Brain 的结果。真实的绑定场景通过可选的接口适配器套件运行。

**[English](./README.md) | [中文](./README_CN.md)**

KIP 2.0 规范的机器检查模型。验证结果、发现与范围限制详见 **[REPORT_CN.md](./REPORT_CN.md)**。

| 套件 | 工具 | 验证目标 |
| --- | --- | --- |
| [`alloy/kip-core.als`](./alloy/kip-core.als) | Alloy 6 (时序) | 核心数据模型：命题 (Proposition) / 断言 (Assertion) / 证据 (Evidence) 生命周期、概念合并 (Concept merge)、同空间闭包 (Same-Space closure)、认识根守恒 (§23)、源头绑定权限 (§31.5) |
| [`tla/KipTransactions.tla`](./tla/KipTransactions.tla) | TLA+ / TLC | 事务：原子提交、`EXPECT VERSION`、幂等性（包括与 `no_effect` 的交互）、`space_seq` / 提交记录 (Commit Record) (§32–§36) |
| [`governance/check_governance.py`](./governance/check_governance.py) | Python (穷举) | §30 治理策略评估：拒绝优先 (deny-overrides)、不变式至高性 (invariant supremacy)、顺序无关性 (order-independence) |
| [`grammar/check_ebnf.py`](./grammar/check_ebnf.py) | Python (静态) | KQL/KML/META EBNF：格式良构性、可达性、跨文法漂移检查 |
| [`lifecycle/check_lifecycle.py`](./lifecycle/check_lifecycle.py) | Python (有界输入枚举与状态流转场景) | 独立尝试聚合、不可变试验/评估重放、修订版本重置、重新试验、合法晋升、同状态监控、迟延结果、纠错与来源排除 |
| [`watch/check_watch.py`](./watch/check_watch.py) | Python (显式状态穷举) | 两个并发求值者加重新投递下的 Watch 触发：恰好一次触发、仅匹配触发、静默健全性 (Profile §5.11; 规范 §34, §35.1, §36.3) |
| [`purge/check_purge.py`](./purge/check_purge.py) | Python (显式状态穷举) | 擦除操作：引用处理策略、策略前及级联中的法律保全、哈希摘要存根、载荷清除 (规范 §19.1, §60.3, §60.6, 不变量 34) |
| [`temporal/check_temporal.py`](./temporal/check_temporal.py) | Python (穷举配对与采样三元组) | 世界时间：时间继承、缺失起点的缺省规则、时间界限与 `kip:memory-default` 优先级（规范 §21.13, §25.2–§25.5）：区间收窄、顺序无关性、单次写入变迁、行动者隔离、不确定支撑不作裁决、迟延历史、意见一致、不捏造过去、推理不在时序线上、结构化基底、规则 2 绝不压过观测、规则应用次序；包含七种缺陷注入模式 |

2026-09-06 一致性修订版本单独报告于 [CONSISTENCY-REPORT_CN.md](./CONSISTENCY-REPORT_CN.md)；其契约现已并入规范正文与 `brain/` 伴随文档中。其 Node 契约套件补充了世代/防护、基线/上下文、数值及类型化制品检查；在运行前须在安装工作区依赖后构建 packages/kip-lang。这些验证预言机 (oracles) 不是 Nexus 引擎的运行结果。

运行全部验证（已对预期结果进行断言，包括在注入错误配置中预期的反例）。Python 套件无需 Java；若缺少 JAR 包，Java 套件会被跳过并以退出码 3 结束：

```bash
export ALLOY_JAR=/path/to/org.alloytools.alloy.dist.jar   # Alloy >= 6.2
export TLA_JAR=/path/to/tla2tools.jar
./run.sh
```

这些工件在有界范围内验证了**协议层**。它们没有 —— 也无法 —— 验证认知层的主张（记忆影响、学习）；根据设计，这些属于 Brain 级别的实证基准测试 (Architecture §21.3)。

## 历史全量运行（上一版草案）

2026-09-02，全部 7 个套件，设置 `ALLOY_JAR` / `TLA_JAR` 运行 `run.sh`（Java 17, Alloy 6.2.0, TLC 2.19）：**全部通过**，耗时 4 分 33 秒；每种故障注入模式均正确产生了预期反例。详见 [REPORT_CN.md §12](./REPORT_CN.md)。在 `java` 不在 `PATH` 上的机器上，运行前请指定 `JAVA=` 指向 JRE 二进制文件。
