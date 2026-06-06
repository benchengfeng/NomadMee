import React, { useState } from 'react';
import { deleteInvestment, AdminDashboardResponse, Investment } from '../../../api/portalApi';

type AdminSection = 'cargos' | 'investments' | 'investors' | 'products' | 'orders' | 'partners' | 'relations' | 'content' | 'messages' | 'avatars';

interface Props {
  data: AdminDashboardResponse;
  showToast: (message: string, type?: 'success' | 'error') => void;
  refresh: () => Promise<void>;
  onNavigate: (section: AdminSection) => void;
}

type ConfirmDelete = { id: string };

const AdminRelationsSection: React.FC<Props> = ({ data, showToast, refresh, onNavigate }) => {
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null);

  const cargoMap = Object.fromEntries(data.cargos.map((c) => [c._id, c]));
  const investorMap = Object.fromEntries(data.investors.map((i) => [i._id, i]));

  const remove = async (inv: Investment) => {
    try {
      await deleteInvestment(inv._id);
      await refresh();
      showToast('Investment deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete investment', 'error');
    }
  };

  return (
    <div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
        Each investment card shows its linked cargos and investors at a glance.
      </p>

      {data.investments.length === 0 ? (
        <p className="relation-empty">No investments yet. Create investments and link cargos and investors to see relations here.</p>
      ) : (
        <div className="relation-stack">
          {data.investments.map((inv) => {
            const linkedCargos = (inv.cargoIds ?? []).map((id) => cargoMap[id]).filter(Boolean);
            const linkedInvestors = (inv.assignedInvestorIds ?? []).map((id) => investorMap[id]).filter(Boolean);
            const totalInvested = linkedInvestors.reduce((sum, i) => sum + (i?.investmentAmount ?? 0), 0);

            return (
              <div className="relation-card" key={inv._id}>
                <div className="relation-card-header">
                  <div>
                    <h3>{inv.title}</h3>
                    <p className="relation-card-meta">{inv.description}</p>
                    <div className="relation-summary-bar" style={{ marginTop: 6 }}>
                      <span className="portal-item-badge">Min {inv.minimumInvestment} {inv.currency}</span>
                      <span className="portal-item-badge">{linkedCargos.length} cargo{linkedCargos.length !== 1 ? 's' : ''}</span>
                      <span className="portal-item-badge">{linkedInvestors.length} investor{linkedInvestors.length !== 1 ? 's' : ''}</span>
                      {totalInvested > 0 && (
                        <span className="portal-item-badge">Total in: {totalInvested.toLocaleString()} {inv.currency}</span>
                      )}
                    </div>
                  </div>
                  {confirmDelete?.id === inv._id ? (
                    <div className="portal-inline-confirm">
                      <span>Delete?</span>
                      <button type="button" className="portal-btn-delete" onClick={() => { void remove(inv); setConfirmDelete(null); }}>Yes</button>
                      <button type="button" className="portal-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="portal-item-actions">
                      <button type="button" className="portal-btn-edit" onClick={() => onNavigate('investments')}>Edit</button>
                      <button type="button" className="portal-btn-delete" onClick={() => setConfirmDelete({ id: inv._id })}>Delete</button>
                    </div>
                  )}
                </div>

                <div className="relation-columns">
                  <div>
                    <p className="relation-col-label">Cargos</p>
                    {linkedCargos.length === 0 ? (
                      <span className="relation-empty">No cargos linked</span>
                    ) : (
                      <div className="relation-chips">
                        {linkedCargos.map((cargo) => cargo && (
                          <span key={cargo._id} className="relation-chip relation-chip--cargo" title={`${cargo.purchasePrice} ${cargo.currency} · Qty ${cargo.quantity}`}>
                            {cargo.shippingType === 'air' ? '✈️' : cargo.shippingType === 'land' ? '🚛' : '🚢'}{' '}
                            {cargo.productBeingShipped} → {cargo.shippingDestination}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="relation-col-label">Investors</p>
                    {linkedInvestors.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="relation-empty">No investors assigned</span>
                        <button
                          type="button"
                          className="portal-btn-edit"
                          style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                          onClick={() => onNavigate('investors')}
                        >
                          Assign investor →
                        </button>
                      </div>
                    ) : (
                      <div className="relation-chips">
                        {linkedInvestors.map((investor) => investor && (
                          <span
                            key={investor._id}
                            className="relation-chip relation-chip--investor"
                            title={`@${investor.username}${investor.location ? ' · ' + investor.location : ''}`}
                          >
                            👤 {investor.name} — {investor.investmentAmount.toLocaleString()} {investor.currency}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRelationsSection;
