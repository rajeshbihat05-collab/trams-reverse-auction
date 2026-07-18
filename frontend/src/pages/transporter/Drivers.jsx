import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Plus, Trash2 } from 'lucide-react';

export default function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', license_number: '', license_expiry: '' });

  const fetchDrivers = async () => {
    if (!user?.transporter_id) return;
    try {
      const res = await api.get(`/transporters/${user.transporter_id}/drivers`);
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/transporters/${user.transporter_id}/drivers`, {
        ...formData,
        license_expiry: formData.license_expiry ? new Date(formData.license_expiry).toISOString() : null
      });
      setShowModal(false);
      setFormData({ name: '', phone: '', license_number: '', license_expiry: '' });
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert('Failed to register driver profile');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this driver?')) return;
    try {
      await api.delete(`/transporters/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registered Fleet Drivers</h1>
          <p className="page-subtitle">Configure transporters' commercial driver records and license expiry logs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Register Driver
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Phone Number</th>
              <th>Commercial License #</th>
              <th>License Expiry Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td>{d.phone}</td>
                <td>{d.license_number || '-'}</td>
                <td>{d.license_expiry ? new Date(d.license_expiry).toLocaleDateString('en-IN') : '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(d.id)}>
                    <Trash2 size={14} />
                  </button>
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
              <span className="modal-title">Register Fleet Driver</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Driver Full Name *</label>
                  <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Support Contact *</label>
                  <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Commercial License Number</label>
                  <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry Date</label>
                  <input type="date" className="form-input" onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
