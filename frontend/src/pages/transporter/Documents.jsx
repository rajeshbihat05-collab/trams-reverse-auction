import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, ShieldAlert, Plus, Trash2, ArrowUpCircle } from 'lucide-react';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload Form States
  const [docType, setDocType] = useState('PAN');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);

  const fetchDocuments = async () => {
    if (!user?.transporter_id) return;
    try {
      const res = await api.get(`/documents/transporter/${user.transporter_id}`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a file to upload');

    setUploading(true);
    const formData = new FormData();
    formData.append('transporter_id', user.transporter_id);
    formData.append('doc_type', docType);
    formData.append('doc_number', docNumber);
    if (expiryDate) {
      formData.append('expiry_date', expiryDate);
    }
    formData.append('file', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocNumber('');
      setExpiryDate('');
      setFile(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Upload failed. Verify file extensions (.pdf, .png, .jpg)');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Documents</h1>
          <p className="page-subtitle">Upload required company tax IDs, GST forms, insurance and vehicle permits.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Uploaded Verification Documents</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {documents.length === 0 ? (
                <div className="empty-state">
                  <ShieldAlert size={32} />
                  <h3>No Documents Uploaded</h3>
                  <p>Please upload compliance files to allow auction bidding approval.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>Reference #</th>
                      <th>Filename</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.doc_type}</td>
                        <td>{d.doc_number || '-'}</td>
                        <td>{d.file_name}</td>
                        <td>{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td>
                          <span className={`badge ${d.status === 'verified' ? 'badge-verified' : d.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(d.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Upload New Compliance File</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Document Category *</label>
                <select 
                  className="form-select" 
                  value={docType} 
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="PAN">PAN Card</option>
                  <option value="GST">GST Registration Certificate</option>
                  <option value="RC">Vehicle RC Book</option>
                  <option value="Insurance">Vehicle Insurance Policy</option>
                  <option value="Fitness">Vehicle Fitness Certificate</option>
                  <option value="Permit">State/National Carriage Permit</option>
                  <option value="DL">Driver License</option>
                  <option value="Company">Company Incorporation Documents</option>
                  <option value="Other">Other Miscellaneous Attachment</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Document Identifier Reference #</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. GSTIN, PAN or license number..." 
                  value={docNumber} 
                  onChange={(e) => setDocNumber(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Document Expiration Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select File Attachment *</label>
                <input 
                  type="file" 
                  className="form-input" 
                  required 
                  onChange={(e) => setFile(e.target.files[0])} 
                />
                <span className="text-xs text-muted mt-2 block">Allowed extensions: .pdf, .png, .jpg (max 10MB)</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full" 
                disabled={uploading}
                style={{ justifyContent: 'center' }}
              >
                <ArrowUpCircle size={16} /> {uploading ? 'Uploading compliance file...' : 'Submit Document'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
