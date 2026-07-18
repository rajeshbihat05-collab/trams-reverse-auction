import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Truck, CheckSquare, ShieldAlert, Award, FileText, Calendar, Landmark } from 'lucide-react';

export default function TransporterDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/transporter');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Available Auctions', value: stats?.available_auctions || 0, icon: Gavel, color: 'blue', link: '/transporter/auctions' },
    { label: 'My Active Bids', value: stats?.active_bids || 0, icon: CheckSquare, color: 'orange', link: '/transporter/my-bids' },
    { label: 'Contracts Won', value: stats?.won_auctions || 0, icon: Award, color: 'green', link: '/transporter/my-bids' },
    { label: 'Total Bids Placed', value: stats?.total_bids || 0, icon: Landmark, color: 'purple', link: '/transporter/my-bids' },
    { label: 'Registered Vehicles', value: stats?.total_vehicles || 0, icon: Truck, color: 'blue', link: '/transporter/vehicles' },
    { label: 'Active Drivers', value: stats?.total_drivers || 0, icon: Calendar, color: 'green', link: '/transporter/drivers' },
    { label: 'Pending Documents', value: stats?.pending_documents || 0, icon: ShieldAlert, color: 'red', link: '/transporter/documents' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transporter Procurement Dashboard</h1>
          <p className="page-subtitle">Track available shipments, commercial bids, and active vehicle fleet stats.</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div 
            className="stat-card" 
            key={i} 
            onClick={() => navigate(card.link)}
            style={{ cursor: 'pointer' }}
          >
            <div className={`stat-icon ${card.color}`}>
              <card.icon size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Commercial Bidding Instructions</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            Welcome to the TRAMS transport network. You can participate in reverse auctions assigned to your company.
            Each bid you submit must be below the Reserve Price if defined. You may revise your bid multiple times 
            prior to the closing deadline. System calculations will compare all bids and L1 winner reports will 
            be generated for the corporate admins. All competitors' quotes are strictly hidden.
          </p>
        </div>
      </div>
    </div>
  );
}
