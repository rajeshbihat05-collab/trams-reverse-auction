import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Truck, Plus, Trash2 } from 'lucide-react';

export default function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ vehicle_number: '', vehicle_type: '', capacity_tons: '', make_model: '', year: '' });

  const fetchVehicles = async () => {
    if (!user?.transporter_id) return;
    try {
      const res = await api.get(`/transporters/${user.transporter_id}/vehicles`);
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/transporters/${user.transporter_id}/vehicles`, {
        ...formData,
        capacity_tons: formData.capacity_tons ? parseFloat(formData.capacity_tons) : null,
        year: formData.year ? parseInt(formData.year) : null
      });
      setShowModal(false);
      setFormData({ vehicle_number: '', vehicle_type: '', capacity_tons: '', make_model: '', year: '' });
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert('Failed to register vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle?')) return;
    try {
      await api.delete(`/transporters/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registered Fleet Vehicles</h1>
          <p className="page-subtitle">Configure transporters' container fleets, trailers, and cargo trucks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Register Vehicle
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle Number</th>
              <th>Vehicle Type</th>
              <th>Capacity (Tons)</th>
              <th>Make & Model</th>
              <th>Year</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>{v.vehicle_number}</td>
                <td>{v.vehicle_type}</td>
                <td>{v.capacity_tons || '-'}</td>
                <td>{v.make_model || '-'}</td>
                <td>{v.year || '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(v.id)}>
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
              <span className="modal-title">Register Vehicle</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Registration Number *</label>
                  <input type="text" placeholder="e.g. MH12AB1234" className="form-input" required onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type *</label>
                  <input type="text" placeholder="e.g. Container, Open Truck" className="form-input" required onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo Capacity (Tons)</label>
                  <input type="number" step="0.1" className="form-input" onChange={(e) => setFormData({ ...formData, capacity_tons: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Make & Model</label>
                  <input type="text" placeholder="e.g. Tata Prima" className="form-input" onChange={(e) => setFormData({ ...formData, make_model: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Year</label>
                  <input type="number" className="form-input" onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
