import './App.css'
import club from './assets/club.png'
import diamond from './assets/diamond.png'
import heart from './assets/heart.png'
import logo from './assets/FRUM.png'
import spade from './assets/spade.png'
import { Routes, Route, Link } from 'react-router';
import { useState } from 'react'

function WelcomePage() {
	return (
		<main className="welcome">
			<section className="plate" aria-labelledby="welcome-title">
				<svg
					className="plate__fold"
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					<path d="M0 0 L50 50 L100 0" vectorEffect="non-scaling-stroke" />
				</svg>

				<div className="ornament" aria-hidden="true">
					<img className="ornament__suit" src={club} alt="" />
					<img className="ornament__suit" src={diamond} alt="" />
					<img className="ornament__suit" src={spade} alt="" />
				</div>

				<h1 id="welcome-title" className="plate__title">
					<img className="plate__logo" src={logo} alt="FRUM" />
				</h1>

				<Link to="/login" className="plate__button">
					Enter
				</Link>

				<div className="plate__body">
					<p className="plate__tagline">Private correspondence, sealed end to end.</p>
					<hr className="plate__rule" />
				</div>

				<div className="ornament ornament--foot" aria-hidden="true">
					<img className="ornament__suit" src={heart} alt="" />
				</div>
			</section>
		</main>
	)
}


function LoginPage() {
    const [status, setStatus] = useState('empty');
    const verifyLogin = async () => { 
        setStatus('loading');
//        try {
//            fetch('https://localhost:5173/login', {
//                 method: 'POST',
//                 headers: {
//                    'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify()
//            })
//        }

    };
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
            </div>
            <div className="login__signup">
                <Link to="/signup" className="login__button">
                    Sign Away Here
                </Link>
            </div>
		</main>
	)
}

function SignupPage() {
    const [status, setStatus] = useState('empty');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const handleSignup = async () => {
        setStatus('loading')
        try {
            const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            });
            setStatus(res.ok ? 'success' : 'error');
            if (status === 'error') {
                console.error('request error: ', error.message);
            }
        } catch (error) {
            console.error('network error: ', error.message);
            setStatus('error');   // only for network failure / server down
        }
    };
    return (
        <main className="signup">
            <div className="signup__card">
                <h1 className="signup__title">Sign away if you please</h1>
                <p className="signup__note">Make your mark in the registry.</p>
            </div>
            <div className="signup__input">
                {status === 'error' && (
                    <p className="input__error">Invalid username or password.</p>
                )}
                {status === 'loading' && (
                    <p className="input__loading">Please wait</p>
                )}
                {status === 'success' && (
                    <p className="input__success">Very nice</p>
                )}
                <input 
                className="input__username"
                type="text"
                placeholder="username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                />
                <input
                className="input__password"
                type="password"
                placeholder="password" 
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

function App() {
	return (
    <>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </>
  );
}

export default App
