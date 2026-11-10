import { Router } from 'express';
import { hash } from 'argon2';
import { createUser, udpateKeyData } from '../database.mjs';
import { webcrypto } from 'crypto';
import { type } from 'os';

const router = Router();
const subtle = webcrypto;

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

        const result = await createUser(username, hashedPassword, null);

        if (result === 11000) {
            return res.status(409).json({ error: "Username already exists" });
        }

        return res.sendStatus(201);
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Failed to create user" });
    }
});


async function generateKeys() {
    return await webcrypto.subtle.generateKey(
        {
            name: "ECDH",
			namedCurve: "P-256"
        },
        false,
        ['deriveKey', 'deriveBits']
    );
}

async function fingerprintPublicKey(p) {
    const publicRaw = webcrypto.subtle.exportKey(
        "raw",
        p
    )
    return webcrypto.subtle.digest('SHA-256', publicRaw);
}

async function exportPublicKey(keys) {
    return await webcrypto.subtle.exportKey(
        "jwk",
        keys.publicKey
    );
}

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
    const keyPair = await generateKeys();
    const fingerprintKey = await fingerprintPublicKey(keyPair.publicKey);
    const exportPublic = await exportPublicKey(keyPair.publicKey);

    // const result = await udpateKeyData(username, exportPublic, fingerprintKey);

});

export default router;