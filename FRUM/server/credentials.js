import dotenv from 'dotenv';
import { MongoClient } from "mongodb";
import express from 'express';
import { hash, verify } from 'argon2';
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

//const passwordHash = await hash("password");
//const ok = await verify (passwordHash, "password");
//console.log(ok);

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

async function createUser(username, passwordHash, publicKey) {
	return;
}

function hashPassword(password) {

}

app.post('/api/signup', (req, res) => {
    if (!isJSON(req.body)) {
        return res.status(400).json({ error: "Expected JSON body" });
    }
    const username = req.body.username;
    const password = req.body.password;
    if (isUsernameEmpty(username) || isPasswordEmpty(password)){
        return res.status(402).json({ error: "Fields can not be empty" });
    }
    res.sendStatus(201);
})

app.listen(3000);
