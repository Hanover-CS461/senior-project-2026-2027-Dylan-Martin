import { Router } from 'express';
import { hash, verify } from 'argon2';
import { createUser, udpateKeyData, getUserHashedPassword, getPublicKey } from '../database.mjs';
import { webcrypto } from 'crypto';
import { type } from 'os';

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

        const result = await createUser(username, hashedPassword, null);

        if (result === 11000) {
            return res.status(409).json({ error: "Username already exists" });
        }

        return res.sendStatus(201);
    } catch (error) {
        console.error(error);
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
    const publicRaw = await webcrypto.subtle.exportKey(
        "raw",
        p
    )
    return webcrypto.subtle.digest('SHA-256', publicRaw);
}

async function exportPublicKey(p) {
    return await webcrypto.subtle.exportKey(
        "jwk",
        p
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


    try {
        const userHashedPasswordField =  await getUserHashedPassword(username)
        const isMatch = await verify(userHashedPasswordField.passwordHash, password);

        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        const currKeyField = await getPublicKey(username);

        // First time login needs keys
        if (currKeyField.publicKey === null) {
            const keyPair = await generateKeys();
            const fingerprintKey = await fingerprintPublicKey(keyPair.publicKey);
            const exportPublic = await exportPublicKey(keyPair.publicKey);

            const result = await udpateKeyData(username, exportPublic, fingerprintKey);
            if (result.modifiedCount === 0 ) {
                return res.status(401).json({ error: "Account does not exist" });
            }
            return res.sendStatus(200);
        }
        // Not first time login
        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to login user" });
    }

});

export default router;