import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvestorHome, loginInvestor } from '../api/portalApi';
import { saveInvestorToken } from '../utils/auth';

const InvestorLogin: React.FC = () => {
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const response = await loginInvestor(username.trim(), password);
			saveInvestorToken(response.token);
			const profile = await getInvestorHome();
			navigate(profile.investor.kycCompleted ? '/home' : '/onboarding');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="investor-login-shell">
			<div className="investor-login-logo">
				<img src="/logo192.png" alt="NomadMee" />
			</div>
			<p className="investor-login-brand">NomadMee</p>

			<section className="investor-login-card">
				<Link to="/" className="auth-back-link">← Home</Link>
				<h2>Investor Access</h2>
				<p className="investor-login-subtitle">Sign in to track your cargos and investment portfolio.</p>

				<form className="investor-login-form" onSubmit={handleSubmit}>
					<div className="investor-login-field">
						<label htmlFor="username">Username</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							placeholder="Enter your username"
							required
							autoComplete="username"
						/>
					</div>

					<div className="investor-login-field">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Enter your password"
							required
							autoComplete="current-password"
						/>
					</div>

					{error && <p className="investor-login-error">{error}</p>}

					<button type="submit" disabled={isLoading} className="investor-login-btn">
						{isLoading ? 'Signing in…' : 'Login →'}
					</button>
				</form>

				<div className="investor-login-footer">
					<Link to="/admin">Admin login</Link>
				</div>
			</section>
		</main>
	);
};

export default InvestorLogin;
