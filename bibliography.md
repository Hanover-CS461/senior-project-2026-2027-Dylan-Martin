# Annotated Bibliography

---

## 1. React — Official Documentation

**Link:** [https://react.dev/][React]

**Source type:** Primary source. This is the official documentation website for React, maintained by the React core team and open-source contributors. It is the authoritative reference for the library itself, not a secondary source commenting on it.

**Relation to app:** React is a `resource` that will be used in my project. It is the frontend framework for my application. Anything that the user interacts with in the GUI will be a React component. 

**Description:** React is an open-source JavaScript library, created by [Meta][facebook], for building user interfaces from composable components. The site hosts an interactive tutorial, a full API reference, and in-depth guides covering components, hooks (`useState`, `useEffect`, etc.), rendering behavior, and patterns for integrating with browser APIs. It is the canonical place React developers go to learn the framework.

**Relevance:** Chat frontend depends on React's effect system. Since React uses a virtual DOM it will be a lot easier to open chat messages without fully rendering the page again. The effect system and rendering are very important for mounting and unmounting WebSocket connections.

## 2. MongoDB — Official Documentation

**Link:** [https://www.mongodb.com/docs/][Mongo]

**Source type:** Primary source. Official documentation published by MongoDB, Inc., the company that develops the database. The docs are the definitive reference for MongoDB's data model and drivers.

**Relation to app:** 

**Description:** MongoDB is a document-oriented NoSQL database that stores data as JSON-like documents in collections. The official docs cover the data model, CRUD operations, indexing, aggregation, and the Node.js driver API, along with Atlas (MongoDB's hosted cloud service). The driver documentation is particularly relevant, as it describes how a Node backend connects to and queries the database.

**Relevance:** 

---

## 3. MDN — WebSockets API

**Link:** [https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API][WebSocket]

**Source type:** Primary documentation. MDN Web Docs is operated by Mozilla with a broad open-source contributor community and is the canonical reference for web platform APIs. It documents the WebSocket interface as implemented in browsers; the underlying protocol specification is RFC 6455.

**Relation to app:** 

**Description:** This page explains the browser's WebSockets API: how a connection is established through an HTTP upgrade handshake, the `readyState` states a connection moves through, sending and receiving text and binary messages, and the `open`, `message`, `error`, and `close` events. It is the standard reference for using WebSockets in a browser.

**Relevance:** 

---

## 4. Node.js — Official API Documentation

**Link:** [https://nodejs.org/docs/latest/api/][Node]

**Source type:** Primary source. Official API documentation published by the Node.js project under the OpenJS Foundation. It is the authoritative reference for the Node.js standard library.

**Relation to app:** 

**Description:** Node.js is a JavaScript runtime built on Google's V8 engine, designed for I/O-heavy, event-driven applications. The API documentation covers the standard library, including the `http` module, `crypto`, `events`, and `streams`, along with the event-loop model that makes Node well suited to long-lived connections.

**Relevance:** 

---

## 5. MDN — Using IndexedDB

**Link:** [https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB][Index]

**Source type:** Primary documentation. Part of MDN Web Docs (Mozilla), the canonical reference for web platform APIs, written and maintained in collaboration with the web standards community.

**Relation to app:** 

**Description:** This guide walks through the IndexedDB API: opening a database, creating object stores, using transactions, adding and retrieving records, and working with indexes. IndexedDB is a transactional, asynchronous, key-value database built into every modern browser, designed for storing significant amounts of structured data client-side.

**Relevance:** 

---

## 6. ws — WebSocket Library Documentation

**Link:** [https://github.com/websockets/ws/blob/HEAD/doc/ws.md][ws]

**Source type:** Primary source. This is the official documentation for the `ws` library, maintained in the library's own GitHub repository by the `ws` team. It describes the library from the inside.

**Relation to app:** 

**Description:** `ws` is a lightweight, widely used WebSocket implementation for Node.js. The docs cover creating a `WebSocketServer`, handling the HTTP upgrade handshake, broadcasting to connected clients, ping/pong keepalive frames, and client-side usage. It is the de facto standard WebSocket library in the Node ecosystem, with a minimal API that stays close to the raw protocol.

**Relevance:** 

---




[facebook]: https://www.meta.com/about/
[React]: https://react.dev/
[Mongo]: https://www.mongodb.com/docs/
[WebSocket]: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
[Node]: https://nodejs.org/docs/latest/api/
[Index]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
[ws]: https://github.com/websockets/ws/blob/HEAD/doc/ws.md
