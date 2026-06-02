import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getInvestorHome, loginInvestor } from '../api/portalApi';
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
				<img src="/logo192.png" alt="NomadMee" />
			</div>
			<p className="investor-login-brand">{t('common:brand')}</p>

			<section className="investor-login-card">
				<Link to="/" className="auth-back-link">← {t('common:nav.backHome')}</Link>
				<h2>{t('login.title')}</h2>
				<p className="investor-login-subtitle">{t('login.subtitle')}</p>

				<form className="investor-login-form" onSubmit={handleSubmit}>
					<div className="investor-login-field">
						<label htmlFor="username">{t('login.username')}</label>
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

					{error && <p className="investor-login-error">{error}</p>}

					<button type="submit" disabled={isLoading} className="investor-login-btn">
						{isLoading ? t('login.submitting') : t('login.submit')}
					</button>
				</form>

				<div className="investor-login-footer">
					<Link to="/admin">{t('common:nav.adminLogin')}</Link>
				</div>
			</section>
		</main>
	);
};

export default InvestorLogin;
