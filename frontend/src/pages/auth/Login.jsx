import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Truck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password, rememberMe);
      if (userData.role === 'transporter') {
        navigate('/transporter/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
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

        <div style={{
          marginTop: 24, padding: 16, background: 'var(--gray-50)',
          borderRadius: 'var(--radius-md)', fontSize: 11, color: 'var(--text-muted)',
        }}>
          <strong>Demo Credentials:</strong><br />
          Admin: admin@trams.in / Admin@123<br />
          Transporter: transport1@demo.in / Transport@123
        </div>
      </div>
    </div>
  );
}
