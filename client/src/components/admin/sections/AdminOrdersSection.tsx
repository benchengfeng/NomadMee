import React, { useEffect, useState } from 'react';
import {
  getAdminProductOrders,
  updateProductOrderStatus,
  ProductOrder,
} from '../../../api/portalApi';

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void;
  unreadCount: number;
  onUnreadChange: (n: number) => void;
}

const AdminOrdersSection: React.FC<Props> = ({ showToast, unreadCount, onUnreadChange }) => {
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getAdminProductOrders()
      .then((r) => { setProductOrders(r.orders); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);

  const markStatus = async (order: ProductOrder, status: ProductOrder['status']) => {
    try {
      await updateProductOrderStatus(order._id, status);
      setProductOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status } : o));
      if (status !== 'new') onUnreadChange(Math.max(0, unreadCount - (order.status === 'new' ? 1 : 0)));
      showToast(status === 'contacted' ? 'Marked as contacted ✓' : 'Marked as read');
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.1rem' }}>Shop orders</h2>
        {unreadCount > 0 && (
          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>
            {unreadCount} new
          </span>
        )}
      </div>

      {!loaded ? (
        <p style={{ color: '#475569' }}>Loading…</p>
      ) : productOrders.length === 0 ? (
        <p style={{ color: '#334155', fontSize: '0.9rem' }}>No orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {productOrders.map((order) => {
            const isExpanded = expandedId === order._id;
            const statusColors: Record<string, string> = { new: '#22c55e', read: '#94a3b8', contacted: '#38bdf8' };
            const statusColor = statusColors[order.status] ?? '#94a3b8';
            const methodIcon = order.contactMethod === 'whatsapp' ? '📱' : '✉️';

            return (
              <div
                key={order._id}
                className={`msg-card${order.status === 'new' ? ' msg-card--new' : ''}`}
                onClick={() => {
                  const newId = isExpanded ? null : order._id;
                  setExpandedId(newId);
                  if (newId && order.status === 'new') void markStatus(order, 'read');
                }}
              >
                <div className="msg-card-header">
                  <div>
                    <p className="msg-card-name">🛒 {order.fullName}</p>
                    <p className="msg-card-investment">📦 {order.productName}{order.variant ? ` · ${order.variant}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`msg-status-badge msg-status-badge--${order.status}`} style={{ color: statusColor }}>
                      {order.status === 'new' ? '🔔 New' : order.status === 'read' ? 'Read' : '✓ Contacted'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="msg-card-body">
                  <div className="msg-detail-row">
                    <span>🧮</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {order.quantity} × {order.unitPrice.toLocaleString()} {order.currency} = {order.total.toLocaleString()} {order.currency}
                    </span>
                  </div>
                  <div className="msg-detail-row">
                    <span>📍</span>
                    <span>{order.country}</span>
                  </div>
                  <div className="msg-detail-row">
                    <span>{methodIcon}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{order.contactDetail}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {order.message && (
                      <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>Message</p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{order.message}</p>
                      </div>
                    )}
                    <div className="msg-card-actions">
                      {order.status !== 'contacted' && (
                        <button
                          type="button"
                          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                          onClick={() => void markStatus(order, 'contacted')}
                        >
                          ✓ Mark as contacted
                        </button>
                      )}
                      {order.contactMethod === 'whatsapp' ? (
                        <a
                          href={`https://wa.me/${order.contactDetail.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                          💬 Open WhatsApp
                        </a>
                      ) : (
                        <a
                          href={`mailto:${order.contactDetail}?subject=${encodeURIComponent(`Your nomadme order — ${order.productName}`)}`}
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

export default AdminOrdersSection;
