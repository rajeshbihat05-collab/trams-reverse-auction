import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Users, Plus, Trash2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '', password: '', role: 'transporter', phone: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/master/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/users', formData);
      setShowModal(false);
      setFormData({ email: '', full_name: '', password: '', role: 'transporter', phone: '' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Error creating user profile');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await api.delete(`/master/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Accounts</h1>
          <p className="page-subtitle">Configure system users, administrators, and transporter credentials.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add User Account
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '-'}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-live' : 'badge-draft'}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-verified' : 'badge-rejected'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {u.is_active && (
                    <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(u.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-slide-up">
            <div className="modal-header">
              <span className="modal-title">Create User Account</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
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
                  <label className="form-label">Temporary Password *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Support</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Authorization Role</label>
                  <select 
                    className="form-select" 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="transporter">Transporter / Bidder</option>
                    <option value="admin">Administrator (Admin)</option>
                    <option value="manager">Manager / Procurement</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
