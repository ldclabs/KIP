import { z } from 'zod'

const CommandObjectSchema = z
  .object({
    command: z.string().min(1).describe('A single KIP command string.'),
    parameters: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Optional per-command parameters.')
  })
  .strict()

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
      .array(z.union([z.string().min(1), CommandObjectSchema]))
      .optional()
      .describe(
        "Batch execution: array of KIP commands. Mutually exclusive with 'command'. Strings use shared 'parameters'; objects can override 'parameters'."
      ),
    parameters: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Optional key-value pairs used for safe substitution of placeholders in command(s). Placeholders start with ':' and must occupy a complete JSON value token."
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

// Backwards compatible alias (typo kept)
export const ListLogsInputSchmema = ListLogsInputSchema

export type ListLogsInput = z.infer<typeof ListLogsInputSchmema>

export const RPCRequestSchema = z
  .object({
    method: z.literal(['execute_kip', 'list_logs']),
    params: z.union([ExecuteKipInputSchema, ListLogsInputSchmema])
  })
  .strict()

export type RPCRequest = z.infer<typeof RPCRequestSchema>
