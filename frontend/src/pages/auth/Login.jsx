import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Truck, Lock, ShieldCheck, Key } from 'lucide-react';
import api from '../../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Force Password Change Modal State
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password, rememberMe);
      if (userData.must_change_password) {
        setPendingUser(userData);
        setMustChangePassword(true);
      } else if (userData.role === 'transporter') {
        navigate('/transporter/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    setChangeError('');

    if (newPassword.length < 6) {
      setChangeError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New password and Confirm password do not match.');
      return;
    }

    setChangeLoading(true);
    try {
      await api.post('/auth/force-change-password', {
        current_password: password,
        new_password: newPassword,
      });

      alert('🎉 Password updated successfully! Your new password is now active.');
      if (pendingUser?.role === 'transporter') {
        navigate('/transporter/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      setChangeError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: mustChangePassword ? 460 : 420 }}>
        {mustChangePassword ? (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Key size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Set Your New Private Password</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Admin has reset your password. For privacy and security, you must set a new personal password before accessing the system.
              </p>
            </div>

            {changeError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--danger-light)', color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
                {changeError}
              </div>
            )}

            <form onSubmit={handleForcePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">New Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  minLength={6}
                  placeholder="Enter your new secret password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  minLength={6}
                  placeholder="Re-enter your new secret password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg w-full" 
                disabled={changeLoading}
                style={{ justifyContent: 'center', width: '100%', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
              >
                <ShieldCheck size={18} /> {changeLoading ? 'Saving New Password...' : 'Save New Password & Enter App'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="login-logo">
              <div className="logo-icon">
                <Truck size={32} />
              </div>
              <h1>TRAMS</h1>
              <p>Transport Reverse Auction Management System</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} id="login-form">
              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-light)', color: '#991B1B',
                  fontSize: 13, marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  type="email" id="email" className="form-input"
                  placeholder="Enter your email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} id="password" className="form-input"
                    placeholder="Enter your password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary-600)' }} />
                  Remember me
                </label>
                <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary-600)', fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
                style={{ justifyContent: 'center', width: '100%' }} id="login-submit">
                {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
              </button>
            </form>

            <div className="login-footer">
              Don't have an account? <Link to="/register">Register as Transporter</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
