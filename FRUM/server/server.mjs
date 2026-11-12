import express from 'express'

import credentialsRouter from './routes/credentials.mjs';

import {
    connect,
    createUserCollection,
    close
} from './database.mjs';

const app = express();

app.use(express.json());

app.use('/api', credentialsRouter);

startServer();

async function startServer() {
    await connect();
    await createUserCollection();

    const server = app.listen(3000, () => {
        console.log("server runnin on port 3000");
    });

    async function shutdown() {
        console.log("\nShutting down server...");
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