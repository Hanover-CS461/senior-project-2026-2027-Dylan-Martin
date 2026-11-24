import { Routes, Route } from 'react-router'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import WelcomePage from './pages/WelcomePage'
import ProfilePage from './pages/ProfilePage'
import FriendsPage from './pages/FriendsList'

function App() {
	return (
		<Routes>
			<Route path="/" element={<WelcomePage />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/signup" element={<SignupPage />} />
			<Route path="/chat" element={<ChatPage />} />
			<Route path="/chat/:friend" element={<ChatPage />} />
			<Route path="/account" element={<ProfilePage />} />
			<Route path="/friendsList" element={<FriendsPage />} />
		</Routes>
	)
}

export default App
