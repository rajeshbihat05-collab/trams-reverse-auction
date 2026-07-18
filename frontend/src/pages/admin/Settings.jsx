import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Settings, Save, Check } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
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

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in" style={{ maxW: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-subtitle">Configure company details, regional options and external API integrations.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

          <div className="card">
            <div className="card-header">
              <span className="card-title">Integration Gateways (Optional)</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">SMS Provider API Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter API credential key..." 
                  value={settings.sms_api_key || ''} 
                  onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">WhatsApp Gateway Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter WhatsApp Business API Key..." 
                  value={settings.whatsapp_api_key || ''} 
                  onChange={(e) => setSettings({ ...settings, whatsapp_api_key: e.target.value })} 
                />
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
        </div>
      </form>
    </div>
  );
}
