import { useState } from 'react'
import { Link } from 'react-router'
import '../styles/auth.css'

function LoginPage() {
	const [status, setStatus] = useState('empty')
	const verifyLogin = async () => {
		setStatus('loading')
		//        try {
		//            fetch('https://localhost:5173/login', {
		//                 method: 'POST',
		//                 headers: {
		//                    'Content-Type': 'application/json'
		//                 },
		//                 body: JSON.stringify()
		//            })
		//        }
	}
	return (
		<main className="login">
			<div className="login__card">
				<h1 className="login__title">Log In</h1>
				<p className="login__note">Your correspondence awaits.</p>
			</div>
			<div className="login__input">
				{status === 'error' && (
					<p className="input__error">Invalid username or password.</p>
				)}
				{status === 'loading' && (
					<p className="input__loading">Please wait</p>
				)}
				<input className="input__username" type="text" placeholder="username"></input>
				<input className="input__password" type="password" placeholder="password"></input>
				<button className="input__login" onClick={verifyLogin}>Login</button>
				<Link to="/chat" className="chat__button">
					Start chatting
				</Link>
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
