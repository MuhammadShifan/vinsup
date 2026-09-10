import React, { useState, useEffect } from 'react';
import './Employees.css';

const Attendance = () => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null); 
  const [showHistoryModal, setShowHistoryModal] = useState(false); 
  const [historySearch, setHistorySearch] = useState('');
  
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMongoDBEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://vinsup-4vt5.onrender.com/api/employees');
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `API Connection Failed (Status: ${response.status})`);
      }

      const dbData = await response.json();
      console.log("Backend Response:", dbData); 

      let employeeArray = [];
      if (Array.isArray(dbData)) {
        employeeArray = dbData;
      } else if (dbData && Array.isArray(dbData.data)) {
        employeeArray = dbData.data;
      } else if (dbData && Array.isArray(dbData.employees)) {
        employeeArray = dbData.employees;
      } else {
        employeeArray = []; 
      }
      
      const formattedRecords = employeeArray.map((emp) => ({
        id: emp.empId || emp._id, 
        name: emp.fullName || emp.name || "Unknown",
        department: emp.department || "General",
        designation: emp.designation || "Trainer",
        shift: emp.shift || "General",
        checkIn: emp.todayCheckIn || "-",  
        checkOut: emp.todayCheckOut || "-",
        status: emp.todayStatus || "Not Marked",
        rate: emp.attendancePercentage || 0,
        photo: emp.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        reason: emp.leaveReason || "", 
        leaveDate: emp.leaveDate || ""
      }));

      setAttendanceRecords(formattedRecords);
      setError(null);
    } catch (err) {
      console.error("MongoDB Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMongoDBEmployees();
  }, []);

  const totalEmployees = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(emp => emp.status === 'Present').length;
  const absentCount = attendanceRecords.filter(emp => emp.status === 'Absent').length;
  const lateCount = attendanceRecords.filter(emp => emp.status === 'Late').length;

  const filteredRecords = attendanceRecords.filter(emp => 
    emp.name.toLowerCase().includes(searchInput.toLowerCase()) || 
    emp.id.toLowerCase().includes(searchInput.toLowerCase())
  );

  const [leaveHistory, setLeaveHistory] = useState([
    { empId: "EMP002", name: "Sneha Reddy", date: "May 02, 2026", status: "Absent", reason: "Casual Leave" },
    { empId: "EMP001", name: "John Peter", date: "Mar 20, 2026", status: "Absent", reason: "Car Breakdown" },
  ]);

  const historyResults = leaveHistory.filter(log => 
    historySearch.length > 2 && (log.name.toLowerCase().includes(historySearch.toLowerCase()) || log.empId.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="employees-container" style={{ width: '100%', boxSizing: 'border-box' }}>
      
      <div className="page-header flex-between" style={{ width: '100%' }}>
        <div>
          <h2>Attendance Log</h2>
          <p className="breadcrumb">Dashboard &gt; Attendance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={fetchMongoDBEmployees} title="Refresh Data">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowHistoryModal(true)}>
            <i className="fas fa-history"></i> Attendance History
          </button>
        </div>
      </div>

      <div className="emp-stats-grid" style={{ marginBottom: '25px', width: '100%' }}>
        <div className="emp-stat-card"><div className="icon blue"><i className="fas fa-users"></i></div><div className="info"><p>Total Employees</p><h3>{totalEmployees}</h3></div></div>
        <div className="emp-stat-card"><div className="icon green"><i className="fas fa-user-check"></i></div><div className="info"><p>Present Today</p><h3>{presentCount}</h3></div></div>
        <div className="emp-stat-card"><div className="icon red"><i className="fas fa-user-times"></i></div><div className="info"><p>Absent Today</p><h3>{absentCount}</h3></div></div>
        <div className="emp-stat-card"><div className="icon orange"><i className="far fa-clock"></i></div><div className="info"><p>Late Today</p><h3>{lateCount}</h3></div></div>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginBottom: '25px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
        <div className="search-box" style={{ flex: 1 }}><i className="fas fa-search"></i>
          <input type="text" placeholder="Search by name or Employee ID..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', width: '100%', boxSizing: 'border-box' }}>
          <i className="fas fa-exclamation-triangle"></i> Alert: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
        
        <div className="table-container" style={{ flex: '1 1 600px', minWidth: 0, overflowX: 'auto', background: '#fff', borderRadius: '10px' }}>
          <table style={{ width: '100%', minWidth: '700px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontWeight: '500' }}>
                  <i className="fas fa-spinner fa-spin"></i> Loading Data...
                </td></tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((emp, index) => (
                  <tr 
                    key={emp.id} 
                    onClick={() => setSelectedEmployee(emp)}
                    style={{ 
                      cursor: 'pointer', 
                      background: selectedEmployee?.id === emp.id ? '#f0f6ff' : 'transparent', 
                      transition: '0.2s' 
                    }}
                  >
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: '500', color: '#64748b' }}>{emp.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={emp.photo.startsWith('http') || emp.photo.startsWith('data:image') ? emp.photo : `https://vinsup-4vt5.onrender.com/${emp.photo.replace(/\\/g, '/').replace(/^\/+/, '').startsWith('uploads/') ? '' : 'uploads/'}${emp.photo.replace(/\\/g, '/').replace(/^\/+/, '')}`} 
                          alt={emp.name} 
                          style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} 
                          onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
                        />
                        <strong style={{ color: '#1e293b', fontSize: '14px' }}>{emp.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#475569' }}>{emp.department}</td>
                    <td style={{ color: '#64748b' }}>{emp.shift}</td>
                    <td style={{ color: '#475569', fontWeight: '500' }}>{emp.checkIn}</td>
                    <td style={{ color: '#475569', fontWeight: '500' }}>{emp.checkOut}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        background: emp.status === 'Present' ? '#dcfce7' : emp.status === 'Absent' ? '#fee2e2' : emp.status === 'Late' ? '#fef3c7' : '#f1f5f9',
                        color: emp.status === 'Present' ? '#16a34a' : emp.status === 'Absent' ? '#ef4444' : emp.status === 'Late' ? '#d97706' : '#64748b'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No Records Found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', minHeight: '300px' }}>
            {selectedEmployee ? (
              <div>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  Summary: {selectedEmployee.name}
                </h4>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px', position: 'relative' }}>
                  <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                    <svg width="130" height="130" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={selectedEmployee.status === 'Absent' ? '#ef4444' : selectedEmployee.status === 'Not Marked' ? '#94a3b8' : '#16a34a'} strokeWidth="8" strokeDasharray={`${selectedEmployee.rate * 2.64} 264`} transform="rotate(-90 50 50)" strokeLinecap="round" style={{ transition: 'all 0.5s' }} />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <strong style={{ fontSize: '24px', color: '#0f172a' }}>{selectedEmployee.rate}%</strong>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Attendance</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '13.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="flex-between"><span>Designation:</span><strong>{selectedEmployee.designation}</strong></div>
                  <div className="flex-between">
                    <span>Status Today:</span>
                    <strong style={{ color: selectedEmployee.status === 'Present' ? '#16a34a' : selectedEmployee.status === 'Absent' ? '#ef4444' : selectedEmployee.status === 'Late' ? '#d97706' : '#64748b' }}>
                      {selectedEmployee.status}
                    </strong>
                  </div>
                  
                  {selectedEmployee.status === 'Absent' && selectedEmployee.reason && (
                    <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444', marginTop: '10px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Absent Reason ({selectedEmployee.leaveDate || "Today"})</span>
                      <p style={{ margin: 0, color: '#1e293b', fontSize: '13px', fontStyle: 'italic' }}>"{selectedEmployee.reason}"</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <i className="fas fa-hand-pointer" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '15px' }}></i>
                {/* 🔥 Text updated to guide users to click the row 🔥 */}
                <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.6' }}>Click anywhere on a <strong>Row</strong> in the table to view attendance summary.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '650px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}><i className="fas fa-history" style={{ color: '#2563eb' }}></i> Employee Leave History</h3>
              <button onClick={() => {setShowHistoryModal(false); setHistorySearch('');}} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 15px', marginBottom: '20px' }}>
                <i className="fas fa-search" style={{ color: '#94a3b8', marginRight: '10px' }}></i>
                <input type="text" placeholder="Enter Employee Name to search past leave logs..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }} />
              </div>
              <div style={{ minHeight: '250px', maxHeight: '400px', overflowY: 'auto' }}>
                {historySearch.length < 3 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Type at least 3 letters to search history.</div>
                ) : historyResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {historyResults.map((log, index) => (
                      <div key={index} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#1e293b' }}>{log.name} <span style={{ color: '#94a3b8', fontSize: '12px' }}>({log.empId})</span></strong>
                          <span style={{ fontSize: '12px', background: '#fee2e2', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{log.status}</span>
                        </div>
                        <div className="flex-between" style={{ fontSize: '13px', color: '#475569' }}>
                          <span><i className="far fa-calendar-alt" style={{ marginRight: '5px' }}></i> {log.date}</span>
                          <span style={{ fontStyle: 'italic' }}>Reason: "{log.reason}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#ef4444', padding: '40px 0' }}>No leave history found for "{historySearch}".</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;