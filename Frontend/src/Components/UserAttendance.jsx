import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserAttendance = ({ userName, userEmail }) => {
  const [attendanceState, setAttendanceState] = useState('idle'); 
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [totalHours, setTotalHours] = useState('-');
  const [statusToday, setStatusToday] = useState('Pending');
  
  const [currentUserData, setCurrentUserData] = useState(null);
  const [pastRecords, setPastRecords] = useState([]);
  
  const [summaryStats, setSummaryStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });

  // 🔥 NEW: Real Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const getSafeDate = () => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const calculateTotalHours = (inTimeStr, outTimeStr) => {
    if (!inTimeStr || !outTimeStr || inTimeStr === "-" || outTimeStr === "-") return "-";
    try {
      const parseTime = (timeStr) => {
        const parts = timeStr.trim().split(' ');
        let [hours, minutes] = parts[0].split(':').map(Number);
        const modifier = parts[1] ? parts[1].toUpperCase() : null;

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        
        return { hours, minutes };
      };

      const inT = parseTime(inTimeStr);
      const outT = parseTime(outTimeStr);

      const d1 = new Date(); d1.setHours(inT.hours, inT.minutes, 0);
      const d2 = new Date(); d2.setHours(outT.hours, outT.minutes, 0);

      const diffMs = d2 - d1;
      if (diffMs < 0) return "Invalid";

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs}h ${diffMins}m`;
    } catch (e) {
      return "-";
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/employees');
      const empData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      const storedEmail = localStorage.getItem('loggedInEmail');
      const incomingEmail = (userEmail || storedEmail || "").toLowerCase().trim();

      let matchedUser = null;
      if (incomingEmail) {
        matchedUser = empData.find(emp => (emp.email || '').toLowerCase().trim() === incomingEmail);
      }

      if (matchedUser) {
        setCurrentUserData(matchedUser);
        
        const todayDateStr = getSafeDate(); 
        
        let currentStatus = 'Pending';
        let inTime = null;

        const dbDate = matchedUser.lastAttendanceDate;
        const hasTodayCheckIn = matchedUser.todayCheckIn && matchedUser.todayCheckIn !== "-" && matchedUser.todayCheckIn !== "Not Marked";
        const isToday = (dbDate === todayDateStr) || hasTodayCheckIn;

        if (isToday && hasTodayCheckIn) {
          setCheckInTime(matchedUser.todayCheckIn);
          currentStatus = matchedUser.todayStatus || 'Present';
          setStatusToday(currentStatus);
          inTime = matchedUser.todayCheckIn;
          
          if (matchedUser.todayCheckOut && matchedUser.todayCheckOut !== "-" && matchedUser.todayCheckOut !== "Not Marked") {
             setAttendanceState('out');
             setCheckOutTime(matchedUser.todayCheckOut);
             setTotalHours(calculateTotalHours(matchedUser.todayCheckIn, matchedUser.todayCheckOut)); 
          } else {
             setAttendanceState('in'); 
          }
        } else {
          setAttendanceState('idle');
          setCheckInTime(null);
          setCheckOutTime(null);
          setTotalHours('-');
          setStatusToday('Pending');
        }

        const dbTotal = matchedUser.totalWorkingDays || 0;
        const dbPresent = matchedUser.presentDays || 0;
        const dbPercentage = matchedUser.attendancePercentage || 0;
        const dbLate = matchedUser.lateDays || (currentStatus === 'Late' ? 1 : 0);
        const dbAbsent = matchedUser.absentDays || (dbTotal > 0 ? dbTotal - dbPresent - dbLate : 0);

        setSummaryStats({
          total: dbTotal,
          present: dbPresent,
          absent: dbAbsent < 0 ? 0 : dbAbsent,
          late: dbLate,
          percentage: dbPercentage
        });

        generateDynamicStats(currentStatus, inTime);
      }
    } catch (err) {
      console.error("Error fetching attendance data", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userName, userEmail]);

  const generateDynamicStats = (todayStatus, todayCheckInTime) => {
    const currentDate = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const todayStr = currentDate.toLocaleDateString('en-GB', options);
    const dayStr = currentDate.toLocaleDateString('en-GB', { weekday: 'long' });

    let recent = []; 

    if (todayStatus !== 'Pending') {
      recent.push({
        date: todayStr, day: dayStr, status: todayStatus, time: todayCheckInTime,
        color: todayStatus === 'Present' ? '#16a34a' : todayStatus === 'Late' ? '#ea580c' : '#ef4444',
        bg: todayStatus === 'Present' ? '#dcfce7' : todayStatus === 'Late' ? '#ffedd5' : '#fee2e2'
      });
    }
    setPastRecords(recent);
  };

  const handleCheckInOut = async () => {
    if (!currentUserData) {
      alert("Error: User data not loaded yet.");
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const todayDateStr = getSafeDate(); 
    const currentHour = now.getHours();
    const empName = currentUserData.fullName || currentUserData.name || userName || 'Employee';

    let newStatus = 'Pending';

    if (attendanceState === 'idle') {
      if (currentHour >= 12) newStatus = 'Late';
      else newStatus = 'Present';

      try {
        setAttendanceState('in');
        setCheckInTime(timeString);
        setStatusToday(newStatus);
        
        await axios.put(`http://localhost:5001/api/employees/${currentUserData._id || currentUserData.empId}`, {
          todayCheckIn: timeString,
          todayStatus: newStatus,
          lastAttendanceDate: todayDateStr, 
          todayCheckOut: "-" 
        });

        await axios.post('http://localhost:5001/api/notifications/add', {
          type: 'Attendance',
          title: 'Employee Checked In',
          message: `${empName} has checked in at ${timeString}. Status: ${newStatus}`
        }).catch(err => console.log(err)); 

        alert(`Checked In Successfully at ${timeString}! Status: ${newStatus}`);
        
        setTimeout(() => {
          fetchUserData(); 
        }, 500);

      } catch (error) {
        console.error("Failed to check in", error);
        setAttendanceState('idle');
        setCheckInTime(null);
        setStatusToday('Pending');
        alert("Failed to mark check-in. Backend error.");
      }

    } else if (attendanceState === 'in') {
      const confirmOut = window.confirm("Are you sure you want to Check Out for today?");
      if (confirmOut) {
        try {
          setAttendanceState('out');
          setCheckOutTime(timeString);
          setTotalHours(calculateTotalHours(checkInTime, timeString));

          await axios.put(`http://localhost:5001/api/employees/${currentUserData._id || currentUserData.empId}`, {
            todayCheckOut: timeString
          });

          await axios.post('http://localhost:5001/api/notifications/add', {
            type: 'Attendance',
            title: 'Employee Checked Out',
            message: `${empName} has checked out at ${timeString}.`
          }).catch(err => console.log(err));

          alert(`Checked Out Successfully at ${timeString}!`);
          
          setTimeout(() => {
            fetchUserData(); 
          }, 500);
          
        } catch (error) {
          console.error("Failed to check out", error);
          setAttendanceState('in');
          setCheckOutTime(null);
          alert("Failed to mark check-out.");
        }
      }
    }
  };

  // 🔥 NEW: Real Calendar Logic Generation
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDate = new Date();
  
  const currentYear = currentMonthDate.getFullYear();
  const currentMonthIndex = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonthIndex - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonthIndex + 1, 1));

  const calendarGrid = [];
  // Add empty slots for days before the 1st of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }
  
  // Add actual days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    let stat = 'off';
    
    // If it's today's date in real life, show the current attendance status
    if (i === todayDate.getDate() && currentMonthIndex === todayDate.getMonth() && currentYear === todayDate.getFullYear()) {
      stat = statusToday === 'Pending' ? 'off' : statusToday.toLowerCase();
    }
    calendarGrid.push({ day: i, status: stat });
  }

  const totalDays = summaryStats.total > 0 ? summaryStats.total : 1;
  const presentPct = (summaryStats.present / totalDays) * 100;
  const latePct = (summaryStats.late / totalDays) * 100;
  const presentEnd = presentPct;
  const lateEnd = presentEnd + latePct;

  return (
    /* 🔥 Fix: Removed maxWidth and margin to stretch full width */
    <div style={{ padding: '30px', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>Attendance</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Track your daily attendance and view history</p>
        </div>
        
        <button 
          onClick={handleCheckInOut}
          disabled={attendanceState === 'out'}
          style={{
            background: attendanceState === 'idle' ? '#2563eb' : attendanceState === 'in' ? '#ef4444' : '#94a3b8',
            color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', 
            fontSize: '14px', fontWeight: 'bold', cursor: attendanceState === 'out' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: '0.3s'
          }}
        >
          <i className={attendanceState === 'idle' ? "fas fa-sign-in-alt" : attendanceState === 'in' ? "fas fa-sign-out-alt" : "fas fa-check-circle"}></i>
          {attendanceState === 'idle' ? 'Check In' : attendanceState === 'in' ? 'Check Out' : 'Attendance Marked'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#dcfce7', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#16a34a', fontSize: '24px' }}><i className="far fa-calendar-check"></i></div>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Present Days</p><h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{summaryStats.present}</h3><span style={{ fontSize: '11px', color: '#64748b' }}>Total</span></div>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#fee2e2', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444', fontSize: '24px' }}><i className="far fa-calendar-times"></i></div>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Absent Days</p><h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{summaryStats.absent}</h3><span style={{ fontSize: '11px', color: '#64748b' }}>Total</span></div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#ffedd5', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ea580c', fontSize: '24px' }}><i className="far fa-clock"></i></div>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Late Days</p><h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{summaryStats.late}</h3><span style={{ fontSize: '11px', color: '#64748b' }}>Total</span></div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#f3e8ff', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9333ea', fontSize: '24px' }}><i className="far fa-calendar-alt"></i></div>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Attendance %</p><h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{summaryStats.percentage}%</h3><span style={{ fontSize: '11px', color: '#64748b' }}>Overall</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 38%', gap: '2%' }}>
        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Attendance Calendar</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handlePrevMonth} style={{ border: '1px solid #e2e8f0', background: '#f8fafc', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', transition: '0.2s' }}><i className="fas fa-chevron-left"></i></button>
              <strong style={{ fontSize: '14px', color: '#1e293b', minWidth: '110px', textAlign: 'center' }}>{monthName} {currentYear}</strong>
              <button onClick={handleNextMonth} style={{ border: '1px solid #e2e8f0', background: '#f8fafc', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', transition: '0.2s' }}><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '10px' }}>
            {weekDays.map(day => (
              <div key={day} style={{ fontWeight: '600', color: '#64748b', fontSize: '13px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>{day}</div>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
            {calendarGrid.map((item, idx) => (
              <div key={idx} style={{ padding: '15px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                {item ? (
                  <>
                    <span style={{ fontSize: '14px', fontWeight: item.status !== 'off' ? 'bold' : '500', color: item.status === 'off' ? '#94a3b8' : item.status === 'absent' ? '#ef4444' : '#1e293b' }}>
                      {item.day}
                    </span>
                    {item.status !== 'off' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.status === 'present' ? '#10b981' : item.status === 'late' ? '#f59e0b' : '#ef4444' }}></span>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ padding: '15px 0' }}></span> 
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Present</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Late</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Absent</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a' }}>Attendance Summary</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', 
                  background: summaryStats.total === 0 ? '#f1f5f9' : `conic-gradient(#10b981 0% ${presentEnd}%, #f59e0b ${presentEnd}% ${lateEnd}%, #ef4444 ${lateEnd}% 100%)`, 
                  display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '90px', height: '90px', background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Total Days</span>
                  <strong style={{ fontSize: '20px', color: '#0f172a' }}>{summaryStats.total}</strong>
                </div>
              </div>
              <div style={{ flex: 1, fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span><span style={{ color: '#10b981', marginRight: '5px' }}>●</span> Present</span> <strong>{summaryStats.present}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span><span style={{ color: '#f59e0b', marginRight: '5px' }}>●</span> Late</span> <strong>{summaryStats.late}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span><span style={{ color: '#ef4444', marginRight: '5px' }}>●</span> Absent</span> <strong>{summaryStats.absent}</strong></div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Recent Attendance</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pastRecords.length > 0 ? pastRecords.map((rec, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: '#f1f5f9', color: '#2563eb', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><i className="far fa-calendar-alt"></i></div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b' }}>{rec.date}</h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{rec.day}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span style={{ background: rec.bg, color: rec.color, padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{rec.status}</span>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{rec.time}</strong>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '13px' }}>No records found. Check in to start tracking.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '25px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a' }}>Attendance Details - Today</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: '#dcfce7', color: '#16a34a', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="far fa-calendar-check"></i></div>
            <div><p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>Check In</p><strong style={{ fontSize: '14px', color: '#0f172a' }}>{checkInTime || '--:--'}</strong></div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="far fa-calendar-times"></i></div>
            <div><p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>Check Out</p><strong style={{ fontSize: '14px', color: '#0f172a' }}>{checkOutTime || '--:--'}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="far fa-clock"></i></div>
            <div><p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>Total Hours</p><strong style={{ fontSize: '14px', color: '#0f172a' }}>{totalHours}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: '#f0fdf4', color: '#16a34a', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="fas fa-toggle-on"></i></div>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>Status</p>
              <span style={{ 
                  background: statusToday === 'Pending' ? '#f1f5f9' : statusToday === 'Present' ? '#dcfce7' : '#ffedd5', 
                  color: statusToday === 'Pending' ? '#64748b' : statusToday === 'Present' ? '#16a34a' : '#ea580c', 
                  padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' 
                }}>
                {statusToday}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ background: '#f3e8ff', color: '#9333ea', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="fas fa-map-marker-alt"></i></div>
            <div><p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>Location</p><strong style={{ fontSize: '14px', color: '#0f172a' }}>Coimbatore, India</strong></div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default UserAttendance;