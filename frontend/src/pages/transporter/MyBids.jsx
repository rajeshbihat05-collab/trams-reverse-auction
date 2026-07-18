import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Landmark, Search, Clock, Award } from 'lucide-react';

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const res = await api.get('/bids/my-bids');
        setBids(res.data.bids || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Placed Rates</h1>
          <p className="page-subtitle">Commercial bids submitted on reverse auctions.</p>
        </div>
      </div>

      {bids.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Landmark size={48} />
            <h3>No Bid History</h3>
            <p>You have not placed bids on any cargo auctions yet.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bid Timestamp</th>
                <th>Auction Number</th>
                <th>Bid Amount</th>
                <th>Revisions</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {bids.map(b => (
                <tr key={b.id}>
                  <td>{new Date(b.submitted_at).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 600 }}>{b.auction_id}</td>
                  <td style={{ fontWeight: 600 }}>₹{b.amount.toLocaleString('en-IN')}</td>
                  <td>{b.revision_number}</td>
                  <td>{b.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
