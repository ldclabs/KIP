# Direct KIP: Formation card

**[English](./KIPFormation.md) | [中文](./KIPFormation_CN.md)**

For a model implementing [Brain Formation](./BrainFormation.md). The host captures
source bytes, source identities, authorized task scope and retry identity. Obtain
exact Schema/element refs from the live Primer; do not invent a predicate or actor.

For a general, unscoped attributed claim, runtime-ingested :evidence can be cited
without re-typing its payload. Missing confidence is allowed. `at` is when the actor
made the claim — the source's observed time — never when this write runs: it is the
claim's start key, so a late-processed old message must carry its old time.

```kip
ASSERT (:subject, :predicate, :object) {by: :actor, mode: "stated", at: :observed_at, evidence: :evidence}
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
      asserted_at: :observed_at, context_refs: :contexts
    }
    SET STRUCTURAL { ("evidence", :evidence) {role: "support"} }
  }
}
```

Create Activity provenance and its real DependencyBasis where a transformation
occurred. The host captures actual read pins and digests; it cannot guess which
sources you used. A fact taken from a document whose author is not a resolvable
actor is your inference: `by: :self, mode: "inferred"`, citing the Evidence — never
a `stated` claim by an actor you invented. Two such inferences never end one another;
the person's own statement outranks them. Unknown Schema material can remain
Evidence-only and must remain reachable through recall with the unresolved
interpretation disclosed.

Three revisions look alike and are written differently. A correction — the actor's
earlier claim was wrong — supersedes it. A world change — the claim was true for its
time — is one new Assertion from when the change began; temporal succession ends the
old one and it still answers for its time. A misrecording — you wrote down what the
actor never said — is a recording repair, never a retraction on their behalf. Do not
supersede another actor's claim because you disagree.

```kip
ASSERT (:subject, :predicate, :new_value) {
  by: :actor, mode: "stated", at: :observed_at, evidence: :evidence, valid: {from: :changed_at}
}
```

Unknown change time stays unknown: write no `valid` at all — a missing start already
means "no later than the claim" — and let `at` carry the statement's time; never an
invented instant. A value that simply stopped is the same actor's `stance: "reject"`
from the end. Scoped revisions keep `context: :contexts` on the ASSERT.

A preference is a `prefers` claim whose option is a Concept typed by its kind
(`ColorScheme`, `Editor`): a newer preference of one kind succeeds the older. When no
installed type names the kind, `DEFINE CONCEPT TYPE` it first; never type options with
a catch-all such as `Topic`, under which every preference would compete with every other.

A relation no package names is added once with `DEFINE PREDICATE` (Spec §20.16) when
the deployment grants `propose_schema`; otherwise keep the material Evidence-only and
queue a `review_schema` SleepTask. Never bend an unrelated Predicate to fit.

Only observed, supplied process is recorded. Feedback has its actual origin:
self-report is never a gradable outcome. Ordinary facts and feedback need no trial.
Do not assign made-up confidence, salience or utility just to fill optional fields.

A timeout is not abort. Resolve the existing idempotency key before retry; never
re-run extraction as new evidence just because the response was lost.

The Memory Interface processing receipt distinguishes recorded, processed and
available. A committed Evidence element alone is not proof that formation finished.
Use the [full syntax](../KIPSyntax.md) for uncommon mutations, not as the default
prompt for every routine write.
