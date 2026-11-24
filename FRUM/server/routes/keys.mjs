import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
    getUserKeyData,
    udpateKeyData
} from '../database.mjs';
import {
    normalizePublicKeyJwk,
    publicKeyFingerprint,
    validFingerprint,
    validUsernameParam
} from '../validation.mjs';

const router = Router();

router.post('/key', isAuthenticated, async (req, res) => {
    const username = req.session.username;
    const publicKey = normalizePublicKeyJwk(req.body.publicKey);
    const keyFingerprint = req.body.keyFingerprint;

    if (!username || !publicKey || !validFingerprint(keyFingerprint)) {
        return res.status(400).json({
            error: "Invalid publicKey or keyFingerprint"
        });
    }

    if (publicKeyFingerprint(publicKey) !== keyFingerprint) {
        return res.status(400).json({
            error: "keyFingerprint does not match publicKey"
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

router.get('/key/:username', isAuthenticated, async (req, res) => {
    const username = validUsernameParam(req.params.username);
    if (!username) {
        return res.status(400).json({ error: "Invalid username" });
    }

    try {
        const result = await getUserKeyData(username);

        if (!result || !result.publicKey || !result.keyFingerprint) {
            return res.status(404).json({ error: "Public key not found" });
        }

        return res.status(200).json({
            publicKey: result.publicKey,
            keyFingerprint: result.keyFingerprint
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve public key" });
    }
});

export default router;