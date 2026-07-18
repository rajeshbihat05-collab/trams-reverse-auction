import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Search, MapPin, Calendar, ArrowRight } from 'lucide-react';

export default function AvailableAuctions() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await api.get(`/auctions?search=${searchTerm}`);
        // Filter only relevant active states for bidder
        setAuctions(res.data.auctions.filter(a => ['live', 'published'].includes(a.status)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, [searchTerm]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Available Cargo Auctions</h1>
          <p className="page-subtitle">Submit commercial rate quotations for active transport routes.</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="header-search" style={{ width: '100%', maxW: 400 }}>
            <Search style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search pickup, destination or cargo..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : auctions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Gavel size={48} />
            <h3>No Active Auctions</h3>
            <p>You have bid on all assigned routes or no requirements are active at this time.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {auctions.map(a => (
            <div className="card" key={a.id}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{a.auction_number}</span>
                <span className="badge badge-live">Live</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
                    <MapPin size={14} className="text-muted" />
                    <strong>From:</strong> {a.pickup_location}
                  </div>
                  <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
                    <MapPin size={14} className="text-muted" />
                    <strong>To:</strong> {a.destination}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '8px 0' }}>
                  <div>
                    <span className="text-muted">Material:</span>
                    <div>{a.material_type}</div>
                  </div>
                  <div>
                    <span className="text-muted">Vehicle:</span>
                    <div>{a.vehicle_type}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted" />
                    <span>Loading: {new Date(a.loading_date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ color: 'var(--danger)', fontWeight: 600 }}>
                    Ends: {new Date(a.closing_time).toLocaleTimeString('en-IN')}
                  </div>
                </div>

                <button 
                  className="btn btn-primary w-full" 
                  onClick={() => navigate(`/transporter/auctions/${a.id}/bid`)}
                  style={{ justifyContent: 'center', marginTop: 8 }}
                >
                  Place Rate Quote <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
