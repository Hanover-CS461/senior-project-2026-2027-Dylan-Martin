---
layout: default
---
# FRUM — An End-to-End Encrypted Web Chat with Trust-on-First-Use

FRUM is a web chat application that encrypts every message end-to-end in the user's browser, so that the server relaying the traffic can never read the plaintext. Each user generates an Elliptic Curve Diffie-Hellman (ECDH) key pair locally — the key-exchange mechanism introduced by Diffie and Hellman [1] — and uploads only the public half of the pair to the server, while the private key never leaves the browser and all cryptography is performed by the browser's native Web Crypto API [2]. Messages are encrypted with AES-GCM under a per-conversation shared secret derived from the two participants' keys, and the server stores nothing but user metadata and public keys, making it a pure relay rather than a message store. This design assumes the server itself is the adversary: it may observe metadata, such as who is messaging whom and when, but it can never observe what is said. Trust between users is established by trust-on-first-use (TOFU) key pinning, in which the first public key seen for a peer is pinned and then verified out-of-band through SHA-256 fingerprints.

## Comparable Solutions

Signal is the closest comparable solution to FRUM and the reference point for its design. The two systems share the core property that their servers relay ciphertext only and never have access to message plaintext, and both authenticate peers through fingerprint comparison; Signal documents these mechanisms in its technical overview [3]. The designs diverge on protocol depth, identity, and the location of message history. Signal implements the X3DH key agreement and the Double Ratchet protocol [4], which provide forward secrecy — compromise of a device or a key does not expose past messages — whereas FRUM deliberately implements the simpler static-static ECDH scheme, which offers no forward secrecy, in exchange for a protocol small enough to implement, analyze, and defend within a single semester. Signal binds identity to phone numbers and retains encrypted message history on its servers for delivery to offline devices, while FRUM uses usernames unbound from phone numbers and keeps message history exclusively on the user's device.

WhatsApp is a second comparable solution and the most widely deployed end-to-end encrypted messaging service. WhatsApp shares FRUM's goal of encrypting all message content end-to-end, implementing the same Signal Protocol, and it likewise verifies peers through security codes, as described in its encryption whitepaper [5]. The differences are structural rather than technical: WhatsApp's clients are closed source, its identity model is phone-number based, it retains encrypted history in server-side stores and cloud backups, and its operator collects extensive metadata as part of a commercial business model. FRUM is open source, stores history only on the client device, and collects nothing beyond account credentials and public keys.

## Main Features

The feature set is scoped to what end-to-end encryption requires, and each feature below serves a stated security or usability purpose.

- **End-to-end encrypted messaging.** ECDH key agreement [1] combined with AES-GCM authenticated encryption, both performed client-side by the browser's Web Crypto API [2]. AES-GCM's authenticated mode covers message integrity, so no separate checksum is needed.
- **Trust-on-first-use key pinning.** The first public key received from a peer is pinned and presented as a SHA-256 fingerprint for out-of-band comparison. This mirrors the raw-public-key trust model standardized for TLS in RFC 7250 [6] and used in production by SSH for over two decades [7]. Because studies of SSH show that fingerprint verification is the human bottleneck of such schemes — it is rarely performed in the wild [8] — FRUM makes the comparison an explicit step in the UI rather than an optional one. History is per-device by design: a new device signs in with a fresh key pair, so peers re-verify the new fingerprint before trusting it.
- **Client-side message history.** Ciphertext, peer keys, and derived keys are stored in the browser's IndexedDB [9] and decrypted on load, so no conversation history ever exists on the server.
- **Server as a pure relay.** The Node.js [10] backend stores only credentials and public keys and relays ciphertext between clients over WebSockets [11].
- **Offline delivery mailbox.** A short-lived (about 24 hours) server-side mailbox holds ciphertext for recipients who reconnect later, then expires it. It holds ciphertext only, never keys or plaintext.
- **Friends list.** Restricts who a user can message and provides the chat application's home screen.
- **Delivered and read indicators.** Give users feedback on message delivery within the relay model.

## System Architecture

FRUM is composed of three logical parts — a client-side encryption core, a client-side storage layer, and a server-side relay — that interact over a single WebSocket connection. The diagram below shows each part and the connections between them.

```
             ┌───────────────────────────────────────────────┐
             │               Browser (trusted)               │
             │  ┌─────────────────────────────────────────┐  │
             │  │ React UI: chat, contacts, settings,     │  │
             │  │ fingerprint display                     │  │
             │  └────────────────────┬────────────────────┘  │
             │                       │                       │
             │  ┌────────────────────▼────────────────────┐  │
             │  │ Web Crypto API: ECDH key pairs,         │  │
             │  │ AES-GCM encrypt/decrypt,                │  │
             │  │ SHA-256 fingerprints                    │  │
             │  └────────────────────┬────────────────────┘  │
             │                       │                       │
             │  ┌────────────────────▼────────────────────┐  │
             │  │ IndexedDB: private key, pinned peer     │  │
             │  │ keys, encrypted history                 │  │
             │  └─────────────────────────────────────────┘  │
             └──────────────────────┬────────────────────────┘
                                    │  WebSocket: public keys,
                                    │  ciphertext, presence
                                    ▼
             ┌───────────────────────────────────────────────┐
             │            Server (the adversary)             │
             │  ┌─────────────────────────────────────────┐  │
             │  │ Node.js + ws: authentication, routing,  │  │
             │  │ ciphertext relay                        │  │
             │  └────────────────────┬────────────────────┘  │
             │                       │                       │
             │  ┌────────────────────▼────────────────────┐  │
             │  │ MongoDB: users, password hashes,        │  │
             │  │ public keys, metadata                   │  │
             │  └─────────────────────────────────────────┘  │
             │                                               │
             │  Offline mailbox: ciphertext, ~24 h expiry    │
             └───────────────────────────────────────────────┘
```

The React user interface [12] is the only part the user sees: it renders the chat, contact, and settings views and drives the other client-side parts. The Web Crypto API [2] is the encryption core: it generates ECDH key pairs, derives per-conversation shared secrets, performs AES-GCM encryption and decryption, and hashes public keys into fingerprints. IndexedDB [9] is the storage layer on the trusted side: it holds the private key, pinned peer keys, and encrypted history so that history survives reloads and sessions without ever touching the server.

On the untrusted side, the Node.js WebSocket server [10], built on the ws library [13], terminates client connections, authenticates users, and relays ciphertext to the correct recipient endpoint. MongoDB [14] holds the only data the server retains — user records, password hashes, public keys, and connection metadata. The offline mailbox is a separate, short-lived store for ciphertext addressed to users who are currently disconnected; it expires entries after roughly 24 hours so the server retains nothing indefinitely.

## Technologies and Alternatives Considered

Each technology below is a deliberate choice over plausible alternatives; the table summarizes the decisions, and the paragraphs that follow make the case for the choices that most affect the security properties.

| Need | Chosen | Alternatives considered | Why chosen |
|---|---|---|---|
| UI framework | React [12] | Vue, Svelte, vanilla JS | Component model keeps the sidebar and message list state-driven; incoming messages re-render declaratively instead of manual DOM updates |
| HTTP framework | Express | Fastify, Koa, bare Node `http` | The natural default for the account and authentication endpoints, with the largest middleware ecosystem |
| Runtime | Node.js [10] | Deno, Bun, Python | A web app is best served by a JavaScript runtime shared with the frontend; Node.js is the most widely documented option and no second runtime's conventions are needed |
| Realtime transport | WebSockets [11] | HTTP polling, Server-Sent Events | Bidirectional conversation over one persistent connection; polling re-requests constantly; SSE carries server-to-client data only |
| WebSocket server | ws [13] | Socket.io | One-on-one relay needs no rooms, broadcast, or reconnection fallbacks; a minimal server matches the threat model |
| Database | MongoDB [14] | PostgreSQL, SQLite | Server data is simple metadata records with no joins needed (KISS); the document model fits that shape; managed Atlas hosting |
| Client storage | IndexedDB [9] | localStorage | Transactional, asynchronous, and large-capacity; localStorage is synchronous, small, and readable by any script |
| Cryptography | Web Crypto API [2] | crypto-js, libsodium-wrappers | Native, audited, constant-time implementations; no third-party crypto overhead |
| Key agreement | Static-static ECDH | X3DH + Double Ratchet [4] | Small, analyzable protocol; forward secrecy explicitly traded for scope |
| Password hashing | argon2id | bcrypt, scrypt | Memory-hard and resistant to GPU-based cracking |
| Build tooling | Vite | webpack | Fast dev server and bundling; the standard tool for React projects |
| Routing | react-router | Hand-rolled state | Standard solution avoids hand-rolling navigation logic |
| IndexedDB wrapper | idb | Raw IndexedDB API | Promise wrapper avoids hand-rolling transaction boilerplate |
| Sessions | express-session | JWT | Server-side sessions are revocable and simpler to reason about than self-contained tokens |
| Testing | Vitest | Jest, Cypress | Known-answer tests (fixed input produces the expected ciphertext) for the encryption core |

The browser's native Web Crypto API is chosen over JavaScript cryptography libraries because the implementation's security is the product's entire value. Libraries such as crypto-js are pure JavaScript, which makes them slower and harder to audit than the browser's native, constant-time implementations, and any third-party crypto code adds uncontrolled overhead and supply-chain risk to the one component where a bug is catastrophic. ECDH over P-256 is natively supported by the API [15], and P-256 is also the NIST-standard curve I am already familiar with from government compliance work, so it is the natural choice.

The key-agreement scheme is the second decision with direct security consequences. Static-static ECDH, in which each user has one long-lived key pair and a conversation key is derived once per pair of users, is dramatically simpler than Signal's X3DH and Double Ratchet [4]: it requires no prekeys, no ratchet state, and no session resynchronization. Its cost is the absence of forward secrecy — if a device is compromised, its past messages are decryptable — a property standard references describe as central to modern key establishment [16]. This trade-off is acceptable for two reasons: the server never stores ciphertext beyond a 24-hour delivery window, so an attacker who steals keys from the server has no stored traffic to decrypt, and the private keys never leave the client device, so the dominant exposure is device compromise, which forward secrecy does not address anyway. To avoid the classic footgun of using raw ECDH output directly as a key, the implementation will follow the key-derivation requirements of NIST SP 800-56A [17]. The design also accepts long-lived history deliberately: Off-the-Record messaging argues for ephemeral, deniable conversations [18], whereas FRUM treats client-side history as a core feature.

The storage decisions follow from the threat model. IndexedDB is chosen over localStorage because it is transactional and asynchronous, has far larger capacity for message history, and does not block the main thread; the XSS exposure is equivalent, so capacity and structure decide. MongoDB is chosen over a relational database because the server stores only metadata-shaped documents with no relational queries or joins, and the document model with managed Atlas hosting reduces operational overhead for a single-semester project. The transport decision — WebSockets over polling or Server-Sent Events, and the minimal ws library over Socket.io — follows from the relay design: a persistent bidirectional channel is the natural fit for chat, and a server intentionally limited to routing and delivery needs no richer abstraction.

## New Concepts to Learn

My background before this project consists of Bash scripting — including scripts that generate RSA key pairs, transfer public keys over FTP, and encrypt and decrypt files with OpenSSL — and the CompTIA Security+ course, which covers cryptographic concepts at a conceptual level. The table below separates what the project requires into concepts that are conceptually familiar but new to implement and technologies that are entirely new.

| Conceptually familiar (Security+/scripting), new to implement | Entirely new |
|---|---|
| Asymmetric encryption and key exchange — previously used via the OpenSSL command line, now implemented through the Web Crypto API [1] [2] | React: component model, JSX, hooks, and state management [12] |
| Hashing and fingerprints — the concept is known; wiring SHA-256 into a trust model is new [8] | Node.js: event loop, asynchronous I/O, and the npm ecosystem [10] |
| Threat modeling — Security+ terminology, now applied to an adversarial-server design | Express: routing, middleware, and HTTP APIs |
| Trust models — PKI and CA-based trust are familiar; the TOFU variant is new [6] | WebSockets: connection lifecycle, upgrade handshake, frames [11] |
| Password hashing — the concept is known; implementing argon2id in an application is new | MongoDB: document model, queries, Atlas deployment [14] |
|  | IndexedDB: object stores, transactions, asynchronous API [9] |
|  | Web Crypto API specifics: CryptoKey objects, extractable flags, encryption calls [15] |
|  | Key derivation per NIST SP 800-56A [17] |
|  | Web application deployment: hosting, HTTPS, environment configuration |

## References

[1] W. Diffie and M. E. Hellman, "New directions in cryptography," *IEEE Transactions on Information Theory*, vol. 22, no. 6, pp. 644–654, Nov. 1976. [Online]. Available: https://ee.stanford.edu/~hellman/publications/24.pdf

[2] W3C, "Web Cryptography API," W3C Recommendation, Jan. 2017. [Online]. Available: https://www.w3.org/TR/WebCryptoAPI/

[3] Signal Messenger, "Signal: Technical information." [Online]. Available: https://signal.org/docs/

[4] T. Perrin and M. Marlinspike, "The X3DH key agreement protocol," Signal Messenger, Nov. 2016. [Online]. Available: https://signal.org/docs/specifications/x3dh/

[5] WhatsApp, "WhatsApp encryption overview," Meta. [Online]. Available: https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf

[6] P. Wouters, H. Tschofenig, J. Gilmore, and S. Weiler, "Using raw public keys in Transport Layer Security (TLS) and Datagram Transport Layer Security (DTLS)," RFC 7250, IETF, Jun. 2014. [Online]. Available: https://www.rfc-editor.org/rfc/rfc7250

[7] T. Ylonen and C. Lonvick, "The Secure Shell (SSH) protocol architecture," RFC 4251, IETF, Jan. 2006. [Online]. Available: https://www.rfc-editor.org/rfc/rfc4251

[8] L. Neef and F. Wisiol, "Oh SSH-it, what's my fingerprint? A large-scale analysis of SSH host key fingerprint verification in the wild," in *Proc. Cryptology and Network Security (CANS)*, 2022, LNCS vol. 13641. [Online]. Available: https://arxiv.org/abs/2208.08846

[9] Mozilla, "Using IndexedDB," MDN Web Docs. [Online]. Available: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

[10] OpenJS Foundation, "Node.js API documentation." [Online]. Available: https://nodejs.org/docs/latest/api/

[11] Mozilla, "WebSockets API," MDN Web Docs. [Online]. Available: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

[12] Meta, "React documentation." [Online]. Available: https://react.dev/

[13] The ws team, "ws: a Node.js WebSocket library." [Online]. Available: https://github.com/websockets/ws/blob/HEAD/doc/ws.md

[14] MongoDB, Inc., "MongoDB documentation." [Online]. Available: https://www.mongodb.com/docs/

[15] Mozilla, "SubtleCrypto," MDN Web Docs. [Online]. Available: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto

[16] A. J. Menezes, P. C. van Oorschot, and S. A. Vanstone, *Handbook of Applied Cryptography*. Boca Raton, FL, USA: CRC Press, 1996. [Online]. Available: http://cacr.uwaterloo.ca/hac/

[17] E. Barker, L. Chen, and R. Davis, "Recommendation for pair-wise key-establishment schemes using discrete logarithm cryptography," NIST Special Publication 800-56A Rev. 3, Apr. 2018. [Online]. Available: https://csrc.nist.gov/pubs/sp/800/56/a/r3/final

[18] N. Borisov, I. Goldberg, and E. Brewer, "Off-the-record communication, or, why not to use PGP," in *Proc. ACM Workshop on Privacy in the Electronic Society (WPES)*, 2004. [Online]. Available: https://otr.cypherpunks.ca/otr-wpes.pdf
