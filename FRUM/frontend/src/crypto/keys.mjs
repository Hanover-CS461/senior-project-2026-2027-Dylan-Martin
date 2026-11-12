import {
	storePrivateKey,
	getPrivateKey,
	storeIdentity,
	getIdentity,
} from '../storage/indexDatabase.mjs';

const subtle = globalThis.crypto.subtle;

export async function generateKeys() {
	return subtle.generateKey(
		{
			name: 'ECDH',
			namedCurve: 'P-256',
		},
		true,
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
	const response = await fetch('/api/keys', {
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

export async function deriveSharedKey(privateKey, peerPublicKey) {
	// TODO: ECDH deriveBits plus HKDF-SHA-256 into an AES-GCM key (NIST SP 800-56A).
	throw new Error('deriveSharedKey not implemented');
}

export async function encryptMessage(sharedKey, plaintext) {
	// TODO: AES-GCM encrypt with a fresh 96-bit IV; return { iv, ciphertext }.
	throw new Error('encryptMessage not implemented');
}

export async function decryptMessage(sharedKey, payload) {
	// TODO: AES-GCM decrypt payload.iv and payload.ciphertext back into a string.
	throw new Error('decryptMessage not implemented');
}
