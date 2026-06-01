import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <main className="not-found-shell">
    <div className="not-found-card">
      <img src="/logo192.png" className="not-found-logo" alt="NomadMee" />
      <h1 className="not-found-code">404</h1>
      <p className="not-found-msg">Page not found</p>
      <p className="not-found-sub">This URL doesn't exist or was moved.</p>
      <Link to="/" className="not-found-btn">← Back to home</Link>
    </div>
  </main>
);

export default NotFound;
