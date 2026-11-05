import express from 'express';
import { hash } from 'argon2';
import { connect, createUser } from './database.mjs';

await connect();

const app = express();
app.use(express.json());

function isJSON(reqBody) {
	if (reqBody === undefined) { return false }
	else { return true }
}

function isUsernameEmpty(username) {
	if (username.length === 0) { return true }
	else { return false }
}

function isPasswordEmpty(password) {
	if (password.length === 0) { return true }
	else { return false }
}

function hashPassword(password) {
	return hash(password);
}

app.post('/api/signup', async (req, res) => {
    if (!isJSON(req.body)) {
        return res.status(400).json({ error: "Expected JSON body" });
    }
    const username = req.body.username;
    const password = req.body.password;
    if (isUsernameEmpty(username) || isPasswordEmpty(password)){
        return res.status(402).json({ error: "Fields can not be empty" });
    }
    const passwordHash = await hashPassword(password);
    await createUser(username, passwordHash, req.body.publicKey);
    res.sendStatus(201);
})

app.listen(3000);
