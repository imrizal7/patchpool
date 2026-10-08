# PatchPool contributor instructions

PatchPool is a non-custodial, sponsor-funded security bounty platform. It cannot move user funds except through the exact, user-authorized contract flows documented in `docs/SPEC.md`.

## Project structure and stack

- `contracts/`: Solidity `^0.8.24`, Foundry, OpenZeppelin; local Anvil and Base Sepolia; allowlisted USDC-style tokens with 6 decimals.
- `packages/crypto/`: TypeScript and libsodium-wrappers for XChaCha20-Poly1305, sealed X25519 keys, and canonical report hashing.
- `backend/`: Node.js, Fastify, TypeScript, zod, Postgres, Drizzle or Prisma, viem indexer, local disk in development and S3-compatible object storage in production.
- `frontend/`: Next.js App Router, TypeScript, wagmi, viem, Tailwind, RainbowKit.
- `docs/`, `scripts/`, `.github/workflows/`: product/security documentation, developer tooling, and CI.
- Root package management uses pnpm workspaces. Keep dependencies pinned by the committed lockfile.

## Security invariants

1. Vulnerability plaintext never enters chain state, events, logs, URLs, analytics, error tracking, or server storage. Server storage is ciphertext only.
2. Contracts are non-upgradeable and have no owner fund-sweep path. Admin powers are limited to timelocked council/verifier changes and pausing new deposits/pool creation. Payouts, claims, refunds, and withdrawals remain available while paused.
3. Use pull payments, checks-effects-interactions, reentrancy protection, SafeERC20, custom errors, and state-change events. Document all external contract functions with NatSpec.
4. Use only allowlisted tokens; reject fee-on-transfer and rebasing behavior. Reserved funds cannot be withdrawn. Do not let a blocked recipient prevent unrelated pool actions.
5. Keep private keys and secrets out of source, logs, fixtures, and Git. Use `.env.example`; never use real private keys or mainnet funds.
6. Do not claim legal compliance. Every product surface must say PatchPool is non-custodial and cannot move user funds.
7. Record material decisions and their safer-default reasoning in `docs/DECISIONS.md`. Keep `docs/THREAT_MODEL.md` current.

## Engineering conventions

- Follow the currently authorized phase in the user-provided project brief. Stop at the end of a phase and wait for an explicit `continue` before starting the next phase.
- Keep commits small and reviewable. Add tests for implemented behavior and update documentation with each phase.
- Validate external inputs with zod at backend boundaries. Never log request bodies or decrypted reports.
- Preserve accessible, responsive UI and strict CSP. Pages handling decrypted reports must not load third-party scripts.
- Explain money movement in plain language. Never put report content in URLs or analytics.
- Before completing a phase, run the checks available for that phase and clearly record unavailable tools or blocked checks.

## Product-specific decisions

The contract enforces accounting and allowed state transitions. People decide whether a vulnerability is real. The initial arbiter council is a placeholder for a future decentralized court. See `docs/SPEC.md`, `docs/DECISIONS.md`, and `docs/THREAT_MODEL.md`.
