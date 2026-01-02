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

export async function executeKipOverHttp(
  input: ExecuteKipInput,
  opts: KipClientOptions
): Promise<unknown> {
  const timeoutMs = opts.timeoutMs ?? 30_000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(opts.baseUrl, {
      method: 'POST',
      headers: getHeaders(opts),
      body: JSON.stringify({
        method: 'execute_kip',
        params: input
      }),
      signal: controller.signal
    })

    const text = await res.text()

    if (!res.ok) {
      const maybeJson = (() => {
        try {
          return JSON.parse(text)
        } catch {
          return undefined
        }
      })()

      const details = maybeJson ? JSON.stringify(maybeJson, null, 2) : text
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

export async function listLogs(
  input: ListLogsInput,
  opts: KipClientOptions
): Promise<unknown> {
  const timeoutMs = opts.timeoutMs ?? 30_000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(opts.baseUrl, {
      method: 'POST',
      headers: getHeaders(opts),
      body: JSON.stringify({
        method: 'list_logs',
        params: input
      }),
      signal: controller.signal
    })

    const text = await res.text()

    if (!res.ok) {
      const maybeJson = (() => {
        try {
          return JSON.parse(text)
        } catch {
          return undefined
        }
      })()

      const details = maybeJson ? JSON.stringify(maybeJson, null, 2) : text
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
