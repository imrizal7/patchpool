# PatchPool

PatchPool is a non-custodial, sponsor-funded security bounty platform for open-source projects. **PatchPool is non-custodial and cannot move user funds.** Sponsors fund immutable per-project pools; people review vulnerability reports and decide their outcomes, while contracts enforce accounting and approved payouts.

This repository is in Phase 0 (foundation only). No contract, cryptographic, backend, or product UI implementation is included yet. Read [the project specification](docs/SPEC.md), [decisions](docs/DECISIONS.md), and [threat model](docs/THREAT_MODEL.md) before implementation.

## Workspace

- `contracts/`: Foundry configuration for Solidity contracts.
- `packages/crypto/`: reserved for report encryption and verification.
- `backend/`: reserved for the API, storage, database, and chain indexer.
- `frontend/`: reserved for the web application.
- `docs/`: product and security specifications.

## Local prerequisites

- Node.js 22 or newer and pnpm 11.17.0.
- Foundry for contract compilation and tests.
- Docker Compose for the local Postgres service.

## Foundation checks

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cd contracts && forge test
```

Start the local database with `docker compose up -d postgres`. Copy `.env.example` for local configuration; it contains development values only. Never use real private keys or mainnet funds.
