// co written 
import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { getAcceptedFriends, getIncomingRequests, getUserDoc, insertFriendRequest, removeFriendship, updateFriendStatus } from '../database.mjs'
import { validUsernameParam } from '../validation.mjs';

const router = Router();

router.get('/search', isAuthenticated, async (req, res) => {
    const username = validUsernameParam(req.query.username)
    if (!username) {
        return res.status(400).json({ error: "Invalid username" })
    }
    try {
        const result = await getUserDoc(username);
        return res.status(200).json({ result: result });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Search failed" })
    }
});

router.post('/request/:username', isAuthenticated, async (req, res) => {
    const sender = req.session.username
    const recipient = validUsernameParam(req.params.username)
    if (!recipient || recipient === sender) {
        return res.status(400).json({
            error: "Improper recipient parameter"
        });
    }

    try {
        if (await getUserDoc(recipient) === null) {
            return res.status(400).json({ error: "Improper recipient parameter" });
        }

        const result = await insertFriendRequest(sender, recipient)
        if (result === 11000) {
            return res.status(409).json({ error: "Already have pending request with user" });
        }

        if (result !== true) {
            return res.status(500).json({ error: "Failed to send friend request" });
        }

        return res.status(200).json("Request sent")
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Failed to send friend request" })
    }
});

router.post('/request/accept/:sender', isAuthenticated, async (req, res) => {
    const username = req.session.username
    const sender = validUsernameParam(req.params.sender)
    if (!sender) {
        return res.status(400).json({ error: "Invalid sender" })
    }
    try {
        const result = await updateFriendStatus(username, sender, "accepted")
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "No current pending request" })
        }
        return res.status(200).json("Accepted Friend Request")
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Failed to accept friend request" })
    }
})

router.post('/request/decline/:sender', isAuthenticated, async (req, res) => {
    const username = req.session.username
    const sender = validUsernameParam(req.params.sender)
    if (!sender) {
        return res.status(400).json({ error: "Invalid sender" })
    }
    try {
        const result = await updateFriendStatus(username, sender, "declined")
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "No current pending request" })
        }
        return res.status(200).json("Declined Friend Request")
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Failed to decline friend request" })
    }
})

router.get('/requests', isAuthenticated, async (req, res) => {
    const username = req.session.username
    try {
        const result = await getIncomingRequests(username)
        res.status(200).json({ result: result })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Failed to load requests" })
    }
})

router.get('/friends', isAuthenticated, async (req, res) => {
    const username = req.session.username
    try {
        const result = await getAcceptedFriends(username)
        res.status(200).json({ result: result })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Failed to load friends" })
    }
})

router.delete('/friends/:friend', isAuthenticated, async (req, res) => {
    const username = req.session.username
    const friend = validUsernameParam(req.params.friend)
    if (!friend) {
        return res.status(400).json({ error: "Invalid friend" })
    }
    try {
        const result = await removeFriendship(username, friend)
        res.status(200).json({ result: result })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Failed to remove friend" })
    }
})

export default router;