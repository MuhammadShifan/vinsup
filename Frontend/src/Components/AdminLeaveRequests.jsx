import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminLeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchAllLeaves();
    fetchAllEmployees(); 
  }, []);

  const fetchAllEmployees = async () => {
    try {
      const res = await axios.get('https://vinsup-4vt5.onrender.com/api/employees');
      if (res.data) {
        setAllEmployees(Array.isArray(res.data) ? res.data : res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchAllLeaves = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('https://vinsup-4vt5.onrender.com/api/leaves'); 
      if (res.data.success) {
        const data = res.data.data;
        setLeaves(data || []); 
        
        let pend = 0, app = 0, rej = 0;
        data.forEach(l => {
          if (l.status === 'Pending') pend++;
          else if (l.status === 'Approved') app++;
          else if (l.status === 'Rejected') rej++;
        });
        setStats({ total: data.length, pending: pend, approved: app, rejected: rej });

        localStorage.setItem('pendingLeaveCount', pend);
        window.dispatchEvent(new Event('storage')); 
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const confirmAction = window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this leave request?`);
    if (!confirmAction) return;

    try {
      const res = await axios.put(`https://vinsup-4vt5.onrender.com/api/leaves/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchAllLeaves(); 
        // 🔥 PUDHU FIX: Frontend-la irundhu pogura duplicate notification line remove panniyachu! Backend automatically anuppidum. 🔥
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update leave status.");
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'EMP';
  
  const parseDate = (dateString) => {
    if (!dateString) return { date: '-', day: '-' };
    const d = new Date(dateString);
    return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        day: d.toLocaleDateString('en-GB', { weekday: 'short' })
    };
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Approved': return { bg: '#dcfce7', color: '#10b981' };
      case 'Rejected': return { bg: '#fee2e2', color: '#ef4444' };
      default: return { bg: '#fff7ed', color: '#f59e0b' }; 
    }
  };

  return (
    <div style={{ padding: 'clamp(14px, 2.5vw, 30px)', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#eff6ff', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6', fontSize: '20px' }}><i className="far fa-envelope"></i></div>
          <div><h2 style={{ margin: 0, fontSize: '22px' }}>{stats.total}</h2><span style={{ fontSize: '13px', color: '#64748b' }}>Total Requests</span></div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#fff7ed', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f59e0b', fontSize: '20px' }}><i className="far fa-clock"></i></div>
          <div><h2 style={{ margin: 0, fontSize: '22px' }}>{stats.pending}</h2><span style={{ fontSize: '13px', color: '#64748b' }}>Pending</span></div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#dcfce7', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10b981', fontSize: '20px' }}><i className="far fa-check-circle"></i></div>
          <div><h2 style={{ margin: 0, fontSize: '22px' }}>{stats.approved}</h2><span style={{ fontSize: '13px', color: '#64748b' }}>Approved</span></div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#fee2e2', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444', fontSize: '20px' }}><i className="far fa-times-circle"></i></div>
          <div><h2 style={{ margin: 0, fontSize: '22px' }}>{stats.rejected}</h2><span style={{ fontSize: '13px', color: '#64748b' }}>Rejected</span></div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(15px, 2vw, 30px)', border: '1px solid #f1f5f9' }}>
        <h3 style={{ margin: '0 0 25px 0', fontSize: '16px', fontWeight: 'bold' }}>Leave Requests List</h3>
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>Employee</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>Leave Type</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>Duration</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>From</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>To</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>Reason</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? leaves.map((leave, index) => {
                const start = parseDate(leave.startDate);
                const end = parseDate(leave.endDate);
                const statusStyle = getStatusStyle(leave.status);

                const targetEmp = allEmployees.find(emp => emp.email === leave.empEmail || emp._id === leave.empId || emp.empId === leave.empId);
                
                let finalImage = "";
                if (targetEmp) {
                  const rawImage = targetEmp.profilePhoto || targetEmp.profilePic || targetEmp.image || targetEmp.avatar || targetEmp.photo || targetEmp.pic || targetEmp.profileImage || targetEmp.empImage || targetEmp.file;
                  if (rawImage && !rawImage.includes('randomuser.me')) {
                    if (rawImage.startsWith('http') || rawImage.startsWith('data:image')) {
                      finalImage = rawImage; 
                    } else {
                      let cleanPath = rawImage.replace(/\\/g, '/').replace(/^\/+/, '');
                      if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
                      finalImage = `https://vinsup-4vt5.onrender.com/${cleanPath}`;
                    }
                  } else if (rawImage) {
                    finalImage = rawImage;
                  }
                }

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {finalImage ? (
                          <img src={finalImage} alt={leave.empName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', color: '#475569', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>
                            {getInitials(leave.empName)}
                          </div>
                        )}
                        <strong>{leave.empName}</strong>
                      </div>
                    </td>

                    <td style={{ padding: '15px' }}>{leave.leaveType}</td>
                    <td style={{ padding: '15px' }}>{leave.totalDays} Days</td>
                    <td style={{ padding: '15px' }}>{start.date}</td>
                    <td style={{ padding: '15px' }}>{end.date}</td>
                    <td style={{ padding: '15px' }}>{leave.reason}</td>
                    <td style={{ padding: '15px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', background: statusStyle.bg, color: statusStyle.color, fontSize: '12px', fontWeight: '600' }}>{leave.status}</span></td>
                    <td style={{ padding: '15px' }}>
                      {leave.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => handleStatusUpdate(leave._id, 'Approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }} title="Approve">✔</button>
                              <button onClick={() => handleStatusUpdate(leave._id, 'Rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }} title="Reject">✘</button>
                          </div>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No leave requests available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveRequests;