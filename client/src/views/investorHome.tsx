import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvestorHome, logoutInvestor, InvestorHomeResponse } from '../api/portalApi';

function money(value: number): string {
	return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

const InvestorHome: React.FC = () => {
	const navigate = useNavigate();
	const [data, setData] = useState<InvestorHomeResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				const response = await getInvestorHome();
				if (isMounted) {
					setData(response);
					setError(null);
				}
			} catch (err) {
				if (isMounted) {
					setError(err instanceof Error ? err.message : 'Unable to load investor dashboard');
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		void load();
		return () => {
			isMounted = false;
		};
	}, []);

	const handleLogout = async () => {
		await logoutInvestor();
		navigate('/');
	};

	if (loading) {
		return <div className="portal-loading">Loading investor dashboard...</div>;
	}

	if (error || !data) {
		return (
			<div className="portal-loading">
				<p>{error || 'Dashboard data not available.'}</p>
				<Link to="/">Back to login</Link>
			</div>
		);
	}

	return (
		<main className="portal-shell">
			<header className="portal-header">
				<div>
					<h1>Investor Dashboard</h1>
					<p>{data.investor.name} · {data.investor.username}</p>
				</div>
				<button type="button" onClick={handleLogout}>Logout</button>
			</header>

			<section className="portal-grid">
				<article className="portal-card">
					<h2>Investment Info</h2>
					<p><strong>Amount:</strong> {money(data.investor.investmentAmount)}</p>
					<p><strong>Profit %:</strong> {data.investor.profitPercentageOnInvestment}%</p>
					<p><strong>Estimated ROI:</strong> {money(data.investor.estimatedROI)}</p>
				</article>

				<article className="portal-card">
					<h2>Assigned Cargos</h2>
					{data.cargos.length === 0 ? (
						<p>No cargos assigned yet.</p>
					) : (
						<div className="portal-stack">
							{data.cargos.map((cargo) => (
								<div key={cargo._id} className="portal-item">
									<h3>{cargo.productBeingShipped}</h3>
									<p><strong>Quantity:</strong> {cargo.quantity}</p>
									<p><strong>Purchase location:</strong> {cargo.purchaseLocation}</p>
									<p><strong>Destination:</strong> {cargo.shippingDestination}</p>
									<p><strong>Purchase price:</strong> {money(cargo.purchasePrice)}</p>
									<p><strong>Shipping price:</strong> {money(cargo.shippingPrice)}</p>
									<p><strong>Other expenses:</strong> {money(cargo.otherExpenses)}</p>
									<p><strong>ETA:</strong> {formatDate(cargo.estimatedTimeOfArrival)}</p>
									<p><strong>Estimated selling:</strong> {formatDate(cargo.estimatedTimeOfSelling)}</p>
								</div>
							))}
						</div>
					)}
				</article>
			</section>
		</main>
	);
};

export default InvestorHome;

