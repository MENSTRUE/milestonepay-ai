# MilestonePay AI — Devpost submission draft

## Tagline
AI-assisted milestone commerce for freelancers: clearer agreements, evidence-driven reviews, and verified PayPal Sandbox invoices.

## Inspiration
Freelancers and clients often disagree about scope, what counts as completed work, and when payment is due. MilestonePay AI brings those decisions into one transparent workflow.

## What it does
A test client (Ahmad) creates a request. A test freelancer (Fulan) submits a proposal and milestone plan. Both parties confirm the agreement. The freelancer submits written evidence; a local Ollama model reviews the text against acceptance criteria and identifies what remains unverified. The client makes the final approval decision. For approved milestones, the freelancer creates and sends a PayPal Sandbox invoice, and the application reads the authoritative status back from PayPal. An off-chain SHA-256 audit trail records key events.

## How we built it
- Frontend: React, TypeScript, Vite with bilingual Indonesian/English interface.
- Backend: FastAPI, Pydantic, and SQLite for persistent requests, proposals, agreements, milestones, invoices, and audit records.
- AI: local Ollama (Qwen2.5 3B) with schema-constrained outputs and budget validation.
- Payments: PayPal Sandbox OAuth + Invoicing v2, using server-side credentials and explicit status verification.
- Evidence review is **advisory**; human approval is mandatory.

## Highlights
- End-to-end proof of a **virtual** $450 invoice reaching `PAID` after Sandbox checkout and API sync.
- Locally running AI without paid API credits.
- Stable invoice history across refresh, backed by SQLite.
- Bilingual guided user experience and two test personas.

## Challenges
Keeping a stateful user experience aligned with persistent backend records, validating small-model structured output, and integrating PayPal Sandbox without confusing invoice creation, sending, and actual payment status.

## What we learned
Payment integrity requires clear boundaries between AI suggestions, human approval, invoice issuance, and PayPal-confirmed status. Small LLMs must be validated against deterministic business rules.

## What's next
Production-grade authentication, multi-tenant permissions, deployed backend, webhook reconciliation, actual deliverable attachments with authenticated verification, and accessible localization across all screens.

## Important limitations
This is a **local prototype and PayPal Sandbox demonstration**, not a production payment platform. `X-Demo-Actor` is NOT authentication. No real money is transferred, there is no escrow, and the SHA-256 audit chain is off-chain. AI does not independently inspect attached files unless explicitly implemented.

## Submission fields to fill manually
- Public repository: https://github.com/MENSTRUE/milestonepay-ai
- Public demo URL: [only if actually deployed]
- YouTube URL (public, under 3 minutes): [record and upload]
- Screenshots: [attach original captured screenshots]
- License: [confirm repository LICENSE]
- Sponsor-specific claims: [only list integrations actually active and demonstrated]
