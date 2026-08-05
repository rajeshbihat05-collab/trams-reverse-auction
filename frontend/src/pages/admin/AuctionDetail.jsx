import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Clock, Play, CheckCircle2, XCircle, ArrowLeft, PlusCircle, Users, Wifi, ShieldAlert } from 'lucide-react';

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeConnections, setActiveConnections] = useState(0);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [extending, setExtending] = useState(false);

  const socketRef = useRef(null);

  const fetchDetail = async () => {
    try {
      const [aRes, bRes] = await Promise.all([
        api.get(`/auctions/${id}`),
        api.get(`/bids/auction/${id}`),
      ]);
      setAuction(aRes.data);
      const sortedBids = (bRes.data.bids || []).sort((x, y) => x.amount - y.amount);
      setBids(sortedBids);
      checkExpiry(aRes.data.closing_time, aRes.data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseIsoDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
      return new Date(dateStr + 'Z');
    }
    return new Date(dateStr);
  };

  const checkExpiry = (closingIso, status) => {
    if (status === 'closed' || status === 'awarded' || status === 'cancelled') {
      setIsExpired(true);
      setTimeLeftStr('Bidding Closed');
      return;
    }
    if (!closingIso) return;

    const closingTime = parseIsoDate(closingIso).getTime();
    const now = new Date().getTime();
    const diff = closingTime - now;

    if (diff <= 0) {
      setIsExpired(true);
      setTimeLeftStr('Bidding Closed');
    } else {
      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Timer Effect
  useEffect(() => {
    if (!auction?.closing_time) return;

    const timer = setInterval(() => {
      checkExpiry(auction.closing_time, auction.status);
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  // WebSocket Connection
  useEffect(() => {
    if (!auction) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/auction/${id}?token=${token}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          setWsConnected(true);
          if (msg.data?.active_connections) {
            setActiveConnections(msg.data.active_connections);
          }
        } else if (msg.type === 'connection_count') {
          setActiveConnections(msg.data.count || 0);
        } else if (msg.type === 'bid_update') {
          setBids((prevBids) => {
            const exists = prevBids.some((b) => b.transporter_id === msg.data.transporter_id);
            let updated;
            if (exists) {
              updated = prevBids.map((b) =>
                b.transporter_id === msg.data.transporter_id
                  ? { ...b, amount: msg.data.amount, revision_number: msg.data.revision_number, submitted_at: msg.data.submitted_at }
                  : b
              );
            } else {
              updated = [...prevBids, msg.data];
            }
            return updated.sort((x, y) => x.amount - y.amount);
          });
        } else if (msg.type === 'auction_status') {
          if (msg.status === 'closed') {
            setAuction((prev) => (prev ? { ...prev, status: 'closed' } : prev));
            setIsExpired(true);
          } else if (msg.status === 'extended') {
            setAuction((prev) => (prev ? { ...prev, closing_time: msg.data.closing_time } : prev));
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
    };

    socketRef.current = socket;

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [auction?.id]);

  const handlePublish = async () => {
    try {
      await api.post(`/auctions/${id}/publish`);
      fetchDetail();
    } catch (err) {
      console.error(err);
      alert('Error publishing auction');
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Are you sure you want to close bidding now? Transporters will no longer be able to submit rates.')) return;
    try {
      await api.post(`/auctions/${id}/close`);
      fetchDetail();
    } catch (err) {
      console.error(err);
      alert('Error closing auction');
    }
  };

  const handleExtend = async (minutes = 5) => {
    setExtending(true);
    try {
      await api.post(`/auctions/${id}/extend?minutes=${minutes}`);
      fetchDetail();
    } catch (err) {
      console.error(err);
      alert('Error extending auction time');
    } finally {
      setExtending(false);
    }
  };

  const handleAward = () => {
    navigate(`/admin/auctions/${id}/result`);
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!auction) return <div className="card"><div className="empty-state"><h3>Auction not found</h3></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <button className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/admin/auctions')}>
            <ArrowLeft size={16} /> Back to Auctions List
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-title">{auction.auction_number}</h1>
            <span className={`badge badge-${auction.status}`}>{auction.status.toUpperCase()}</span>
            {auction.status === 'live' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                <Users size={16} /> {activeConnections} Live Bidders Connected
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Route: <strong>{auction.pickup_location}</strong> {auction.pickup_postal_code ? `(PIN: ${auction.pickup_postal_code})` : ''} &rarr; <strong>{auction.destination}</strong> {auction.destination_postal_code ? `(PIN: ${auction.destination_postal_code})` : ''}
          </p>
        </div>

        {/* Admin Timer & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {auction.status === 'live' && (
            <div style={{ 
              background: 'var(--card-bg)', 
              border: '2px solid var(--primary)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>LIVE COUNTDOWN</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                {timeLeftStr}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {auction.status === 'draft' && (
              <button className="btn btn-primary" onClick={handlePublish}>
                <Play size={16} /> Publish Auction
              </button>
            )}

            {auction.status === 'live' && (
              <>
                <button className="btn btn-secondary" onClick={() => handleExtend(5)} disabled={extending}>
                  <PlusCircle size={16} /> {extending ? 'Extending...' : '+5 Mins'}
                </button>
                <button className="btn btn-danger" onClick={handleClose}>
                  <XCircle size={16} /> Close Bidding
                </button>
              </>
            )}

            {auction.status === 'closed' && (
              <button className="btn btn-success" onClick={handleAward} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                <CheckCircle2 size={16} /> Award Contract
              </button>
            )}

            {auction.status === 'awarded' && (
              <button className="btn btn-secondary" onClick={() => navigate(`/admin/auctions/${id}/result`)}>
                View Result Details
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Auction Details & Requirements</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Material Type</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.material_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Expected Weight</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.expected_weight ? `${auction.expected_weight} MT` : 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Vehicle Type Needed</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Capacity Specification</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_capacity || 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Loading Date</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(auction.loading_date).toLocaleDateString('en-IN')}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Reserve Price Cap</label>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
                  {auction.reserve_price ? `₹${auction.reserve_price.toLocaleString('en-IN')}` : 'None'}
                </div>
              </div>
            </div>
            {auction.special_instructions && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                <label className="form-label">Special Instructions</label>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{auction.special_instructions}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Real-Time Bids Stream ({bids.length})</span>
            {auction.status === 'live' && (
              <span className="badge badge-live" style={{ fontSize: 11 }}>
                🟢 Real-Time Synced
              </span>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {bids.length === 0 ? (
              <div className="empty-state">
                <Gavel size={32} />
                <h3>No bids submitted yet</h3>
                <p>Invited transporters will appear here live when they submit rate quotes.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Transporter Name</th>
                    <th>Quoted Rate</th>
                    <th>Revision #</th>
                    <th>Position Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b, idx) => (
                    <tr key={b.id} style={{ background: idx === 0 ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ fontWeight: 700, color: idx === 0 ? '#15803d' : 'inherit' }}>L{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{b.company_name || 'Transporter'}</td>
                      <td style={{ fontWeight: 800, color: idx === 0 ? '#15803d' : 'inherit' }}>
                        ₹{b.amount.toLocaleString('en-IN')}
                      </td>
                      <td>Rev #{b.revision_number}</td>
                      <td>
                        {idx === 0 ? (
                          <span className="badge badge-live" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>🏆 Lowest (L1)</span>
                        ) : (
                          <span className="badge badge-draft" style={{ opacity: 0.8 }}>Outbid</span>
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
