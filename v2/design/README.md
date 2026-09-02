# KIP 2.0 Design Notes (frozen)

**Status: frozen as of 2026-09-02.** The ten documents in this directory are the pre-consolidation design drafts that led to [KIP-2.0-SPECIFICATION.md](../KIP-2.0-SPECIFICATION.md). They are kept for the reasoning behind the rules, not for the rules themselves:

- they are no longer maintained, and their `_CN.md` twins are no longer synchronized;
- where a note differs from the Specification, the Specification is right and the note is out of date;
- new rationale goes into the Specification's own prose or into [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md).

**状态：自 2026-09-02 起冻结。** 本目录十篇文档是规范性统合之前的设计草稿，保留它们是为了留下规则背后的推理，而不是规则本身：不再维护，中文镜像不再同步；凡与规范不一致之处以规范为准；新的设计依据写入规范正文或架构文档。

| Note | Subsystem |
| --- | --- |
| [Core Data Model](./KIP-2.0-Core-Data-Model.md) | elements, identity, references, literals |
| [Epistemic Model](./KIP-2.0-Epistemic-Model.md) | projection, trust, independence, conflict |
| [Governance](./KIP-2.0-Governance.md) | principals, permissions, classification |
| [Schema Packages](./KIP-2.0-Schema-Packages.md) | packages, environments, upgrade |
| [Transactions](./KIP-2.0-Transactions.md) | commit, idempotency, change stream |
| [Capsule](./KIP-2.0-Capsule.md) | export, import, canonicalization |
| [KQL](./KIP-2.0-KQL.md) | read language |
| [KML](./KIP-2.0-KML.md) | mutation language |
| [META](./KIP-2.0-META.md) | introspection, search, verification |
| [Protocol Runtime](./KIP-2.0-Protocol-Runtime.md) | envelopes, execution modes, errors |
