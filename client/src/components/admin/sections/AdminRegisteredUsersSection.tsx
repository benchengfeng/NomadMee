import React, { useEffect, useState } from 'react';
import { getAdminRegisteredUsers, updateRegisteredUserStatus, RegisteredUser } from '../../../api/portalApi';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const STATUS_LABELS: Record<RegisteredUser['accountStatus'], string> = {
  active: 'Active',
  pending_verification: 'Pending verification',
  suspended: 'Suspended',
};

const STATUS_COLORS: Record<RegisteredUser['accountStatus'], string> = {
  active: '#22c55e',
  pending_verification: '#f59e0b',
  suspended: '#ef4444',
};

const AdminRegisteredUsersSection: React.FC<Props> = ({ showToast }) => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    getAdminRegisteredUsers()
      .then((r) => { setUsers(r.users); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const changeStatus = async (id: string, status: RegisteredUser['accountStatus']) => {
    setUpdatingId(id);
    try {
      await updateRegisteredUserStatus(id, status);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, accountStatus: status } : u));
      showToast('Status updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.accountStatus === 'active').length,
    pending: users.filter((u) => u.accountStatus === 'pending_verification').length,
    assigned: users.filter((u) => u.assignedInvestmentIds.length > 0).length,
  };

  return (
    <div className="admin-section-grid" style={{ gridTemplateColumns: '1fr' }}>
      <article className="portal-card">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Self-Registered Users <span className="portal-item-badge">{stats.total}</span></h2>
          <div style={{ display: 'flex', gap: 10, fontSize: '0.8rem', color: '#64748b' }}>
            <span><span style={{ color: '#22c55e' }}>●</span> {stats.active} active</span>
            <span><span style={{ color: '#f59e0b' }}>●</span> {stats.pending} pending</span>
            <span><span style={{ color: '#c8a06a' }}>●</span> {stats.assigned} assigned</span>
          </div>
        </div>

        {!loaded ? (
          <p style={{ color: '#475569' }}>Loading…</p>
        ) : users.length === 0 ? (
          <p className="relation-empty">No self-registered users yet.</p>
        ) : (
          <div className="portal-stack">
            {users.map((user) => (
              <div className="portal-item" key={user._id}>
                <div className="portal-item-head">
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user.name}
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: STATUS_COLORS[user.accountStatus],
                        background: `${STATUS_COLORS[user.accountStatus]}18`,
                        border: `1px solid ${STATUS_COLORS[user.accountStatus]}30`,
                        borderRadius: 6,
                        padding: '2px 7px',
                      }}>
                        {STATUS_LABELS[user.accountStatus]}
                      </span>
                      {user.googleId && (
                        <span className="portal-item-badge" style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>Google</span>
                      )}
                      {user.assignedInvestmentIds.length > 0 && (
                        <span className="portal-item-badge" style={{ background: 'rgba(200,160,106,0.12)', color: '#c8a06a' }}>
                          {user.assignedInvestmentIds.length} inv.
                        </span>
                      )}
                    </h3>
                    <p className="portal-item-meta" style={{ margin: 0 }}>
                      {user.email || '—'} · @{user.username}
                      {user.registrationMethod === 'google' && (
                        <span style={{ color: '#475569', marginLeft: 6 }}>· via Google</span>
                      )}
                      {user.createdAt && (
                        <span style={{ color: '#334155', marginLeft: 6 }}>
                          · joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="portal-item-actions">
                    <select
                      value={user.accountStatus}
                      onChange={(e) => void changeStatus(user._id, e.target.value as RegisteredUser['accountStatus'])}
                      disabled={updatingId === user._id}
                      style={{
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: '#94a3b8',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="pending_verification">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {!user.emailVerified && user.registrationMethod === 'email' && (
                  <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚠ Email not yet verified
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default AdminRegisteredUsersSection;
