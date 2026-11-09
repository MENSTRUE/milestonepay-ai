# Security & Trust / Keamanan dan Kepercayaan

## Classification

**Local hackathon demonstration, not a production financial service.**
**Demonstrasi hackathon lokal, bukan layanan keuangan produksi.**

## Existing safeguards / Perlindungan yang ada

- PayPal API secret stays on the FastAPI server. / Secret PayPal disimpan di backend.
- PayPal endpoint is hard-coded to Sandbox within `backend/app/paypal.py`. / API pembayaran dibatasi ke Sandbox.
- Requests and milestones enforce business-role checks **for demo personas**. / Ada pemeriksaan peran untuk persona uji.
- AI output is schema-validated and cannot directly approve human milestones. / Keluaran AI divalidasi, bukan persetujuan otomatis.
- Invoice `PAID` is obtained through provider sync, not entered arbitrarily by React. / Status lunas bersumber dari API PayPal.
- Audit events have off-chain SHA-256 chaining. / Ada hash chain audit off-chain.
- The existing final-readiness audit checks whether `.env` or SQLite database files are Git-tracked. / Ada audit file rahasia di Git.

## Production blockers / Penghalang rilis produksi

| Severity | Issue / Masalah | Required fix / Perbaikan |
|---|---|---|
| CRITICAL | Caller can choose `X-Demo-Actor`; login card is persona switching only | Real authentication (e.g. robust session/OIDC), server-side identity binding and tenant-scoped authorization |
| CRITICAL | PayPal Sandbox-only flow | Maintain Sandbox in demo; production payment design requires separately reviewed compliance, policy and fraud safeguards |
| HIGH | No provider webhook reconciliation/idempotent backfill verified | Signed webhook handling, event IDs, retries and reconciliation |
| HIGH | Evidence is plain text; no authenticated proof of file ownership | Private file storage, access controls, checksum and provenance tracking |
| HIGH | Local SQLite as single-node store | Migration strategy, backups, tenant isolation, locks and observability |
| HIGH | Local LLM can hallucinate evidence quality | Human gates, deterministic constraints, model-evaluation datasets, red-team testing |
| MEDIUM | Off-chain audit chain can be rewritten by administrator | Anchoring/append-only storage, key separation and independent verification |
| MEDIUM | Lack of documented rate limiting and abuse prevention | Request quotas, size limits, anomaly detection, audit logging |
| MEDIUM | Limited accessibility / localization audit | Keyboard, contrast, screen-reader and multilingual checks |

## Handling credentials / Menangani kredensial

Never:
- Commit `backend/.env`, real PayPal secrets, tokens or private buyer information.
- Include PayPal Client Secret, authorization headers or private account details in screenshots.
- Replace Sandbox API with Live endpoints for the hackathon demo.
- Present `X-Demo-Actor` as password protection.

Always:
- Keep `backend/.env.example` placeholder-only.
- Use private local Sandbox credentials and local-only servers.
- Mask invoice recipient emails in public demo material.
- Require human approval of deliverables and keep an explainable AI report.

## Payment disclosure / Keterangan pembayaran

A local screenshot of **USD 450.00 PAID** is a **PayPal Sandbox virtual test payment**. It does not represent commercial revenue, a real transfer, legal escrow, or money available to withdraw. Refresh status through PayPal before filming; if PayPal cannot be reached, describe the saved state explicitly rather than asserting fresh verification.

## Security disclosures / Pelaporan masalah

Avoid opening public issues containing secrets. Rotate exposed credentials immediately. The code is an open-source prototype; evaluate it independently before deploying it beyond localhost.
