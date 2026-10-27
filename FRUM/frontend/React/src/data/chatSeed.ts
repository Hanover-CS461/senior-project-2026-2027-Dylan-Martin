import type { ChatContact, ChatMessage } from '../types'

export const contacts: ChatContact[] = [
	{ id: 'beatrice', name: 'Beatrice Ashcombe' },
	{ id: 'cornelius', name: 'Cornelius Vale' },
	{ id: 'edith', name: 'Edith Marlowe' },
	{ id: 'reginald', name: 'Reginald Pike' },
]

export const seedThreads: Record<string, ChatMessage[]> = {
	beatrice: [
		{ id: 1, from: 'them', text: 'The garden is in full bloom at last. You must come and see it.', time: '9:12' },
		{ id: 2, from: 'me', text: 'I shall call upon you at four, if the weather holds.', time: '9:20' },
	],
	cornelius: [
		{ id: 1, from: 'them', text: 'Have you finished the ledger I left on the desk?', time: 'Yesterday' },
	],
	edith: [
		{ id: 1, from: 'them', text: 'Thank you for the flowers. They are quite lovely.', time: 'Monday' },
	],
	reginald: [
		{ id: 1, from: 'me', text: 'Until Thursday, then. Do try to be punctual.', time: 'Sunday' },
	],
}
