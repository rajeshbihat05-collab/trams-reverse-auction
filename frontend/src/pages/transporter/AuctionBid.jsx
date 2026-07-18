import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Clock, MapPin, DollarSign, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AuctionBid() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchAuctionAndBid = async () => {
    try {
      const [aRes, bRes] = await Promise.all([
        api.get(`/auctions/${id}`),
        api.get(`/bids/auction/${id}`),
      ]);
      setAuction(aRes.data);
      const bids = bRes.data.bids || [];
      if (bids.length > 0) {
        setMyBid(bids[0]);
        setBidAmount(bids[0].amount.toString());
        setRemarks(bids[0].remarks || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionAndBid();
  }, [id]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      await api.post('/bids', {
        auction_id: id,
        amount: parseFloat(bidAmount),
        remarks: remarks,
      });
      setSuccess(true);
      fetchAuctionAndBid();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Error submitting rate quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!auction) return <div className="card"><div className="empty-state"><h3>Auction template not found</h3></div></div>;

  return (
    <div className="animate-fade-in" style={{ maxW: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/transporter/auctions')}>
            <ArrowLeft size={16} /> Back to Available Cargo
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{auction.auction_number}</h1>
            <span className="badge badge-live">Bidding Live</span>
          </div>
          <p className="page-subtitle">Route: {auction.pickup_location} {auction.pickup_postal_code ? `(PIN: ${auction.pickup_postal_code})` : ''} &rarr; {auction.destination} {auction.destination_postal_code ? `(PIN: ${auction.destination_postal_code})` : ''}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Transportation Profile</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Material Type</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.material_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Expected Weight</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.expected_weight ? `${auction.expected_weight} MT` : 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Vehicle Needed</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Required Capacity</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_capacity || 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Required Length</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_length || 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Required Width</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_width || 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Loading Date</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(auction.loading_date).toLocaleDateString('en-IN')}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Closing Time</label>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>
                  {new Date(auction.closing_time).toLocaleTimeString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Submit Rate Quote (Reverse Auction)</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleBidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {myBid && (
                <div style={{ padding: '12px 16px', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 8 }}>
                  Your current active quotation: <strong>₹{myBid.amount.toLocaleString('en-IN')}</strong> (Revision #{myBid.revision_number})
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Quoted Freight Amount (₹) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  placeholder="Enter bidding rate..." 
                  value={bidAmount} 
                  onChange={(e) => setBidAmount(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bid Remarks (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="e.g. Can supply extra driver support" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
                {success && (
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <CheckCircle2 size={16} /> Bid Submitted!
                  </span>
                )}
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                >
                  <Gavel size={16} /> {submitting ? 'Submitting...' : 'Submit / Update Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
