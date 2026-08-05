import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Truck, Check, X, Search, ShieldCheck, Plus, Trash, Key, Lock, RefreshCw } from 'lucide-react';

export default function TransporterList() {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Add Transporter Modal / Form States
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

  // Reset Password Modal States
  const [resetModal, setResetModal] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [tempPassword, setTempPassword] = useState('TempPass@123');
  const [resetting, setResetting] = useState(false);

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
    if (!confirm('Are you sure you want to delete this transporter? All associated data will be deleted.')) return;
    try {
      await api.delete(`/transporters/${transporterId}`);
      fetchTransporters();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  const handleOpenResetModal = (t) => {
    setSelectedTransporter(t);
    setTempPassword('TempPass@' + Math.floor(1000 + Math.random() * 9000));
    setResetModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransporter) return;
    setResetting(true);
    try {
      const res = await api.post(`/transporters/${selectedTransporter.id}/reset-password`, {
        new_password: tempPassword,
      });

      alert(`✅ Password Reset Successful!\n\nTransporter: ${selectedTransporter.company_name}\nEmail: ${selectedTransporter.user_email}\nTemporary Password: ${tempPassword}\n\nNote: The transporter will be prompted to create their own new password upon login.`);
      setResetModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Password reset failed');
    } finally {
      setResetting(false);
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
          <h1 className="page-title">Transporters Management</h1>
          <p className="page-subtitle">Manage cargo providers, verify credentials and reset passwords.</p>
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
                  <th>Email & Phone</th>
                  <th>GST Number</th>
                  <th>City</th>
                  <th>Verification</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transporters.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{t.company_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {t.id.slice(0, 8)}...</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{t.user_email || '-'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.user_phone || ''}</div>
                    </td>
                    <td>{t.gst_number || '-'}</td>
                    <td>{t.city || '-'}</td>
                    <td>
                      <span className={`badge ${t.is_verified ? 'badge-verified' : 'badge-pending'}`}>
                        {t.is_verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenResetModal(t)}
                          title="Reset Password for Transporter"
                        >
                          <Key size={14} /> Reset Password
                        </button>

                        {!t.is_verified && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleVerify(t.id)}
                            title="Approve & Verify"
                          >
                            <ShieldCheck size={14} /> Verify
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

      {/* Reset Password Modal */}
      {resetModal && selectedTransporter && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={20} className="text-primary" />
                <h3 className="modal-title">Reset Transporter Password</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setResetModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 2 }}>Target Account</label>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedTransporter.company_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedTransporter.user_email}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Set Temporary Password *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={tempPassword} 
                      onChange={(e) => setTempPassword(e.target.value)} 
                      required 
                      minLength={6}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setTempPassword('TempPass@' + Math.floor(1000 + Math.random() * 9000))}
                      title="Generate Random Temp Password"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    🔒 Transporter will be forced to change this temporary password to their own secret password when logging in.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Set Temp Password & Force Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transporter Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Register New Transporter</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Company Name *</label>
                  <input type="text" className="form-input" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value, full_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Password *</label>
                  <input type="password" className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input type="text" className="form-input" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" className="form-input" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Register Transporter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
