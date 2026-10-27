import { useState } from 'react'
import club from '../assets/club.png'
import diamond from '../assets/diamond.png'
import heart from '../assets/heart.png'
import spade from '../assets/spade.png'
import { contacts, seedThreads } from '../data/chatSeed'
import type { ChatMessage } from '../types'
import '../styles/chat.css'

function ChatPage() {
	const [activeId, setActiveId] = useState(contacts[0].id)
	const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(seedThreads)
	const [draft, setDraft] = useState('')
	const [adding, setAdding] = useState(false)
	const [friendName, setFriendName] = useState('')

	const active = contacts.find(contact => contact.id === activeId) ?? contacts[0]
	const thread = threads[activeId] ?? []

	const sendMessage = () => {
		const text = draft.trim()
		if (!text) return
		setThreads(prev => ({
			...prev,
			[activeId]: [
				...(prev[activeId] ?? []),
				{
					id: Date.now(),
					from: 'me',
					text,
					time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				},
			],
		}))
		setDraft('')
	}

	return (
		<main className="chat">
			<header className="chat__bar">
				<div className="chat__suits chat__suits--left" aria-hidden="true">
					<img src={club} alt="" />
					<img src={diamond} alt="" />
				</div>

				<nav className="chat__people" aria-label="Conversations">
					{contacts.map(contact => (
						<button
							key={contact.id}
							type="button"
							className={`chat__person${contact.id === activeId ? ' is-active' : ''}`}
							aria-pressed={contact.id === activeId}
							onClick={() => setActiveId(contact.id)}
						>
							<span className="chat__avatar" aria-hidden="true">{contact.name.charAt(0)}</span>
							{contact.name}
						</button>
					))}
				</nav>

				<div className="chat__suits chat__suits--right" aria-hidden="true">
					<img src={spade} alt="" />
					<img src={heart} alt="" />
				</div>

				<button
					type="button"
					className="chat__add"
					aria-expanded={adding}
					onClick={() => setAdding(open => !open)}
				>
					Add Friends
				</button>
			</header>

			{adding && (
				<form
					className="chat__add-panel"
					onSubmit={event => {
						event.preventDefault()
						setFriendName('')
						setAdding(false)
					}}
				>
					<input
						type="text"
						placeholder="Name or username"
						aria-label="Name or username"
						value={friendName}
						onChange={event => setFriendName(event.target.value)}
					/>
					<button type="submit">Send invitation</button>
				</form>
			)}

			<section className="chat__thread">
				<header className="chat__thread-head">
					<span className="chat__avatar chat__avatar--lg" aria-hidden="true">
						{active.name.charAt(0)}
					</span>
					<div>
						<h2 className="chat__thread-name">{active.name}</h2>
						<p className="chat__presence">Available for correspondence</p>
					</div>
				</header>

				<div className="chat__messages" aria-live="polite">
					<p className="chat__day">Today</p>
					{thread.map(message => (
						<div key={message.id} className={`bubble bubble--${message.from}`}>
							<p>{message.text}</p>
							<span className="bubble__time">{message.time}</span>
						</div>
					))}
				</div>

				<form
					className="chat__composer"
					onSubmit={event => {
						event.preventDefault()
						sendMessage()
					}}
				>
					<input
						type="text"
						placeholder="Write your letter…"
						aria-label="Message"
						value={draft}
						onChange={event => setDraft(event.target.value)}
					/>
					<button type="submit">Seal &amp; Send</button>
				</form>
			</section>
		</main>
	)
}

export default ChatPage
