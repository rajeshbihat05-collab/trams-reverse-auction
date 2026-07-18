import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, MapPin, Calendar, Truck, User, Play, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [aRes, bRes] = await Promise.all([
          api.get(`/auctions/${id}`),
          api.get(`/bids/auction/${id}`),
        ]);
        setAuction(aRes.data);
        setBids(bRes.data.bids || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (!auction || auction.status !== 'live') return;

    const token = localStorage.getItem('access_token');
    const socket = new WebSocket(`ws://${window.location.host}/ws/auction/${id}?token=${token}`);
    
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'bid_update') {
        setBids(prevBids => {
          const exists = prevBids.some(b => b.transporter_id === msg.data.transporter_id);
          if (exists) {
            return prevBids.map(b => b.transporter_id === msg.data.transporter_id ? { ...b, amount: msg.data.amount, revision_number: msg.data.revision_number } : b).sort((x, y) => x.amount - y.amount);
          } else {
            return [...prevBids, msg.data].sort((x, y) => x.amount - y.amount);
          }
        });
      }
    };

    setWs(socket);
    return () => socket.close();
  }, [auction]);

  const handlePublish = async () => {
    try {
      await api.post(`/auctions/${id}/publish`);
      const aRes = await api.get(`/auctions/${id}`);
      setAuction(aRes.data);
    } catch (err) {
      console.error(err);
      alert('Error publishing auction');
    }
  };

  const handleClose = async () => {
    try {
      await api.post(`/auctions/${id}/close`);
      const aRes = await api.get(`/auctions/${id}`);
      setAuction(aRes.data);
    } catch (err) {
      console.error(err);
      alert('Error closing auction');
    }
  };

  const handleAward = () => {
    navigate(`/admin/auctions/${id}/result`);
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!auction) return <div className="card"><div className="empty-state"><h3>Auction not found</h3></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/admin/auctions')}>
            <ArrowLeft size={16} /> Back to Auctions
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{auction.auction_number}</h1>
            <span className={`badge badge-${auction.status}`}>{auction.status}</span>
          </div>
          <p className="page-subtitle">Route: {auction.pickup_location} &rarr; {auction.destination}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {auction.status === 'draft' && (
            <button className="btn btn-primary" onClick={handlePublish}>
              <Play size={16} /> Publish Auction
            </button>
          )}
          {auction.status === 'live' && (
            <button className="btn btn-danger" onClick={handleClose}>
              <XCircle size={16} /> Close Bidding
            </button>
          )}
          {auction.status === 'closed' && (
            <button className="btn btn-success" onClick={handleAward}>
              <CheckCircle2 size={16} /> Award Contract
            </button>
          )}
          {auction.status === 'awarded' && (
            <button className="btn btn-secondary" onClick={() => navigate(`/admin/auctions/${id}/result`)}>
              View Results
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Auction Details</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Material</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{auction.material_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Expected Weight</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{auction.expected_weight ? `${auction.expected_weight} MT` : 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Vehicle Type</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{auction.vehicle_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Required Capacity</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{auction.vehicle_capacity || 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Loading Date</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(auction.loading_date).toLocaleDateString('en-IN')}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Reserve Price</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger)' }}>
                  {auction.reserve_price ? `₹${auction.reserve_price.toLocaleString('en-IN')}` : 'None'}
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <label className="form-label">Special Instructions</label>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{auction.special_instructions || 'No instructions provided.'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Real-Time Bids ({bids.length})</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {bids.length === 0 ? (
              <div className="empty-state">
                <Gavel size={32} />
                <h3>No bids received yet</h3>
                <p>Invitations are active. Bidders will show up when they submit rates.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Transporter</th>
                    <th>Bid Amount</th>
                    <th>Revision #</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b, idx) => (
                    <tr key={b.id} style={{ background: idx === 0 ? 'var(--success-light)' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>L{idx + 1}</td>
                      <td>{b.company_name || 'Anonymous Transporter'}</td>
                      <td style={{ fontWeight: 600, color: idx === 0 ? '#15803d' : 'inherit' }}>
                        ₹{b.amount.toLocaleString('en-IN')}
                      </td>
                      <td>{b.revision_number}</td>
                      <td>
                        {idx === 0 ? (
                          <span className="badge badge-live">Lowest (L1)</span>
                        ) : (
                          <span className="badge badge-draft">Outbid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
