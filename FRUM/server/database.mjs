import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function connect() {
    await client.connect();
    db = client.db('frum');
    console.log('connected');
}

export async function close() {
    await client.close();
}

export async function findUserByUsername(username) {
    // TODO: return the user document matching username, or null
}

export async function createUser(username, passwordHash, publicKey) {
    // TODO: insert a new user document and return the result
}
