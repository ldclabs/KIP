# 仓库目录迁移

**[English](./Repository-Layout.md) | [中文](./Repository-Layout_CN.md)**

KIP 2.0 已成为仓库根目录的默认开发版本。协议继续标为 `2.0-draft`；软件包版本和引擎兼容性与目录变动独立。状态和 API 的升级请参阅[从 KIP 1.x 迁移](./KIP-2.0-Migration-from-1.x_CN.md)。

## 路径映射

| 原路径 | 新路径 |
| --- | --- |
| `v2/README.md`、`v2/README_CN.md` | `README.md`、`README_CN.md` |
| `v2/KIP-2.0-SPECIFICATION.md`、`v2/KIP-2.0-SPECIFICATION_CN.md` | `SPECIFICATION.md`、`SPECIFICATION_CN.md` |
| 其他 `v2/<path>` 文档、Schema、语法、Profile、测试数据与脚本 | 根目录的 `<path>`，保留文件名 |
| 原根目录 v1 首页、规范、语法卡及 Self/System 指令 | `v1/` 下同名文件 |
| 原根目录 `brain/`、`capsules/`、`FunctionDefinition*.json` | `v1/brain/`、`v1/capsules/`、`v1/FunctionDefinition*.json` |
| `mcp/`、`skill/` | `v1/mcp/`、`v1/skill/` |
| 原 `CONTEXT.md`、`CONTEXT_CN.md` | 历史副本进入 `v1/`，根目录术语表改为描述 v2 |
| `packages/`、`post/`、`LICENSE` | 位置不变 |

旧 [v2 入口](../v2/README_CN.md)仅保留导航。GitHub Markdown 不会重定向深层链接或 raw 下载，请按上表更新 `blob/main/v2/...` 和 `raw/.../main/v2/...` 引用。原根目录 v1 URL 现在返回 v2 内容；v1 使用方必须改用 `v1/...` 或固定到原始提交。归档内部的相对链接指向其 v1 契约。

## 历史参考

迁移前仓库保存在提交 [`31cf33f84450918432083d19c085fa47cb74d879`](https://github.com/ldclabs/KIP/tree/31cf33f84450918432083d19c085fa47cb74d879) 中，可据此获取原始字节和路径。[v1 归档](../v1/README_CN.md)保留旧版文档、胶囊、函数定义、MCP Server 和 Skill，并添加归档说明、调整链接。历史 CONTEXT 文件在快照时已经包含部分 v2 术语。

当前语言包和 VS Code 扩展面向 v2，继续位于 `packages/`；它们不是 v1 工具的归档副本。旧工具版本保留在 Git 历史中。归档的 MCP 软件包已移出根目录 pnpm workspace，其独立 lockfile 保留供历史使用。原生 v2 MCP/Skill 适配另行开展。

## 协议工件完整性

迁移按原字节保留所有既有 JSON 工件，包括 Schema ID、模式包身份和版本、验证 Schema 锁、规范化配置、测试数据与内容摘要。部分不可变 JSON 描述仍引用原文件名 `KIP-2.0-SPECIFICATION.md`，该引用现对应根目录的[主规范](../SPECIFICATION.md)。不要仅为修改叙述性引用而重新生成摘要。

## 当前检查命令

在仓库根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm --filter @ldclabs/kip-lang test
pnpm --filter vscode-kip test
pnpm --filter vscode-kip lint
pnpm --filter vscode-kip build
pnpm --filter vscode-kip package
node conformance/update-digests.mjs
node conformance/run.mjs --list
node conformance/run.mjs --suite interface --list
bash formal/run.sh
```

形式化运行器会显式报告缺失前置条件；任一套件跳过时返回 3。详见[形式化检查前置条件](../formal/README_CN.md)与[一致性指南](../conformance/README.md)。根目录 CI 已改为监控新位置的主规范、Brain 文档、Schema、语法、Profile、一致性套件和形式模型。
