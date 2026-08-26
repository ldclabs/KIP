/**
 * Version of this grammar implementation.
 *
 * An engine stamps this into its `DESCRIBE PRIMER` output, so a grammar bump
 * is visible to the agent instead of silently changing what a stored command
 * means. It is a literal rather than a `package.json` read because this module
 * has to load in runtimes with no filesystem; `test/lower.test.mjs` asserts the
 * two stay in step.
 */
export const PARSER_VERSION = '2.0.2'

/** The KIP specification revision this grammar targets. */
export const KIP_SPEC_REVISION = '2.0-draft'
