import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config({ path: new URL('./.env', import.meta.url) });

const client = new MongoClient(process.env.MONGODB_URI);
let db;
let Users;
let Friends;

export async function connect() {
    await client.connect();
    db = client.db('frum');
    Users = db.collection("Users");
    Friends = db.collection("friends");
    console.log('connected');
}


export async function close() {
    await client.close();
    console.log("disconnected");
}

export async function UsersExists() {
    const collections = await db.listCollections({ name: "Users" }).toArray();
    return collections.length > 0;
}

export async function createUserCollection() {
    if (!(await UsersExists())) {
        await db.createCollection("Users");
        console.log("Created Users Collection");
    }
    await Users.createIndex({ username: 1 }, { unique: true });
}

// Database indexes should be username, passwordHash, publicKey, and keyFingerprint
export async function createFriendsCollection() {
    const collections = await db.listCollections({ name: "friends" }).toArray();
    if (collections.length === 0) {
        await db.createCollection("friends");
        console.log("Created friends Collection");
    }
    // pair is a single string of the two usernames sorted (sender + recipient), unique per directionless pair
    await Friends.createIndex({ pair: 1 }, { unique: true });
    // recipient's pending/declined inbox, newest first
    await Friends.createIndex({ recipient: 1, status: 1, createdAt: -1 });
    // sender's accepted friends (for chat/WS lookups)
    await Friends.createIndex({ sender: 1, status: 1, createdAt: -1 });
}

export async function createUser(username, passwordHash, publicKey = null, keyFingerprint = null) {
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
    if (typeof username !== 'string') return false;
    const result = await Users.deleteOne({ username: username });
    return result.acknowledged;
}

export async function udpateKeyData(username, key, fingerprint) {
    const result = await Users.updateOne(
        { username: username },
        { $set: { publicKey: key, keyFingerprint: fingerprint } }
    );
    return result;

}

export async function getUserHashedPassword(username) {
    if (typeof username !== 'string') return null;
    const hashedPasswordField = await Users.findOne({ username: username }, { projection: { passwordHash: 1, _id: 0 } });
    return hashedPasswordField;
}

export async function getPublicKey(username) {
    if (typeof username !== 'string') return null;
    const keyField = await Users.findOne({ username: username }, { projection: { publicKey: 1, _id: 0 } });
    return keyField;
}

export async function getUserKeyData(username) {
    if (typeof username !== 'string') return null;
    const keyField = await Users.findOne({ username: username }, { projection: { publicKey: 1, keyFingerprint: 1, _id: 0 } });
    return keyField;
}

export async function getUserDoc(username) {
    if (typeof username !== 'string') return null;
    const userDoc = await Users.findOne({ username: username }, { projection: { passwordHash: 0 } });
    return userDoc;
}

function pairKey(a, b) {
    return [a, b].sort().join("\n")
}

export async function insertFriendRequest(sender, recipient) {
    const doc = {
        sender,
        recipient,
        pair: pairKey(sender, recipient),
        status: "pending",
        createdAt: new Date()
    }
    try {
        const result = await Friends.insertOne(doc);
        return result.acknowledged;
    }
    catch (error) {
        return error.code;
    }
}

export async function getFriendship(a, b) {
    const friendship = await Friends.findOne({ pair: pairKey(a, b)})
    return friendship
}

export async function updateFriendStatus(a, b, status) {
    const result = await Friends.updateOne(
        { pair: pairKey(a, b) },
        { $set: { status }}
    )
    return result
}

export async function getIncomingRequests(username) {
    const result = await Friends.find(
        { recipient: username, status: "pending"}
    ).sort({ createdAt: -1 }).toArray()
    return result
}

export async function getAcceptedFriends(username) {
    const result = await Friends.find(
        { status: "accepted", $or: [{ sender: username }, { recipient: username }] }
    ).toArray()
    return result
}

export async function removeFriendship(a, b) {
    const result = await Friends.deleteOne(
        { pair: pairKey(a, b) }
    )
    return result
}
