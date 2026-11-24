import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import '../styles/auth.css'

function SignupPage() {
	const navigate = useNavigate()
	const [status, setStatus] = useState('empty')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const handleSignup = async () => {
		setStatus('loading')
		setErrorMessage('')
		try {
			const res = await fetch('/api/credential/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			})
			if (!res.ok) {
				setStatus('error')
				const errorData = await res.json()
				setErrorMessage(errorData['error'])
			} else {
				setStatus('success')
			}
		} catch (error) {
			console.error('network error: ', error)
			setStatus('error') // only for network failure / server down
		}
	}

	function goToLogin() {
		navigate("/login")
	}

	return (
		<main className="signup">
			<div className="signup__card">
				<h1 className="signup__title">Sign away if you please</h1>
				<p className="signup__note">Make your mark in the registry.</p>
			</div>
			<div className="signup__input">
				{status === 'error' && (
					<p className="input__error">{errorMessage}</p>
				)}
				{status === 'loading' && (
					<p className="input__loading">Please wait</p>
				)}
				{status === 'success' && (
					<button className="input__success" onClick={ goToLogin }>Go Login</button>
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
				<button className="input__signup" onClick={handleSignup}>Sign Up</button>
			</div>
			<div className="signup__login">
				<Link to="/login" className="signup__button">
					Already enrolled? Log In
				</Link>
			</div>
		</main>
	)
}

export default SignupPage
