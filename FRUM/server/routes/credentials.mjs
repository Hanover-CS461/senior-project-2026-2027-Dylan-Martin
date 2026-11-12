import { Router } from 'express';
import { hash, verify } from 'argon2';
import {
    createUser,
    getUserHashedPassword,
    getPublicKey,
    udpateKeyData
} from '../database.mjs';

const router = Router();

router.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            error: "Username and password are required"
        });
    }

    try {
        const hashedPassword = await hash(password);

        const result = await createUser(username, hashedPassword, null, null);

        if (result === 11000) {
            return res.status(409).json({ error: "Username already exists" });
        }

        if (result !== true) {
            return res.status(500).json({ error: "Failed to create user" });
        }

        return res.sendStatus(201);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to create user" });
    }
});

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            error: "Username and password are required"
        });
    }


    try {
        const userHashedPasswordField = await getUserHashedPassword(username);

        if (!userHashedPasswordField) {
            return res.status(401).json({ error: "Incorrect username or password" });
        }

        const isMatch = await verify(userHashedPasswordField.passwordHash, password);

        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        const keyField = await getPublicKey(username);
        const needsPublicKey = !keyField || keyField.publicKey === null;

        return res.status(200).json({ username, needsPublicKey });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to log in" });
    }
});

router.post('/keys', async (req, res) => {
    const username = req.body.username;
    const publicKey = req.body.publicKey;
    const keyFingerprint = req.body.keyFingerprint;

    if (
        typeof username !== 'string' ||
        !username.trim() ||
        !publicKey ||
        typeof keyFingerprint !== 'string' ||
        !keyFingerprint
    ) {
        return res.status(400).json({
            error: "username, publicKey, and keyFingerprint are required"
        });
    }

    try {
        const result = await udpateKeyData(username, publicKey, keyFingerprint);

        if (!result || result.matchedCount === 0) {
            return res.status(404).json({ error: "Account does not exist" });
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to store public key" });
    }
});

export default router;