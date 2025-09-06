Comprehensive Integration Plan: Temporal + TextMorphDropdown

Status legend: [ ] pending  [~] in progress  [x] done  [!] blocked

Phase 1 — Setup & Dependencies
- [x] Scaffold Temporal directories and types (temporal/*)
- [x] Add Temporal SDK deps to package.json
- [x] Add TextMorph component (components/motion-ui/text-morph.tsx)
- [x] Add TextMorphDropdown (components/model-selector/TextMorphDropdown.tsx)

Phase 2 — Core Temporal Integration
- [x] Temporal client manager (temporal/client/temporal-client.ts)
- [x] Chat workflow with signals/queries (temporal/workflows/chat-workflow.ts)
- [x] Activity shims (temporal/activities/*)
- [x] Chat worker bootstrap (temporal/workers/chat-worker.ts)

Phase 3 — Model Selector Integration
- [x] Add hook to bridge UI → API (hooks/useTemporalChat.ts)
- [x] Optional env flag to enable new dropdown (components/model-selector.tsx)
- [x] Replace legacy selector across app (behind feature flag rollout)

Phase 4 — API Endpoints
- [x] POST /api/temporal/update-model (signals updateModel)
- [x] POST /api/temporal/start-chat (start workflow, return workflowId)

Phase 5 — Tool Enhancements (initial pass)
- [x] Create tool activity stubs (web_search, image_generation, document_analysis, code_execution)
- [x] Map stubs to existing implementations under lib/ai/tools/*

Phase 6 — Tests & Validation
- [x] Unit tests for chat workflow (Temporal test env)
- [ ] Component tests for TextMorphDropdown
- [~] Capy tool chain tests (temporal/__tests__/capy-tool-integration.test.ts)
    - Skipped by default; blocked in CI until Temporal test env is stabilized

Phase 7 — Deployment & Ops
- [x] Script to run worker (npm/bun script)
- [x] Temporal config and env docs

Phase 8 — Capy.ai Tool Registry & Protocol
- [x] TemporalToolRegistry with categories and approvals
- [x] Capy tool activities stub (executeCapyTool)
- [x] Tool chain workflow with approvals and handoff
- [x] Sub-agent orchestration + readAgent child workflow
- [x] Context management workflow with thresholds & handoff
- [x] Approval workflow (signals, queries, timeouts)
- [x] EnhancedTextMorphDropdown (feature flagged)
- [x] API routes to bridge approvals/signals from UI

Notes
- Client-only code never imports Temporal SDK (Node-only). All Temporal usage is via API routes.
- Existing model selector remains default. Enable new dropdown via NEXT_PUBLIC_USE_TEXTMORPH_SELECTOR=true.
- Tool activities are placeholders; wire to existing tool flows incrementally.
