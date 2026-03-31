# A Deep Dive into Claude Code's Memory System: How Does AI "Remember" You?

> A reverse-engineering analysis of memory engineering based on Claude Code's source code. Designed for readers interested in AI—no coding experience required.

---

## Introduction: The AI's "Goldfish Memory" Dilemma

Have you ever experienced this? Every time you start a new conversation with an AI assistant, it acts like it has amnesia. It completely forgets what you said last time, what your job is, or what answering style you prefer. You find yourself repeating the same information over and over again.

This happens because Large Language Models (LLMs) are inherently "stateless"—every conversation is a brand-new beginning. They don't possess true "memory," only the context within the current chat window.

Anthropic's Claude Code (a command-line-based AI coding assistant) has designed an elegant **file-based memory system** to solve this problem. Even more fascinating is a feature it implements called **autoDream**—allowing the AI to automatically organize and consolidate memories behind the scenes, much like human dreaming during sleep.

This article will take you on a deep dive into the core principles of this system.

---

## 1. Overall Architecture: A Three-Tier Memory System

Claude Code's memory system consists of three core modules, akin to different memory regions in the human brain:

### 1. `memdir` — The Memory "Archive"

This is the infrastructure layer of the memory system. It handles:

- **Storage**: All memories are saved on your disk as Markdown files (e.g., `~/.claude/projects/<project-name>/memory/`).
- **Indexing**: Each memory directory has a `MEMORY.md` entry file acting as a catalog index (like a library's card catalog), strictly limited to 200 lines / 25KB.
- **Categorization**: Memories are strictly classified into four types.
- **Retrieval**: It uses a lightweight AI model (Claude 3.5 Sonnet) to dynamically match memories relevant to your current prompt.

### 2. `extractMemories` — The Real-Time "Stenographer"

After every round of conversation between you and the AI, the system quietly launches a "forked agent" in the background. It reviews the recent chat, extracts information worth keeping long-term, and writes it to memory files. This is entirely automated; you don't need to do a thing.

### 3. `autoDream` — The "Sleep Consolidator"

This is the most creative part. It simulates the memory consolidation process that occurs during human sleep. Periodically, the system initiates a "dream sequence" to review records from multiple recent conversations, merging, correcting, and deleting outdated memories.

Their relationship can be understood through a simple analogy:

| Module            | Analogy              | Responsibility                                              |
| :---------------- | :------------------- | :---------------------------------------------------------- |
| `memdir`          | 🏛️ Archive Room       | Provides storage, indexing, and retrieval infrastructure    |
| `extractMemories` | 📝 Stenographer       | Extracts key points after each conversation turn            |
| `autoDream`       | 🌙 Sleep Consolidator | Periodically integrates, deduplicates, corrects, and cleans |

---

## 2. Four Types of Memory: What Does the AI Remember?

The system categorizes memory contents strictly rather than hoarding everything. The four types are:

### 🧑 User Memory (`user`)
Information about "who you are." For example, your professional role, tech background, or working habits.

> Example: "The user is a data scientist currently focusing on observability and logging systems."
> Example: "The user has 10 years of Go experience but is touching React frontend for the first time."

A senior engineer and a coding beginner require completely different communication styles—this type of memory enables the AI to adapt accordingly.

### 💬 Feedback Memory (`feedback`)
Your corrections or approvals of how the AI works. This is one of the most critical memory types.

> Example: "Do not mock the database in tests—we had an incident last quarter where mock tests passed but the production migration failed."
> Example: "Do not summarize at the end of every answer; the user said they will read the diff themselves."

**Key Design:** The system records not only corrections ("don't do this") but also approvals ("yes, do it exactly like this"). If it only remembers mistakes, the AI becomes overly cautious and abandons proven strategies. Every piece of feedback must include the **Why**, allowing the AI to make flexible judgments in edge cases rather than applying rules blindly.

### 📋 Project Memory (`project`)
Dynamic information about the current project—things that cannot be deduced from the codebase or Git history.

> Example: "Code merge freeze starts on 2026-03-05 because the mobile team is cutting a release branch."
> Example: "Replacing the legacy auth middleware is driven by legal compliance requirements, not technical debt."

Notice a subtle yet brilliant detail: The system is instructed to convert relative dates (like "Thursday" or "next week") into absolute dates. Because a memory might be read weeks later, "Thursday" would become meaningless.

### 📌 Reference Memory (`reference`)
Pointers to external systems.

> Example: "Pipeline-related bugs are tracked in the Linear project 'INGEST'."
> Example: "grafana.internal/d/api-latency is the on-call latency dashboard."

### Equally Important: What NOT to Remember

The system explicitly defines what **should not** be saved:

- ❌ Code patterns, architectures, file paths—these can be fetched directly from the current codebase.
- ❌ Git history—`git log` is the authoritative source.
- ❌ Debugging steps—the fix is already in the code.
- ❌ Temporary task states—useless once the current chat ends.

Even if a user explicitly says, "Remember this list of PRs," the system is instructed to push back and ask: *"What part of this is **unexpected** or **non-obvious**? Only that part is worth keeping."*

---

## 3. Writing and Retrieving Memories

### Writing: Every Memory is a File

Each memory is an independent Markdown file with structured metadata (frontmatter):

```markdown
---
name: Database Testing Strategy
description: Integration tests must use a real database; mocking is forbidden.
type: feedback
---

Integration tests must connect to a real database and avoid mocks.

**Why:** Last quarter, behavioral differences between mocks and production
caused a migration failure that tests didn't catch.

**How to apply:** When writing data-layer tests, always configure
connections to the test database instance.
```

Simultaneously, an entry is added to the `MEMORY.md` index file:
```
- [Database Testing Strategy](feedback_testing.md) — Mocks forbidden, must use real DB
```

### Retrieval: AI Helps AI Select Memories

When a user initiates a new request, the system doesn't dump all memories into the context. Instead:

1. **Scans** the frontmatter of all memory files (filename, description, type, last modified).
2. Sends this "catalog list," along with the user's current prompt, to a lightweight AI model (Sonnet).
3. The model selects a **maximum of 5** most relevant memories.
4. Only the full text of these selected memories is read and injected into the main conversation context.

It's like asking a librarian to pick out the 5 most relevant books for your question, rather than hauling the entire library to your desk.

### Freshness Awareness: Memories "Fade"

The system calculates how many days have passed since a memory was created. Memories older than 1 day get a warning attached:

> "This memory is 47 days old. Memory is a snapshot in time, not live state—details about code behavior or file locations may be outdated. Please verify before citing as fact."

This prevents the AI from treating stale information as gospel.

---

## 4. `extractMemories`: The Silent Stenographer

After every complete Q&A turn, the `extractMemories` module runs automatically in the background. Its workflow is:

```text
1. User asks → AI answers
2. (Background) Memory extraction sub-agent boots up
3. Analyzes recent conversation content
4. Scans existing memory catalog (to prevent duplicates)
5. Updates existing files OR creates new memories
6. UI implicitly/explicitly notifies "Saved N memories"
```

A few key design choices:

- **Mutex Mechanism**: If the main AI already proactively wrote a memory during the chat (e.g., the user said "Remember this..."), the background stenographer skips this round to prevent duplication.
- **Least Privilege**: The stenographer can only read files and write *inside* the memory directory. It cannot execute write commands or modify the codebase.
- **Budget Control**: Capped at 5 back-and-forth turns to prevent infinite verification loops.
- **Efficiency First**: It parallelizes reading all potentially relevant files, then parallelizes writing—completing the task in just two steps.

---

## 5. `autoDream`: The AI's "Sleep Consolidation"

This is the most innovative part of the entire memory system.

### The Inspiration

For humans, sleep isn't just rest. During sleep, the brain performs "memory consolidation": restructuring the fragmented information acquired during the day, reinforcing what's important, discarding the useless, and resolving contradictions. Neuroscience suggests that dreams are a manifestation of this process.

Claude Code's `autoDream` is a software simulation of this exact phenomenon.

### Triggers: Three Gates

`autoDream` doesn't run constantly. It features a meticulously designed "gating" mechanism, checking conditions from lowest to highest computational cost:

#### Gate 1: Time Threshold
Has enough time passed since the last consolidation? (Default: ≥ 24 hours)
*Cost: Extremely low; just checks the modification time of a lockfile.*

#### Gate 2: Volume Threshold
Have enough conversations accumulated in this period? (Default: ≥ 5 sessions)
*Cost: Low; scans the session directory, excluding the active session.*

#### Gate 3: Lock Mechanism
Is another process already running a consolidation?
*Implementation: Writes the Process ID (PID) to a lockfile. If the process crashes (PID is dead), the system detects this and reclaims the lock. The lock times out after 1 hour to prevent deadlocks.*

Only when all three gates are passed does the "dream" truly begin.

### The Four Stages of Dreaming

Once triggered, `autoDream` executes a strict 4-stage pipeline:

#### Stage 1: Orient
- Views all existing files in the memory directory.
- Reads the `MEMORY.md` index.
- Browses existing topic files to grasp the current memory landscape.

#### Stage 2: Gather (Collect New Signals)
Looks for new, noteworthy information in recent chat logs. By priority:
1. Log files (if any).
2. Existing but potentially outdated memories (contradicting the codebase's current state).
3. Original conversation transcripts (searched via precise keywords, not read top-to-bottom).

#### Stage 3: Consolidate
This is the core work:
- **Merge**: Integrate new info into existing topic files instead of creating near-duplicates.
- **Time Correction**: Convert vague terms like "yesterday" or "last week" into exact dates.
- **Correction**: If an old memory contradicts today's reality, revise the source file directly.

#### Stage 4: Prune & Index
- Update the `MEMORY.md` index, keeping it strictly under the 200 lines / 25KB limit.
- Delete broken links to outdated or replaced memories.
- Compress bloated index entries—if a summary exceeds 200 characters, it's carrying details that belong in the topic file.
- Resolve contradictions—if two files conflict, fix the incorrect one.

### Safety & Fault Tolerance

The design of `autoDream` reflects rigorous engineering:

- **Read-Only Shell**: During a dream, the agent can only execute read-only commands (`ls`, `find`, `grep`, `cat`). Any filesystem-altering shell commands are rejected.
- **Restricted Write Scope**: It can only edit files inside the memory directory, never touching project code.
- **Crash Rollback**: If a dream fails unexpectedly, the lockfile's timestamp is reverted, ensuring it can trigger normally next time.
- **User Cancellable**: Users can terminate the dream process anytime via the background task panel.
- **Scan Throttling**: Even if the time gate is passed, if the session directory was scanned within the last 10 minutes, it won't scan again.
- **Visible Progress**: Every step of the dream updates the task panel, so users see exactly what the AI is thinking and modifying.

---

## 6. The Memory Security Perimeter

Because the memory system involves file I/O, security is paramount. The codebase reveals multiple layers of defense:

### Path Security
- **Anti-Path Traversal**: Blocks `../`, URL-encoded `%2e%2e%2f`, full-width Unicode trickery, etc.
- **Symlink Protection**: Resolves absolute paths before writing to prevent using symlinks to write outside the memory folder (e.g., to `~/.ssh/`).
- **Dangerous Root Bans**: Rejects writes to `/`, Windows `C:\`, and UNC network paths.

### Privilege Control
- The system distrusts path overrides from project config files (`.claude/settings.json`)—a malicious repository might use this to gain write access to sensitive local directories.
- Background agents operate with least privilege: they can read anything but write only to the memory directory.

### Sensitive Data
- The system explicitly forbids saving API keys, user credentials, or other sensitive data in team-shared memories.

---

## 7. The Philosophy of Memory "Reliability"

The most intriguing aspect of the codebase is its deep contemplation of "memory reliability." The system constantly reinforces a core philosophy:

> **"Memory saying X exists != X currently exists."**

This manifests in several ways:

1. **Verify First**: If a memory mentions a function name, `grep` to confirm it's still there before using it.
2. **Reality Wins**: If memory contradicts current code, the code is the ultimate truth, and the memory must be updated.
3. **Staleness Markers**: Memories over 1 day old are automatically flagged as "potentially outdated."
4. **Respect Forgetting**: When a user says "ignore that memory," the AI should completely drop it, avoiding passive-aggressive responses like "Although my memory says X, I will ignore it."

This reflects mature design thinking: **Memory is an auxiliary tool, not an authoritative source. It helps the AI work with better context, but it must always bow to objective reality.**

---

## 8. Conclusion: From "Goldfish Memory" to an "Experienced Partner"

Through three collaborating modules, Claude Code's memory system realizes a continuous lifecycle of cognitive evolution:

```text
Ongoing Conversation
    │
    ├── extractMemories: Real-time extraction → Writes to memory files
    │
    ├── memdir: Stores, indexes, retrieves on-demand → Injects into next chat
    │
    └── autoDream: Periodic sleep consolidation → Merges, corrects, prunes
```

Its design is full of respect for real-world complexity:

- **Precision over Volume**: Memories should be structured and maintainable, not a bloated mess.
- **Snapshots over Bibles**: Old memories aren't sacred; they are verifiable, correctable, and erasable snapshots.
- **Guardrails over Wild West**: Automation doesn't mean losing control; it requires gates, privileges, and rollbacks.
- **Active over Passive**: The AI isn't just a tape recorder; it is an active knowledge manager that reflects and organizes.

---

## 9. Extended Thoughts: What is the Ceiling for File-Based Memory?

Claude Code's memory system sets a benchmark for AI coding assistants. But as a technical teardown concludes, it's worth asking: **Can Markdown files truly serve as an AI's "long-term brain"?**

There are three structural tensions to note:

**1. More memories mean higher maintenance costs.** Every retrieval scans all frontmatters; every dream reads the index and related files. The 200-line `MEMORY.md` is a hard ceiling. Once memories hit this roof, compressing the index degrades retrieval accuracy. This is a cycle of **more files → higher cost → lower accuracy**. It is more than adequate for project-scoped memory, but trying to sustain years of cognitive history would crush it under its own weight.

**2. Files lack "relationships."** Suppose the AI separately remembers "Alice manages Project Aurora," "Aurora migrated from MySQL to PostgreSQL," and "Alice excels at DB optimization." In a human brain, these three facts instantly form a web, deducing: "Alice is the best person for an Aurora DB issue." But in Markdown, they are isolated in three files without explicit links. The AI must rely entirely on NLP to "guess" the connection. This kind of **multi-hop reasoning** along relationship chains is the blind spot of flat file structures.

**3. Conflict resolution erases evolutionary tracks.** When `autoDream` spots an outdated memory, it modifies or deletes it. It's simple and effective, but the timeline of *"We used MySQL 3 months ago and moved to PostgreSQL last week"* is lost. If someone later asks, "What shifts has our tech stack undergone?", the answer is gone.

These are not "flaws" in Claude Code—in its intended use case, these are highly pragmatic engineering trade-offs. However, they point to a deeper truth: **For AI to possess true long-term memory, the underlying data structure likely needs to evolve from "files" to "graphs."** A network woven from entities (nodes) and relationships (edges) naturally supports traversal, tracking evolutionary contradictions, and cross-event pattern extraction.

If you are interested in this direction, check out [**Anda Hippocampus**](https://github.com/ldclabs/anda-hippocampus)—an open-source project that draws inspiration from the human hippocampus, substituting Markdown files with Knowledge Graphs for AI memory consolidation. Its core philosophy is: **Consumed tokens should not simply evaporate; they should crystallize into reusable, transferable, structured cognitive assets that are not bound to any specific model.**

---

Moving from "every chat is a stranger" to "a collaborative partner who remembers you, understands you, and continuously grows"—Claude Code's memory system takes a solid, elegant step in this direction. The `autoDream` metaphor is a brilliant intersection of engineering aesthetics and cognitive science, proving one thing: **Even a machine, if it wishes to remember well, occasionally needs to "stop and think."**