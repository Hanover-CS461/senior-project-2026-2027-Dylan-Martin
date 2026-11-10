import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config({ path: new URL('./.env', import.meta.url) });

const client = new MongoClient(process.env.MONGODB_URI);
let db;
let Users;

export async function connect() {
    await client.connect();
    db = client.db('frum');
    Users = await db.collection("Users");
    console.log('connected');
}


export async function close() {
    await client.close();
    console.log("disconnected");
}

export async function UsersExists() {
    if (Users === "Users") { return true; }
    else { return false; }
}

export async function createUserCollection() {
    if (UsersExists) { return; }
    await db.createCollection(Users, {});
    console.log("Created Users Collection")
}

export async function findUserByUsername(username) {
    // TODO: return the user document matching username, or null
    return await Users[username];
}

// Database indexes should be username, passwordHash, publicKey, and keyFingerprint
export async function createUser(username, passwordHash, publicKey, keyFingerprint) {
    // TODO: insert a new user document and return the result
    const doc = {
        username: username,
        passwordHash: passwordHash,
        publicKey: publicKey,
        keyFingerprint: keyFingerprint
    };
    try {
        const result = await Users.insertOne(doc);
        return result.acknowledged;
    }
    catch (error) {
        return error.code;
    }
}

export async function removeUser(username) {
    const result = await Users.deleteOne({ username: username });
    return result.acknowledged;
}
