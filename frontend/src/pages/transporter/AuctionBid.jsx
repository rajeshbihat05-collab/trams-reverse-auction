import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Clock, CheckCircle2, ArrowLeft, Zap, ShieldAlert, Award, TrendingDown, Wifi, WifiOff, PartyPopper, CheckCircle } from 'lucide-react';

export default function AuctionBid() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [lowestBid, setLowestBid] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [awardResult, setAwardResult] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [urgentWarn, setUrgentWarn] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);

  const socketRef = useRef(null);

  const fetchAuctionAndBid = async () => {
    try {
      const [aRes, bRes] = await Promise.all([
        api.get(`/auctions/${id}`),
        api.get(`/bids/auction/${id}`),
      ]);

      const auctionData = aRes.data;
      setAuction(auctionData);

      const bids = bRes.data.bids || [];
      if (bRes.data.lowest_bid) setLowestBid(bRes.data.lowest_bid);

      if (bids.length > 0) {
        const active = bids[0];
        setMyBid(active);
        setBidAmount(active.amount.toString());
        setRemarks(active.remarks || '');
      }

      if (auctionData.status === 'awarded') {
        try {
          const rRes = await api.get(`/bids/auction/${id}/result`);
          setAwardResult(rRes.data);
        } catch {
          // result not published yet or error
        }
      }

      checkExpiry(auctionData.closing_time, auctionData.status);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load auction details');
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
      setTimeLeftStr(status === 'awarded' ? 'Contract Awarded' : 'Bidding Closed');
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

      setUrgentWarn(diff < 2 * 60 * 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }
  };

  useEffect(() => {
    if (!auction?.closing_time) return;

    const timer = setInterval(() => {
      checkExpiry(auction.closing_time, auction.status);
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  useEffect(() => {
    fetchAuctionAndBid();

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
        } else if (msg.type === 'bid_confirmed') {
          if (msg.data?.amount) {
            setMyBid((prev) => ({
              ...(prev || {}),
              amount: msg.data.amount,
              revision_number: msg.data.revision,
              submitted_at: msg.data.submitted_at,
            }));
            if (msg.data.lowest_bid) setLowestBid(msg.data.lowest_bid);
            if (msg.data.rank) setMyRank(msg.data.rank);
            setBidHistory((prev) => [
              {
                amount: msg.data.amount,
                revision: msg.data.revision,
                time: new Date(msg.data.submitted_at).toLocaleTimeString('en-IN'),
              },
              ...prev,
            ]);
          }
        } else if (msg.type === 'bid_activity') {
          if (msg.data?.lowest_bid) setLowestBid(msg.data.lowest_bid);
          fetchAuctionAndBid();
        } else if (msg.type === 'auction_status') {
          if (msg.status === 'closed') {
            setIsExpired(true);
            setAuction((prev) => prev ? { ...prev, status: 'closed' } : prev);
          } else if (msg.status === 'awarded') {
            setIsExpired(true);
            setAuction((prev) => prev ? { ...prev, status: 'awarded' } : prev);
            fetchAuctionAndBid();
          } else if (msg.status === 'extended') {
            setAuction((prev) => prev ? { ...prev, closing_time: msg.data.closing_time } : prev);
            setSuccessMsg(`Auction extended by ${msg.data.extended_by_minutes || 3} mins!`);
            setTimeout(() => setSuccessMsg(''), 4000);
          }
        }
      } catch (err) {
        console.error('WS JSON parse error', err);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
    };

    socketRef.current = socket;

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [id]);

  const handleBidSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const val = parseFloat(bidAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Please enter a valid rate amount greater than ₹0');
      return;
    }

    if (myBid && val >= myBid.amount) {
      setErrorMsg(`In a reverse auction, your new bid (₹${val.toLocaleString('en-IN')}) must be lower than your current active quote (₹${myBid.amount.toLocaleString('en-IN')})`);
      return;
    }

    if (auction.reserve_price && val > auction.reserve_price) {
      setErrorMsg(`Your bid cannot exceed the Reserve Price limit of ₹${auction.reserve_price.toLocaleString('en-IN')}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/bids', {
        auction_id: id,
        amount: val,
        remarks: remarks,
      });

      setSuccessMsg(`Rate quote ₹${val.toLocaleString('en-IN')} submitted successfully!`);
      setMyBid(res.data);
      fetchAuctionAndBid();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit bid quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDecrement = (amountToSubtract) => {
    let base = myBid ? myBid.amount : (lowestBid || auction?.reserve_price || 50000);
    let newVal = Math.max(0, base - amountToSubtract);
    setBidAmount(newVal.toString());
  };

  const handleMatchL1 = () => {
    if (lowestBid) {
      let target = Math.max(0, lowestBid - 500);
      setBidAmount(target.toString());
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!auction) return <div className="card"><div className="empty-state"><h3>Auction load error</h3></div></div>;

  const currentLowest = lowestBid || (myBid ? myBid.amount : null);
  const isL1 = myBid && currentLowest && myBid.amount <= currentLowest;
  const isWinner = awardResult && myBid && awardResult.winner_id === myBid.transporter_id;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <button className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/transporter/auctions')}>
            <ArrowLeft size={16} /> Back to Cargo Auctions
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-title">{auction.auction_number}</h1>
            <span className={`badge ${auction.status === 'awarded' ? 'badge-published' : isExpired ? 'badge-closed' : 'badge-live'}`} style={{ backgroundColor: auction.status === 'awarded' ? '#15803d' : undefined, color: auction.status === 'awarded' ? '#ffffff' : undefined }}>
              {auction.status === 'awarded' ? '🏆 Contract Awarded' : isExpired ? 'Bidding Closed' : '🟢 Bidding Live'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: wsConnected ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {wsConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {wsConnected ? 'Live Synchronized' : 'Connecting...'}
            </span>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Route: <strong>{auction.pickup_location}</strong> {auction.pickup_postal_code ? `(PIN: ${auction.pickup_postal_code})` : ''} &rarr; <strong>{auction.destination}</strong> {auction.destination_postal_code ? `(PIN: ${auction.destination_postal_code})` : ''}
          </p>
        </div>

        {/* Live Timer / Award Card */}
        <div style={{ 
          background: auction.status === 'awarded' ? '#f0fdf4' : isExpired ? 'var(--danger-light)' : urgentWarn ? '#fef2f2' : 'var(--card-bg)', 
          border: `2px solid ${auction.status === 'awarded' ? '#16a34a' : isExpired ? 'var(--danger)' : urgentWarn ? '#ef4444' : 'var(--primary)'}`,
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          minWidth: 200,
          boxShadow: urgentWarn ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Clock size={14} /> {auction.status === 'awarded' ? 'AWARD STATUS' : 'REMAINING TIME'}
          </div>
          <div style={{ 
            fontSize: 22, 
            fontWeight: 800, 
            fontFamily: 'monospace', 
            color: auction.status === 'awarded' ? '#15803d' : isExpired ? 'var(--danger)' : urgentWarn ? '#dc2626' : 'var(--primary)',
            letterSpacing: 1,
            marginTop: 2
          }}>
            {timeLeftStr}
          </div>
        </div>
      </div>

      {/* Official Award Announcement Banner (if awarded) */}
      {awardResult && (
        <div className="card mb-6 animate-fade-in" style={{ 
          background: isWinner ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          color: '#ffffff',
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isWinner ? (
              <PartyPopper size={48} style={{ color: '#fde047' }} />
            ) : (
              <Award size={48} style={{ color: '#60a5fa' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12 }}>
                  OFFICIAL PUBLISHED ANNOUNCEMENT
                </span>
                {awardResult.awarded_at && (
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    Awarded on {new Date(awardResult.awarded_at).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 4px 0', color: '#fff' }}>
                {isWinner ? '🎉 CONGRATULATIONS! YOUR COMPANY WON THIS TRANSPORTATION ORDER!' : `Contract Awarded to ${awardResult.winner_company || 'Winning Transporter'}`}
              </h2>
              <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
                {isWinner 
                  ? `Your rate quote of ₹${awardResult.winning_amount.toLocaleString('en-IN')} was accepted and officially published by Admin.`
                  : `This route was awarded to ${awardResult.winner_company} at final agreed freight rate of ₹${awardResult.winning_amount.toLocaleString('en-IN')}.`}
              </p>
              {awardResult.remarks && (
                <div style={{ marginTop: 8, fontSize: 13, background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Admin Remarks:</strong> {awardResult.remarks}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
        {/* Left Column: Requirements & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status & Rank Card */}
          <div className="card" style={{ 
            background: isWinner ? '#f0fdf4' : isL1 ? '#f0fdf4' : myBid ? '#fff7ed' : 'var(--card-bg)',
            borderColor: isWinner ? '#16a34a' : isL1 ? '#22c55e' : myBid ? '#f97316' : 'var(--border-color)',
            borderWidth: 2
          }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {isWinner ? (
                <CheckCircle size={40} style={{ color: '#16a34a' }} />
              ) : isL1 ? (
                <Award size={40} style={{ color: '#16a34a' }} />
              ) : myBid ? (
                <TrendingDown size={40} style={{ color: '#ea580c' }} />
              ) : (
                <Gavel size={40} style={{ color: 'var(--primary)' }} />
              )}
              <div>
                <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Your Position Status
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isWinner || isL1 ? '#15803d' : myBid ? '#c2410c' : 'var(--text-main)', marginTop: 2 }}>
                  {isWinner ? '🎉 Winner (Order Awarded)' : isL1 ? '🏆 Lowest Rate (L1 Position)' : myBid ? `⚠️ Outbid (Rank L${myRank || 2})` : 'Not Bidded Yet'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {isWinner ? 'This order has been officially published and assigned to your transport company!' : isL1 ? 'Great job! You currently hold the lowest rate for this load.' : myBid ? 'Revise your freight rate downwards to reclaim the L1 position.' : 'Submit your first rate quotation to join the auction.'}
                </div>
              </div>
            </div>
          </div>

          {/* Transportation Specifications */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Freight & Route Details</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Material Type</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.material_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Cargo Weight</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.expected_weight ? `${auction.expected_weight} MT` : 'N/A'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Vehicle Type Needed</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_type}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Capacity / Specs</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{auction.vehicle_capacity || 'Standard'}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Loading Date</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(auction.loading_date).toLocaleDateString('en-IN')}</div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 2 }}>Reserve Price (Max Cap)</label>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
                  {auction.reserve_price ? `₹${auction.reserve_price.toLocaleString('en-IN')}` : 'No Limit'}
                </div>
              </div>
            </div>
            {auction.special_instructions && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-subtle)', fontSize: 13 }}>
                <strong>Instructions:</strong> {auction.special_instructions}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Reverse Bidding Box */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} style={{ color: 'var(--warning)' }} /> Live Rate Submission
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Rates Comparison Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, background: 'var(--primary-50)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Benchmark (L1)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
                  {lowestBid ? `₹${lowestBid.toLocaleString('en-IN')}` : 'No Bids Yet'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Your Active Rate</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                  {myBid ? `₹${myBid.amount.toLocaleString('en-IN')}` : 'Not Submitted'}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={16} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            <form onSubmit={handleBidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Enter Quoted Rate (₹) *
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  disabled={isExpired || submitting}
                  placeholder="e.g. 18500" 
                  value={bidAmount} 
                  onChange={(e) => setBidAmount(e.target.value)} 
                  style={{ fontSize: 18, fontWeight: 700, padding: '10px 14px' }}
                />
              </div>

              {/* Quick Rate Reduction Buttons */}
              {!isExpired && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    ⚡ 1-Click Fast Rate Decrements:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDecrement(500)}>
                      - ₹500
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDecrement(1000)}>
                      - ₹1,000
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDecrement(2000)}>
                      - ₹2,000
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickDecrement(5000)}>
                      - ₹5,000
                    </button>
                    {lowestBid && !isL1 && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleMatchL1} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                        Beat L1 (-₹500)
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Bid Remarks (Optional)</label>
                <input 
                  type="text"
                  className="form-input" 
                  disabled={isExpired || submitting}
                  placeholder="e.g. Ready for immediate placement" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg w-full" 
                disabled={isExpired || submitting}
                style={{ justifyContent: 'center', backgroundColor: isExpired ? '#9ca3af' : undefined }}
              >
                <Gavel size={18} /> {submitting ? 'Submitting Rate...' : isExpired ? (auction.status === 'awarded' ? 'Contract Awarded' : 'Bidding Closed') : myBid ? 'Update Rate Quote' : 'Submit Rate Quote'}
              </button>
            </form>

            {/* Transporter Revision Log */}
            {bidHistory.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Your Submitted Revisions Log:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                  {bidHistory.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <span>Rev #{h.revision}: <strong>₹{h.amount.toLocaleString('en-IN')}</strong></span>
                      <span style={{ color: 'var(--text-muted)' }}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
