import { Router } from 'express';
import { hash, verify } from 'argon2';
import {
    createUser,
    getUserHashedPassword,
    getPublicKey,
    removeUser
} from '../database.mjs';

import { isAuthenticated } from '../middleware/auth.js';
import {
    loginAttemptLimiter,
    recordLoginFailure,
    clearLoginFailures
} from '../middleware/loginLimiter.mjs';
import {
    validSignupUsername,
    validUsernameParam,
    validPassword
} from '../validation.mjs';

const router = Router();

router.post('/signup', async (req, res) => {
    const username = validSignupUsername(req.body.username);
    const password = validPassword(req.body.password);
    if (!username || !password) {
        return res.status(400).json({
            error: "Username must be 3-32 characters (letters, numbers, _ . -) and password is required"
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

router.post('/login', loginAttemptLimiter, async (req, res) => {
    const username = validUsernameParam(req.body.username);
    const password = validPassword(req.body.password);
    if (!username || !password) {
        return res.status(400).json({
            error: "Username and password are required"
        });
    }


    try {
        const userHashedPasswordField = await getUserHashedPassword(username);

        if (!userHashedPasswordField) {
            recordLoginFailure(req);
            return res.status(401).json({ error: "Incorrect username or password" });
        }

        const isMatch = await verify(userHashedPasswordField.passwordHash, password);

        if (!isMatch) {
            recordLoginFailure(req);
            return res.status(401).json({ error: "Incorrect password" });
        }

        const keyField = await getPublicKey(username);
        const needsPublicKey = !keyField || keyField.publicKey === null;

        await new Promise((resolve, reject) => {
            req.session.regenerate((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        req.session.username = username;
        // promise return created with help of opencode agent
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        clearLoginFailures(req);
        return res.status(200).json({ username, needsPublicKey });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to log in" });
    }
});

router.delete('/logout', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) return reject(err);
                resolve();
            });
            res.clearCookie('connect.sid');
            res.status(200).json("Logged out");
        });
    } catch (error) {
        res.status(500).json({ error: "failed to logout" });
    }
});

router.get('/me', isAuthenticated, (req, res) => {
    return res.status(200).json({ username: req.session.username });
})

router.delete('/removeUser', isAuthenticated, async (req, res) => {
    const username = req.session.username;
    try {
        const result = await removeUser(username);
        res.status(204).json("Removed and logged out user");
    } catch (error) {
        res.status(500).json({ error: "failed to remove account" });
    }
})


export default router;