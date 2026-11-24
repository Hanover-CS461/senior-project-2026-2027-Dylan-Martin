import { createHash } from 'node:crypto'

export const USERNAME_MAX = 32
export const PASSWORD_MAX = 1024
export const MESSAGE_MAX = 2000

const SIGNUP_USERNAME_RE = /^[A-Za-z0-9_.-]{3,32}$/
const FINGERPRINT_RE = /^[0-9a-f]{2}(?::[0-9a-f]{2}){31}$/
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/
const JWK_COORD_RE = /^[A-Za-z0-9_-]{43}$/

export function validUsernameParam(value) {
    if (typeof value !== 'string') return null
    if (!value || value.length > USERNAME_MAX) return null
    if (CONTROL_CHAR_RE.test(value)) return null
    return value
}

export function validSignupUsername(value) {
    if (typeof value !== 'string') return null
    const username = value.trim()
    if (!SIGNUP_USERNAME_RE.test(username)) return null
    return username
}

export function validPassword(value) {
    if (typeof value !== 'string') return null
    if (value.length === 0 || value.length > PASSWORD_MAX) return null
    return value
}

export function validMessageText(value) {
    if (typeof value !== 'string') return null
    if (!value.trim() || value.length > MESSAGE_MAX) return null
    return value
}

export function validFingerprint(value) {
    return typeof value === 'string' && FINGERPRINT_RE.test(value)
}

export function normalizePublicKeyJwk(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    if (value.kty !== 'EC' || value.crv !== 'P-256') return null
    if (typeof value.x !== 'string' || typeof value.y !== 'string') return null
    if (!JWK_COORD_RE.test(value.x) || !JWK_COORD_RE.test(value.y)) return null
    return { kty: 'EC', crv: 'P-256', x: value.x, y: value.y }
}

export function publicKeyFingerprint(jwk) {
    const x = Buffer.from(jwk.x, 'base64url')
    const y = Buffer.from(jwk.y, 'base64url')
    if (x.length !== 32 || y.length !== 32) return null

    const raw = Buffer.concat([Buffer.from([0x04]), x, y])
    const digest = createHash('sha256').update(raw).digest()
    return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join(':')
}
