# MilestonePay AI — Interactive Frontend

React + TypeScript + Vite prototype, upgraded from the provided Figma Make export with an original premium blue-gray UI and responsive motion.

## Run

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Build with `npm run build`.

## Interactive demo

Use **Switch Demo Account** to move between Jordan (client) and Alex (freelancer). Follow **Demo Journey**: create request → submit proposal → accept and confirm agreement → deliver/review → create invoice → simulate payment. Browse the landing page by clicking the logo. Use **Reset Demo** to restart.

## Important scope

This is a frontend prototype. AI recommendations and PayPal payment are **simulated**, not connected to external services. Data is in React state and resets on reload. The UI intentionally labels demo activity; do not present it as verified payments or operational AI. Actual PayPal integration requires a server, merchant sandbox credentials, server-side permission checks, and payment-status verification.

## Design

Original blue-gray design layer: `src/polish.css`; workflow logic: `src/Workspace.tsx` and `src/model.ts`. Accessible focus styles and reduced-motion support included.

## License

MIT; see `LICENSE`. Review licenses and origin of any future third-party assets before publishing.
