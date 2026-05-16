import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginInvestor } from '../api/portalApi';
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
			navigate('/home');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="auth-shell">
			<section className="auth-card">
				<h1>Investor Access</h1>
				<p>Sign in to view your assigned cargos and investment summary.</p>

				<form className="auth-form" onSubmit={handleSubmit}>
					<label htmlFor="username">Username</label>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						placeholder="Enter your username"
						required
					/>

					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						placeholder="Enter your password"
						required
					/>

					{error && <p className="auth-error">{error}</p>}

					<button type="submit" disabled={isLoading}>
						{isLoading ? 'Signing in...' : 'Login'}
					</button>
				</form>

				<div className="auth-links">
					<Link to="/admin">Admin login</Link>
				</div>
			</section>
		</main>
	);
};

export default InvestorLogin;
