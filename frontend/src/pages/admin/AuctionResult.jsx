import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Award, ArrowLeft, CheckCircle2, AlertCircle, Megaphone, Save } from 'lucide-react';

export default function AuctionResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [existingResult, setExistingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [awardStatus, setAwardStatus] = useState('auto_l1');
  const [selectedTransporter, setSelectedTransporter] = useState(null);

  const fetchData = async () => {
    try {
      const [aRes, bRes] = await Promise.all([
        api.get(`/auctions/${id}`),
        api.get(`/bids/auction/${id}`),
      ]);
      setAuction(aRes.data);
      const sortedBids = (bRes.data.bids || []).sort((x, y) => x.amount - y.amount);
      setBids(sortedBids);

      // Check existing result
      try {
        const rRes = await api.get(`/bids/auction/${id}/result`);
        if (rRes.data) {
          setExistingResult(rRes.data);
          setRemarks(rRes.data.remarks || '');
          setAwardStatus(rRes.data.award_status || 'auto_l1');
          const matched = sortedBids.find(b => b.transporter_id === rRes.data.winner_id);
          if (matched) setSelectedTransporter(matched);
        }
      } catch {
        if (sortedBids.length > 0) {
          setSelectedTransporter(sortedBids[0]); // Default L1
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAwardSubmit = async (publishNow = false) => {
    if (!selectedTransporter) return;
    setSubmitting(true);
    try {
      await api.post(`/auctions/${id}/award`, {
        transporter_id: selectedTransporter.transporter_id,
        amount: selectedTransporter.amount,
        award_status: awardStatus,
        remarks: remarks,
        publish_now: publishNow,
      });

      alert(publishNow ? '🎉 Award Result Officially Published to Transporters!' : '💾 Internal Decision Saved as Draft.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save award decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectPublish = async () => {
    if (!window.confirm('Are you sure you want to PUBLISH this contract award to all transporters? Notifications will be sent.')) return;
    setSubmitting(true);
    try {
      await api.post(`/auctions/${id}/publish-result`);
      alert('🎉 Award Result Officially Published to Transporters!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to publish result');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!auction) return <div className="card"><div className="empty-state"><h3>Auction not found</h3></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(`/admin/auctions/${id}`)}>
            <ArrowLeft size={16} /> Back to Auction Details
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">Award Transportation Contract</h1>
            {existingResult && (
              <span className={`badge ${existingResult.is_published ? 'badge-live' : 'badge-draft'}`} style={{ backgroundColor: existingResult.is_published ? '#16a34a' : '#d97706', color: '#fff' }}>
                {existingResult.is_published ? '🟢 PUBLICLY PUBLISHED' : '🟡 INTERNAL DRAFT'}
              </span>
            )}
          </div>
          <p className="page-subtitle">Evaluate commercial bids and decide when to publish the winner announcement to transporters.</p>
        </div>
      </div>

      {/* Internal vs Public Banner */}
      {existingResult && (
        <div className="card mb-6" style={{ 
          background: existingResult.is_published ? '#f0fdf4' : '#fffbeb', 
          borderColor: existingResult.is_published ? '#22c55e' : '#f59e0b',
          borderWidth: 2,
          padding: '16px 20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: existingResult.is_published ? '#15803d' : '#b45309' }}>
              {existingResult.is_published ? '🏆 Published Winner: ' + existingResult.winner_company : '💾 Internal Decision Saved for: ' + existingResult.winner_company}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {existingResult.is_published 
                ? 'This contract award is currently live and visible on Transporter Apps.' 
                : 'This decision is saved internally. Transporters cannot see the winner until you click Publish.'}
            </div>
          </div>

          {!existingResult.is_published && (
            <button className="btn btn-success" onClick={handleDirectPublish} disabled={submitting} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
              <Megaphone size={18} /> Publish Result to Transporters Now
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Commercial Bid Comparison (L1 - L3 Analysis)</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {bids.length === 0 ? (
                <div className="empty-state">
                  <AlertCircle size={32} />
                  <h3>No bids to compare</h3>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Transporter Name</th>
                      <th>Bid Amount</th>
                      <th>Revisions</th>
                      <th>Select Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((b, idx) => (
                      <tr key={b.id} style={{ background: selectedTransporter?.id === b.id ? 'var(--primary-50)' : 'transparent' }}>
                        <td style={{ fontWeight: 700, color: idx === 0 ? '#15803d' : 'inherit' }}>L{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{b.company_name}</td>
                        <td style={{ fontWeight: 800 }}>₹{b.amount.toLocaleString('en-IN')}</td>
                        <td>Rev #{b.revision_number}</td>
                        <td>
                          <input 
                            type="radio" 
                            name="winner-select" 
                            checked={selectedTransporter?.id === b.id}
                            onChange={() => {
                              setSelectedTransporter(b);
                              setAwardStatus(idx === 0 ? 'auto_l1' : 'manual');
                            }}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Award Decision & Publishing</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedTransporter ? (
              <>
                <div>
                  <label className="form-label" style={{ marginBottom: 2 }}>Selected Winner</label>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{selectedTransporter.company_name}</div>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 2 }}>Final Agreed Rate</label>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>
                    ₹{selectedTransporter.amount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Award Method</label>
                  <select 
                    className="form-select" 
                    value={awardStatus} 
                    onChange={(e) => setAwardStatus(e.target.value)}
                  >
                    <option value="auto_l1">Award to Lowest Bidder (L1)</option>
                    <option value="manual">Award to L2/L3 (Requires remarks)</option>
                    <option value="negotiated">Negotiated / Post-auction rate change</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Justification / Remarks *</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Enter decision reasoning (mandatory if awarding to non-L1)"
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <button 
                    className="btn btn-secondary w-full" 
                    onClick={() => handleAwardSubmit(false)}
                    style={{ justifyContent: 'center' }}
                    disabled={submitting || (awardStatus !== 'auto_l1' && !remarks)}
                  >
                    <Save size={16} /> Save Internal Decision (Draft)
                  </button>

                  <button 
                    className="btn btn-primary btn-lg w-full" 
                    onClick={() => handleAwardSubmit(true)}
                    style={{ justifyContent: 'center', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                    disabled={submitting || (awardStatus !== 'auto_l1' && !remarks)}
                  >
                    <Megaphone size={18} /> 📢 Save & Publish to Transporters
                  </button>
                </div>
              </>
            ) : (
              <p className="text-muted text-sm text-center">Please select a bidder from the list.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
