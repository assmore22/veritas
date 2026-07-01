# Security Policy

This repository contains public contract code, frontend code, deployment receipts, and test fixtures for a GenLayer Studionet project.

## Secret Handling

Wallet private keys, faucet credentials, encrypted vaults, Vercel tokens, local dashboard state, and environment files are intentionally kept outside this repository.

Do not commit .env files, local vault files, wallet exports, private keys, or generated deployment state. Public addresses and finalized transaction hashes are safe to keep in deployment metadata.

## Reporting

Open an issue for ordinary bugs. For sensitive security findings, contact the repository owner privately before publishing details.