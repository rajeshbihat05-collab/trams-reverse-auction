import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Search, MapPin, Calendar, ArrowRight, Award, CheckCircle2 } from 'lucide-react';

export default function AvailableAuctions() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('live');

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await api.get(`/auctions?search=${searchTerm}`);
        setAuctions(res.data.auctions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, [searchTerm]);

  const filteredAuctions = auctions.filter((a) => {
    if (statusFilter === 'live') return ['live', 'published'].includes(a.status);
    if (statusFilter === 'awarded') return a.status === 'awarded';
    if (statusFilter === 'closed') return ['closed', 'awarded'].includes(a.status);
    return true;
  });

  const parseIsoDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
      return new Date(dateStr + 'Z');
    }
    return new Date(dateStr);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Freight Auctions</h1>
          <p className="page-subtitle">Submit rate quotes on active routes and track published order awards.</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div className="header-search" style={{ width: '100%', maxWidth: 360 }}>
            <Search style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search route, location or material..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%' }}
            />
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className={`btn btn-sm ${statusFilter === 'live' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter('live')}
            >
              🟢 Live Bidding
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'awarded' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter('awarded')}
              style={{ backgroundColor: statusFilter === 'awarded' ? '#16a34a' : undefined, borderColor: statusFilter === 'awarded' ? '#16a34a' : undefined }}
            >
              🏆 Published Awards
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter('all')}
            >
              All Cargo
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : filteredAuctions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Gavel size={48} />
            <h3>No Auctions Found</h3>
            <p>No cargo requirements match your selected filter at this time.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredAuctions.map((a) => (
            <div className="card" key={a.id} style={{ borderColor: a.status === 'awarded' ? '#16a34a' : undefined }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{a.auction_number}</span>
                <span className={`badge ${a.status === 'awarded' ? 'badge-published' : a.status === 'closed' ? 'badge-closed' : 'badge-live'}`} style={{ backgroundColor: a.status === 'awarded' ? '#15803d' : undefined, color: a.status === 'awarded' ? '#fff' : undefined }}>
                  {a.status === 'awarded' ? '🏆 Contract Awarded' : a.status === 'closed' ? 'Closed' : 'Live'}
                </span>
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
                    <div style={{ fontWeight: 600 }}>{a.material_type}</div>
                  </div>
                  <div>
                    <span className="text-muted">Vehicle:</span>
                    <div style={{ fontWeight: 600 }}>{a.vehicle_type}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted" />
                    <span>Loading: {parseIsoDate(a.loading_date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ color: a.status === 'awarded' ? '#16a34a' : 'var(--danger)', fontWeight: 600 }}>
                    {a.status === 'awarded' ? 'Award Published' : `Ends: ${parseIsoDate(a.closing_time).toLocaleTimeString('en-IN')}`}
                  </div>
                </div>

                <button 
                  className="btn w-full" 
                  onClick={() => navigate(`/transporter/auctions/${a.id}/bid`)}
                  style={{ 
                    justifyContent: 'center', 
                    marginTop: 8,
                    backgroundColor: a.status === 'awarded' ? '#16a34a' : 'var(--primary)',
                    borderColor: a.status === 'awarded' ? '#16a34a' : 'var(--primary)',
                    color: '#fff'
                  }}
                >
                  {a.status === 'awarded' ? 'View Published Result' : 'Place Rate Quote'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
