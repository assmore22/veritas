# Security Policy

## Public Scope

The package is limited to public frontend code, GenLayer contract code, deployment receipts, and test fixtures for Studionet review.

## Secret Handling

Wallet private keys, faucet credentials, encrypted vaults, Vercel tokens, local dashboard state, and environment files stay outside the repository.

Do not commit `.env` files, local vault files, wallet exports, private keys, or generated deployment state. Public addresses and finalized transaction hashes are acceptable in deployment metadata.

## Reporting

Open an issue for ordinary bugs. For sensitive findings, contact the repository owner privately before publishing details.