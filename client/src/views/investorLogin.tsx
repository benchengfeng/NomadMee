import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getInvestorHome, loginInvestor, getGoogleAuthUrl } from '../api/portalApi';
import { saveInvestorToken } from '../utils/auth';
import { track } from '../utils/analytics';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const InvestorLogin: React.FC = () => {
	const navigate = useNavigate();
	const { t } = useTranslation(['auth', 'common']);
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
			track('login-success', { kyc: profile.investor.kycCompleted });
			navigate(profile.investor.kycCompleted ? '/home' : '/onboarding');
		} catch (err) {
			setError(err instanceof Error ? err.message : t('login.failed'));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="investor-login-shell">
			<div className="investor-login-topbar">
				<LanguageSwitcher variant="ghost" />
			</div>

			<div className="investor-login-logo">
				<img src="/logo192.png" alt="nomadme" />
			</div>
			<p className="investor-login-brand">{t('common:brand')}</p>

			<section className="investor-login-card">
				<Link to="/" className="auth-back-link" onClick={() => track('nav-click', { label: 'back-home', from: 'login' })}>← {t('common:nav.backHome')}</Link>
				<h2>{t('login.title')}</h2>
				<p className="investor-login-subtitle">{t('login.subtitle')}</p>

				<a
					href={getGoogleAuthUrl()}
					className="auth-google-btn"
					onClick={() => track('login-click', { method: 'google' })}
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
						<path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
						<path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
						<path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
						<path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
					</svg>
					Continue with Google
				</a>

				<div className="auth-divider"><span>or</span></div>

				<form className="investor-login-form" onSubmit={handleSubmit}>
					<div className="investor-login-field">
						<label htmlFor="username">{t('login.username')} / Email</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							placeholder={t('login.usernamePlaceholder')}
							required
							autoComplete="username"
						/>
					</div>

					<div className="investor-login-field">
						<label htmlFor="password">{t('login.password')}</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder={t('login.passwordPlaceholder')}
							required
							autoComplete="current-password"
						/>
					</div>

					<div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
						<Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>
							Forgot password?
						</Link>
					</div>

					{error && <p className="investor-login-error">{error}</p>}

					<button type="submit" disabled={isLoading} className="investor-login-btn">
						{isLoading ? t('login.submitting') : t('login.submit')}
					</button>
				</form>

				<div className="investor-login-footer" style={{ textAlign: 'center' }}>
					<span style={{ color: '#475569' }}>Don't have an account? </span>
					<Link to="/register" style={{ color: '#c8a06a' }}>Create one</Link>
					<span style={{ color: '#334155', margin: '0 8px' }}>·</span>
					<Link to="/admin" style={{ color: '#475569' }}>{t('common:nav.adminLogin')}</Link>
				</div>
			</section>
		</main>
	);
};

export default InvestorLogin;
