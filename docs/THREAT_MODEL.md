# PatchPool threat model (draft)

## Scope and security goals

PatchPool holds sponsor-funded token balances in non-upgradeable contracts and handles vulnerability reports whose plaintext must remain confidential until the researcher chooses to disclose it. The contract guarantees accounting and permitted transitions; humans decide whether reports are valid. PatchPool is non-custodial and cannot move user funds.

Goals:

- Preserve pool accounting, sponsor withdrawal limits, reservations, and exactly-once report outcomes.
- Keep report plaintext out of chain data, server storage, logs, URLs, analytics, and error trackers.
- Ensure a server, maintainer, sponsor, or arbiter cannot take funds through an undocumented path.
- Make verification and reviewer authorization resistant to signature replay and expiry mistakes.
- Make failure and dispute handling explicit; silence does not imply acceptance.

## Assets

- Sponsor deposits and report stakes held by the contract.
- Per-report reserved payout capacity and policy snapshots.
- Ciphertext reports, attachment ciphertext, wrapped keys, and report hashes.
- Researcher and reviewer private keys, wallet credentials, verifier signing key, arbiter authority.
- Indexer state, role/session data, GitHub verification results, and notification metadata.

## Trust boundaries

- Browser clients ↔ wallet, browser storage, and public web application.
- Browser clients ↔ API/session service and ciphertext object store.
- API/indexer ↔ Postgres, RPC provider, object storage, GitHub, and notification providers.
- Users ↔ immutable contracts, allowlisted tokens, verifier signer, and arbiter council.
- CI/build chain ↔ package registries, GitHub Actions, and production frontend artifacts.

## Threats and initial mitigations

| Threat | Impact | Initial mitigation | Residual risk |
|---|---|---|---|
| Maintainer collusion or report suppression | Researchers lose access to review or payout | Fixed windows, researcher escalation, arbiter path, immutable policy snapshot | Arbiter may collude or be unavailable; resolution remains human |
| Sponsor griefing or early withdrawal | Pool becomes underfunded or report capacity is reduced | Deposit locks, delayed withdrawal, reserved funds excluded from withdrawals | Unreserved balance may still fall; new reports reserve only available funds |
| Spam and stake/lockup abuse | Review burden and capital lockup | Stake, per-researcher open-report cap, spam resolution by humans | False spam decisions and Sybil identities remain possible |
| Arbiter bribery or compromise | Wrong dispute outcome | Council multisig, narrow resolution choices, timelocked council changes, emitted decisions | Council members can collude; no cryptographic proof of decision quality |
| Backend or object-store compromise | Metadata exposure or ciphertext deletion | Ciphertext-only storage, access control, redacted logs, backups and integrity hashes | Ciphertext can be deleted or withheld; traffic/metadata may be exposed |
| XSS or malicious frontend dependency steals keys | Report plaintext or keys exposed in reviewer browser | Strict CSP, pinned dependencies, no third-party scripts on decrypted-report pages, local key decryption | A compromised same-origin frontend can still steal keys while used |
| Replay or phishing signatures | Unauthorized claim, key registration, or verifier use | EIP-712 domain includes chain and verifying contract; nonce, deadline, role checks; SIWE origin binding | Wallet UX and domain compromise remain user risks |
| Frontend/build supply chain compromise | Malicious code reaches users | Lockfile, CI, dependency review, build provenance and release review | Maintainer/action/registry compromise remains possible |
| USDC issuer blacklist or token pause | Recipient cannot receive a pull-payment | Pull claims and independent pool accounting; recipient can retry or choose supported destination only if contract permits safely | Issuer blocklist may strand that recipient's claim unless a safe alternative is designed |
| Chain reorg or indexer fault | UI shows stale or incorrect role/report state | Confirmation depth, idempotent event processing, rollback to common ancestor, contract as source of truth | Finality assumptions and RPC/provider failures remain |
| Researcher key loss | Researcher cannot decrypt their submitted report | Wrap the report key to researcher key and require export/backup flow | Lost keys cannot be restored by server; backups can be stolen |
| Timelock or pause misuse | Delayed governance action or inability to create/fund pools | Timelocked changes; pause limited to new pool creation/deposits; transparent events | Governance can still disrupt future operations |

## Plaintext and key-handling rules

- Construct and encrypt report content in the browser. Plaintext exists only in the submitting or authorized reviewer client while in use.
- Store and transmit ciphertext only. Do not place report content or keys in URLs, analytics, server logs, tracing, exception messages, or notifications.
- Wrap each report key to the registered reviewers and the researcher's public key. Private keys remain client-side and are protected by a user passphrase and export/backup process.
- Treat browser extensions, XSS, compromised devices, clipboard/screen capture, and an authorized reviewer as capable of exposing plaintext.
- Keep the verifier signing key and infrastructure credentials outside the repository and CI logs. Use test-only keys for local development.

## Open items for implementation/review

- Specify how a blocked token recipient can recover a claim without allowing arbitrary redirection or double claims.
- Define precise report deadlines, mutually exclusive terminal states, and reservation release accounting.
- Decide how token allowlist governance and token behavior are validated.
- Threat-model GitHub OAuth/App credential storage and verifier signer operations.
- Validate object-store authorization, deletion recovery, metadata minimization, and request-body redaction with tests.
- Perform independent contract and application security reviews before any production launch.

This is a draft threat model, not an audit or a claim of legal compliance.
