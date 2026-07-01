# Veritas

Forensic page and image notary with stake-backed verdicts.

Veritas lets users open authenticity cases, stake on a side and ask GenLayer to review the live resource. The result is a public case record with settlement and claim paths.

## Review Links

| Surface | Link |
| --- | --- |
| Live app | https://assmore22-veritas.vercel.app |
| GitHub | https://github.com/assmore22/veritas |
| Contract | https://explorer-studio.genlayer.com/contracts/0x6894EA0d3e554dD5EE87Be079386F99B2CD02c80 |

## Chain Record

- Network: GenLayer Studionet
- Chain ID: 61999
- Contract: `0x6894EA0d3e554dD5EE87Be079386F99B2CD02c80`
- Deploy transaction: [0x7408dcef...324106](https://explorer-studio.genlayer.com/tx/0x7408dcef300dfe0be747905809f519b712d1ec88b83b539034311c7b0f324106)
- Deployed: `2026-06-24T04:02:24.870Z`
- Source: `contracts/veritas_v2.py` (24,055 bytes)

## Protocol Path

1. Open a case.
2. Back REAL or FAKE.
3. Run GenLayer jury review.
4. Settle the case.
5. Claim the winning side.

The frontend reads case count, case detail, stake totals, stats and owner data. Contract state is public; write actions still require a connected wallet on GenLayer Studionet.

## Finalized Smoke

| Action | Transaction |
| --- | --- |
| `open_case` | [0xe1c4cd54...f70df5](https://explorer-studio.genlayer.com/tx/0xe1c4cd5428d4d3d9656d124f85b55709863215b4601d09483b09fa10a3f70df5) |
| `back_case` | [0x3862f5ef...c4e39f](https://explorer-studio.genlayer.com/tx/0x3862f5ef6fc97ea977f525be9c90734c380782986e638dca7784860398c4e39f) |
| `judge` | [0xd68ae0fd...c8d6df](https://explorer-studio.genlayer.com/tx/0xd68ae0fd6d88ebac6a643eaf1180b4de01d4c3bd871f0ab099342e7b71c8d6df) |
| `settle` | [0x3934b986...dd2b46](https://explorer-studio.genlayer.com/tx/0x3934b98658634016afbfb06d61b16f75f680b760293e1e29df1ed83038dd2b46) |
| `claim` | [0xe556eccb...0d2129](https://explorer-studio.genlayer.com/tx/0xe556eccb72b7650370e10ab52afa7f49fcbf77542f2f7cc6dfd1964b630d2129) |

## Local Run

```bash
cd frontend
python -m http.server 8080
```

Open `http://localhost:8080`.

## Release Hygiene

The Vercel deployment is served as static frontend output. Python-only test files stay in the repo, but `requirements.txt` is excluded from Vercel staging so the host does not mis-detect the app as a Python service.

Keep wallet private keys, vault exports, `.env` files, Vercel project state and dashboard data out of Git. This repository is for public source, UI, tests and deployment receipts only.
