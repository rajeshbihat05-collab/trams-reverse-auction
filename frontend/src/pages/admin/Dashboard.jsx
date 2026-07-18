import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Gavel, TrendingUp, Users, Clock, Award, BarChart3,
  Activity, DollarSign, CheckCircle, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, actRes, chartRes, monthlyRes] = await Promise.all([
          api.get('/dashboard/admin'),
          api.get('/dashboard/recent-activity'),
          api.get('/dashboard/charts/auctions-by-status'),
          api.get('/dashboard/charts/monthly-auctions'),
        ]);
        setStats(statsRes.data);
        setActivities(actRes.data);
        setChartData(chartRes.data);
        setMonthlyData(monthlyRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total Auctions', value: stats?.total_auctions || 0, icon: Gavel, color: 'blue' },
    { label: 'Live Auctions', value: stats?.live_auctions || 0, icon: Activity, color: 'green' },
    { label: 'Closed Auctions', value: stats?.closed_auctions || 0, icon: Clock, color: 'orange' },
    { label: 'Awarded Auctions', value: stats?.awarded_auctions || 0, icon: Award, color: 'purple' },
    { label: 'Total Transporters', value: stats?.total_transporters || 0, icon: Users, color: 'cyan' },
    { label: "Today's Auctions", value: stats?.todays_auctions || 0, icon: TrendingUp, color: 'blue' },
    { label: 'Live Bids', value: stats?.live_bid_count || 0, icon: BarChart3, color: 'green' },
    { label: 'Total Savings', value: `₹${(stats?.total_savings || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'green' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your transport auction overview.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/auctions/create')} id="create-auction-btn">
          <Gavel size={16} /> Create Auction
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div className="stat-card" key={i}>
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

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Auctions by Status</span>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%"
                  outerRadius={100} innerRadius={60} paddingAngle={3} label={({ label, value }) => `${label}: ${value}`}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Auction Trend</span>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="rgba(59,130,246,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/audit-log')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {activities.length === 0 ? (
            <div className="empty-state">
              <p>No recent activity</p>
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {activities.map((act, i) => (
                <div key={act.id} style={{
                  padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < activities.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: act.action.includes('CREATE') ? 'var(--success)' :
                      act.action.includes('AWARD') ? 'var(--primary-600)' :
                      act.action.includes('DELETE') || act.action.includes('CANCEL') ? 'var(--danger)' : 'var(--warning)',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{act.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      by {act.user_name} • {new Date(act.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span className={`badge badge-${act.entity_type || 'draft'}`}>{act.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
