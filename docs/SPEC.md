# PatchPool specification

PatchPool is non-custodial and cannot move user funds. Contracts guarantee accounting, enforce approved transitions, and make payouts available by pull claim; humans determine report validity and severity. This document records the Phase 0 target behavior, not implemented or audited behavior.

## Identifiers and pool data

- `projectId = keccak256("github:<owner>/<repo>".lowercase())`.
- A pool stores its owner (zero until claimed), allowlisted token, policy hash, four tier amounts (Low/Medium/High/Critical), acknowledgement/review/contest windows, disclosure days, base stake, and creation-time protocol fee (maximum 500 bps).
- Pool states are `Unclaimed`, `Active`, and `Closed`. Anyone may create an unclaimed pool and deposit into it. Reports require `Active`.
- Accounting tracks `totalBalance`, `reserved`, and each sponsor's amount, deposit lock end, and withdrawal request time.
- A signed GitHub ownership claim binds the project and owner, nonce, deadline, chain ID, and verifying contract in EIP-712. A claimed wallet cannot be the researcher on its pool.
- New policy settings are queued then executable after the delay. Reports retain the policy hash and reservation that applied at submission.

## Report state machine

`Acknowledged` is an optional marker on a submitted report; it does not reset deadlines. A report has exactly one terminal state: `Paid`, `ClosedRejected`, `ClosedSpam`, or `Withdrawn`.

| State | Caller | Preconditions | Effects | Events |
|---|---|---|---|---|
| None → Submitted | Researcher | Pool Active; researcher is not owner; valid nonzero report hash; open-report cap not reached; stake paid; available capacity computed | Snapshot policy; reserve `min(max tier, available balance)`; record researcher, pool, hash, submission time, stake, reservation; increment open count | `ReportSubmitted` with report ID, pool ID, researcher, hash, and non-sensitive accounting data |
| Submitted → Acknowledged | Pool owner/authorized reviewer | Report is unresolved and before applicable review deadline | Mark acknowledged; deadline remains measured from submission | `ReportAcknowledged` |
| Submitted/Acknowledged → Accepted | Pool owner/authorized reviewer | Report unresolved; valid severity | Record severity and acceptance time; preserve reservation; make stake refundable; start contest window | `ReportAccepted` |
| Submitted/Acknowledged → Rejected | Pool owner/authorized reviewer | Report unresolved; nonzero reason hash | Record reason hash and spam flag; preserve reservation during dispute window | `ReportRejected` |
| Submitted/Acknowledged → ClosedRejected (duplicate) | Pool owner/authorized reviewer | Report unresolved and duplicate relationship is valid; older valid issue report remains eligible | Release reservation; make stake refundable; do not mark spam | `ReportRejectedDuplicate` |
| Submitted/Acknowledged → Disputed (silence) | Researcher | Acknowledgement/review deadline passed without a decision | Preserve reservation and stake pending arbiter outcome | `ReportDisputed` with silence reason code |
| Accepted → Disputed | Researcher | Within contest window | Preserve reservation and stake pending arbiter outcome | `ReportDisputed` with severity-contest reason code |
| Rejected → Disputed | Researcher | Within rejection dispute window | Preserve reservation; defer stake refund/forfeiture | `ReportDisputed` with rejection-dispute reason code |
| Submitted/Acknowledged → Withdrawn | Researcher | Still unreviewed and undisputed | Release reservation; make stake refundable; close report | `ReportWithdrawn` |
| Accepted → Paid (agree) | Researcher | Researcher agrees to recorded severity | Settle payout accounting; terminalize report; stake refund becomes claimable | `SeverityAgreed`, `PayoutCredited` |
| Accepted → Paid (window elapsed) | Permissionless caller or researcher claim path | Contest window elapsed; no dispute | Make payout claimable; terminalize exactly once; stake refund becomes claimable | `PayoutCredited` |
| Disputed → Paid | Configured arbiter | Report disputed; valid severity selected | Set severity; terminalize as paid; credit capped payout; make stake refundable | `DisputeResolved`, `PayoutCredited` |
| Disputed → ClosedRejected | Configured arbiter | Report disputed; good-faith rejection selected | Release reservation; terminalize; make stake refundable | `DisputeResolved`, `ReportRejectedFinal` |
| Disputed → ClosedSpam | Configured arbiter | Report disputed; spam rejection selected | Release reservation; terminalize; forfeit stake to pool | `DisputeResolved`, `ReportSpamFinal` |
| Paid → payout claimed | Researcher | Positive claimable payout; not previously claimed | Zero payout credit before token transfer (pull payment) | `PayoutClaimed` |
| Accepted/Withdrawn/ClosedRejected → stake refunded | Researcher | Stake refund is claimable; not previously claimed | Zero stake credit before token transfer | `StakeRefunded` |
| Rejected → ClosedSpam | Permissionless caller or researcher claim path | Spam flag set; rejection window elapsed; no dispute | Release reservation; terminalize; add forfeited stake to pool | `SpamStakeForfeited` |
| Rejected → ClosedRejected | Permissionless caller or researcher claim path | Good-faith rejection, or spam flagged but a dispute is not raised within window and policy makes refund due | Release reservation; terminalize; make stake refundable unless unchallenged spam | `ReportRejectionFinalized` |

## Pool and sponsor state machine

| State | Caller | Preconditions | Effects | Events |
|---|---|---|---|---|
| No pool → Unclaimed | Any account | New project ID; token allowlisted; pool creation not paused; valid bounded config | Initialize immutable pool terms and accounting | `PoolCreated` |
| Unclaimed → Active | Any account with valid verifier signature | Matching project ID/owner; signature not expired or replayed; nonce unused | Bind owner; consume nonce; set initial policy and terms | `PoolClaimed` |
| Unclaimed/Active → Closed | Pool owner | No unresolved reports or reserved liabilities; closure rules satisfied | Prevent new submissions; preserve claims, refunds, and sponsor withdrawal paths | `PoolClosed` |
| Sponsor amount increases | Any sponsor | Positive amount; allowed token transfer received exactly; lock duration at least minimum; new deposits not paused | Credit only actual received amount; set/extend applicable lock | `Deposited` |
| Sponsor → withdrawal requested | Sponsor | Positive sponsor balance; request permitted | Record request timestamp | `WithdrawalRequested` |
| Sponsor amount decreases | Sponsor | Notice passed and lock expired; pool not in unclaimed early-exit case; amount ≤ sponsor balance and ≤ `totalBalance - reserved` | Debit sponsor and pool balance before pull transfer; clear request as needed | `Withdrawn` |
| Unclaimed sponsor early exit | Sponsor | Pool remains unclaimed for at least 180 days | Permit full available sponsor withdrawal without notice | `UnclaimedFundsWithdrawn` |
| Policy update queued → executed | Pool owner, then permissionless executor | Valid settings; delay elapsed for execution | Store new policy hash/config for subsequent reports only | `PolicyUpdateQueued`, `PolicyUpdated` |
| Deposits/pool creation paused → resumed | Authorized governance role | Pause applies only to new pool creation and deposits | Toggle pause; all other exits/claims/transitions remain enabled | `DepositsPaused`, `DepositsUnpaused` |
| Arbiter/verifier change queued → executed | Authorized governance role, then permissionless executor | Proposed address valid; timelock elapsed; action not cancelled | Replace council/verifier, without altering user balances or in-flight report rules | `GovernanceChangeQueued`, `GovernanceChangeExecuted` |

## Economics and invariant rules

- A researcher stake starts at the configured base amount and is discounted by accepted-report reputation thresholds (100% at 0, 50% at 3, 0% at 10; exact counting semantics to be pinned before implementation).
- A report reserves `min(maxTierAmount, totalBalance - reserved)` at submission. Reservation never exceeds pool balance and is not sponsor-withdrawable.
- Payout is the selected tier capped by that report's reservation. Fee is calculated in basis points from the payout; the fee goes to the configured treasury and the remainder to the researcher. Rounding direction must be explicit and tested.
- Accepted reports refund stake. Good-faith rejections and researcher withdrawals refund stake. Spam stakes are added to the pool after the applicable finality window or arbiter decision.
- For duplicate valid reports concerning the same issue, the earliest submitted report wins; maintainers explicitly mark later reports duplicate. Duplicate rejection is not spam.
- Reputation counters are non-transferable and emitted for indexing. The owner cannot earn a self-payout.
- `disclosureRightAt(reportId)` returns the configured submission time plus disclosure days only if the report has not been paid; disclosure itself is off-chain.
- Token balances held by the contract must cover all pool balances and active stakes. Token transfers must be exact; fee-on-transfer/rebasing tokens are unsupported.

## On-chain data minimization

Report state contains only researcher, pool ID, commitment hash of encrypted bundle, submission timestamp, policy hash snapshot, stake, reserved amount, state, and severity. Do not put titles, descriptions, proof-of-concept material, plaintext, or private keys in events, storage, URLs, or logs.

## Authentication and off-chain data

- Wallet sign-in uses SIWE with EIP-1271 support, short-lived sessions, CSRF/origin protections, and roles derived from confirmed indexed chain state.
- Ciphertext upload validates size and canonical report hash before persistence. Fetch is restricted to the submitting researcher, authorized pool reviewers, or arbiter.
- The indexer uses confirmations, idempotent event identity, health/lag reporting, and rollback on reorg. Contract state remains authoritative.
- Notifications contain event references and non-sensitive metadata only, never report content.

## Phase 0 scope boundary

This is a target behavior specification. Phase 0 creates only docs, workspace configuration, local development scaffolding, and CI. Feature implementations and their verification belong to later phases after explicit authorization to continue.
