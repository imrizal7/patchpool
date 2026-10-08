# Decisions

Decisions here record safe defaults made while translating the initial brief into a buildable specification. Revisit them when implementation evidence or a threat review warrants a change.

## D-001: Phase-gated implementation

**Decision:** Build only the foundation in Phase 0. Later phases begin only after the user says `continue`.

**Reasoning:** The brief explicitly sets a stop-and-wait boundary after every phase. The foundation therefore contains workspace/tooling/docs only, with no feature code.

## D-002: Contract authority and fund movement

**Decision:** Keep contracts non-upgradeable; no administrator can withdraw or redirect user funds. All transfers use user-triggered pull-payment claims. Pausing affects only new pool creation and deposits.

**Reasoning:** Minimizes privileged paths and ensures a pause cannot strand existing payouts, refunds, or sponsor withdrawals.

## D-003: Disputes require a human decision

**Decision:** Silence never automatically pays or rejects a report. Escalation creates a dispute for the arbiter. The contract enforces only the outcomes available to the human decision-maker.

**Reasoning:** The contract cannot determine whether a vulnerability is real. Automatic resolution on silence would incorrectly treat lack of response as evidence.

## D-004: Ciphertext-only server storage

**Decision:** Store report ciphertext and non-sensitive metadata only. Keep decryption keys client-side; keep report plaintext out of logs, routes, telemetry, and events.

**Reasoning:** Server compromise should not directly reveal vulnerability content. This does not protect a compromised researcher/reviewer client or a plaintext leak by an authorized reviewer.

## D-005: Immutable policy snapshots

**Decision:** A report snapshots the policy hash and reservation at submission. Owner policy updates are queued and execute after the configured delay, affecting only later submissions.

**Reasoning:** Researchers and maintainers need stable rules for an in-flight report; sponsors also need time to observe changes before they apply.

## D-006: Initial arbiter council is a placeholder

**Decision:** Use a council address (initially expected to be a 2-of-3 or stronger multisig) as the arbiter interface. Council changes are timelocked.

**Reasoning:** This creates a replaceable governance boundary without pretending the initial council is a decentralized court. Council members can choose only specified report outcomes and cannot take funds.

## D-007: Allowlisted exact-transfer tokens

**Decision:** Accept only allowlisted tokens with expected decimals and exact transfer semantics. Do not support fee-on-transfer or rebasing assets. Measure received balances on deposit and reject short transfers.

**Reasoning:** Pool accounting and reservation guarantees rely on the received amount matching the recorded amount. Token behavior is part of the trust model.

## D-008: Development-only defaults

**Decision:** Use local Anvil, a local Postgres container, and MockUSDC for development. No real key, mainnet RPC, production bucket, or deployment credential belongs in this repository.

**Reasoning:** Keeps early development reproducible without exposing funds or secrets.
