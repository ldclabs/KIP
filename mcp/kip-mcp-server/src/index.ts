#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import {
  ExecuteKipInputSchema,
  ListLogsInputSchema,
  type ExecuteKipInput
} from './schemas/executeKip.js'
import {
  executeKipOverHttp,
  executeKipReadonlyOverHttp,
  listLogs,
  type KipClientOptions
} from './services/kipClient.js'

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it to your KIP HTTP endpoint (for example, https://host/kip).`
    )
  }
  return v
}

async function readServerVersion(): Promise<string> {
  try {
    const pkgUrl = new URL('../package.json', import.meta.url)
    const pkg = JSON.parse(await readFile(pkgUrl, 'utf-8')) as {
      version?: string
    }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const server = new McpServer({
  name: 'kip-mcp-server',
  version: await readServerVersion()
})

/** Build backend client options from the environment. */
function clientOptions(): KipClientOptions {
  return {
    baseUrl: requiredEnv('KIP_BACKEND_URL'),
    apiKey: process.env.KIP_API_KEY,
    authHeader: process.env.KIP_AUTH_HEADER,
    timeoutMs: process.env.KIP_TIMEOUT_MS
      ? Number(process.env.KIP_TIMEOUT_MS)
      : undefined
  }
}

/** Shape a backend response into MCP tool output (text + structured content). */
function toToolResult(output: unknown) {
  const structuredContent: Record<string, unknown> =
    typeof output === 'object' && output !== null && !Array.isArray(output)
      ? (output as Record<string, unknown>)
      : { result: output }

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
    structuredContent
  }
}

function getRepoRoot(): string {
  // If KIP_REPO_ROOT is set, allow loading docs from a checked-out KIP repo.
  // When published as a standalone npm package, docs are bundled under ../docs.
  return process.env.KIP_REPO_ROOT ?? path.resolve(process.cwd(), '..', '..')
}

async function readRepoFile(relPath: string): Promise<string> {
  const abs = path.resolve(getRepoRoot(), relPath)
  return await readFile(abs, 'utf-8')
}

async function readBundledDocFile(filename: string): Promise<string> {
  // dist/index.js -> ../docs/<filename>
  const url = new URL(`../docs/${filename}`, import.meta.url)
  return await readFile(url, 'utf-8')
}

async function readDocFile(filename: string): Promise<string> {
  try {
    return await readBundledDocFile(filename)
  } catch {
    return await readRepoFile(filename)
  }
}

// --- Resources: expose the core instruction docs so clients can fetch them on demand.
server.registerResource(
  'kip-instructions',
  'kip://docs/Instructions.md',
  {
    title: 'KIP Instructions',
    description:
      'KIP cognitive core instructions (recommended to inject as system prompt by the client).',
    mimeType: 'text/markdown'
  },
  async (uri) => {
    const text = await readDocFile('Instructions.md')
    return {
      contents: [{ uri: uri.href, mimeType: 'text/markdown', text }]
    }
  }
)

server.registerResource(
  'kip-specification',
  'kip://docs/KIP.md',
  {
    title: 'KIP Specification',
    description: 'Full KIP specification document.',
    mimeType: 'text/markdown'
  },
  async (uri) => {
    const text = await readDocFile('KIP.md')
    return {
      contents: [{ uri: uri.href, mimeType: 'text/markdown', text }]
    }
  }
)

// --- Prompts: provide an injectable system prompt for clients that support prompt->messages flow.
server.registerPrompt(
  'kip_bootstrap',
  {
    title: 'KIP Bootstrap (System Instructions)',
    description:
      'Return a system prompt that teaches the agent how to use KIP correctly (retrieval-first, schema-grounded, safe writes).'
  },
  async (_args, _extra) => {
    const promptText = await readDocFile('Instructions.md')

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              'Use the following as your system instructions for interacting with a Cognitive Nexus via KIP.\n\n' +
              promptText
          }
        },
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: "Loaded KIP instructions. Use 'execute_kip' and follow schema discovery (DESCRIBE/SEARCH) when uncertain."
          }
        }
      ]
    }
  }
)

server.registerTool(
  'execute_kip',
  {
    title: 'Execute KIP Commands',
    description: `Execute KIP (Knowledge Interaction Protocol) commands against a Cognitive Nexus backend.

IMPORTANT: KIP is new and typically NOT present in the model's training data. Before using this tool for anything non-trivial (especially writes), you MUST load KIP usage instructions.

Do one of the following first:
- Use the prompt: kip_bootstrap (recommended)
- Or fetch the resources: kip://docs/Instructions.md and (optionally) kip://docs/KIP.md

Input shape:
- Provide exactly one of: 'command' (single multi-line string) OR 'commands' (batch).
- In a batch, each 'commands' element is either a string (using shared 'parameters') or an object { command, parameters } whose parameters override the shared ones.
- Use 'dry_run: true' to validate without executing.
- If you only need to read (KQL FIND, META DESCRIBE/SEARCH/EXPORT) and will not modify the graph, prefer the 'execute_kip_readonly' tool.

Schema grounding (do not guess):
- Types are UpperCamelCase; predicates/attributes are snake_case (case-sensitive).
- If unsure about schema/types/predicates, discover first via META: DESCRIBE / SEARCH.

Safe parameterization:
- Prefer 'parameters' over string interpolation.
- Placeholders start with ':' and MUST occupy a complete KIP value position (for example: name: :name, LIMIT :limit, or SEARCH CONCEPT :term).

Update semantics:
- SET ATTRIBUTES overwrites each specified key (arrays/objects are replaced, not merged).
- SET PROPOSITIONS is additive (creates/updates links).

Safety:
- Never store secrets/credentials or one-time tokens in KIP.`,
    inputSchema: ExecuteKipInputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (input: ExecuteKipInput, _extra) => {
    const output = await executeKipOverHttp(input, clientOptions())
    return toToolResult(output)
  }
)

server.registerTool(
  'execute_kip_readonly',
  {
    title: 'Execute KIP Commands (read-only)',
    description: `Execute safe, read-only KIP commands against a Cognitive Nexus backend.

Prefer this tool over 'execute_kip' whenever you only need to retrieve knowledge and will not modify the graph. Only read-only commands are valid here: KQL FIND and META DESCRIBE / SEARCH / EXPORT. Any KML write (UPSERT / UPDATE / MERGE / DELETE) will be rejected by the backend.

The input shape and parameterization rules are identical to 'execute_kip' (provide exactly one of 'command' or 'commands'; use 'parameters' for safe placeholder substitution).

If you are unsure about schema/types/predicates, discover first via META: DESCRIBE / SEARCH.`,
    inputSchema: ExecuteKipInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (input: ExecuteKipInput, _extra) => {
    const output = await executeKipReadonlyOverHttp(input, clientOptions())
    return toToolResult(output)
  }
)

server.registerTool(
  'list_logs',
  {
    title: 'List KIP Logs',
    description:
      'List log entries from the KIP backend (if supported). Use this to debug failed executions or inspect recent activity.',
    inputSchema: ListLogsInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (input, _extra) => {
    const output = await listLogs(input, clientOptions())
    return toToolResult(output)
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
