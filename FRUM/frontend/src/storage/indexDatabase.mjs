const DB_NAME = 'client storage';
const DB_VERSION = 4;

const PRIVATE_KEY_ID = 'identity-private-key';
const IDENTITY_ID = 'identity';

export function openKeyDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains('keys')) {
				db.createObjectStore('keys');
			}
			if (!db.objectStoreNames.contains('peers')) {
				db.createObjectStore('peers');
			}
			if (!db.objectStoreNames.contains('messages')) {
				db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
			}
		};

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
	});
}

function requestAsPromise(request) {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function getItem(storeName, key) {
	const db = await openKeyDatabase();
	const transaction = db.transaction(storeName, 'readonly');
	return requestAsPromise(transaction.objectStore(storeName).get(key));
}

export async function getAllItems(storeName) {
	const db = await openKeyDatabase();
	const transaction = db.transaction(storeName, 'readonly');
	return requestAsPromise(transaction.objectStore(storeName).getAll());
}

export async function putItem(storeName, value, key) {
	const db = await openKeyDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, 'readwrite');
		const store = transaction.objectStore(storeName);

		if (key === undefined) {
			store.put(value);
		} else {
			store.put(value, key);
		}

		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});
}

export async function deleteItem(storeName, key) {
	const db = await openKeyDatabase();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, 'readwrite');
		transaction.objectStore(storeName).delete(key);

		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});
}

export function storePrivateKey(privateKey) {
	return putItem('keys', privateKey, PRIVATE_KEY_ID);
}

export function getPrivateKey() {
	return getItem('keys', PRIVATE_KEY_ID);
}

export function storeIdentity(publicKey, fingerprint) {
	return putItem('keys', { publicKey, fingerprint }, IDENTITY_ID);
}

export function getIdentity() {
	return getItem('keys', IDENTITY_ID);
}

export function storePinnedPeerKey(username, publicKey, fingerprint) {
	return putItem(
		'peers',
		{ username, publicKey, fingerprint, pinnedAt: Date.now() },
		username
	);
}

export function getPinnedPeerKey(username) {
	return getItem('peers', username);
}

export function storeMessage(peer, ciphertext, direction, timestamp = Date.now()) {
	return putItem('messages', { peer, ciphertext, direction, timestamp });
}

export async function getMessagesForPeer(peer) {
	const messages = await getAllItems('messages');
	return messages
		.filter((message) => message.peer === peer)
		.sort((a, b) => a.timestamp - b.timestamp);
}
