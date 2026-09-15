# Repository layout migration

**[English](./Repository-Layout.md) | [中文](./Repository-Layout_CN.md)**

KIP 2.0 is the default development version at the repository root. The protocol remains `2.0-draft`; package versions and engine compatibility are independent of this directory change. For state and API migration, use [Migration from KIP 1.x](./KIP-2.0-Migration-from-1.x.md).

## Path mapping

| Before | Now |
| --- | --- |
| `v2/README.md`, `v2/README_CN.md` | `README.md`, `README_CN.md` |
| `v2/KIP-2.0-SPECIFICATION.md`, `v2/KIP-2.0-SPECIFICATION_CN.md` | `SPECIFICATION.md`, `SPECIFICATION_CN.md` |
| Other `v2/<path>` documents, schemas, grammars, profiles, fixtures and scripts | `<path>` at the root, retaining filenames |
| Former root v1 README, specification, syntax card and Self/System instructions | `v1/`, retaining filenames |
| Former root `brain/`, `capsules/`, `FunctionDefinition*.json` | `v1/brain/`, `v1/capsules/`, `v1/FunctionDefinition*.json` |
| `mcp/`, `skill/` | `v1/mcp/`, `v1/skill/` |
| Former `CONTEXT.md`, `CONTEXT_CN.md` | Historical copies in `v1/`; root glossaries now describe v2 |
| `packages/`, `post/`, `LICENSE` | Unchanged locations |

The old [v2 entry](../v2/README.md) contains navigation only. GitHub Markdown does not redirect deep links or raw downloads. Update `blob/main/v2/...` and `raw/.../main/v2/...` references with the table above. The former root v1 URLs now resolve to v2 content; v1 consumers must use `v1/...` or pin the original commit. Relative links inside the archive point to its v1 contract.

## Historical reference

The repository immediately before the move is preserved at commit [`31cf33f84450918432083d19c085fa47cb74d879`](https://github.com/ldclabs/KIP/tree/31cf33f84450918432083d19c085fa47cb74d879). Use that commit for the original bytes and paths. The [v1 archive](../v1/README.md) retains legacy documentation, capsules, function definitions, MCP server and Skill with archive notices and adjusted links. Its historical CONTEXT files already included some v2 terminology at the time of the snapshot.

Current language packages and the VS Code extension target v2 and stay in `packages/`. They are not archived copies of v1 tooling. Historical tooling revisions remain in Git history. The archived MCP package is outside the root pnpm workspace; its independent lockfile is retained for historical use. Native v2 MCP/Skill adaptation is separate work.

## Protocol artifact integrity

The move preserves all existing JSON artifacts byte-for-byte, including Schema IDs, package identities and versions, validation-schema locks, canonicalization profiles, fixture data and content digests. Some immutable JSON descriptions still cite the original filename `KIP-2.0-SPECIFICATION.md`; that citation now refers to the root [Specification](../SPECIFICATION.md). Do not regenerate digests merely to rename a prose citation.

## Current checks

Run from the repository root:

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

The formal runner reports unavailable prerequisites explicitly and returns 3 when any suite is skipped. See [formal prerequisites](../formal/README.md) and the [conformance guide](../conformance/README.md). Root CI now watches the current specification, Brain documents, schemas, grammars, profiles, conformance suite and formal models in their root locations.
