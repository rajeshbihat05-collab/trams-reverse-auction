import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Truck, Check, X, Search, ShieldCheck, Plus, Trash } from 'lucide-react';

export default function TransporterList() {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal / Form States
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    role: 'transporter',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    company_name: '',
    gst_number: '',
    pan_number: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

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

  const handleDelete = async (transporterId) => {
    if (!confirm('Are you sure you want to delete this transporter? All associated data (vehicles, drivers, documents) will be deleted.')) return;
    try {
      await api.delete(`/transporters/${transporterId}`);
      fetchTransporters();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/register', formData);
      setShowModal(false);
      fetchTransporters();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to add transporter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transporters</h1>
          <p className="page-subtitle">Manage cargo providers, verify credentials and monitor ratings.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { 
            setFormData({
              role: 'transporter',
              email: '',
              password: '',
              full_name: '',
              phone: '',
              company_name: '',
              gst_number: '',
              pan_number: '',
              address: '',
              city: '',
              state: '',
              pincode: ''
            }); 
            setShowModal(true); 
          }}
        >
          <Plus size={16} /> Add Transporter
        </button>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="header-search" style={{ width: '100%', maxWidth: 400 }}>
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
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {!t.is_verified && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleVerify(t.id)}
                            title="Approve & Verify"
                          >
                            <ShieldCheck size={14} /> Approve & Verify
                          </button>
                        )}
                        <button 
                          className="btn btn-ghost btn-icon btn-sm text-danger"
                          onClick={() => handleDelete(t.id)}
                          title="Delete Transporter"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-slide-up" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="modal-header">
              <span className="modal-title">Add New Transporter</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                maxHeight: '70vh',
                overflowY: 'auto',
                padding: '20px'
              }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Company Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.company_name} 
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    minLength={6} 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.gst_number} 
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.pan_number} 
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.city} 
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.state} 
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.pincode} 
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '15px 20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Transporter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

