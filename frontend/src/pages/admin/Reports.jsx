import { useState, useEffect } from 'react';
import api from '../../api/client';
import { BarChart3, FileSpreadsheet, FileDown, TrendingDown, Users, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [savings, setSavings] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [savingsRes, perfRes] = await Promise.all([
          api.get('/reports/savings'),
          api.get('/reports/transporter-performance'),
        ]);
        setSavings(savingsRes.data);
        setPerformance(perfRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExport = (format, type) => {
    window.open(`/api/reports/export/${format}/${type}`, '_blank');
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Procurement Analytics</h1>
          <p className="page-subtitle">Export auction history spreadsheets and review supplier price performance metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => handleExport('excel', 'auction-summary')}>
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('pdf', 'auction-summary')}>
            <FileDown size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="stat-icon blue">
              <PiggyBank size={24} />
            </div>
            <div>
              <div className="text-xs text-muted font-bold uppercase">Total Budget Reserve</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>₹{(savings?.total_reserve || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="stat-icon green">
              <TrendingDown size={24} />
            </div>
            <div>
              <div className="text-xs text-muted font-bold uppercase">Agreed Contract Price</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>₹{(savings?.total_awarded || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="stat-icon orange">
              <DollarSignIcon size={24} />
            </div>
            <div>
              <div className="text-xs text-muted font-bold uppercase">Total Net Savings</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>
                ₹{(savings?.total_savings || 0).toLocaleString('en-IN')} ({savings?.avg_savings_percent}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <span className="card-title">Transporter Bidding & Win Rate Performance</span>
        </div>
        <div className="card-body" style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="company_name" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
              <YAxis label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
              <Tooltip />
              <Bar dataKey="win_rate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Detailed Transport Savings Report</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Auction ID</th>
                <th>Route Details</th>
                <th>Reserve Price (₹)</th>
                <th>Final Bid Amount (₹)</th>
                <th>Net Savings (₹)</th>
                <th>Savings (%)</th>
                <th>Winning Transporter</th>
              </tr>
            </thead>
            <tbody>
              {(savings?.details || []).map((detail, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{detail.auction_number}</td>
                  <td>{detail.route}</td>
                  <td>₹{detail.reserve_price.toLocaleString('en-IN')}</td>
                  <td>₹{detail.winning_amount.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{detail.savings.toLocaleString('en-IN')}</td>
                  <td>{detail.savings_percent}%</td>
                  <td style={{ fontWeight: 500 }}>{detail.winner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DollarSignIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
