import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Gavel, Play, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function AuctionCreate() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [pickup, setPickup] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationPostalCode, setDestinationPostalCode] = useState('');
  const [distance, setDistance] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [vehicleLength, setVehicleLength] = useState('');
  const [vehicleWidth, setVehicleWidth] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [expectedWeight, setExpectedWeight] = useState('');
  const [loadingDate, setLoadingDate] = useState('');
  const [reportingTime, setReportingTime] = useState('08:00');
  const [unloadingPoint, setUnloadingPoint] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [autoNotify, setAutoNotify] = useState(true);
  const [selectedTransporters, setSelectedTransporters] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [rRes, mRes, tRes] = await Promise.all([
          api.get('/master/routes'),
          api.get('/master/materials'),
          api.get('/transporters/all'),
        ]);
        setRoutes(rRes.data);
        setMaterials(mRes.data);
        setTransporters(tRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMasters();
  }, []);

  const handleRouteSelect = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setPickup(route.origin);
      setDestination(route.destination);
      setDistance(route.distance_km || '');
    }
  };

  const handleMaterialSelect = (materialId) => {
    const mat = materials.find(m => m.id === materialId);
    if (mat) {
      setMaterialType(mat.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        pickup_location: pickup,
        pickup_postal_code: pickupPostalCode || null,
        destination: destination,
        destination_postal_code: destinationPostalCode || null,
        distance_km: distance ? parseFloat(distance) : null,
        vehicle_type: vehicleType,
        vehicle_capacity: vehicleCapacity || null,
        vehicle_length: vehicleLength || null,
        vehicle_width: vehicleWidth || null,
        material_type: materialType,
        expected_weight: expectedWeight ? parseFloat(expectedWeight) : null,
        loading_date: new Date(loadingDate).toISOString(),
        reporting_time: reportingTime,
        unloading_point: unloadingPoint || null,
        closing_time: new Date(closingTime).toISOString(),
        reserve_price: reservePrice ? parseFloat(reservePrice) : null,
        special_instructions: specialInstructions || null,
        terms_conditions: termsConditions || null,
        auto_notify: autoNotify,
        invited_transporter_ids: selectedTransporters,
      };

      await api.post('/auctions', payload);
      navigate('/admin/auctions');
    } catch (err) {
      console.error(err);
      alert('Error creating auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <h1 className="page-title">Create Transport Auction</h1>
          <p className="page-subtitle">Publish a cargo/freight requirement and invite registered transporters to bid instantly.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Required details card */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title" style={{ color: 'var(--primary)', fontWeight: 600 }}>Required Details</span>
                <span className="badge badge-live" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)', display: 'inline-block' }}></span>
                  Will Start Live Instantly
                </span>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Pickup Location (Exact Address) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Plot 42, Phase II, Okhla, New Delhi"
                    value={pickup} 
                    onChange={(e) => setPickup(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pickup PIN Code (Postal Code) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 110020"
                    value={pickupPostalCode} 
                    onChange={(e) => setPickupPostalCode(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Location (Exact Address) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Shed 3, Sector 4, Gandhinagar"
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Destination PIN Code (Postal Code) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 382010"
                    value={destinationPostalCode} 
                    onChange={(e) => setDestinationPostalCode(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Material Description (Material kya hai) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Steel Coils, FMCG"
                    value={materialType} 
                    onChange={(e) => setMaterialType(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Cargo Weight in MT (Kitna weight hai) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="e.g. 15.5"
                    value={expectedWeight} 
                    onChange={(e) => setExpectedWeight(e.target.value)} 
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Auction Closing Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    value={closingTime} 
                    onChange={(e) => setClosingTime(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Advanced Specifications Accordion Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                type="button" 
                className="btn btn-secondary w-full"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                <span>Optional Advanced Specifications</span>
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showAdvanced && (
                <div className="card animate-fade-in" style={{ marginTop: 4 }}>
                  <div className="card-header">
                    <span className="card-title">Advanced Configuration</span>
                  </div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Predefined Route Helper (Optional)</label>
                      <select className="form-select" onChange={(e) => handleRouteSelect(e.target.value)}>
                        <option value="">-- Select a Route to Prefill --</option>
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>{r.origin} &rarr; {r.destination} ({r.distance_km} km)</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Distance (km)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={distance} 
                        onChange={(e) => setDistance(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Unloading Specific Point</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Warehouse 3B" 
                        value={unloadingPoint} 
                        onChange={(e) => setUnloadingPoint(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Material Category Prefill</label>
                      <select className="form-select" onChange={(e) => handleMaterialSelect(e.target.value)}>
                        <option value="">-- Select Material --</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Vehicle Type Required</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 32 Ft Container" 
                        value={vehicleType} 
                        onChange={(e) => setVehicleType(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Vehicle Capacity / Specification</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 16 MT Max capacity" 
                        value={vehicleCapacity} 
                        onChange={(e) => setVehicleCapacity(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Required Length</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 32 Ft" 
                        value={vehicleLength} 
                        onChange={(e) => setVehicleLength(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Required Width</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 8 Ft" 
                        value={vehicleWidth} 
                        onChange={(e) => setVehicleWidth(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Loading Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={loadingDate} 
                        onChange={(e) => setLoadingDate(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Reporting Time</label>
                      <input 
                        type="time" 
                        className="form-input" 
                        value={reportingTime} 
                        onChange={(e) => setReportingTime(e.target.value)} 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Reserve Price / Max Acceptable Bid (₹)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Optional reserve price limit" 
                        value={reservePrice} 
                        onChange={(e) => setReservePrice(e.target.value)} 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Special Delivery / Transportation Instructions</label>
                      <textarea 
                        className="form-textarea" 
                        value={specialInstructions} 
                        onChange={(e) => setSpecialInstructions(e.target.value)} 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Contract terms and conditions</label>
                      <textarea 
                        className="form-textarea" 
                        value={termsConditions} 
                        onChange={(e) => setTermsConditions(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Invite Transporters</span>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
                    <input 
                      type="checkbox" 
                      checked={autoNotify} 
                      onChange={(e) => setAutoNotify(e.target.checked)} 
                    />
                    Notify Invited Transporters instantly
                  </label>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <label className="form-label" style={{ marginBottom: 12 }}>Invite List *</label>
                  {transporters.length === 0 ? (
                    <p className="text-xs text-muted">No verified transporters available</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                      {transporters.map(t => {
                        const isChecked = selectedTransporters.includes(t.id);
                        return (
                          <label 
                            key={t.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 8, 
                              fontSize: 13, 
                              cursor: 'pointer',
                              padding: '6px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: isChecked ? 'var(--primary-50)' : 'transparent',
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTransporters([...selectedTransporters, t.id]);
                                } else {
                                  setSelectedTransporters(selectedTransporters.filter(id => id !== t.id));
                                }
                              }} 
                            />
                            <span>{t.company_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg w-full" 
              disabled={loading}
              style={{ justifyContent: 'center', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            >
              <Play size={18} style={{ marginRight: 8 }} /> {loading ? 'Starting Live Auction...' : 'Create & Start Live Auction'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
