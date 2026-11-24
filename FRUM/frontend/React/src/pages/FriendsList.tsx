// mostly written by agent
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type FriendDoc = {
    _id: string
    sender: string
    recipient: string
    status: string
    createdAt: string
}

function FriendsPage() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [showPending, setShowPending] = useState(false)
    const [showFriends, setShowFriends] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [friendSearchValue, setFriendSearchValue] = useState('')
    const [searchResult, setSearchResult] = useState<string | null>(null)
    const [pending, setPending] = useState<FriendDoc[]>([])
    const [friends, setFriends] = useState<FriendDoc[]>([])
    const [loadingPending, setLoadingPending] = useState(false)
    const [loadingFriends, setLoadingFriends] = useState(false)
    const [onlineFriends, setOnlineFriends] = useState<string[]>([])

    function goToChat() {
        navigate("/chat")
    }

    const loadPending = async () => {
        setLoadingPending(true)
        try {
            const res = await fetch('/api/friends/requests')
            if (res.status === 401) {
                navigate("/login")
                return
            }
            if (!res.ok) return
            const { result } = await res.json()
            setPending(result)
        } finally {
            setLoadingPending(false)
        }
    }

    const loadFriends = async (me: string) => {
        setLoadingFriends(true)
        try {
            const res = await fetch('/api/friends/friends')
            if (res.status === 401) {
                navigate("/login")
                return
            }
            if (!res.ok) return
            const { result } = await res.json()

            const existing: FriendDoc[] = []
            for (const doc of result) {
                const other = doc.sender === me ? doc.recipient : doc.sender
                const userRes = await fetch(`/api/friends/search?username=${encodeURIComponent(other)}`)
                if (userRes.status === 401) {
                    navigate("/login")
                    return
                }
                if (!userRes.ok) {
                    existing.push(doc)
                    continue
                }

                const { result: user } = await userRes.json()
                if (user === null) {
                    await fetch(`/api/friends/friends/${encodeURIComponent(other)}`, {
                        method: 'DELETE'
                    })
                } else {
                    existing.push(doc)
                }
            }
            setFriends(existing)
        } finally {
            setLoadingFriends(false)
        }
    }

    useEffect(() => {
        const load = async () => {
            const res = await fetch('/api/credential/me')
            if (!res.ok) {
                navigate("/login")
                return
            }
            const data = await res.json()
            setUsername(data.username)
            await loadPending()
            await loadFriends(data.username)
        }
        load()
    }, [])

    useEffect(() => {
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
        const socket = new WebSocket(`${protocol}://${location.host}/ws`)

        socket.onmessage = (event) => {
            let msg
            try {
                msg = JSON.parse(event.data)
            } catch {
                return
            }

            if (msg.type === 'presence') {
                setOnlineFriends(prev => {
                    const next = new Set(prev)
                    if (msg.online) {
                        next.add(msg.username)
                    } else {
                        next.delete(msg.username)
                    }
                    return [...next]
                })
            }
        }

        return () => socket.close()
    }, [])

    const startChat = (friend: string) => {
        navigate(`/chat/${encodeURIComponent(friend)}`)
    }

    const request = async (username: string) => {
        const res = await fetch(`/api/friends/request/${encodeURIComponent(username)}`, {
            method: 'POST'
        })
        if (res.status === 401) return "Not authenticated"
        if (res.status === 400) return "That request is not allowed"
        if (res.status === 409) return "Request already exists"
        if (!res.ok) return "Failed to send request"
        return "Request sent"
    }

    const search = async () => {
        const username = friendSearchValue.trim()
        if (!username) {
            setSearchResult("Enter a username")
            return
        }

        setSubmitting(true)
        setSearchResult(null)
        try {
            const res = await fetch(`/api/friends/search?username=${encodeURIComponent(username)}`)
            if (res.status === 401) {
                navigate("/login")
                return
            }
            if (!res.ok) {
                setSearchResult("Search failed")
                return
            }

            const { result } = await res.json()
            if (result === null) {
                setSearchResult("User does not exist")
                return
            }

            setSearchResult(await request(result.username))
        } finally {
            setSubmitting(false)
        }
    }

    const accept = async (sender: string) => {
        const res = await fetch(`/api/friends/request/accept/${encodeURIComponent(sender)}`, {
            method: 'POST'
        })
        if (res.status === 401) {
            navigate("/login")
            return
        }
        if (!res.ok) return
        await loadPending()
        await loadFriends(username)
    }

    const decline = async (sender: string) => {
        const res = await fetch(`/api/friends/request/decline/${encodeURIComponent(sender)}`, {
            method: 'POST'
        })
        if (res.status === 401) {
            navigate("/login")
            return
        }
        if (!res.ok) return
        await loadPending()
    }

    return (
        <div>
            <header>Friends List</header>
            <button className="account__to__chat" onClick={ goToChat }>Start Chatting</button>
            <button className="chat__friends" onClick={() => setShowSearch(!showSearch)}>Find Friends</button>
            <button className="chat__friends" onClick={() => setShowPending(!showPending)}>Pending Requests</button>
            <button className="chat__friends" onClick={() => setShowFriends(!showFriends)}>Friends</button>
            {
                showSearch &&
                <div>
                    <input className="chat__friends__search"
                    type='text'
                    placeholder="Find friend with username"
                    maxLength={32}
                    value={friendSearchValue}
                    onChange={e => setFriendSearchValue(e.target.value)}/>
                    <button className="chat__search" onClick={search} disabled={submitting}>Add Friend</button>
                    {searchResult && (
                        <p>{searchResult}</p>
                    )}
                </div>
            }
            {
                showPending &&
                <div>
                    {loadingPending ? (
                        <p>Loading…</p>
                    ) : pending.length === 0 ? (
                        <p>No pending requests</p>
                    ) : (
                        <ul>
                            {pending.map((req) => (
                                <li key={req._id}>
                                    {req.sender} · {new Date(req.createdAt).toLocaleString()}
                                    <button onClick={() => accept(req.sender)}>Accept</button>
                                    <button onClick={() => decline(req.sender)}>Decline</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            }
            {
                showFriends &&
                <div>
                    {loadingFriends ? (
                        <p>Loading…</p>
                    ) : friends.length === 0 ? (
                        <p>No friends yet</p>
                    ) : (
                        <ul>
                            {friends.map((f) => {
                                const other = f.sender === username ? f.recipient : f.sender
                                return (
                                    <li key={f._id}>
                                        {other}
                                        <button
                                            onClick={() => startChat(other)}
                                            disabled={!onlineFriends.includes(other)}
                                        >Start Chatting</button>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            }
        </div>
    )
}

export default FriendsPage
