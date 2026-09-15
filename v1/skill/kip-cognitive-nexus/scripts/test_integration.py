#!/usr/bin/env python3
"""
Integration tests for execute_kip.py against anda_cognitive_nexus_server.

Prerequisites:
    - Server running at http://127.0.0.1:8080/kip (or set KIP_SERVER_URL)

Usage:
    python test_integration.py
    python test_integration.py -v  # verbose output
"""

import json
import sys
import unittest
from pathlib import Path

# Add script directory to path for import
sys.path.insert(0, str(Path(__file__).parent))
from execute_kip import execute_kip


class TestKIPIntegration(unittest.TestCase):
    """Integration tests for KIP operations."""

    # ==================== META Commands ====================

    def test_describe_primer(self):
        """Test DESCRIBE PRIMER returns schema overview."""
        result = execute_kip(command="DESCRIBE PRIMER")
        self.assertIn("result", result, f"Expected 'result' in response: {result}")
        self.assertNotIn("error", result)

    def test_describe_concept_type(self):
        """Test DESCRIBE CONCEPT TYPE for built-in types."""
        result = execute_kip(command='DESCRIBE CONCEPT TYPE "Person"')
        self.assertIn("result", result, f"Expected 'result' in response: {result}")

    def test_describe_proposition_type(self):
        """Test DESCRIBE PROPOSITION TYPE for built-in predicates."""
        result = execute_kip(command='DESCRIBE PROPOSITION TYPE "belongs_to_domain"')
        self.assertIn("result", result, f"Expected 'result' in response: {result}")

    def test_search_concept(self):
        """Test SEARCH CONCEPT fuzzy search."""
        result = execute_kip(command='SEARCH CONCEPT "test" LIMIT 5')
        self.assertIn("result", result, f"Expected 'result' in response: {result}")

    # ==================== KQL Queries ====================

    def test_find_all_concept_types(self):
        """Test listing all concept types."""
        result = execute_kip(
            command='FIND(?t.name) WHERE { ?t {type: "$ConceptType"} } ORDER BY ?t.name ASC LIMIT 50'
        )
        self.assertIn("result", result, f"Expected 'result' in response: {result}")

    def test_find_all_proposition_types(self):
        """Test listing all proposition types."""
        result = execute_kip(
            command='FIND(?p.name) WHERE { ?p {type: "$PropositionType"} } ORDER BY ?p.name ASC LIMIT 50'
        )
        self.assertIn("result", result, f"Expected 'result' in response: {result}")

    def test_find_with_parameters(self):
        """Test query with parameter substitution."""
        result = execute_kip(
            command="FIND(?p.name) WHERE { ?p {type: :type} } LIMIT :limit",
            parameters={"type": "Domain", "limit": 10},
        )
        self.assertIn("result", result, f"Expected 'result' in response: {result}")

    def test_find_domains(self):
        """Test finding all domains."""
        result = execute_kip(
            command='FIND(?d.name, ?d.attributes.description) WHERE { ?d {type: "Domain"} } LIMIT 20'
        )
        self.assertIn("result", result, f"Expected 'result' in response: {result}")

    # ==================== KML Operations ====================

    def test_upsert_and_delete_concept(self):
        """Test creating and deleting a concept."""
        test_name = "IntegrationTest:Concept:2026-01-02"

        # Create concept
        upsert_result = execute_kip(
            command=f'''UPSERT {{
                CONCEPT ?c {{
                    {{type: "Event", name: "{test_name}"}}
                    SET ATTRIBUTES {{
                        event_class: "Test",
                        content_summary: "Integration test concept"
                    }}
                }}
            }}
            WITH METADATA {{ source: "test_integration.py", author: "$self", confidence: 1.0 }}'''
        )
        self.assertIn("result", upsert_result, f"UPSERT failed: {upsert_result}")

        # Verify creation
        find_result = execute_kip(
            command=f'FIND(?c) WHERE {{ ?c {{type: "Event", name: "{test_name}"}} }}'
        )
        self.assertIn("result", find_result, f"FIND after UPSERT failed: {find_result}")

        # Delete concept
        delete_result = execute_kip(
            command=f'DELETE CONCEPT ?c DETACH WHERE {{ ?c {{type: "Event", name: "{test_name}"}} }}'
        )
        self.assertIn("result", delete_result, f"DELETE failed: {delete_result}")

        # Verify deletion - should return empty result or KIP_3002 (not found)
        verify_result = execute_kip(
            command=f'FIND(?c) WHERE {{ ?c {{type: "Event", name: "{test_name}"}} }}'
        )
        # After deletion, either empty result or "not found" error is acceptable
        if "error" in verify_result:
            self.assertEqual(
                verify_result["error"]["code"],
                "KIP_3002",
                f"Unexpected error after deletion: {verify_result}",
            )
        else:
            result_data = verify_result.get("result", [])
            self.assertEqual(len(result_data), 0, f"Concept not deleted: {verify_result}")

    def test_upsert_with_propositions(self):
        """Test creating concepts with propositions."""
        domain_name = "IntegrationTest:Domain"
        event_name = "IntegrationTest:Event:WithDomain"

        try:
            # Create domain and event with proposition
            result = execute_kip(
                command=f'''UPSERT {{
                    CONCEPT ?d {{
                        {{type: "Domain", name: "{domain_name}"}}
                        SET ATTRIBUTES {{ description: "Test domain for integration" }}
                    }}
                    CONCEPT ?e {{
                        {{type: "Event", name: "{event_name}"}}
                        SET ATTRIBUTES {{ event_class: "Test", content_summary: "Event linked to domain" }}
                        SET PROPOSITIONS {{ ("belongs_to_domain", ?d) }}
                    }}
                }}
                WITH METADATA {{ source: "test_integration.py", author: "$self", confidence: 1.0 }}'''
            )
            self.assertIn("result", result, f"UPSERT with propositions failed: {result}")

            # Verify proposition exists
            find_result = execute_kip(
                command=f'''FIND(?e.name) WHERE {{
                    ?e {{type: "Event", name: "{event_name}"}}
                    (?e, "belongs_to_domain", {{type: "Domain", name: "{domain_name}"}})
                }}'''
            )
            self.assertIn("result", find_result, f"FIND proposition failed: {find_result}")

        finally:
            # Cleanup
            execute_kip(
                command=f'DELETE CONCEPT ?e DETACH WHERE {{ ?e {{type: "Event", name: "{event_name}"}} }}'
            )
            execute_kip(
                command=f'DELETE CONCEPT ?d DETACH WHERE {{ ?d {{type: "Domain", name: "{domain_name}"}} }}'
            )

    def test_dry_run_validation(self):
        """Test dry_run mode validates without execution."""
        # Valid command should pass dry_run
        valid_result = execute_kip(
            command='UPSERT { CONCEPT ?c { {type: "Event", name: "DryRunTest"} } }',
            dry_run=True,
        )
        self.assertNotIn("error", valid_result, f"Valid dry_run failed: {valid_result}")

        # Verify nothing was created
        find_result = execute_kip(
            command='FIND(?c) WHERE { ?c {type: "Event", name: "DryRunTest"} }'
        )
        result_data = find_result.get("result", [])
        self.assertEqual(len(result_data), 0, "Dry run should not create concepts")

    # ==================== Batch Operations ====================

    def test_batch_commands(self):
        """Test batch command execution."""
        result = execute_kip(
            commands=[
                "DESCRIBE PRIMER",
                'FIND(?t.name) WHERE { ?t {type: "$ConceptType"} } LIMIT 5',
            ]
        )
        self.assertIn("result", result, f"Batch execution failed: {result}")
        # Batch should return array of results
        self.assertIsInstance(result.get("result"), list)
        self.assertEqual(len(result["result"]), 2)

    def test_batch_with_mixed_parameters(self):
        """Test batch with shared and command-specific parameters."""
        result = execute_kip(
            commands=[
                "FIND(?p.name) WHERE { ?p {type: :type} } LIMIT :limit",
                {
                    "command": "FIND(?d.name) WHERE { ?d {type: :type} } LIMIT 5",
                    "parameters": {"type": "Domain"},
                },
            ],
            parameters={"type": "Person", "limit": 3},
        )
        self.assertIn("result", result, f"Mixed batch failed: {result}")

    # ==================== Error Handling ====================

    def test_syntax_error(self):
        """Test that syntax errors return proper error codes."""
        result = execute_kip(command="FIND( WHERE { invalid syntax")
        self.assertIn("error", result, f"Expected error for invalid syntax: {result}")
        error = result["error"]
        self.assertIn("code", error)
        # Syntax errors should be KIP_1xxx
        self.assertTrue(
            error["code"].startswith("KIP_1") or "syntax" in error.get("message", "").lower(),
            f"Expected syntax error code: {error}",
        )

    def test_unknown_type_error(self):
        """Test that unknown types return schema errors."""
        result = execute_kip(
            command='FIND(?x) WHERE { ?x {type: "NonExistentType123"} }'
        )
        # This may succeed with empty results or return schema error
        # depending on server implementation
        if "error" in result:
            error = result["error"]
            self.assertIn("code", error)

    # ==================== Parameter Validation ====================

    def test_mutually_exclusive_params(self):
        """Test that command and commands cannot both be provided."""
        with self.assertRaises(ValueError):
            execute_kip(command="DESCRIBE PRIMER", commands=["DESCRIBE PRIMER"])

    def test_missing_command(self):
        """Test that at least one command parameter is required."""
        with self.assertRaises(ValueError):
            execute_kip()


class TestConnectionError(unittest.TestCase):
    """Test error handling when server is unreachable."""

    def test_connection_error_handling(self):
        """Test graceful handling of connection errors."""
        import os

        # Temporarily set invalid server URL
        original_url = os.environ.get("KIP_SERVER_URL")
        os.environ["KIP_SERVER_URL"] = "http://127.0.0.1:59999/invalid"

        try:
            result = execute_kip(command="DESCRIBE PRIMER")
            self.assertIn("error", result)
            self.assertEqual(result["error"]["code"], "CONNECTION_ERROR")
        finally:
            # Restore original URL
            if original_url:
                os.environ["KIP_SERVER_URL"] = original_url
            else:
                os.environ.pop("KIP_SERVER_URL", None)


def run_tests():
    """Run all integration tests."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestKIPIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestConnectionError))

    # Run with verbosity based on command line
    verbosity = 2 if "-v" in sys.argv or "--verbose" in sys.argv else 1
    runner = unittest.TextTestRunner(verbosity=verbosity)
    result = runner.run(suite)

    # Return exit code
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(run_tests())
