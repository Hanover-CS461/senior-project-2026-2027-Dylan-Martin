import './App.css'
import club from './assets/club.png'
import diamond from './assets/diamond.png'
import heart from './assets/heart.png'
import logo from './assets/FRUM.png'
import spade from './assets/spade.png'
import { Routes, Route, Link } from 'react-router';

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
	return (
		<main className="login">
			<div className="login__card">
				<h1 className="login__title">Sign In</h1>
				<p className="login__note">Your correspondence awaits.</p>
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
      </Routes>
    </>
  );
}

export default App
