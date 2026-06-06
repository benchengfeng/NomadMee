import React, { useEffect, useState } from 'react';
import {
  getAdminContactRequests,
  updateContactRequestStatus,
  ContactRequest,
} from '../../../api/portalApi';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
  unreadCount: number;
  onUnreadChange: (n: number) => void;
}

const AdminMessagesSection: React.FC<Props> = ({ showToast, unreadCount, onUnreadChange }) => {
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getAdminContactRequests()
      .then((r) => { setContactRequests(r.requests); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);

  const markStatus = async (req: ContactRequest, status: ContactRequest['status']) => {
    try {
      await updateContactRequestStatus(req._id, status);
      setContactRequests((prev) => prev.map((r) => r._id === req._id ? { ...r, status } : r));
      if (status !== 'new') onUnreadChange(Math.max(0, unreadCount - (req.status === 'new' ? 1 : 0)));
      showToast(status === 'contacted' ? 'Marked as contacted ✓' : 'Marked as read');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.1rem' }}>Contact requests</h2>
        {unreadCount > 0 && (
          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>
            {unreadCount} new
          </span>
        )}
      </div>

      {!loaded ? (
        <p style={{ color: '#475569' }}>Loading…</p>
      ) : contactRequests.length === 0 ? (
        <p style={{ color: '#334155', fontSize: '0.9rem' }}>No contact requests yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contactRequests.map((req) => {
            const isExpanded = expandedId === req._id;
            const methodIcon = req.contactMethod === 'whatsapp' ? '📱' : '✉️';
            const statusColors: Record<string, string> = { new: '#22c55e', read: '#94a3b8', contacted: '#38bdf8' };
            const statusColor = statusColors[req.status] ?? '#94a3b8';

            return (
              <div
                key={req._id}
                className={`msg-card${req.status === 'new' ? ' msg-card--new' : ''}`}
                onClick={() => {
                  const newId = isExpanded ? null : req._id;
                  setExpandedId(newId);
                  if (newId && req.status === 'new') void markStatus(req, 'read');
                }}
              >
                <div className="msg-card-header">
                  <div>
                    <p className="msg-card-name">{methodIcon} {req.fullName}</p>
                    {req.type === 'contact_us' || !req.investmentTitle ? (
                      <p className="msg-card-investment" style={{ color: '#64748b' }}>📩 General inquiry</p>
                    ) : (
                      <p className="msg-card-investment">💼 {req.investmentTitle}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`msg-status-badge msg-status-badge--${req.status}`} style={{ color: statusColor }}>
                      {req.status === 'new' ? '🔔 New' : req.status === 'read' ? 'Read' : '✓ Contacted'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="msg-card-body">
                  <div className="msg-detail-row">
                    <span>{req.contactMethod === 'whatsapp' ? '📱' : '✉️'}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{req.contactDetail}</span>
                  </div>
                  {req.rdvDate && (
                    <div className="msg-detail-row">
                      <span>📅</span>
                      <span>RDV: {new Date(req.rdvDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {req.note && (
                      <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>Message</p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{req.note}</p>
                      </div>
                    )}
                    <div className="msg-card-actions">
                      {req.status !== 'contacted' && (
                        <button
                          type="button"
                          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                          onClick={() => void markStatus(req, 'contacted')}
                        >
                          ✓ Mark as contacted
                        </button>
                      )}
                      {req.contactMethod === 'whatsapp' && (
                        <a
                          href={`https://wa.me/${req.contactDetail.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          💬 Open WhatsApp
                        </a>
                      )}
                      {req.contactMethod === 'email' && (
                        <a
                          href={`mailto:${req.contactDetail}`}
                          style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          ✉️ Send email
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMessagesSection;
