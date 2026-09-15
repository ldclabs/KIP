import { z } from 'zod'

/**
 * A single batch entry may be either a bare command string (which shares the
 * top-level `parameters`) or an object carrying its own `parameters` that
 * override the shared ones (spec §6.1).
 */
const CommandObjectSchema = z
  .object({
    command: z.string().min(1).describe('A single KIP command string.'),
    parameters: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Per-command parameters (override the shared parameters).')
  })
  .strict()

const CommandEntrySchema = z.union([z.string().min(1), CommandObjectSchema])

export const ExecuteKipInputSchema = z
  .object({
    command: z
      .string()
      .min(1)
      .optional()
      .describe(
        "A complete, multi-line KIP command (KQL, KML or META) string to be executed. Mutually exclusive with 'commands'."
      ),
    commands: z
      .array(CommandEntrySchema)
      .optional()
      .describe(
        "Batch execution: array of KIP commands. Each element is either a command string (using the shared 'parameters') or an object { command, parameters } whose parameters override the shared ones. Mutually exclusive with 'command'."
      ),
    parameters: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Optional key-value pairs used for safe substitution of placeholders in command(s). Placeholders start with ':' and must occupy a complete KIP value position (for example: name: :name, LIMIT :limit, or SEARCH CONCEPT :term)."
      ),
    dry_run: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, validate only without execution.')
  })
  .strict()
  .superRefine((val, ctx) => {
    const hasCommand = typeof val.command === 'string' && val.command.length > 0
    const hasCommands = Array.isArray(val.commands) && val.commands.length > 0

    if (hasCommand === hasCommands) {
      ctx.addIssue({
        code: 'custom',
        message: "Provide exactly one of 'command' or 'commands'.",
        path: ['command']
      })
    }
  })

export type ExecuteKipInput = z.infer<typeof ExecuteKipInputSchema>

export const ListLogsInputSchema = z
  .object({
    cursor: z.string().optional().describe('Optional pagination cursor.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe(
        'Maximum number of log entries to return (default: 10, max: 100).'
      )
  })
  .strict()

export type ListLogsInput = z.infer<typeof ListLogsInputSchema>

export const RPCRequestSchema = z
  .object({
    method: z.literal(['execute_kip', 'execute_kip_readonly', 'list_logs']),
    params: z.union([ExecuteKipInputSchema, ListLogsInputSchema])
  })
  .strict()

export type RPCRequest = z.infer<typeof RPCRequestSchema>
