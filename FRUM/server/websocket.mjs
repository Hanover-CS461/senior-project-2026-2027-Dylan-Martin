import { WebSocketServer, WebSocket } from 'ws';
import { getAcceptedFriends, getFriendship } from './database.mjs';
import { validMessageText, validUsernameParam } from './validation.mjs';

const online = new Map();

function sendTo(username, payload) {
    const sockets = online.get(username);
    if (!sockets) return false;

    const data = JSON.stringify(payload);
    let delivered = false;
    for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
            delivered = true;
        }
    }
    return delivered;
}

async function friendsOf(username) {
    const docs = await getAcceptedFriends(username);
    return docs.map(doc => (doc.sender === username ? doc.recipient : doc.sender));
}

export function attachWebSocket(server, sessionMiddleware) {
    const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });

    server.on('upgrade', (req, socket, head) => {
        if (req.url !== '/ws') {
            socket.destroy();
            return;
        }

        sessionMiddleware(req, {}, (err) => {
            if (err || !req.session?.username) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        });
    });

    wss.on('connection', async (ws, req) => {
        const username = req.session.username;
        ws.isAlive = true;

        if (!online.has(username)) online.set(username, new Set());
        online.get(username).add(ws);

        try {
            const friends = await friendsOf(username);
            for (const friend of friends) {
                if (online.has(friend)) {
                    sendTo(username, { type: 'presence', username: friend, online: true });
                }
            }
            for (const friend of friends) {
                sendTo(friend, { type: 'presence', username, online: true });
            }
        } catch (error) {
            console.error('presence error:', error);
        }

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        let messageCount = 0;
        let windowStart = Date.now();

        ws.on('message', async (raw) => {
            const now = Date.now();
            if (now - windowStart > 10000) {
                windowStart = now;
                messageCount = 0;
            }
            messageCount += 1;
            if (messageCount > 30) return;

            let msg;
            try {
                msg = JSON.parse(raw.toString());
            } catch {
                return;
            }

            if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;
            if (msg.type !== 'chat') return;

            const to = validUsernameParam(msg.to);
            const text = validMessageText(msg.text);
            if (!to || !text) return;

            try {
                const friendship = await getFriendship(username, to);
                if (!friendship || friendship.status !== 'accepted') return;

                const delivered = sendTo(to, {
                    type: 'chat',
                    from: username,
                    text
                });
                if (!delivered) {
                    sendTo(username, { type: 'chat-error', to, error: 'offline' });
                }
            } catch (error) {
                console.error('relay error:', error);
            }
        });

        ws.on('close', async () => {
            const sockets = online.get(username);
            if (sockets) {
                sockets.delete(ws);
                if (sockets.size === 0) online.delete(username);
            }
            if (online.has(username)) return;

            try {
                const friends = await friendsOf(username);
                for (const friend of friends) {
                    sendTo(friend, { type: 'presence', username, online: false });
                }
            } catch (error) {
                console.error('presence error:', error);
            }
        });

        ws.on('error', () => {});
    });

    const heartbeat = setInterval(() => {
        for (const ws of wss.clients) {
            if (ws.isAlive === false) {
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, 30000);
    heartbeat.unref();

    wss.on('close', () => clearInterval(heartbeat));

    return wss;
}
