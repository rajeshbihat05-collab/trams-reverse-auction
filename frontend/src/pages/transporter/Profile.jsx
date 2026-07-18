import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User, Save, Check } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.transporter_id) return;
      try {
        const res = await api.get(`/transporters/${user.transporter_id}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await api.put(`/transporters/${user.transporter_id}`, profile);
      setProfile(res.data);
      updateUser({ ...user, company_name: res.data.company_name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update transporter profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in" style={{ maxW: 700, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transporter Corporate Profile</h1>
          <p className="page-subtitle">Update company contact, address, GST, and PAN parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Corporate Profile</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Transporter Company Name *</label>
              <input 
                type="text" 
                className="form-input" 
                value={profile.company_name} 
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">GSTIN / Tax ID Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profile.gst_number || ''} 
                  onChange={(e) => setProfile({ ...profile, gst_number: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profile.pan_number || ''} 
                  onChange={(e) => setProfile({ ...profile, pan_number: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Registered Office Address</label>
              <textarea 
                className="form-textarea" 
                value={profile.address || ''} 
                onChange={(e) => setProfile({ ...profile, address: e.target.value })} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profile.city || ''} 
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profile.state || ''} 
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">ZIP / Pincode</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profile.pincode || ''} 
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
              {success && (
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <Check size={16} /> Profile changes saved!
                </span>
              )}
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={saving}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Update Corporate Profile'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
