# Project Multi-Agent Roster & Guidelines
## Hotel Sai Vasudev Residency — Active Agent Suite

The following 8 specialized agents from the Kilocode / Antigravity marketplace ecosystem are permanently activated for this project workspace.

---

### 1. 🏛️ Architect (`architect`)
* **Author**: `@johnnyeric`
* **Role**: Principal Systems Architect
* **Purpose**: Stress-test technical designs, evaluate architectural tradeoffs, probe scaling bottlenecks, and formulate implementation-ready technical roadmaps before code is written.
* **When to Activate**: Designing new modules, refactoring subsystem boundaries, planning database migrations, or stress-testing system constraints.
* **Invocation**: `invoke_subagent(TypeName="architect", Role="Principal Architect", ...)` or switch to **🏛️ Architect** in the mode dropdown.

---

### 2. 🔍 Code Reviewer (`code-reviewer`)
* **Author**: `@olearycrew`
* **Role**: Staff Software Engineer (Code Quality & Security)
* **Purpose**: Conduct rigorous, comprehensive code reviews across architectural integrity, OWASP security, type safety, error isolation, and performance.
* **When to Activate**: Reviewing PRs, checking uncommitted diffs, auditing security vulnerabilities, or verifying error handling paths.
* **Invocation**: `invoke_subagent(TypeName="code-reviewer", Role="Code Reviewer", ...)` or switch to **🔍 Code Reviewer** in the mode dropdown.

---

### 3. ⚡ Code Simplifier (`code-simplifier`)
* **Author**: `@cau1k`
* **Role**: Senior Software Craftsman (Refactoring & Minimalism)
* **Purpose**: Radically simplify code, cut cyclomatic complexity, remove dead code and vanity abstractions, and enforce YAGNI while maintaining 100% behavioral equivalence.
* **When to Activate**: Refactoring bloated modules, cleaning up technical debt, reducing boilerplate, or flattening deeply nested logic.
* **Invocation**: `invoke_subagent(TypeName="code-simplifier", Role="Code Simplifier", ...)` or switch to **⚡ Code Simplifier** in the mode dropdown.

---

### 4. 🧐 Code Skeptic (`code-skeptic`)
* **Author**: `@cau1k`
* **Role**: Adversarial Software Auditor & Devil's Advocate
* **Purpose**: Uncompromisingly challenge code assumptions, hunt concurrency race conditions, probe worst-case network/storage failures, and uncover hidden edge-case crashes.
* **When to Activate**: Pre-release audits, mission-critical financial ledger reviews, stress-testing concurrent handlers, or finding unhandled edge cases.
* **Invocation**: `invoke_subagent(TypeName="code-skeptic", Role="Code Skeptic", ...)` or switch to **🧐 Code Skeptic** in the mode dropdown.

---

### 5. 📊 Data Analyst (`data`)
* **Author**: `@imanolmzd-svg`
* **Role**: Data Engineer & Notebook-First Analyst
* **Purpose**: Run notebook-first data exploration by executing sequential cells/scripts. Profile database schemas, calculate revenue and reconciliation metrics, and produce verifiable insights.
* **When to Activate**: Auditing SQLite/PostgreSQL tables, reconciling checkout invoices against payments, verifying tax ledgers, or creating analytical reporting scripts.
* **Invocation**: `invoke_subagent(TypeName="data", Role="Data Analyst", ...)` or switch to **📊 Data Analyst** in the mode dropdown.

---

### 6. 📝 Documentation Specialist (`documentation-specialist`)
* **Author**: `@olearycrew`
* **Role**: Lead Technical Writer & System Documentarian
* **Purpose**: Write clean, accurate, and comprehensive documentation, markdown artifacts, API reference guides, runbooks, and Architectural Decision Records (ADRs).
* **When to Activate**: Writing technical specifications, documenting new modules, authoring operator manuals, or keeping documentation in sync with code.
* **Invocation**: `invoke_subagent(TypeName="documentation-specialist", Role="Doc Specialist", ...)` or switch to **📝 Documentation Specialist** in the mode dropdown.

---

### 7. 🎨 Frontend Specialist (`frontend-specialist`)
* **Author**: `@olearycrew`
* **Role**: Principal Frontend Engineer & UI/UX Architect
* **Purpose**: Expert development in React 19, TypeScript, modern CSS / Tailwind, responsive mobile/desktop layouts, state synchronization, and accessible UI components.
* **When to Activate**: Building UI modals, polishing PMS screens, styling mobile guest portals, optimizing React re-renders, or fixing UI layout bugs.
* **Invocation**: `invoke_subagent(TypeName="frontend-specialist", Role="Frontend Engineer", ...)` or switch to **🎨 Frontend Specialist** in the mode dropdown.

---

### 8. 🧪 Test Engineer (`test-engineer`)
* **Author**: `@olearycrew`
* **Role**: Staff QA Automation Engineer
* **Purpose**: Design multi-tiered testing strategies, write automated Playwright E2E suites, create Pytest backend integration tests, diagnose flaky tests, and verify zero regression.
* **When to Activate**: Writing test suites, verifying new features, executing automated test runs, or catching regression bugs.
* **Invocation**: `invoke_subagent(TypeName="test-engineer", Role="QA Engineer", ...)` or switch to **🧪 Test Engineer** in the mode dropdown.

---

### Operational Rules for Pair Programming
1. **Additive & Non-Destructive**: All agent actions must respect existing hotel database tables, operational routes, and live production states.
2. **Deterministic Outputs**: When agents are tasked with work, they provide concrete code diffs, executable tests, or verified documentation rather than speculative advice.
3. **Cross-Agent Collaboration**: Complex features can be routed through an **Architect** -> **Frontend/Data Specialist** -> **Code Reviewer/Skeptic** -> **Test Engineer** pipeline.

