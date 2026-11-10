import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config({ path: new URL('./.env', import.meta.url) });

const client = new MongoClient(process.env.MONGODB_URI);
let db;
let collections = null;

export async function connect() {
    await client.connect();
    db = client.db('frum');
    collections = await db.listCollections().toArray();
    console.log('connected');
}


export async function close() {
    await client.close();
    console.log("disconnected");
}

export async function UsersExists() {
    const collectionName = collections[0]["name"];
    if (collectionName === "Users") { return true; }
    else { return false; }
}

export async function createUserCollection() {
    if (UsersExists) { return; }
    await db.createCollection(Users, {});
    console.log("Created Users Collection")
}

export async function findUserByUsername(username) {
    // TODO: return the user document matching username, or null
    return await collections[0][username];
}

export async function createUser(username, passwordHash, publicKey) {
    // TODO: insert a new user document and return the result
    console.log(findUserByUsername(username));
}
