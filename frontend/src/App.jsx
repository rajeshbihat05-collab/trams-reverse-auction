import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AuctionList from './pages/admin/AuctionList';
import AuctionCreate from './pages/admin/AuctionCreate';
import AuctionDetail from './pages/admin/AuctionDetail';
import AuctionResult from './pages/admin/AuctionResult';
import TransporterList from './pages/admin/TransporterList';
import Reports from './pages/admin/Reports';
import MasterData from './pages/admin/MasterData';
import AuditLog from './pages/admin/AuditLog';
import SystemSettings from './pages/admin/Settings';
import UserManagement from './pages/admin/UserManagement';

// Transporter Pages
import TransporterDashboard from './pages/transporter/Dashboard';
import AvailableAuctions from './pages/transporter/AvailableAuctions';
import AuctionBid from './pages/transporter/AuctionBid';
import MyBids from './pages/transporter/MyBids';
import Vehicles from './pages/transporter/Vehicles';
import Drivers from './pages/transporter/Drivers';
import Profile from './pages/transporter/Profile';
import Documents from './pages/transporter/Documents';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

function DefaultHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'transporter') return <Navigate to="/transporter/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={<DefaultHome />} />

              {/* Admin Routes */}
              <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="admin/auctions" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AuctionList /></ProtectedRoute>} />
              <Route path="admin/auctions/create" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AuctionCreate /></ProtectedRoute>} />
              <Route path="admin/auctions/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AuctionDetail /></ProtectedRoute>} />
              <Route path="admin/auctions/:id/result" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AuctionResult /></ProtectedRoute>} />
              <Route path="admin/transporters" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><TransporterList /></ProtectedRoute>} />
              <Route path="admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Reports /></ProtectedRoute>} />
              <Route path="admin/master-data" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><MasterData /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><UserManagement /></ProtectedRoute>} />
              <Route path="admin/audit-log" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AuditLog /></ProtectedRoute>} />
              <Route path="admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><SystemSettings /></ProtectedRoute>} />

              {/* Transporter Routes */}
              <Route path="transporter/dashboard" element={<ProtectedRoute allowedRoles={['transporter']}><TransporterDashboard /></ProtectedRoute>} />
              <Route path="transporter/auctions" element={<ProtectedRoute allowedRoles={['transporter']}><AvailableAuctions /></ProtectedRoute>} />
              <Route path="transporter/auctions/:id/bid" element={<ProtectedRoute allowedRoles={['transporter']}><AuctionBid /></ProtectedRoute>} />
              <Route path="transporter/my-bids" element={<ProtectedRoute allowedRoles={['transporter']}><MyBids /></ProtectedRoute>} />
              <Route path="transporter/vehicles" element={<ProtectedRoute allowedRoles={['transporter']}><Vehicles /></ProtectedRoute>} />
              <Route path="transporter/drivers" element={<ProtectedRoute allowedRoles={['transporter']}><Drivers /></ProtectedRoute>} />
              <Route path="transporter/profile" element={<ProtectedRoute allowedRoles={['transporter']}><Profile /></ProtectedRoute>} />
              <Route path="transporter/documents" element={<ProtectedRoute allowedRoles={['transporter']}><Documents /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
