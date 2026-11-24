// written by myself for now styling and prettifying will be agent more than likely
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import '../styles/chat.css'
import { useEffect, useRef, useState } from 'react';
import { getIdentity, getMessagesForPeer, storeMessage } from '../../../src/storage/indexDatabase.mjs';
import { verifyPeerIdentity } from '../../../src/crypto/cryptoKeys.mjs';

type ChatMessage = {
	id: string
	from: string
	text: string
}

type FriendDoc = {
	_id: string
	sender: string
	recipient: string
}

type StoredMessage = {
	id: number
	peer: string
	ciphertext: string
	direction: string
	timestamp: number
}

function ChatPage() {
	const [username, setUsername] = useState<string | null>(null)
	const [checking, setChecking] = useState(true)
	const [authenticated, setAuthenticated] = useState(false)
	const [unauthenticated, setUnauthenticated] = useState(false)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [draft, setDraft] = useState('')
	const [friends, setFriends] = useState<FriendDoc[]>([])
	const [loadingFriends, setLoadingFriends] = useState(false)
	const [verifiedPeer, setVerifiedPeer] = useState<string | null>(null)
	const [tofuError, setTofuError] = useState<string | null>(null)
	const [ownFingerprint, setOwnFingerprint] = useState<string | null>(null)
	const [peerFingerprint, setPeerFingerprint] = useState<string | null>(null)
	const socketRef = useRef<WebSocket | null>(null)
	const { friend } = useParams()
	const friendRef = useRef<string | undefined>(friend)
	const navigate = useNavigate();

	const loadHistory = async (peer: string) => {
		const stored = await getMessagesForPeer(peer)
		setMessages(stored.map((m: StoredMessage) => ({
			id: String(m.id),
			from: m.direction === 'out' ? (username ?? 'me') : m.peer,
			text: m.ciphertext
		})))
	}

	useEffect(() => {
		friendRef.current = friend
	}, [friend])

	useEffect(() => {
		if (!authenticated || !friend) return
		loadHistory(friend)
	}, [authenticated, friend])
	useEffect(() => {
		fetch('/api/credential/me')
		.then(res => {
			if (!res.ok) {
				throw new Error('Not Authenticated');
			}
			return res.json()
		})
		.then(data => {
			setUsername(data.username);
			setAuthenticated(true);
			setUnauthenticated(false);
		})
		.catch(err => {
			console.error(err);
			setAuthenticated(false);
			setUnauthenticated(true);
			setUsername(null);
		})
		.finally(()=> {
			setChecking(false);
		});
	}, []);

	useEffect(() => {
		if (!authenticated) return

		getIdentity()
			.then((identity) => {
				if (identity) setOwnFingerprint(identity.fingerprint)
			})
			.catch(() => {})
	}, [authenticated])

	useEffect(() => {
		if (!authenticated || !friend) {
			setVerifiedPeer(null)
			setTofuError(null)
			setPeerFingerprint(null)
			return
		}

		let cancelled = false
		setVerifiedPeer(null)
		setTofuError(null)
		setPeerFingerprint(null)

		verifyPeerIdentity(friend)
			.then((identity) => {
				if (!cancelled) {
					setVerifiedPeer(friend)
					setPeerFingerprint(identity.fingerprint)
				}
			})
			.catch((error) => {
				if (!cancelled) {
					setTofuError(error instanceof Error ? error.message : 'Key verification failed')
				}
			})

		return () => {
			cancelled = true
		}
	}, [authenticated, friend])

	useEffect(() => {
		if (!authenticated) return

		const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
		const socket = new WebSocket(`${protocol}://${location.host}/ws`)
		socketRef.current = socket

		socket.onmessage = async (event) => {
			let msg
			try {
				msg = JSON.parse(event.data)
			} catch {
				return
			}

			if (msg.type === 'chat') {
				try {
					await verifyPeerIdentity(msg.from)
				} catch (error) {
					if (msg.from === friendRef.current) {
						setTofuError(error instanceof Error ? error.message : 'Key verification failed')
					}
					return
				}

				await storeMessage(msg.from, msg.text, '', 'in')
				if (msg.from === friendRef.current) await loadHistory(msg.from)
			} else if (msg.type === 'chat-error') {
				setMessages(prev => [...prev, {
					id: crypto.randomUUID(),
					from: 'system',
					text: `${msg.to} is offline`
				}])
			}
		}

		return () => {
			socket.close()
			socketRef.current = null
		}
	}, [authenticated])

	useEffect(() => {
		if (!authenticated) return

		const load = async () => {
			setLoadingFriends(true)
			try {
				const res = await fetch('/api/friends/friends')
				if (!res.ok) return
				const { result } = await res.json()
				setFriends(result)
			} finally {
				setLoadingFriends(false)
			}
		}
		load()
	}, [authenticated])

	const sendMessage = async () => {
		const text = draft.trim()
		if (!text || !friend || socketRef.current?.readyState !== WebSocket.OPEN) return

		try {
			const identity = await verifyPeerIdentity(friend)
			setPeerFingerprint(identity.fingerprint)
			setTofuError(null)
		} catch (error) {
			setTofuError(error instanceof Error ? error.message : 'Key verification failed')
			return
		}

		socketRef.current.send(JSON.stringify({ type: 'chat', to: friend, text }))
		await storeMessage(friend, text, '', 'out')
		await loadHistory(friend)
		setDraft('')
	}

	const logout = async () => {
		const res = await fetch('/api/credential/logout', {
			method: 'DELETE',
		})
		if (res.ok) {
			const data = await res.json();
			console.log(data);
			handleLogoutSuccess();
		}
	}

	function handleLogoutSuccess() {
		navigate("/login");
	}

	function goToProfile() {
		navigate("/account")
	}

	function goToFriendsList() {
		navigate("/friendsList")
	}

	if (checking) return <p>Checking session…</p>
	if (unauthenticated || !authenticated) return <Navigate to="/login" replace />

	return (
		<div>
			<header>Welcome {username}</header>
			<button className = "chat__to__account" onClick={ goToProfile }>Account Settings</button>
			<button className = "chat__to__friends" onClick={ goToFriendsList }>Friends List</button>
			<button className = "chat__logout" onClick={ logout }>Logout</button>
			{
				!friend &&
				<div>
					<h2>Who would you like to talk to?</h2>
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
										<Link to={`/chat/${encodeURIComponent(other)}`}>{other}</Link>
									</li>
								)
							})}
						</ul>
					)}
				</div>
			}
			{
				friend &&
				<div>
					<h2>Chatting with {friend}</h2>
					{tofuError ? (
						<p>{tofuError}</p>
					) : verifiedPeer !== friend ? (
						<p>Verifying peer key…</p>
					) : (
						<>
							<details>
								<summary>Verify fingerprints</summary>
								<p>You: {ownFingerprint ?? 'not available on this device'}</p>
								<p>{friend}: {peerFingerprint ?? 'unknown'}</p>
								<p>Compare these out-of-band (in person or another channel) before trusting this key.</p>
							</details>
							<ul>
								{messages.map((m) => (
									<li key={m.id}>{m.from}: {m.text}</li>
								))}
							</ul>
							<input
								type="text"
								value={draft}
								maxLength={2000}
								onChange={e => setDraft(e.target.value)}
							/>
							<button onClick={sendMessage}>Send</button>
						</>
					)}
				</div>
			}
		</div>
	)
}

export default ChatPage
