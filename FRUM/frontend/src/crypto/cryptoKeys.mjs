// co written agent and myself
import {
	storePrivateKey,
	getPrivateKey,
	storeIdentity,
	getIdentity,
	getPinnedPeerKey,
	storePinnedPeerKey,
} from '../storage/indexDatabase.mjs';

const subtle = globalThis.crypto.subtle;

export async function generateKeys() {
	return subtle.generateKey(
		{
			name: 'ECDH',
			namedCurve: 'P-256',
		},
		false,
		['deriveKey', 'deriveBits']
	);
}

export async function exportPublicKey(publicKey) {
	return subtle.exportKey('jwk', publicKey);
}

export async function importPublicKey(jwk) {
	return subtle.importKey(
		'jwk',
		jwk,
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		[]
	);
}

export function formatFingerprint(buffer) {
	return Array.from(new Uint8Array(buffer), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join(':');
}

export async function fingerprintPublicKey(publicKey) {
	const raw = await subtle.exportKey('raw', publicKey);
	const digest = await subtle.digest('SHA-256', raw);
	return formatFingerprint(digest);
}

// idea and structure came from opencode agent
export async function initializeIdentity() {
	const [existingPrivateKey, existingIdentity] = await Promise.all([
		getPrivateKey(),
		getIdentity(),
	]);

	if (existingPrivateKey && existingIdentity) {
		return existingIdentity;
	}

	const keyPair = await generateKeys();
	const publicKey = await exportPublicKey(keyPair.publicKey);
	const fingerprint = await fingerprintPublicKey(keyPair.publicKey);

	await storePrivateKey(keyPair.privateKey);
	await storeIdentity(publicKey, fingerprint);

	return { publicKey, fingerprint };
}

export async function publishPublicKey(username, identity) {
	const response = await fetch('/api/keys/key', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			username,
			publicKey: identity.publicKey,
			keyFingerprint: identity.fingerprint,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error ?? 'Failed to publish public key');
	}
}

const HKDF_SALT = new TextEncoder().encode('frum-v1');

export async function deriveSharedKey(privateKey, peerPublicKey) {
    const sharedSecret = await subtle.deriveBits(
    {
        name: "ECDH",
        public: peerPublicKey
    },
    privateKey,
    256);

    const hkdfKey = await subtle.importKey(
        'raw',
        sharedSecret,
        'HKDF',
        false,
        ['deriveKey']
    )

    return await subtle.deriveKey(
    {
        name: "HKDF",
        hash: "SHA-256",
        salt: HKDF_SALT,
        info: new TextEncoder().encode("derived key")
    },
    hkdfKey,
    {
        name: "AES-GCM",
        length: 256
    },
    false,
    ['encrypt', 'decrypt']);
}

export async function encryptMessage(sharedKey, plaintext) {
	// TODO: AES-GCM encrypt with a fresh 96-bit IV; return { iv, ciphertext }.
    const IV = crypto.getRandomValues(new Uint8Array(12));
	const encryptedMessage = await subtle.encrypt(
        {
            name: "AES-GCM",
            iv: IV
        },
        sharedKey,
        new TextEncoder().encode(plaintext)
    );
    return { iv: IV, ciphertext: encryptedMessage };
}

export async function decryptMessage(sharedKey, payload) {
	// TODO: AES-GCM decrypt payload.iv and payload.ciphertext back into a string.
	const arrayDecrypt = await subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(payload.iv)
        },
        sharedKey,
        payload.ciphertext
    );
	return new TextDecoder().decode(arrayDecrypt);
}

export async function fetchPeerIdentity(username) {
	const response = await fetch(`/api/keys/key/${encodeURIComponent(username)}`);

	if (!response.ok) {
		const error = await response.json().catch(() => null);
		throw new Error(error?.error ?? 'Failed to retrieve public key');
	}

	const { publicKey, keyFingerprint } = await response.json();
	const importedKey = await importPublicKey(publicKey);
	const fingerprint = await fingerprintPublicKey(importedKey);

	if (fingerprint !== keyFingerprint) {
		throw new Error(`Key fingerprint mismatch for ${username}`);
	}

	return { publicKey: importedKey, rawPublicKey: publicKey, fingerprint };
}

export async function fetchPeerKey(username) {
	return (await fetchPeerIdentity(username)).publicKey;
}

export async function verifyPeerIdentity(username) {
	const identity = await fetchPeerIdentity(username);
	const pinned = await getPinnedPeerKey(username);

	if (pinned && pinned.fingerprint !== identity.fingerprint) {
		throw new Error(`Key fingerprint changed for ${username}`);
	}

	if (!pinned) {
		await storePinnedPeerKey(username, identity.rawPublicKey, identity.fingerprint);
	}

	return identity;
}

export async function getSharedKey(username) {
	const privateKey = await getPrivateKey();
	if (!privateKey) {
		throw new Error('No local identity; run initializeIdentity first');
	}

	const identity = await verifyPeerIdentity(username);
	return deriveSharedKey(privateKey, identity.publicKey);
}
