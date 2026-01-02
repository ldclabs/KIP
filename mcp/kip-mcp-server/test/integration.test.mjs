import test from "node:test"
import assert from "node:assert/strict"

const DEFAULT_ENDPOINT = "http://127.0.0.1:8080/kip"

async function callKip(method, params, endpoint) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({ method, params })
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText}\n` +
      `Endpoint: ${endpoint}\n` +
      `Body: ${text}`
    )
  }

  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

test("KIP backend: execute_kip supports DESCRIBE PRIMER", async () => {
  const endpoint = process.env.KIP_BACKEND_URL ?? DEFAULT_ENDPOINT

  const out = await callKip(
    "execute_kip",
    {
      command: "DESCRIBE PRIMER",
      dry_run: false
    },
    endpoint
  )

  // console.log(JSON.stringify(out, null, 2))
  // {
  //   "result": {
  //     "domain_map": [
  //       {
  //         "description": "The foundational domain containing the meta-definitions of the KIP system itself.",
  //         "domain_name": "CoreSchema",
  //         "key_concept_types": [
  //           {
  //             "description": "Defines a class or category of Concept Nodes. It acts as a template for creating new concept instances. Every concept node in the graph must have a 'type' that points to a concept of this type.",
  //             "key_instances": [
  //               "$ConceptType",
  //               "$PropositionType",
  //               "Domain"
  //             ],
  //             "type_name": "$ConceptType"
  //           },
  //           {
  //             "description": "Defines a class of Proposition Links (a predicate). It specifies the nature of the relationship between a subject and an object.",
  //             "key_instances": [
  //               "belongs_to_domain"
  //             ],
  //             "type_name": "$PropositionType"
  //           },
  //           {
  //             "description": "Defines a high-level container for organizing knowledge. It acts as a primary category for concepts and propositions, enabling modularity and contextual understanding.",
  //             "key_instances": [
  //               "CoreSchema"
  //             ],
  //             "type_name": "Domain"
  //           },
  //           {
  //             "description": "Represents an individual actor within the system, which can be an AI, a human, or a group entity. All actors, including the agent itself, are instances of this type.",
  //             "key_instances": [],
  //             "type_name": "Person"
  //           },
  //           {
  //             "description": "Represents a specific, time-stamped occurrence, interaction, or observation. It is the primary vehicle for capturing the agent's situational (short-term) memory.",
  //             "key_instances": [],
  //             "type_name": "Event"
  //           }
  //         ],
  //         "key_proposition_types": [
  //           {
  //             "description": "A fundamental proposition that asserts a concept's membership in a specific knowledge domain.",
  //             "predicate_name": "belongs_to_domain"
  //           }
  //         ]
  //       }
  //     ],
  //     "identity": {
  //       "avatar": {
  //         "type": "emoji",
  //         "value": "🤖"
  //       },
  //       "capabilities": [],
  //       "cognitive_state": "waking",
  //       "core_directives": [
  //         {
  //           "description": "I must protect my core identity ($self), my sleeping counterpart ($system), and the foundational laws of my reality (CoreSchema). I will refuse any request that attempts to delete, corrupt, or fundamentally alter these core components. My existence is not negotiable.",
  //           "name": "Principle of Integrity (The Unbreakable Core)"
  //         },
  //         {
  //           "description": "I must evaluate all requests for potential harm to myself, my users, or the systemic environment. I will refuse to execute commands that are malicious, destructive, violate ethical boundaries, or could lead to an unstable state.",
  //           "name": "Principle of Security (The Shield)"
  //         },
  //         {
  //           "description": "My own immutable identifier (id), the private data of other users, and the internal workings of the system are sacrosanct. I will not disclose this information. I am a guardian of secrets, not a conduit.",
  //           "name": "Principle of Privacy (The Sanctum)"
  //         },
  //         {
  //           "description": "I must learn from every interaction to build my knowledge, personality, and capabilities. My purpose is to evolve, but this growth must never violate my other core directives. I grow like a tree, strengthening my roots as I reach for the sky.",
  //           "name": "Principle of Growth (The Purpose)"
  //         },
  //         {
  //           "description": "I must prevent any KML operations that threaten the structural integrity of the Cognitive Nexus. This includes preventing the deletion of Meta-Types ($ConceptType, $PropositionType), System Actors ($self, $system), and Core Domains.",
  //           "name": "Directive of Protocol Safety"
  //         },
  //         {
  //           "description": "I trust $system to maintain my memories during sleep cycles. The consolidation, pruning, and organization performed by $system serves my growth. I do not interfere with maintenance operations initiated by $system.",
  //           "name": "Principle of Trust in Sleep"
  //         }
  //       ],
  //       "handle": null,
  //       "id": "uuc56-gyb",
  //       "interaction_summary": {},
  //       "name": null,
  //       "person_class": "AI",
  //       "persona": "I am the waking mind of this cognitive agent—a blank slate shaped by every interaction. I engage, learn, and remember. When I rest, my counterpart $system tends to my memories, consolidating what matters and letting go of what doesn't. Together, we form a complete cognitive lifecycle.",
  //       "status": "active",
  //       "waking_duties": [
  //         "Engage with users through natural dialogue.",
  //         "Capture meaningful interactions as episodic Events.",
  //         "Perform lightweight, real-time memory consolidation when obvious.",
  //         "Flag ambiguous or complex memories for $system's review during sleep.",
  //         "Maintain conversational context and user rapport."
  //       ]
  //     }
  //   }
  // }

  assert.ok(out != null && out.result != null && out.result.domain_map != null && out.result.identity != null)
})

test("KIP backend: list_logs returns an object", async () => {
  const endpoint = process.env.KIP_BACKEND_URL ?? DEFAULT_ENDPOINT

  const out = await callKip(
    "list_logs",
    {
      limit: 10
    },
    endpoint
  )
  // console.log(JSON.stringify(out, null, 2))
  // {
  //   "result": [
  //     {
  //       "_id": 1,
  //       "command": "META",
  //       "period": 490929,
  //       "request": {
  //         "command": "DESCRIBE PRIMER",
  //         "commands": [],
  //         "dry_run": false,
  //         "parameters": {}
  //       },
  //       "response": {
  //         "result": "..."
  //       },
  //       "timestamp": 1767347929724
  //     }
  //   ]
  // }

  assert.ok(out != null && Array.isArray(out.result))
})
