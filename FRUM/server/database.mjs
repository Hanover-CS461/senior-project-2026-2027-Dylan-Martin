import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config({ path: new URL('./.env', import.meta.url) });

const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function connect() {
    await client.connect();
    db = client.db('frum');
    console.log('connected');
}

export async function close() {
    await client.close();
    console.log("disconnected");
}

export async function UsersExists() {
    const collections = await db.listCollections().toArray();
    const collectionName = collections[0]["name"];
    if (collectionName === "Users") { return true; }
    else { return false; }
}

export async function createUserCollection() {
    if (UsersExists) { return; }
    await db.createCollection(Users, {});
    console.log("Created Users Collection")
}

export async function listUsernames() {
    const docs = await db.collections();
    console.log(docs);
}

export async function findUserByUsername(username) {
    // TODO: return the user document matching username, or null
}

export async function createUser(username, passwordHash, publicKey) {
    // TODO: insert a new user document and return the result
}
