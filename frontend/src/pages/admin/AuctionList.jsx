import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Search, Plus, Calendar, MapPin, Loader, ArrowRight } from 'lucide-react';

export default function AuctionList() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/auctions?page=${page}&status=${statusFilter}&search=${searchTerm}`);
        setAuctions(res.data.auctions);
        setTotal(res.data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, [page, statusFilter, searchTerm]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auctions</h1>
          <p className="page-subtitle">Manage, track and award active cargo/vehicle reverse auctions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/auctions/create')}>
          <Plus size={16} /> Create Auction
        </button>
      </div>

      <div className="card mb-6">
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="header-search" style={{ flex: 1, minWidth: 250 }}>
            <Search style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by pickup, destination or materials..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <select 
              className="form-select" 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="live">Live</option>
              <option value="closed">Closed</option>
              <option value="awarded">Awarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : auctions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Gavel size={48} />
            <h3>No Auctions Found</h3>
            <p>Try refining your search queries or create a new auction template.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Auction ID</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Material Type</th>
                  <th>Vehicle Requirements</th>
                  <th>Closing Date</th>
                  <th>Bids</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.auction_number}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-muted" />
                        <span>{a.pickup_location}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-muted" />
                        <span>{a.destination}</span>
                      </div>
                    </td>
                    <td>{a.material_type}</td>
                    <td>
                      <div>{a.vehicle_type}</div>
                      <div className="text-xs text-muted">{a.vehicle_capacity || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted" />
                        <span>{new Date(a.closing_time).toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.total_bids}</td>
                    <td>
                      <span className={`badge badge-${a.status}`}>{a.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/admin/auctions/${a.id}`)}
                      >
                        Details <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="pagination">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                &laquo;
              </button>
              <button className="active">{page}</button>
              <button 
                disabled={page * 20 >= total} 
                onClick={() => setPage(page + 1)}
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
