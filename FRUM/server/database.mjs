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

export async function udpateKeyData(username, key, fingerprint) {
    try{
        const result = await Users.updateOne(
            { username: username },
            { $set: { publicKey: key, keyFingerprint: fingerprint } }
        );
        return result;
    } catch (error) {
        return error.code
    }
    

}

export async function getUserHashedPassword(username) {
    const hashedPasswordField = await Users.findOne({ username: username }, { projection: { passwordHash: 1, _id: 0 } });
    return hashedPasswordField;
}

export async function getPublicKey(username) {
    const keyField = await Users.findOne({ username: username }, { projection: { publicKey: 1, _id: 0 } });
    return keyField;
}
