import express from 'express'
import session from 'express-session'

import credentialsRouter from './routes/credentials.mjs';
import keysRouter from './routes/keys.mjs';
import friendRouter from './routes/friends.mjs';
import { blockedApiGuard } from './middleware/loginLimiter.mjs';
import { attachWebSocket } from './websocket.mjs';

import {
    connect,
    createUserCollection,
    createFriendsCollection,
    close
} from './database.mjs';

import dotenv from 'dotenv'

dotenv.config({ path: new URL('./.env', import.meta.url) });

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});
app.use(express.json({ limit: '16kb' }));

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false, httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 }
});
app.use(sessionMiddleware);

app.use('/api', blockedApiGuard);
app.use('/api/credential', credentialsRouter);
app.use('/api/keys', keysRouter)
app.use('/api/friends', friendRouter)
startServer();

async function startServer() {
    await connect();
    await createUserCollection();
    await createFriendsCollection();

    const server = app.listen(process.env.PORT, () => {
        console.log("server runnin");
    });
    const wss = attachWebSocket(server, sessionMiddleware);

    async function shutdown() {
        console.log("\nShutting down server...");
        for (const ws of wss.clients) ws.close();
        wss.close();
        server.close(async (error) => {
            try {
                await close();
            } catch (dbError) {
                console.error('MongoDB shutdown error:', dbError);
                process.exitCode = 1;
            }

            if (error) {
                console.error('HTTP shutdown error:', error);
                process.exitCode = 1;
            }
        });
    }

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}