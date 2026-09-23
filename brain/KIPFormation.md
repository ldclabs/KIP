# Direct KIP: Formation card

**[English](./KIPFormation.md) | [中文](./KIPFormation_CN.md)**

For a model implementing [Brain Formation](./BrainFormation.md). The host captures
source bytes, source identities, authorized task scope and retry identity. Obtain
exact Schema/element refs from the live Primer; do not invent a predicate or actor.

For a general, unscoped attributed claim, runtime-ingested :evidence can be cited
without re-typing its payload. Missing confidence is allowed.

```kip
ASSERT (:subject, :predicate, :object) {by: :actor, mode: "stated", evidence: :evidence}
```

For a scoped claim use `ASSERT ... {context: :contexts}`. It lowers exactly to
`context_refs`; the Adapter supplies the canonical task/context set. The equivalent
explicit form remains available:

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

Create Activity provenance and its real DependencyBasis where a transformation
occurred. The host captures actual read pins and digests; it cannot guess which
sources you used. Unknown actor/Schema material can remain Evidence-only and must
remain reachable through recall with the unresolved interpretation disclosed.

A correction replaces an actor's mistaken assertion; a world change closes the
previous valid interval and creates the new one. Do not supersede another actor's
claim because you disagree. Keep each coherent revision in one MUTATE.

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

This example is unscoped. Scoped revisions retain `context: :contexts` on each ASSERT (or equivalent
explicit context_refs). Unknown change time remains unknown; do not invent an instant.

Only observed, supplied process is recorded. Feedback has its actual origin:
self-report is never a gradable outcome. Ordinary facts and feedback need no trial.
Do not assign made-up confidence, salience or utility just to fill optional fields.

A timeout is not abort. Resolve the existing idempotency key before retry; never
re-run extraction as new evidence just because the response was lost.

The Memory Interface processing receipt distinguishes recorded, processed and
available. A committed Evidence element alone is not proof that formation finished.
Use the [full syntax](../KIPSyntax.md) for uncommon mutations, not as the default
prompt for every routine write.
