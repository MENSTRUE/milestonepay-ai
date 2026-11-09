# MilestonePay AI — Final QA / Pemeriksaan Akhir

## Automated (must pass)

```powershell
cd "D:\porto\00.paypal hackathon"
& .\scripts\final_check.ps1
```

- [ ] TypeScript passes
- [ ] Vite production build passes
- [ ] All backend tests pass
- [ ] No `.env` or database is tracked in Git
- [ ] The existing Sandbox PAID invoice is preserved in SQLite

## Browser (must verify manually)

1. Open `http://localhost:5173` in a fresh Incognito window. A **public landing page** appears first.
2. Click **Masuk / Sign in**. The **login card** appears. Select **Ahmad / Client** and enter the workspace.
3. Click **Ganti Akun / Switch account**. It MUST return to the **login card**, not silently switch into Fulan.
4. Select **Fulan / Freelancer**, enter workspace. Select **Indonesia / English** and confirm main navigation and guide respond.
5. Open Dashboard and Analytics. Verify requests and invoices load from SQLite, not a React-only placeholder. A `PAID` record must be clearly marked **PayPal Sandbox (virtual funds)**.
6. On an existing project, open **Proyek & AI / Projects & AI**. Verify proposal, agreement, milestone, AI review and PayPal history views still function. **Do not create duplicate invoices**.
7. Use **Verify status with PayPal** on an existing invoice. Confirm only PayPal API response can establish `PAID`; no button may unilaterally mark an invoice paid.
8. Test a deliberately wrong/missing backend: UI must explain connectivity failure rather than displaying invented success or zero revenue as fact.
9. Refresh browser and re-open the project. The SQLite data should still exist; login persona may require selection again depending on session.
10. Confirm `.env`, password, Secret, access token, private contact data, and real personal account information are never shown in video or GitHub.

## Reviewer disclaimer

- Ahmad and Fulan are **test personas**, selected through a UI; this is NOT production login/authentication.
- All payment transactions are **PayPal Sandbox virtual funds**; not real income or escrow.
- Local Ollama analyzes submitted **text**, not attachments or screenshots unless they are actually processed.
- Audit uses an **off-chain SHA-256 hash chain**; the optional Solidity contract is not proof of a confirmed public-chain transaction.
- AI recommendations are advisory; humans approve deliverables.

## Recording evidence

Record a 2:40–2:55 public YouTube video, use captions in English, and show a real Sandbox `PAID` invoice (safely obscuring private identifiers). Keep a short screen recording of the entire journey as backup.
