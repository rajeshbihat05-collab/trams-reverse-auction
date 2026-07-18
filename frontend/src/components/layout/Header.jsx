import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Search, Bell, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react';
import api from '../../api/client';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState({ unread_count: 0 });
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setNotifications(res.data);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      try {
        const res = await api.get('/notifications?page_size=10');
        setNotifList(res.data.notifications || []);
      } catch {}
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="header" id="header">
      <div className="header-left">
        <div className="header-search">
          <Search />
          <input type="text" placeholder="Search auctions, transporters..." id="global-search" />
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle Theme" id="theme-toggle">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="header-icon-btn" onClick={handleNotifClick} id="notifications-btn">
            <Bell size={18} />
            {notifications.unread_count > 0 && <span className="badge" />}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 8,
              width: 360, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 60,
              maxHeight: 400, overflowY: 'auto',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                <button className="btn btn-ghost btn-sm" onClick={async () => {
                  await api.put('/notifications/mark-all-read');
                  setNotifications({ unread_count: 0 });
                  setNotifList(prev => prev.map(n => ({ ...n, is_read: true })));
                }}>Mark all read</button>
              </div>
              {notifList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No notifications
                </div>
              ) : (
                notifList.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                    background: n.is_read ? 'transparent' : 'var(--primary-50)',
                    cursor: 'pointer',
                  }} onClick={async () => {
                    if (!n.is_read) {
                      await api.put(`/notifications/${n.id}/read`);
                      setNotifications(prev => ({ ...prev, unread_count: Math.max(0, prev.unread_count - 1) }));
                    }
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <div className="header-user" onClick={() => setShowMenu(!showMenu)} id="user-menu-btn">
            <div className="header-user-info">
              <div className="header-user-name">{user?.full_name}</div>
              <div className="header-user-role">{user?.role}</div>
            </div>
            <div className="header-avatar">{initials}</div>
            <ChevronDown size={14} />
          </div>

          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 8,
              width: 200, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 60, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-muted)' }}>
                {user?.email}
              </div>
              <button onClick={() => { setShowMenu(false); navigate(user?.role === 'transporter' ? '/transporter/profile' : '/admin/settings'); }}
                style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                <User size={16} /> Profile
              </button>
              <button onClick={handleLogout}
                style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
