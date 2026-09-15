import { ExecuteKipInput, ListLogsInput } from '../schemas/executeKip.js'

export type KipClientOptions = {
  baseUrl: string
  apiKey?: string
  authHeader?: string
  timeoutMs?: number
}

function getHeaders(opts: KipClientOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json'
  }

  if (opts.authHeader) {
    headers.authorization = opts.authHeader
  } else if (opts.apiKey) {
    headers.authorization = `Bearer ${opts.apiKey}`
  }

  return headers
}

/**
 * POST a `{ method, params }` JSON-RPC-style request to the KIP backend and
 * return the parsed response. Shared by every tool so timeout, auth, and
 * error handling stay consistent.
 */
async function postToBackend(
  method: string,
  params: unknown,
  opts: KipClientOptions
): Promise<unknown> {
  const timeoutMs = opts.timeoutMs ?? 30_000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(opts.baseUrl, {
      method: 'POST',
      headers: getHeaders(opts),
      body: JSON.stringify({ method, params }),
      signal: controller.signal
    })

    const text = await res.text()

    if (!res.ok) {
      let details = text
      try {
        details = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        // keep raw text
      }
      throw new Error(
        `KIP backend request failed (HTTP ${res.status} ${res.statusText}).\n` +
          `URL: ${opts.baseUrl}\n` +
          `Response: ${details}`
      )
    }

    if (!text) return {}

    try {
      return JSON.parse(text)
    } catch {
      return { raw: text }
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function executeKipOverHttp(
  input: ExecuteKipInput,
  opts: KipClientOptions
): Promise<unknown> {
  return postToBackend('execute_kip', input, opts)
}

export function executeKipReadonlyOverHttp(
  input: ExecuteKipInput,
  opts: KipClientOptions
): Promise<unknown> {
  return postToBackend('execute_kip_readonly', input, opts)
}

export function listLogs(
  input: ListLogsInput,
  opts: KipClientOptions
): Promise<unknown> {
  return postToBackend('list_logs', input, opts)
}
