export type ChatContact = {
	id: string
	name: string
}

export type ChatMessage = {
	id: number
	from: 'me' | 'them'
	text: string
	time: string
}
