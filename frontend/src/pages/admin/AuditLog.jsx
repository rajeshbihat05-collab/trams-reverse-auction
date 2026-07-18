import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Shield, Search, ArrowRight } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/audit-logs?page=${page}&search=${searchTerm}`);
        setLogs(res.data.logs);
        setTotal(res.data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, searchTerm]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Audit Log</h1>
          <p className="page-subtitle">Historical records of logins, bid placements, awards, and database edits.</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="header-search" style={{ width: '100%', maxW: 400 }}>
            <Search style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by action, description or user..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Shield size={48} />
            <h3>No audit logs available</h3>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / User</th>
                  <th>Action</th>
                  <th>Details / Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{log.user_name || 'System'}</td>
                    <td>
                      <span className="badge badge-draft">{log.action}</span>
                    </td>
                    <td>{log.description}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 50 && (
            <div className="pagination">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                &laquo;
              </button>
              <button className="active">{page}</button>
              <button 
                disabled={page * 50 >= total} 
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
