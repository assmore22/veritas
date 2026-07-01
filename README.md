# Veritas V2

A forensic image/page notary.

This repository contains a complete GenLayer Studionet project: frontend, contract source, deployment metadata and local verification scripts.

## Veritas Brief

- Project folder: `projects/30-veritas`
- Frontend: frontend folder
- Contract package: `contracts/` plus `deployment.json`
- Build status: Schema-valid (24055 bytes); clean deploy + 5 write smoke txs finalized incl GenLayer jury; 12/12 read tests passed; frontend CONFIG.address repointed.
- QA notes: Smoke opened a REAL case, backed FAKE, ran GenLayer judge, settled and claimed. Final case scored 975 authenticity / 970 confidence and settled REAL.

## Veritas On Studionet

- Network: studionet (61999)
- Contract: [0x6894EA0d3e554dD5EE87Be079386F99B2CD02c80](https://explorer-studio.genlayer.com/contracts/0x6894EA0d3e554dD5EE87Be079386F99B2CD02c80)
- Deploy tx: [0x7408dcef...324106](https://explorer-studio.genlayer.com/tx/0x7408dcef300dfe0be747905809f519b712d1ec88b83b539034311c7b0f324106)
- Deployed at: 2026-06-24T04:02:24.870Z
- Smoke writes recorded: 5

## Protocol Mechanics

- Primary source: `contracts/veritas_v2.py` (24,055 bytes)
- Public write/action methods: 8
- Read methods: 5
- GenLayer features: LLM adjudication, indexed storage, append-only collections

Typical flow: `open_case` -> `claim` -> `archive` -> `back_case` -> `judge` -> `settle` -> `list_cases`

Useful reads: `get_case_count`, `get_case`, `get_stakes`, `get_stats`, `get_owner`

The contract is deliberately larger than a one-method demo. It keeps lifecycle state, evidence records and read endpoints so the UI can show real project state instead of static copy.

## Local Review Path

```powershell
cd <private-workspace-root>
npm run preview:start
npm run preview:project -- 30-veritas
```

Open http://localhost:8080/30-veritas/.

## Smoke Transactions

- open_case: [0xe1c4cd54...f70df5](https://explorer-studio.genlayer.com/tx/0xe1c4cd5428d4d3d9656d124f85b55709863215b4601d09483b09fa10a3f70df5)
- back_case: [0x3862f5ef...c4e39f](https://explorer-studio.genlayer.com/tx/0x3862f5ef6fc97ea977f525be9c90734c380782986e638dca7784860398c4e39f)
- judge: [0xd68ae0fd...c8d6df](https://explorer-studio.genlayer.com/tx/0xd68ae0fd6d88ebac6a643eaf1180b4de01d4c3bd871f0ab099342e7b71c8d6df)
- settle: [0x3934b986...dd2b46](https://explorer-studio.genlayer.com/tx/0x3934b98658634016afbfb06d61b16f75f680b760293e1e29df1ed83038dd2b46)
- claim: [0xe556eccb...0d2129](https://explorer-studio.genlayer.com/tx/0xe556eccb72b7650370e10ab52afa7f49fcbf77542f2f7cc6dfd1964b630d2129)

## GitHub And Vercel

```powershell
cd <private-workspace-root>
npm run publish:project -- -Project 30-veritas -Repo https://github.com/aspro45/<repo-name>.git
```

Replace `<repo-name>` with the GitHub repository name before publishing.

## Secret Handling

- Private keys and local vault files are not part of this repository.
- Public addresses, contract source, deployment metadata and frontend code are safe to publish.
- Vercel should receive only this project folder, never the workspace dashboard or vault data.
