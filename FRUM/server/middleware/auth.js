export function isAuthenticated(req, res, next) {
    if (!req.session?.username) return res.status(401).json({ error: "Not Authenticated" });
    next();
}
