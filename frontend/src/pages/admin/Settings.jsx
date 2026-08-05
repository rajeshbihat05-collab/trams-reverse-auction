import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Settings, Save, Check, Key, ShieldAlert, RefreshCw, UserCheck } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Transporter Password Reset in Settings
  const [transporters, setTransporters] = useState([]);
  const [selectedTransporterId, setSelectedTransporterId] = useState('');
  const [tempPassword, setTempPassword] = useState('TempPass@123');
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          api.get('/settings'),
          api.get('/transporters/all'),
        ]);
        setSettings(sRes.data);
        setTransporters(tRes.data || []);
        if ((tRes.data || []).length > 0) {
          setSelectedTransporterId(tRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.put('/settings', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Save settings failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTransporterPasswordReset = async (e) => {
    e.preventDefault();
    if (!selectedTransporterId) {
      alert('Please select a transporter account.');
      return;
    }
    setResettingPassword(true);
    try {
      const selectedObj = transporters.find(t => t.id === selectedTransporterId);
      await api.post(`/transporters/${selectedTransporterId}/reset-password`, {
        new_password: tempPassword,
      });

      alert(`✅ Password Reset Successful!\n\nTransporter: ${selectedObj?.company_name}\nEmail: ${selectedObj?.user_email}\nTemporary Password: ${tempPassword}\n\n🔒 On their next login, the transporter will be required to set their own secret password before accessing the system.`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Corporate Settings & Security</h1>
          <p className="page-subtitle">Configure system parameters, localized defaults and reset transporter access passwords.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Card 1: Transporter Password Reset Control */}
        <div className="card" style={{ borderColor: 'var(--primary-300)', borderWidth: 1 }}>
          <div className="card-header" style={{ background: 'var(--primary-50)' }}>
            <div className="flex items-center gap-2">
              <Key size={18} className="text-primary" />
              <span className="card-title" style={{ color: 'var(--primary-900)' }}>Transporter Account Password Reset</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleTransporterPasswordReset} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Select Transporter Account *</label>
                <select 
                  className="form-select" 
                  value={selectedTransporterId} 
                  onChange={(e) => setSelectedTransporterId(e.target.value)}
                  required
                >
                  {transporters.length === 0 ? (
                    <option value="">No registered transporters found</option>
                  ) : (
                    transporters.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.company_name} ({t.user_email || t.city || 'Transporter'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Assign Temporary Password *</label>
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
                    title="Generate Temp Password"
                  >
                    <RefreshCw size={14} /> Generate Temp
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  🔒 Security Rule: When the transporter logs in using this temporary password, the system will mandate that they set their own secret new password.
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={resettingPassword || !selectedTransporterId}>
                  <Key size={16} /> {resettingPassword ? 'Resetting Password...' : 'Reset Password & Mandate Password Creation'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: Company Profile */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Company Profile Details</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Company Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={settings.company_name} 
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Support</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={settings.phone || ''} 
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notification Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={settings.email || ''} 
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Website Domain URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={settings.website || ''} 
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Localization Settings</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Default Currency</label>
                <select 
                  className="form-select" 
                  value={settings.currency} 
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">System Timezone</label>
                <select 
                  className="form-select" 
                  value={settings.timezone} 
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                >
                  <option value="Asia/Kolkata">India (IST - Asia/Kolkata)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="America/New_York">New York (EST - America/New_York)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
            {success && (
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <Check size={16} /> Configuration saved!
              </span>
            )}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
