# MilestonePay AI — Demo video script (target 2:45)

**00:00–00:18 — The problem (landing page)**
> Freelancers lose time to unclear scopes, ambiguous acceptance criteria, and disconnected payments. MilestonePay AI unifies the workflow—from agreement to verified milestone invoicing.

**00:18–00:42 — Client and freelancer (login card + dashboard)**
> This is our bilingual MVP. Ahmad is the test client; Fulan is the test freelancer. These are demo personas, not production user accounts. The workspace reads persistent records from FastAPI and SQLite.

**00:42–01:10 — Scope and agreement (projects)**
> Ahmad creates a project request. Fulan responds with a proposal and milestones. Both confirm the agreement, so responsibilities and acceptance criteria are explicit before work begins.

**01:10–01:42 — Local AI with human decision (evidence review)**
> Fulan submits written evidence. Our locally hosted Qwen2.5 model compares it with acceptance criteria and points out what is missing. It cannot verify files it has not opened; Ahmad retains the final approval decision.

**01:42–02:18 — PayPal Sandbox checkout + sync (invoice history)**
> Once a milestone is approved, Fulan issues a PayPal Sandbox invoice. We completed a test checkout using virtual funds. MilestonePay then retrieves the payment status from PayPal's API—not from a simulated button. Here is the verified PAID invoice and persistent history.

**02:18–02:38 — Integrity and design (analytics + audit)**
> The audit log uses SHA-256 hash chaining to make modifications detectable. The dashboard clearly distinguishes Sandbox amounts from real money. Both English and Indonesian interfaces help users understand each step.

**02:38–02:48 — Close**
> MilestonePay AI: trust built through clear milestones, human judgment, and verifiable Sandbox payment events.

## Recording notes
- Record actual screens and live flows. Preload the already-tested PAID invoice; don't create another invoice merely for video.
- If AI response takes too long, show a clearly identified prior successful run; do not fake a new live inference.
- Blur Sandbox emails, personal names from PayPal accounts, tokens, passwords and the `.env` file.
- Keep the video public and **below 3 minutes**; add English subtitles and verify playback before submission.
