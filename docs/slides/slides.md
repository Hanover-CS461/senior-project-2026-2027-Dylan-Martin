---
marp: true
theme: gaia
paginate: true
html: true
style: |
  table { font-size: 0.8em; }
  code { font-size: 0.85em; }
---

<!-- _class: lead -->
# FRUM

**Frankly Redundant Unnecessary Messenger**

CS461 Senior Project — Dylan Martin

---

# Introduction

FRUM is a web chat where every message is encrypted end-to-end in the browser — the server that relays the traffic can never read the plaintext.

- Threat model: the server is the adversary — it may see metadata, never plaintext
- All cryptography happens in the browser, so no keys, exception of public key, ever leave your device
- **Motivation**: Improve current understanding of encryption. As well as having a finished lab for resumes.

---

# Acronyms To Know

`ECDH` - Elliptic Curve Diffie-Hellman
`AES-GCM` - Advanced Encryption Standard in Galois/Counter Mode
`KDF` - Key Derivation Function
`SHA` - Secure Hash Algorithm
`X3DH` - Extended Triple Diffie-Hellman
`NIST SP` - National Institue of Standards and Technology Special Publication

---

# Features

- **End-to-end encryption** — ECDH key agreement + AES-GCM, entirely in the browser
- **Trust on first use** — peer keys are pinned and verified via SHA-256 fingerprints
- **Client-side history** — messages stay encrypted in IndexedDB, never on the server
- **Pure-relay server** — stores only public keys and metadata
- **Offline mailbox** — allows for messaging to recipients who are offline

---

# Comparable Solutions

| | Signal | WhatsApp | FRUM |
|---|---|---|---|
| Server sees plaintext? | No | No | No |
| Protocol | X3DH + Double Ratchet | Signal Protocol | Static-static ECDH |
| Forward secrecy | Yes | Yes | No (deliberate) |
| Identity | Phone number | Phone number | Username |
| History lives | Server + device | Server + cloud | Device only |
| Open source | Yes | No | Yes |

---

# Architecture

<div class="mxgraph" style="width:400px;max-width:100%;border:1px solid transparent;margin:0 auto;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;xml&quot;:&quot;&lt;mxfile host=\&quot;app.diagrams.net\&quot;&gt;&lt;diagram name=\&quot;Page-1\&quot; id=\&quot;P3-_StHs5fSa3BKbdDGM\&quot;&gt;&lt;mxGraphModel dx=\&quot;1459\&quot; dy=\&quot;780\&quot; grid=\&quot;1\&quot; gridSize=\&quot;10\&quot; guides=\&quot;1\&quot; tooltips=\&quot;1\&quot; connect=\&quot;1\&quot; arrows=\&quot;1\&quot; fold=\&quot;1\&quot; page=\&quot;1\&quot; pageScale=\&quot;1\&quot; pageWidth=\&quot;850\&quot; pageHeight=\&quot;1100\&quot; math=\&quot;0\&quot; shadow=\&quot;0\&quot;&gt;&lt;root&gt;&lt;mxCell id=\&quot;0\&quot;/&gt;&lt;mxCell id=\&quot;1\&quot; parent=\&quot;0\&quot;/&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-53\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;font style=&amp;quot;font-size: 15px;&amp;quot;&amp;gt;Generate ECDH key pair&amp;lt;/font&amp;gt;&amp;lt;div&amp;gt;&amp;lt;font style=&amp;quot;font-size: 15px;&amp;quot;&amp;gt;Web Crypto API, oncec per identity&amp;lt;/font&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;60\&quot; width=\&quot;240\&quot; x=\&quot;300\&quot; y=\&quot;40\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-54\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;font style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Private key&amp;lt;/font&amp;gt;&amp;lt;div&amp;gt;&amp;lt;font style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Stored in IndexedDB on device only&amp;lt;/font&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;70\&quot; width=\&quot;180\&quot; x=\&quot;120\&quot; y=\&quot;140\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-55\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-54\&quot; style=\&quot;endArrow=none;startArrow=classic;html=1;rounded=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;exitX=0.5;exitY=0;exitDx=0;exitDy=0;edgeStyle=orthogonalEdgeStyle;startFill=1;endFill=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-53\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;470\&quot; y=\&quot;350\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;520\&quot; y=\&quot;300\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-56\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Public key&amp;lt;/span&amp;gt;&amp;lt;div&amp;gt;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;uploaded to MongoDB server side&amp;lt;/span&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;70\&quot; width=\&quot;180\&quot; x=\&quot;540\&quot; y=\&quot;140\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-57\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-53\&quot; style=\&quot;endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;edgeStyle=orthogonalEdgeStyle;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-56\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;470\&quot; y=\&quot;350\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;520\&quot; y=\&quot;300\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;font style=&amp;quot;font-size: 20px;&amp;quot;&amp;gt;Fetch endpoint public key&amp;lt;/font&amp;gt;&amp;lt;div&amp;gt;&amp;lt;font style=&amp;quot;font-size: 20px;&amp;quot;&amp;gt;From MongoDB via server&amp;lt;/font&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;70\&quot; width=\&quot;240\&quot; x=\&quot;300\&quot; y=\&quot;240\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-59\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot; style=\&quot;endArrow=none;html=1;rounded=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;exitX=0.5;exitY=0;exitDx=0;exitDy=0;edgeStyle=orthogonalEdgeStyle;startArrow=classic;startFill=1;endFill=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-56\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;470\&quot; y=\&quot;340\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;520\&quot; y=\&quot;290\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-60\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;font style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Derive Shared Secret&amp;lt;/font&amp;gt;&amp;lt;div&amp;gt;&amp;lt;font style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;ECDH(my priv, their pub) -&amp;amp;gt; KDF -&amp;amp;gt; AES-GCM key&amp;lt;/font&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;60\&quot; width=\&quot;240\&quot; x=\&quot;300\&quot; y=\&quot;360\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-61\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-60\&quot; style=\&quot;endArrow=none;html=1;rounded=0;exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;startArrow=classic;startFill=1;endFill=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;470\&quot; y=\&quot;320\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;520\&quot; y=\&quot;270\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-62\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;font style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Verify Fingerprint&amp;lt;/font&amp;gt;&amp;lt;div&amp;gt;&amp;lt;font style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;SHA-256 of both public kets, compared out-of-band&amp;lt;/font&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;60\&quot; width=\&quot;240\&quot; x=\&quot;300\&quot; y=\&quot;470\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-63\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-60\&quot; style=\&quot;endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-62\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;450\&quot; y=\&quot;390\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;500\&quot; y=\&quot;340\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-64\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;font style=&amp;quot;font-size: 17px;&amp;quot;&amp;gt;Ready to message&amp;lt;/font&amp;gt;&amp;lt;div&amp;gt;&amp;lt;font style=&amp;quot;font-size: 17px;&amp;quot;&amp;gt;Shared AES-GCM key cached locally&amp;lt;/font&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;60\&quot; width=\&quot;240\&quot; x=\&quot;300\&quot; y=\&quot;580\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-66\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-62\&quot; style=\&quot;endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-64\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;450\&quot; y=\&quot;370\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;500\&quot; y=\&quot;320\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;&lt;/diagram&gt;&lt;/mxfile&gt;&quot;,&quot;toolbar&quot;:&quot;pages zoom layers lightbox&quot;,&quot;page&quot;:0}"></div>

<script type="text/javascript" src="https://app.diagrams.net/js/viewer-static.min.js"></script>

---

# Architecture (cont.)

<div class="mxgraph" style="width:400px;max-width:100%;border:1px solid transparent;margin:0 auto;" data-mxgraph="{&quot;highlight&quot;:&quot;#0000ff&quot;,&quot;nav&quot;:true,&quot;resize&quot;:true,&quot;xml&quot;:&quot;&lt;mxfile host=\&quot;app.diagrams.net\&quot;&gt;&lt;diagram name=\&quot;Page-1\&quot; id=\&quot;P3-_StHs5fSa3BKbdDGM\&quot;&gt;&lt;mxGraphModel dx=\&quot;1152\&quot; dy=\&quot;616\&quot; grid=\&quot;1\&quot; gridSize=\&quot;10\&quot; guides=\&quot;1\&quot; tooltips=\&quot;1\&quot; connect=\&quot;1\&quot; arrows=\&quot;1\&quot; fold=\&quot;1\&quot; page=\&quot;1\&quot; pageScale=\&quot;1\&quot; pageWidth=\&quot;850\&quot; pageHeight=\&quot;1100\&quot; math=\&quot;0\&quot; shadow=\&quot;0\&quot;&gt;&lt;root&gt;&lt;mxCell id=\&quot;0\&quot;/&gt;&lt;mxCell id=\&quot;1\&quot; parent=\&quot;0\&quot;/&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-53\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;span style=&amp;quot;font-size: 15px;&amp;quot;&amp;gt;Ciphertext sent over WebSocket&amp;lt;/span&amp;gt;&amp;lt;div&amp;gt;&amp;lt;span style=&amp;quot;font-size: 15px;&amp;quot;&amp;gt;Server checks recipient connection state&amp;lt;/span&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;60\&quot; width=\&quot;240\&quot; x=\&quot;305\&quot; y=\&quot;140\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-54\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Recipient online&amp;lt;/span&amp;gt;&amp;lt;div&amp;gt;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Relayed live over WebSocket&amp;lt;/span&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;70\&quot; width=\&quot;180\&quot; x=\&quot;122.5\&quot; y=\&quot;240\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-55\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-54\&quot; style=\&quot;endArrow=none;startArrow=classic;html=1;rounded=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;exitX=0.5;exitY=0;exitDx=0;exitDy=0;edgeStyle=orthogonalEdgeStyle;startFill=1;endFill=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-53\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;470\&quot; y=\&quot;350\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;520\&quot; y=\&quot;300\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-56\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Recipient offline&amp;lt;/span&amp;gt;&amp;lt;div&amp;gt;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Queued in MongoDB, ~24h TTL&amp;lt;/span&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;70\&quot; width=\&quot;180\&quot; x=\&quot;545\&quot; y=\&quot;240\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-57\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-53\&quot; style=\&quot;endArrow=classic;html=1;rounded=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;edgeStyle=orthogonalEdgeStyle;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-56\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;mxPoint x=\&quot;470\&quot; y=\&quot;350\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;520\&quot; y=\&quot;300\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;span style=&amp;quot;font-size: 20px;&amp;quot;&amp;gt;Ciphertext arrives at recipient browser&amp;lt;/span&amp;gt;&amp;lt;div&amp;gt;&amp;lt;span style=&amp;quot;font-size: 20px;&amp;quot;&amp;gt;Same derived AES-GCM key&amp;lt;/span&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;70\&quot; width=\&quot;605\&quot; x=\&quot;123\&quot; y=\&quot;345\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;GAgfhNuNm2BYbKR1eKeO-60\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;Decrypt and render&amp;lt;/span&amp;gt;&amp;lt;div&amp;gt;&amp;lt;span style=&amp;quot;font-size: 18px;&amp;quot;&amp;gt;React UI shows plaintext; ack/delete from mailbox&amp;lt;/span&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;70\&quot; width=\&quot;240\&quot; x=\&quot;305.5\&quot; y=\&quot;450\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;jherzpwTcLiryubI9R6w-2\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;jherzpwTcLiryubI9R6w-1\&quot; style=\&quot;edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-53\&quot;&gt;&lt;mxGeometry relative=\&quot;1\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;jherzpwTcLiryubI9R6w-1\&quot; parent=\&quot;1\&quot; style=\&quot;rounded=1;whiteSpace=wrap;html=1;\&quot; value=\&quot;&amp;lt;span style=&amp;quot;font-size: 15px;&amp;quot;&amp;gt;Encrypt plaintext locally&amp;lt;/span&amp;gt;&amp;lt;div&amp;gt;&amp;lt;span style=&amp;quot;font-size: 15px;&amp;quot;&amp;gt;AES-GCM with shared key + fresh nonce&amp;lt;/span&amp;gt;&amp;lt;/div&amp;gt;\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;60\&quot; width=\&quot;240\&quot; x=\&quot;305\&quot; y=\&quot;40\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;jherzpwTcLiryubI9R6w-3\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-54\&quot; style=\&quot;edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.148;entryY=0.017;entryDx=0;entryDy=0;entryPerimeter=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot;&gt;&lt;mxGeometry relative=\&quot;1\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;jherzpwTcLiryubI9R6w-4\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-56\&quot; style=\&quot;edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.847;entryY=0.048;entryDx=0;entryDy=0;entryPerimeter=0;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot;&gt;&lt;mxGeometry relative=\&quot;1\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;jherzpwTcLiryubI9R6w-5\&quot; edge=\&quot;1\&quot; parent=\&quot;1\&quot; source=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot; style=\&quot;endArrow=none;html=1;rounded=0;exitX=0.147;exitY=0.036;exitDx=0;exitDy=0;exitPerimeter=0;entryX=0.843;entryY=-0.003;entryDx=0;entryDy=0;entryPerimeter=0;curved=1;edgeStyle=orthogonalEdgeStyle;innerLoopWaypoints=1;\&quot; target=\&quot;GAgfhNuNm2BYbKR1eKeO-58\&quot; value=\&quot;\&quot;&gt;&lt;mxGeometry height=\&quot;50\&quot; relative=\&quot;1\&quot; width=\&quot;50\&quot; as=\&quot;geometry\&quot;&gt;&lt;Array as=\&quot;points\&quot;&gt;&lt;mxPoint x=\&quot;211.89\&quot; y=\&quot;320\&quot;/&gt;&lt;mxPoint x=\&quot;633.05\&quot; y=\&quot;320\&quot;/&gt;&lt;/Array&gt;&lt;mxPoint x=\&quot;400\&quot; y=\&quot;360\&quot; as=\&quot;sourcePoint\&quot;/&gt;&lt;mxPoint x=\&quot;450\&quot; y=\&quot;310\&quot; as=\&quot;targetPoint\&quot;/&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell id=\&quot;jherzpwTcLiryubI9R6w-6\&quot; parent=\&quot;1\&quot; style=\&quot;text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;\&quot; value=\&quot;On reconnect, client pulls queued ciphertexts\&quot; vertex=\&quot;1\&quot;&gt;&lt;mxGeometry height=\&quot;30\&quot; width=\&quot;224\&quot; x=\&quot;312\&quot; y=\&quot;290\&quot; as=\&quot;geometry\&quot;/&gt;&lt;/mxCell&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;&lt;/diagram&gt;&lt;/mxfile&gt;&quot;,&quot;toolbar&quot;:&quot;pages zoom layers lightbox&quot;,&quot;page&quot;:0}"></div>

<script type="text/javascript" src="https://app.diagrams.net/js/viewer-static.min.js"></script>

---

# Technology Overview

| In the browser | On the server |
|---|---|
| React + Vite + react-router | Node.js + Express |
| Web Crypto API (ECDH, AES-GCM) | ws (WebSocket relay) |
| IndexedDB (keys, encrypted history) | MongoDB (users, public keys) |
|  | argon2id (password hashing) |

Also: express-session, Vitest (crypto tests)

---

# Choice: Web Crypto API

- All cryptography runs in the browser — native, audited, constant-time
- No third-party crypto code in the supply chain, no uncontrolled overhead
- Alternatives: crypto-js (pure JavaScript — slower, harder to audit), libsodium-wrappers (extra dependency)

---

# Choice: Static-Static ECDH

- One long-lived keypair per user; one conversation key per pair of users
- FRUM trades forward secrecy for a protocol small enough to implement
- The server stores no history, and device compromise defeats forward secrecy anyway
- Key derivation follows NIST SP 800-56A — never raw ECDH output as a key

---

# Choice: WebSockets + ws

- Chat needs both directions — WebSockets give a persistent, bidirectional channel
- HTTP polling re-requests constantly; Server-Sent Events are server-to-client only
- ws over Socket.io: a one-on-one relay needs no rooms, broadcast, or reconnection fallbacks

---

# Choice: IndexedDB + MongoDB

- IndexedDB over localStorage: transactional, asynchronous, large capacity
- Keys and encrypted history stay on the device — the server never holds them
- MongoDB over SQLite/PostgreSQL: metadata-only records with no joins

---

# The Rest, Briefly

| Choice | Alternative(s) | Why |
|---|---|---|
| Express | Fastify, Koa | natural default, middleware ecosystem |
| argon2id | bcrypt, scrypt | memory-hard, GPU-resistant |
| Vite | webpack | standard, fast dev server |
| react-router | hand-rolled | standard navigation |
| express-session | JWT | revocable server-side sessions |
| Vitest | Jest, Cypress | known-answer crypto tests |

---

<!-- _class: lead -->
# Summary

- Encryption happens in the browser with hybrid approach — the server never sees plaintext
- Trust through TOFU key pinning and fingerprint verification
- A simple, analyzable protocol — forward secrecy deliberately traded for scope
- History belongs to the device, not the server

---

<!-- _class: lead -->
# Thank You

Questions?
