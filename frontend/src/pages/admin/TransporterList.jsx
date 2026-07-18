import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Truck, Check, X, Search, ShieldCheck } from 'lucide-react';

export default function TransporterList() {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransporters = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/transporters?page=${page}&search=${searchTerm}`);
      setTransporters(res.data.transporters);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransporters();
  }, [page, searchTerm]);

  const handleVerify = async (transporterId) => {
    try {
      await api.post(`/transporters/${transporterId}/verify`);
      fetchTransporters();
    } catch (err) {
      console.error(err);
      alert('Verification failed');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transporters</h1>
          <p className="page-subtitle">Manage cargo providers, verify credentials and monitor ratings.</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="header-search" style={{ width: '100%', maxW: 400 }}>
            <Search style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by company name, GST, or city..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : transporters.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Truck size={48} />
            <h3>No Transporters found</h3>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>GST Number</th>
                  <th>PAN Number</th>
                  <th>City</th>
                  <th>Rating</th>
                  <th>Bids Submitted</th>
                  <th>Wins</th>
                  <th>Verification</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transporters.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.company_name}</td>
                    <td>{t.gst_number || '-'}</td>
                    <td>{t.pan_number || '-'}</td>
                    <td>{t.city || '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 600, color: 'var(--warning)' }}>★</span>
                        <span>{t.rating || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{t.total_bids}</td>
                    <td>{t.total_wins}</td>
                    <td>
                      <span className={`badge ${t.is_verified ? 'badge-verified' : 'badge-pending'}`}>
                        {t.is_verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!t.is_verified && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleVerify(t.id)}
                        >
                          <ShieldCheck size={14} /> Approve & Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
