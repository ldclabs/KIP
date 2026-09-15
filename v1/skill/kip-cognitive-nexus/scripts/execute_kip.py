#!/usr/bin/env python3
"""
execute_kip.py - KIP (Knowledge Interaction Protocol) client for anda_cognitive_nexus_server.

This script provides a command-line interface to execute KIP commands (KQL/KML/META)
against the Cognitive Nexus server.

Usage:
    # Single command
    python execute_kip.py --command 'DESCRIBE PRIMER'

    # With parameters
    python execute_kip.py --command 'FIND(?p) WHERE { ?p {type: :type} } LIMIT :limit' \
                          --params '{"type": "Person", "limit": 5}'

    # Batch commands
    python execute_kip.py --commands '["DESCRIBE PRIMER", "FIND(?t.name) WHERE { ?t {type: \"$ConceptType\"} }"]'

    # Dry run (validation only)
    python execute_kip.py --command 'DELETE CONCEPT ?n DETACH WHERE {...}' --dry-run

Environment Variables:
    KIP_SERVER_URL: Server endpoint (default: http://127.0.0.1:8080/kip)
    KIP_API_KEY: Optional Bearer token for authentication
"""

import argparse
import json
import os
import sys
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# Configuration
DEFAULT_SERVER_URL = "http://127.0.0.1:8080/kip"
TIMEOUT_SECONDS = 30


def get_server_url() -> str:
    """Get the KIP server URL from environment or default."""
    return os.environ.get("KIP_SERVER_URL", DEFAULT_SERVER_URL)


def get_api_key() -> str | None:
    """Get the optional API key from environment."""
    return os.environ.get("KIP_API_KEY")


def execute_kip(
    command: str | None = None,
    commands: list[str | dict] | None = None,
    parameters: dict[str, Any] | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    """
    Execute a KIP request against the Cognitive Nexus server.

    Args:
        command: Single KIP command (mutually exclusive with commands)
        commands: Batch of commands for sequential execution
        parameters: Key-value pairs for placeholder substitution (:name → value)
        dry_run: If True, validate only without execution

    Returns:
        Response dict with 'result' or 'error' key

    Raises:
        ValueError: If neither command nor commands is provided
        HTTPError: If the server returns an error status
        URLError: If the server is unreachable
    """
    if command is None and commands is None:
        raise ValueError("Either 'command' or 'commands' must be provided")
    if command is not None and commands is not None:
        raise ValueError("'command' and 'commands' are mutually exclusive")

    # Build request payload
    payload: dict[str, Any] = {
        "method": "execute_kip",
        "params": {},
    }

    if command is not None:
        payload["params"]["command"] = command
    if commands is not None:
        payload["params"]["commands"] = commands
    if parameters:
        payload["params"]["parameters"] = parameters
    if dry_run:
        payload["params"]["dry_run"] = True

    # Prepare HTTP request
    server_url = get_server_url()
    headers = {"Content-Type": "application/json"}

    api_key = get_api_key()
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request_data = json.dumps(payload).encode("utf-8")
    req = Request(server_url, data=request_data, headers=headers, method="POST")

    try:
        with urlopen(req, timeout=TIMEOUT_SECONDS) as response:
            response_body = response.read().decode("utf-8")
            return json.loads(response_body)
    except HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        try:
            return json.loads(error_body)
        except json.JSONDecodeError:
            return {"error": {"code": f"HTTP_{e.code}", "message": error_body}}
    except URLError as e:
        return {"error": {"code": "CONNECTION_ERROR", "message": str(e.reason)}}
    except json.JSONDecodeError as e:
        return {"error": {"code": "PARSE_ERROR", "message": str(e)}}


def main():
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="Execute KIP commands against anda_cognitive_nexus_server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Schema discovery
  python execute_kip.py --command 'DESCRIBE PRIMER'

  # Query with parameters
  python execute_kip.py \\
    --command 'FIND(?p.name) WHERE { ?p {type: :type} } LIMIT :limit' \\
    --params '{"type": "Person", "limit": 10}'

  # Create a concept
  python execute_kip.py --command 'UPSERT { CONCEPT ?e { {type:"Event", name:"test"} } }'

  # Batch execution
  python execute_kip.py --commands '["DESCRIBE PRIMER", "FIND(?t) WHERE { ?t {type: \\"Domain\\"} }"]'

  # Dry run validation
  python execute_kip.py --command 'DELETE CONCEPT ?n DETACH WHERE { ?n {type:"Event"} }' --dry-run

Environment:
  KIP_SERVER_URL  Server endpoint (default: http://127.0.0.1:8080/kip)
  KIP_API_KEY     Optional Bearer token for authentication
""",
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--command",
        "-c",
        type=str,
        help="Single KIP command (KQL/KML/META)",
    )
    group.add_argument(
        "--commands",
        type=str,
        help="JSON array of commands for batch execution",
    )

    parser.add_argument(
        "--params",
        "-p",
        type=str,
        help="JSON object of parameters for placeholder substitution",
    )
    parser.add_argument(
        "--dry-run",
        "-d",
        action="store_true",
        help="Validate command(s) without execution",
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="Output compact JSON (no indentation)",
    )

    args = parser.parse_args()

    # Parse parameters if provided
    parameters = None
    if args.params:
        try:
            parameters = json.loads(args.params)
            if not isinstance(parameters, dict):
                print("Error: --params must be a JSON object", file=sys.stderr)
                sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"Error parsing --params: {e}", file=sys.stderr)
            sys.exit(1)

    # Parse batch commands if provided
    commands = None
    if args.commands:
        try:
            commands = json.loads(args.commands)
            if not isinstance(commands, list):
                print("Error: --commands must be a JSON array", file=sys.stderr)
                sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"Error parsing --commands: {e}", file=sys.stderr)
            sys.exit(1)

    # Execute the request
    result = execute_kip(
        command=args.command,
        commands=commands,
        parameters=parameters,
        dry_run=args.dry_run,
    )

    # Output result
    indent = None if args.compact else 2
    print(json.dumps(result, indent=indent, ensure_ascii=False))

    # Exit with error code if request failed
    if "error" in result:
        sys.exit(1)


if __name__ == "__main__":
    main()
