# Squatch Hunt migration

Use native Cloudflare Git builds from main. Keep original Heroku commit/slug for
recovery and Heroku automatic deploys off. Keep RPC/session/FLAG values in
Cloudflare, never Git or logs; staging has independent synthetic credentials.
Preserve the CTF's contract addresses and exact token thresholds. Do not execute
payments, faucets, approvals, gambling or minting as deployment tests. Run locked
builds and Worker tests; prove native source/version and serving behavior separately.
