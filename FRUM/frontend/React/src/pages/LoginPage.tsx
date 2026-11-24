import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { initializeIdentity, publishPublicKey } from '../../../src/crypto/cryptoKeys.mjs'
import '../styles/auth.css'

function LoginPage() {
	const [status, setStatus] = useState('empty')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const navigate = useNavigate();
	const verifyLogin = async () => {
		setStatus('loading')
		setErrorMessage('')
		try {
			const res = await fetch('/api/credential/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			})
			if (!res.ok) {
				setStatus('error')
				const errorData = await res.json()
				setErrorMessage(errorData['error'])
			} else {
				const data = await res.json()
				if (data.needsPublicKey) {
					const identity = await initializeIdentity()
					await publishPublicKey(data.username, identity)
				}
				setStatus('success')
				handleSuccess()
			}
		} catch (error) {
			setStatus('error') // only for network failure / server down
			setErrorMessage("Server down")
		}
	}
	const handleSuccess = () => {
		navigate("/chat");
	}

	return (
		<main className="login">
			<div className="login__card">
				<h1 className="login__title">Log In</h1>
				<p className="login__note">Your correspondence awaits.</p>
			</div>
			<div className="login__input">
				{status === 'error' && (
					<p className="input__error">{errorMessage}</p>
				)}
				{status === 'loading' && (
					<p className="input__loading">Please wait</p>
				)}
				<input
					className="input__username"
					type="text"
					placeholder="username"
					maxLength={32}
					value={username}
					onChange={e => setUsername(e.target.value)}
				/>
				<input
					className="input__password"
					type="password"
					placeholder="password"
					maxLength={1024}
					value={password}
					onChange={e => setPassword(e.target.value)}
				/>
				<button className="input__login" onClick={verifyLogin}>Login</button>
			</div>
			<div className="login__signup">
				<Link to="/signup" className="login__button">
					Sign Away Here
				</Link>
			</div>
		</main>
	)
}

export default LoginPage
