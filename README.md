# Veritas

Forensic page and image notary with stake-backed verdicts.

Veritas lets users open authenticity cases, stake on a side and ask GenLayer to review the live resource. The result is a public case record with settlement and claim paths.

## Review Links

| Surface | Link |
| --- | --- |
| Live app | https://assmore22-veritas.vercel.app |
| GitHub | https://github.com/assmore22/veritas |
| Contract | https://explorer-bradbury.genlayer.com/address/0x70dc688c3DA860Db55c038913af428b162fEF583 |

## Chain Record

- Network: GenLayer Bradbury
- Chain ID: 4221
- Contract: `0x70dc688c3DA860Db55c038913af428b162fEF583`
- Deploy transaction: [0x0238d18e...b0e87c](https://explorer-bradbury.genlayer.com/tx/0x0238d18e1eb2596182202b5b2dff71bbc7f6fbf6ec779ae029519a1b2fb0e87c)
- Deployed: `2026-07-01T15:46:02.324Z`
- Source: `contracts/veritas_v2.py` (24,055 bytes)

## Protocol Path

1. Open a case.
2. Back REAL or FAKE.
3. Run GenLayer jury review.
4. Settle the case.
5. Claim the winning side.

The frontend reads case count, case detail, stake totals, stats and owner data. Contract state is public; write actions still require a connected wallet on GenLayer Bradbury.

## Bradbury Smoke

| Action | Transaction |
| --- | --- |
| `open_case` | [0xa6040371...0d3c75](https://explorer-bradbury.genlayer.com/tx/0xa60403714869085f145672d3b1aaee5549364f1448d46509bc12199c2d0d3c75) |

Read verification passed on Bradbury after deploy. The public app points at this contract address and reads accepted state.

## Local Run

```bash
cd frontend
python -m http.server 8080
```

Open `http://localhost:8080`.

## Release Hygiene

The Vercel deployment is served as static frontend output. Python-only test files stay in the repo, but `requirements.txt` is excluded from Vercel staging so the host does not mis-detect the app as a Python service.

Keep wallet private keys, vault exports, `.env` files, Vercel project state and dashboard data out of Git. This repository is for public source, UI, tests and deployment receipts only.
