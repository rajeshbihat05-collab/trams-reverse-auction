import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Gavel, Users, FileText, BarChart3,
  Database, Shield, Settings, Truck, Package, ClipboardList,
  Bell, History, User, FileCheck, Car, UserCheck
} from 'lucide-react';

const adminNav = [
  { section: 'Overview', items: [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Auction Management', items: [
    { path: '/admin/auctions', icon: Gavel, label: 'Auctions' },
    { path: '/admin/auctions/create', icon: ClipboardList, label: 'Create Auction' },
  ]},
  { section: 'Management', items: [
    { path: '/admin/transporters', icon: Truck, label: 'Transporters' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/master-data', icon: Database, label: 'Master Data' },
  ]},
  { section: 'System', items: [
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/audit-log', icon: Shield, label: 'Audit Log' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]},
];

const transporterNav = [
  { section: 'Overview', items: [
    { path: '/transporter/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Bidding', items: [
    { path: '/transporter/auctions', icon: Gavel, label: 'Available Auctions' },
    { path: '/transporter/my-bids', icon: ClipboardList, label: 'My Bids' },
    { path: '/transporter/history', icon: History, label: 'Bid History' },
  ]},
  { section: 'Fleet', items: [
    { path: '/transporter/vehicles', icon: Car, label: 'Vehicles' },
    { path: '/transporter/drivers', icon: UserCheck, label: 'Drivers' },
  ]},
  { section: 'Account', items: [
    { path: '/transporter/documents', icon: FileCheck, label: 'Documents' },
    { path: '/transporter/profile', icon: User, label: 'Profile' },
  ]},
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = user?.role === 'transporter' ? transporterNav : adminNav;

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">T</div>
        <div className="brand-text">
          <span className="brand-name">TRAMS</span>
          <span className="brand-sub">Auction Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
