# Optional blockchain proof (NOT required for the MVP)

`contracts/MilestoneProof.sol` anchors a SHA-256 audit digest as a bytes32 value on an EVM testnet. It does NOT accept funds, release PayPal payments, replace invoice verification, or implement escrow.

1. Finish the PayPal Sandbox invoice end-to-end demo first.
2. Inspect and test the contract using Remix with Solidity compiler 0.8.24+.
3. Deploy ONLY on a testnet with test tokens using a dedicated development wallet.
4. Retrieve `GET /api/v1/requests/{id}/audit` as a participant.
5. Hash the request ID with SHA-256 locally to get `requestHash`; use `latest_hash` as `auditHash`. Only publish hashes—never agreements, emails, or evidence.
6. Call `anchor(requestHash, auditHash)` with the owner wallet. Keep chain ID, contract address, transaction hash, and receipt as evidence.
7. `blockchain_anchored: false` in the API is deliberately not changed automatically. Don't claim an anchor unless the on-chain transaction and receipt are verified.

Limitations: the server's off-chain hash chain cannot prevent privileged DB rewriting with rehashing. Anchoring externally can make later tampering detectable against a previously published commitment, but does not prove the underlying business statements were true. This is optional and must not block the core submission.
