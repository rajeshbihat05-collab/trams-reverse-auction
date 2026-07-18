import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Route, MapPin, Package, Home, UserCheck, Plus, Trash } from 'lucide-react';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / Creating Forms
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, mRes, bRes, cRes] = await Promise.all([
        api.get('/master/routes'),
        api.get('/master/materials'),
        api.get('/master/branches'),
        api.get('/master/customers'),
      ]);
      setRoutes(rRes.data);
      setMaterials(mRes.data);
      setBranches(bRes.data);
      setCustomers(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'routes') {
        await api.post('/master/routes', formData);
      } else if (activeTab === 'materials') {
        await api.post('/master/materials', formData);
      } else if (activeTab === 'branches') {
        await api.post('/master/branches', formData);
      } else if (activeTab === 'customers') {
        await api.post('/master/customers', formData);
      }
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/master/${activeTab}/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Data Configuration</h1>
          <p className="page-subtitle">Configure routes, material tables, shipping branches, and corporate customers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormData({}); }}>
          <Plus size={16} /> Add New Entry
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'routes' ? 'active' : ''}`} onClick={() => setActiveTab('routes')}>
          Routes
        </button>
        <button className={`tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
          Materials
        </button>
        <button className={`tab ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
          Branches
        </button>
        <button className={`tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          Customers
        </button>
      </div>

      {activeTab === 'routes' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route Code</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Distance (km)</th>
                <th>Est. Hours</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map(r => (
                <tr key={r.id}>
                  <td>{r.route_code || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{r.origin}</td>
                  <td style={{ fontWeight: 600 }}>{r.destination}</td>
                  <td>{r.distance_km || '-'}</td>
                  <td>{r.estimated_hours || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(r.id)}>
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>HSN Code</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>{m.category || '-'}</td>
                  <td>{m.unit || '-'}</td>
                  <td>{m.hsn_code || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(m.id)}>
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Code</th>
                <th>City</th>
                <th>Contact Phone</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{b.branch_code || '-'}</td>
                  <td>{b.city || '-'}</td>
                  <td>{b.phone || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(b.id)}>
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Code</th>
                <th>Contact Email</th>
                <th>Contact Phone</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.customer_code || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(c.id)}>
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-slide-up">
            <div className="modal-header">
              <span className="modal-title">Add New Entry</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>X</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeTab === 'routes' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Route Code</label>
                      <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, route_code: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Origin City *</label>
                      <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, origin: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Destination City *</label>
                      <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Distance (km)</label>
                      <input type="number" className="form-input" onChange={(e) => setFormData({ ...formData, distance_km: parseFloat(e.target.value) })} />
                    </div>
                  </>
                )}

                {activeTab === 'materials' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Material Name *</label>
                      <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit of Measure (UOM)</label>
                      <input type="text" className="form-input" placeholder="e.g. MT, Box, Drum" onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">HSN Code</label>
                      <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })} />
                    </div>
                  </>
                )}

                {activeTab === 'branches' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Branch Name *</label>
                      <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch Code</label>
                      <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Person</label>
                      <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Phone</label>
                      <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </>
                )}

                {activeTab === 'customers' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Customer Name *</label>
                      <input type="text" className="form-input" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Customer Code</label>
                      <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-input" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
