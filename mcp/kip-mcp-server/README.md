# @ldclabs/kip-mcp-server

Minimal MCP server that exposes KIP (Knowledge Interaction Protocol) tools over stdio.

This server is a thin bridge:

- MCP client (Claude / VS Code / Cursor / etc) -> this package (stdio)
- this package -> your KIP backend (HTTP)

## Requirements

- Node.js >= 18

## What it provides

### Tools

- `execute_kip`: Execute one or more KIP commands against your backend. Important: clients should inject `kip_bootstrap` (or load `kip://docs/Instructions.md`) so the agent can use KIP correctly.
- `list_logs`: List backend log entries (if your backend implements it).

### Resources

This package ships documentation as MCP resources:

- `kip://docs/Instructions.md`
- `kip://docs/KIP.md`

### Prompt

- `kip_bootstrap`: Returns a ready-to-inject system prompt for KIP usage.

## Quickstart (with anda-db backend via Docker)

KIP backend implementation: https://github.com/ldclabs/anda-db/tree/main/rs/anda_cognitive_nexus_server

Start the backend:

```bash
docker run -d \
	--name anda_kip \
	-p 8080:8080 \
	-e API_KEY=your_secret_key \
	-v $(pwd)/db:/app/db \
	ghcr.io/ldclabs/anda_cognitive_nexus_server_amd64:latest \
	local --db /app/db
```

Then run this MCP server (stdio) and point it at the backend endpoint:

```bash
export KIP_BACKEND_URL="http://127.0.0.1:8080/kip"
export KIP_API_KEY="your_secret_key"

npx -y @ldclabs/kip-mcp-server
```

Notes:

- `KIP_BACKEND_URL` is a single HTTP endpoint that accepts a JSON body like `{ "method": "execute_kip", "params": ... }`.
- The example URL `/kip` depends on your backend	route. If unsure, check backend docs/logs and update the URL accordingly.
- Backend uses `API_KEY`, this MCP server uses `KIP_API_KEY` (sent as `Authorization: Bearer <key>`).

## Install / Run

### Option A: Run via npx (recommended)

```bash
KIP_BACKEND_URL="http://127.0.0.1:8080/kip" npx -y @ldclabs/kip-mcp-server
```

### Option B: Global install

```bash
npm i -g @ldclabs/kip-mcp-server
KIP_BACKEND_URL="http://127.0.0.1:8080/kip" kip-mcp-server
```

### Option C: Run from source (development)

```bash
cd mcp/kip-mcp-server
npm i
KIP_BACKEND_URL="http://127.0.0.1:8080/kip" npm run dev
```

## Configuration

Required:

- `KIP_BACKEND_URL`: HTTP URL for the KIP backend endpoint.

Optional:

- `KIP_API_KEY`: sent as `Authorization: Bearer <key>`
- `KIP_AUTH_HEADER`: overrides the Authorization header completely (e.g. `Bearer ...` or a custom scheme)
- `KIP_TIMEOUT_MS`: request timeout in milliseconds (default `30000`)

## Using it in MCP clients

This MCP server runs over stdio, so most MCP clients can launch it with a `command`, `args`, and `env`.

### Claude Desktop

Add a server entry to Claude Desktop config (macOS path shown):

- `~/Library/Application Support/Claude/claude_desktop_config.json`

Example:

```json
{
	"mcpServers": {
		"kip": {
			"command": "npx",
			"args": ["-y", "@ldclabs/kip-mcp-server"],
			"env": {
				"KIP_BACKEND_URL": "http://127.0.0.1:8080/kip",
				"KIP_API_KEY": "your_secret_key"
			}
		}
	}
}
```

Restart Claude Desktop after editing the file.

### VS Code

VS Code itself does not ship a single built-in MCP UI across all distributions, but several MCP-capable extensions support the same stdio-style server definition.

Use your extension's UI/settings to add an MCP server:

- Command: `npx`
- Args: `-y @ldclabs/kip-mcp-server`
- Env: `KIP_BACKEND_URL`, `KIP_API_KEY` (optional)

If your extension uses a JSON setting (often named `mcpServers`), the Claude example above typically works with minimal changes.

### Other MCP apps (Cursor / etc.)

Look for a section named like “MCP Servers” / “Tools” / “Server (stdio)”.

Use the same launch parameters:

- `command`: `npx`
- `args`: `-y @ldclabs/kip-mcp-server`
- `env`: `KIP_BACKEND_URL` (+ optional auth vars)

## Bundled docs (Resources)

By default this package serves bundled docs from `docs/`.

Optional:

- `KIP_REPO_ROOT`: if set, the server will additionally try loading `Instructions.md`.
