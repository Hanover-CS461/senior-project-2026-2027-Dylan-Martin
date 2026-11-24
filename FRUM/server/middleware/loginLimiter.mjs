// written by opencode agent per request
const userAttempts = new Map();
const ipAttempts = new Map();

const MINUTE = 60 * 1000;

function getPositiveNumber(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function settings() {
    return {
        windowMs: getPositiveNumber('LOGIN_WINDOW_MS', 15 * MINUTE),
        blockMs: getPositiveNumber('LOGIN_BLOCK_MS', 15 * MINUTE),
        maxPerUser: getPositiveNumber('LOGIN_MAX_ATTEMPTS_PER_USER', 5),
        maxPerIp: getPositiveNumber('LOGIN_MAX_ATTEMPTS_PER_IP', 10)
    };
}

function activeEntry(map, key, windowMs) {
    const now = Date.now();
    const entry = map.get(key);
    if (!entry) return null;

    if (entry.blockedUntil > now) return entry;
    if (now - entry.firstAt < windowMs) return entry;

    map.delete(key);
    return null;
}

function blockedUntil(entry) {
    return entry && entry.blockedUntil > Date.now() ? entry.blockedUntil : 0;
}

function record(map, key, max, config) {
    const now = Date.now();
    let entry = activeEntry(map, key, config.windowMs);

    if (!entry) {
        entry = { count: 0, firstAt: now, blockedUntil: 0 };
        map.set(key, entry);
    }

    if (entry.blockedUntil > now) return;

    entry.count += 1;
    if (entry.count >= max) {
        entry.blockedUntil = now + config.blockMs;
    }
}

function usernameFrom(req) {
    const username = req.body?.username;
    return typeof username === 'string' && username ? username : null;
}

export function recordLoginFailure(req) {
    const config = settings();
    const username = usernameFrom(req);

    if (username) record(userAttempts, username, config.maxPerUser, config);
    if (req.ip) record(ipAttempts, req.ip, config.maxPerIp, config);
}

export function clearLoginFailures(req) {
    const username = usernameFrom(req);
    if (username) userAttempts.delete(username);
    if (req.ip) ipAttempts.delete(req.ip);
}

export function loginAttemptLimiter(req, res, next) {
    const config = settings();
    const now = Date.now();
    const username = usernameFrom(req);
    const userEntry = username ? activeEntry(userAttempts, username, config.windowMs) : null;
    const ipEntry = req.ip ? activeEntry(ipAttempts, req.ip, config.windowMs) : null;
    const until = Math.max(blockedUntil(userEntry), blockedUntil(ipEntry));

    if (until > now) {
        res.set('Retry-After', String(Math.ceil((until - now) / 1000)));
        return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    }

    next();
}

export function blockedApiGuard(req, res, next) {
    if (req.path === '/credential/logout') return next();

    const config = settings();
    const now = Date.now();
    const ipEntry = req.ip ? activeEntry(ipAttempts, req.ip, config.windowMs) : null;
    const username = req.session?.username;
    const userEntry = typeof username === 'string' && username
        ? activeEntry(userAttempts, username, config.windowMs)
        : null;
    const until = Math.max(blockedUntil(ipEntry), blockedUntil(userEntry));

    if (until > now) {
        res.set('Retry-After', String(Math.ceil((until - now) / 1000)));
        return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
    }

    next();
}

const sweeper = setInterval(() => {
    const { windowMs } = settings();
    const now = Date.now();

    for (const map of [userAttempts, ipAttempts]) {
        for (const [key, entry] of map) {
            if (entry.blockedUntil <= now && now - entry.firstAt >= windowMs) {
                map.delete(key);
            }
        }
    }
}, MINUTE);

sweeper.unref();
