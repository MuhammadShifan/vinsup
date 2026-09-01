import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserLeaveRequest = ({ userName, userEmail }) => {
  const activeEmail = userEmail || localStorage.getItem('loggedInEmail');

  // 🔥 FIX: session removed from state 🔥
  const [leaveData, setLeaveData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [calculatedDays, setCalculatedDays] = useState(0);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [leaveBalances, setLeaveBalances] = useState([
    { type: 'Casual Leave', used: 0, total: 2, icon: 'far fa-calendar-alt', color: '#10b981', bg: '#dcfce7' },
    { type: 'Sick Leave', used: 0, total: 2, icon: 'fas fa-briefcase-medical', color: '#3b82f6', bg: '#eff6ff' },
    { type: 'Privilege Leave', used: 0, total: 1, icon: 'far fa-star', color: '#a855f7', bg: '#f3e8ff' },
    { type: 'Comp Off', used: 0, total: 3, icon: 'far fa-clock', color: '#f59e0b', bg: '#ffedd5' }
  ]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [activeEmail]);

  // 🔥 FIX: Session logic completely removed from calculation 🔥
  useEffect(() => {
    if (leaveData.startDate && leaveData.endDate) {
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(diffDays);
      } else {
        setCalculatedDays(0);
      }
    } else {
        setCalculatedDays(0);
    }
  }, [leaveData.startDate, leaveData.endDate]);

  const fetchLeaveHistory = async () => {
    if (!activeEmail) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/leaves/user/${activeEmail}`);
      if (res.data.success) {
        setHistory(res.data.data);
        calculateUsedBalances(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const calculateUsedBalances = (records) => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const approvedLeavesThisMonth = records.filter(r => {
          if (r.status !== 'Approved') return false;
          const leaveDate = new Date(r.startDate);
          return leaveDate.getFullYear() === currentYear && leaveDate.getMonth() === currentMonth;
      });
      
      let casual = 0, sick = 0, privilege = 0, compOff = 0;
      
      approvedLeavesThisMonth.forEach(leave => {
          if (leave.leaveType === 'Casual Leave') casual += leave.totalDays;
          if (leave.leaveType === 'Sick Leave') sick += leave.totalDays;
          if (leave.leaveType === 'Privilege Leave') privilege += leave.totalDays;
          if (leave.leaveType === 'Comp Off') compOff += leave.totalDays;
      });

      setLeaveBalances(prev => [
          { ...prev[0], used: casual },
          { ...prev[1], used: sick },
          { ...prev[2], used: privilege },
          { ...prev[3], used: compOff }
      ]);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeEmail) { alert("User email not found. Please relogin."); return; }
    if (!leaveData.leaveType || !leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
        alert("Please fill all fields!");
        return;
    }
    if (calculatedDays <= 0) {
        alert("Invalid date range!");
        return;
    }

    const selectedLeave = leaveBalances.find(l => l.type === leaveData.leaveType);
    if (selectedLeave) {
      const remainingBalance = selectedLeave.total - selectedLeave.used;
      if (calculatedDays > remainingBalance) {
        alert(`You only have ${remainingBalance} day(s) remaining for ${selectedLeave.type} this month. Cannot apply for ${calculatedDays} days! 🚫`);
        return;
      }
    }

    setIsSubmitting(true);
    
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const appliedBy = userName || "Employee";

    // 🔥 FIX: session removed from payload 🔥
    const payload = {
        empId: "EMP-001",
        empName: appliedBy,
        empEmail: activeEmail,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        totalDays: calculatedDays,
        reason: leaveData.reason,
        appliedOn: todayStr
    };

    try {
        const res = await axios.post('http://localhost:5001/api/leaves/apply', payload);
        if (res.data.success) {
            alert("Leave request submitted successfully!");
            // 🔥 FIX: session removed from reset state 🔥
            setLeaveData({ leaveType: '', startDate: '', endDate: '', reason: '' });
            setCalculatedDays(0);
            fetchLeaveHistory();
        }
    } catch (err) {
        console.error(err);
        alert("Failed to submit request.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
      switch(status) {
          case 'Approved': return { color: '#10b981', bg: '#dcfce7' };
          case 'Rejected': return { color: '#ef4444', bg: '#fee2e2' };
          default: return { color: '#f59e0b', bg: '#ffedd5' };
      }
  };

  const filteredHistory = filter === 'All' ? history : history.filter(h => h.status === filter);

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>Leave Request</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Apply for leave and track your leave status</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: APPLY FORM */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a' }}>Apply for Leave</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>Leave Type</label>
                <select 
                    value={leaveData.leaveType}
                    onChange={(e) => setLeaveData({...leaveData, leaveType: e.target.value})}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none' }}
                >
                    <option value="">Select Leave Type</option>
                    {leaveBalances.map((leave, idx) => (
                    <option key={idx} value={leave.type}>{leave.type} (Available: {leave.total - leave.used} Days)</option>
                    ))}
                </select>
                </div>
                
                <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                <input 
                    type="date" 
                    value={leaveData.startDate}
                    onChange={(e) => setLeaveData({...leaveData, startDate: e.target.value})}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                />
                </div>

                <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>End Date</label>
                <input 
                    type="date" 
                    value={leaveData.endDate}
                    onChange={(e) => setLeaveData({...leaveData, endDate: e.target.value})}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                />
                </div>

                {/* 🔥 FIX: Session removed, Total Days now takes full width 🔥 */}
                <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>Total Days</label>
                <input 
                    type="text" 
                    value={calculatedDays > 0 ? `${calculatedDays} Days` : '0 Days'} 
                    readOnly
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', outline: 'none', boxSizing: 'border-box' }}
                />
                </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>Reason</label>
                <textarea 
                value={leaveData.reason}
                onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})}
                placeholder="Enter reason for leave..." 
                rows="4"
                style={{ width: '100%', padding: '15px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                ></textarea>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>{leaveData.reason.length}/500</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '25px' }}>
                <button type="button" onClick={() => setLeaveData({ leaveType: '', startDate: '', endDate: '', reason: '' })} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #2563eb', color: '#2563eb', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: isSubmitting ? '#93c5fd' : '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
            </div>
          </form>

          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <i className="fas fa-info-circle" style={{ color: '#0ea5e9', marginTop: '2px' }}></i>
            <div>
              <strong style={{ fontSize: '13px', color: '#0369a1', display: 'block', marginBottom: '5px' }}>Note</strong>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#0c4a6e', lineHeight: '1.6' }}>
                <li>Please apply for leave at least 1 day in advance.</li>
                <li>You will be notified once your leave is approved or rejected.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: BALANCE & HISTORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Leave Balance for a month</h3>
              <a href="#" style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>View Details</a>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {leaveBalances.map((leave, index) => (
                <div key={index} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    <div style={{ color: leave.color, background: leave.bg, width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', fontSize: '12px' }}>
                      <i className={leave.icon}></i>
                    </div>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{leave.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '10px' }}>
                    <h2 style={{ margin: '0', fontSize: '24px', color: '#0f172a' }}>{leave.used}</h2>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>/ {leave.total} Days</span>
                  </div>
                  <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: leave.color, width: `${leave.total > 0 ? (leave.used/leave.total)*100 : 0}%`, height: '100%', borderRadius: '3px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #e2e8f0', flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Leave Request History</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Filter</span>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#1e293b' }}>
                  <option>All</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '15px 10px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Applied On</th>
                  <th style={{ padding: '15px 10px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Leave Type</th>
                  <th style={{ padding: '15px 10px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Date Range</th>
                  <th style={{ padding: '15px 10px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Days</th>
                  <th style={{ padding: '15px 10px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length > 0 ? filteredHistory.map((item, index) => {
                  const style = getStatusStyle(item.status);
                  return (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 10px', fontSize: '13px', color: '#1e293b' }}>{item.appliedOn}</td>
                    <td style={{ padding: '15px 10px', fontSize: '13px', color: '#1e293b' }}>{item.leaveType}</td>
                    <td style={{ padding: '15px 10px', fontSize: '13px', color: '#475569' }}>
                        {item.startDate === item.endDate ? item.startDate : `${item.startDate} to ${item.endDate}`}
                    </td>
                    <td style={{ padding: '15px 10px', fontSize: '13px', color: '#1e293b' }}>{item.totalDays}</td>
                    <td style={{ padding: '15px 10px' }}>
                      <span style={{ background: style.bg, color: style.color, padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )}) : (
                    <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                            No leave requests found.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserLeaveRequest;