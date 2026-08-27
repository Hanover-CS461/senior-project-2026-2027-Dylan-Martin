# Real-Time EE2E 
---
Web chat that utilizes asymmetric encryption where each user has a stored private/public key. Not shared with the server at all. Server is specifically for sending
public keys and encrypted messages. Threat model: the server is the adversary (it can see metadata, never plaintext); the browser is trusted. Message history
lives client-side in IndexedDB. 

## Stack Framework
**React.js** - frontend using the Web Crypto API \
**MongoDB** - database for user metadata and public keys only (no messages stored) \
**WebSockets** - For the message delivery and user endpoint connections \
**Node.js** - backend for websockets \
**IndexedDB** - client-side storage for private keys, ephemeral keys, and encrypted message history 

## Phase 0 — Crypto model (decide first, shapes everything)
- Hybrid scheme: each user generates an ECDH keypair client-side (P-256 via Web Crypto API; X25519 isn't uniformly supported in SubtleCrypto). Public key -> server; private key stays client-side in IndexedDB (not localStorage — XSS-readable).
- TOFU trust model: the first public key seen for a peer is trusted and pinned, so an MITM can only target the initial exchange. Display a fingerprint (SHA-256 of the public key) for out-of-band comparison — the hash is only as good as the comparison.
- Ephemeral keys per message for per-message separation. Keep ephemeral keys stored alongside ciphertext so history stays re-readable — forward secrecy protects against server compromise, not device compromise.
- Research E2E services now (Signal protocol docs etc.) to know what NOT to attempt.

## Phase 1 — Skeleton app (no crypto)
1. Scaffold monorepo: React frontend + Node.js backend + WebSocket server.
2. Auth: register/login with password hashing (argon2id/bcrypt) -> session token. Store users in MongoDB.
3. Basic chat over WebSockets: connect, send plaintext message, receive it. Message ordering via sequence numbers.

## Phase 2 — E2E layer
4. On signup: generate ECDH keypair, upload public key, store private key in IndexedDB.
5. TOFU: on first contact with a peer, store and pin their public key; show fingerprints on both sides for verification.
6. Derive per-conversation shared secret via ECDH, encrypt each message with AES-GCM (authenticated — covers integrity, no extra hashing/CRC needed). Server is a pure relay, never stores message content.
7. History lives client-side: encrypted messages + ephemeral keys in IndexedDB, decrypt on load.

## Phase 3 — Hardening & polish
8. Offline delivery: short-lived mailbox on the server — ciphertext only, auto-expires (~24h), delivered on recipient reconnect.
9. Edge cases: missing key, key regeneration, reconnection mid-conversation, delivered/read indicators.
10. Friends list (optional but cheap) — limits who you can message, gives the UI a home page.
11. Tests: known-answer crypto tests (fixed inputs -> expected ciphertext), auth tests, WebSocket integration tests.
12. Deploy (Render/Railway/Vercel or similar) so it's demoable, not just localhost.

# Mania Game (Story Game Maybe)
---
everhood
A story game where the conversations and/or combat involves playing a mania game of differing styles perhaps. Within the speech there could possibly be moments where a conversation option means the mania
game. Similar to Skyrim with the persuading and speech levels. Although instead of a certain level this is instead an accuracy thing. It could be thought of similar to Everhood where battles are the rhythm
game. I want to add it a little more though. 

## Stack Framework
**Not yet decided need help**
**Want it to be a pc only game but run on both Windows, Linux, and Apple MacOS to keep building simple I dont want to mess with packaging/building the game just an easy download hopefully. If possible**

## Style
The game will be a pixel 2d artstyle that includes themes of going through Hanover CS classes and graduating. Perhaps I shall ask the professors if I can create characters that model or are inspired by 
them. Of course I might need to keep it lightweight I dont have years to work on this.

## Language
I am a **BIG** fan of the C programming language. My knowledge is very small but I would hope this project would help. IDK maybe use SDL that could be really good we have to make a tutorial on a library
SDL could be that library perhaps. SDL setup has given me trouble in the past but not this time.

### Planned Steps
1. Game Storyboard
2. Create Characters (concept)
3. Other things I dont feel like thinking of right now.
