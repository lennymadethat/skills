---
name: how-it-works
description: Generate long-form "How It Works" architectural white papers and technical explainers with system flow diagrams and brand-native styling. Use when the user says "/how-it-works", "make a white paper for X", "make a how-it-works page", "explain the architecture of X", or wants an honest, deeply technical explanation page for an engine, API, or platform.
---

# /how-it-works — Architectural White-Paper Generator

Every serious system deserves a **rigorous, long-form "How It Works" page**: real engineering explanations, data flow diagrams, and the product's native branding. Zero marketing fluff, zero buzzwords, and transparent about trade-offs.

---

## Inputs (Gather Before Writing)

1. **The Codebase Surfaces:** Read actual entrypoints, routers, data models, and config files so the explainer describes what the system *actually is*, not what was hoped for.
2. **The Product's Design System:** Extract real color tokens, typography, and dark/light modes from existing CSS so the page feels native to the product.
3. **The Core Trick:** Identify the non-obvious engineering insight that makes this build work (e.g. zero open ports, custom memory ledger, format-strict geometry checks).

---

## Section Structure

A proper *How It Works* document follows this narrative progression:

### 1. The Opening Promise
- One-line problem statement: What breaks in traditional approaches.
- The Architectural Solution: How this system solves it differently.

### 2. Concept Decomposition (3–5 Distinct Concepts)
Break the architecture into distinct, bite-sized layers. Give each its own section and diagram:
1. **Intake / Trigger:** How data enters or how jobs start.
2. **Core Transformation / The Pipeline:** State machines, queues, or agent execution loop.
3. **Storage / State Management:** How state persists across failures or restarts.
4. **Output / Delivery:** How clients receive the finished result.

### 3. Diagram Blueprint
Provide a clear system diagram for each concept (using Mermaid, SVG, or generated visual assets) adhering to:
- Real subsystem names, ports, and protocols (e.g. WebSocket, Durable Objects, SQLite, REST).
- Minimal, exact labels (avoid ambiguous arrows).
- Strict brand palette matching.

### 4. Honest Limits & Failure Modes
Never hide trade-offs. A senior engineer reading the page should respect its honesty:
- Concurrency bottlenecks or API rate limits.
- Edge cases where the pattern breaks down.
- Failure recovery behavior (e.g. replay queues vs. idempotent drops).

---

## Output Format
Generate as a clean, responsive standalone HTML page (`how-it-works.html` or `docs/architecture.html`) or Markdown white paper that integrates directly into the project repository.
