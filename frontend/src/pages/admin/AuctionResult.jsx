import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Award, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuctionResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [awardStatus, setAwardStatus] = useState('auto_l1');
  const [selectedTransporter, setSelectedTransporter] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, bRes] = await Promise.all([
          api.get(`/auctions/${id}`),
          api.get(`/bids/auction/${id}`),
        ]);
        setAuction(aRes.data);
        const sortedBids = (bRes.data.bids || []).sort((x, y) => x.amount - y.amount);
        setBids(sortedBids);
        if (sortedBids.length > 0) {
          setSelectedTransporter(sortedBids[0]); // default L1
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAwardSubmit = async () => {
    if (!selectedTransporter) return;
    try {
      await api.post(`/auctions/${id}/award`, {
        transporter_id: selectedTransporter.transporter_id,
        amount: selectedTransporter.amount,
        award_status: awardStatus,
        remarks: remarks
      });
      navigate(`/admin/auctions/${id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to award auction');
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!auction) return <div className="card"><div className="empty-state"><h3>Auction not found</h3></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(`/admin/auctions/${id}`)}>
            <ArrowLeft size={16} /> Back to Details
          </button>
          <h1 className="page-title">Award Transportation Contract</h1>
          <p className="page-subtitle">Select the winning transporter from the auction bids comparison.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Commercial Bid Comparison (L1-L3 Analysis)</span>
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
                      <th>Revision #</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((b, idx) => (
                      <tr key={b.id} style={{ background: selectedTransporter?.id === b.id ? 'var(--primary-50)' : 'transparent' }}>
                        <td style={{ fontWeight: 600 }}>L{idx + 1}</td>
                        <td>{b.company_name}</td>
                        <td style={{ fontWeight: 600 }}>₹{b.amount.toLocaleString('en-IN')}</td>
                        <td>{b.revision_number}</td>
                        <td>
                          <input 
                            type="radio" 
                            name="winner-select" 
                            checked={selectedTransporter?.id === b.id}
                            onChange={() => {
                              setSelectedTransporter(b);
                              setAwardStatus(idx === 0 ? 'auto_l1' : 'manual');
                            }}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
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
            <span className="card-title">Award Decision Details</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedTransporter ? (
              <>
                <div>
                  <label className="form-label" style={{ marginBottom: 2 }}>Selected Winner</label>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedTransporter.company_name}</div>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 2 }}>Final Agreed Rate</label>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>
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
                    <option value="manual">Award to L2/L3 (requires remarks)</option>
                    <option value="negotiated">Negotiated / Post-auction rate change</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Justification *</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Enter reasoning for decision (mandatory if not choosing L1)"
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    required 
                  />
                </div>

                <button 
                  className="btn btn-primary btn-lg w-full" 
                  onClick={handleAwardSubmit}
                  style={{ justifyContent: 'center' }}
                  disabled={awardStatus !== 'auto_l1' && !remarks}
                >
                  <Award size={18} /> Confirm Award
                </button>
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
