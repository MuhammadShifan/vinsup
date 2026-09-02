import React, { useState, useEffect } from 'react';
import './Employees.css';

const Reports = () => {
  const [fromDate, setFromDate] = useState('2026-07-01');
  const [toDate, setToDate] = useState('2026-07-16');
  
  const [activeReport, setActiveReport] = useState(null); 

  const [attendanceData, setAttendanceData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeCourseTab, setActiveCourseTab] = useState('Ongoing');
  const [activeWorkloadTab, setActiveWorkloadTab] = useState('Active'); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]); 
  const [generatedReportsHistory, setGeneratedReportsHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    reportName: 'Attendance Log', 
    reportType: 'Attendance Log',
    empId: '',
    empName: '',
    empEmail: '',
    summary: ''
  });

  useEffect(() => {
    fetchEmployeesForDropdown();
    fetchGeneratedReportsHistory();
  }, []);

  const fetchEmployeesForDropdown = async () => {
    try {
      const empResponse = await fetch('https://vinsup-4vt5.onrender.com/api/employees');
      if (empResponse.ok) {
        const dbEmployees = await empResponse.json();
        setAllEmployees(Array.isArray(dbEmployees) ? dbEmployees : dbEmployees.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchGeneratedReportsHistory = async () => {
    try {
      const res = await fetch('https://vinsup-4vt5.onrender.com/api/reports');
      if (res.ok) {
        const dbReports = await res.json();
        setGeneratedReportsHistory(Array.isArray(dbReports.data) ? dbReports.data : []);
      }
    } catch (error) {
      console.error("Error fetching reports history:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'reportType') {
      setFormData({ ...formData, reportType: value, reportName: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleEmployeeChange = (e) => {
    const selectedEmp = allEmployees.find(emp => emp._id === e.target.value || emp.empId === e.target.value);
    if (selectedEmp) {
      const name = selectedEmp.name || selectedEmp.firstName || selectedEmp.fullName || selectedEmp.email || 'Unknown';
      setFormData({ 
        ...formData, 
        empId: selectedEmp._id || selectedEmp.empId, 
        empName: name,
        empEmail: selectedEmp.email || ''
      });
    } else {
      setFormData({ ...formData, empId: '', empName: '', empEmail: '' });
    }
  };

  const handleGenerateReport = async () => {
    if (!formData.empId || !formData.summary) {
      alert("Please select an employee and enter summary details (*)");
      return;
    }

    try {
      const res = await fetch('https://vinsup-4vt5.onrender.com/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const targetEmp = allEmployees.find(emp => emp._id === formData.empId || emp.empId === formData.empId);
        const resolvedEmail = (formData.empEmail || targetEmp?.email || targetEmp?.empEmail || '').toLowerCase().trim();

        if (resolvedEmail) {
          try {
            await fetch('https://vinsup-4vt5.onrender.com/api/notifications/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'message',
                title: 'New Report Received',
                message: `You have received a new report from Admin.`,
                recipientEmail: resolvedEmail
              })
            });
          } catch (notifErr) {
            console.error("Error sending report notification:", notifErr);
          }
        }

        alert("Report successfully generated & sent to the user! 🎉");
        setIsModalOpen(false);
        setFormData({ reportName: 'Attendance Log', reportType: 'Attendance Log', empId: '', empName: '', empEmail: '', summary: '' });
        fetchGeneratedReportsHistory();
      } else {
        alert("Failed to generate report.");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to generate report.");
    }
  };

  const handleDeleteReport = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this report? The user won't be able to see it anymore.");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`https://vinsup-4vt5.onrender.com/api/reports/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        alert("Report deleted successfully! 🗑️");
        fetchGeneratedReportsHistory(); 
      } else {
        alert("Failed to delete the report.");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("An error occurred while deleting.");
    }
  };

  const fetchReportData = async (reportType) => {
    setActiveReport(reportType);
    setLoading(true);

    try {
      if (reportType === 'attendance' || reportType === 'workload') {
        
        if (reportType === 'workload') setActiveWorkloadTab('Active'); 

        const empResponse = await fetch('https://vinsup-4vt5.onrender.com/api/employees');
        const batchResponse = await fetch('https://vinsup-4vt5.onrender.com/api/batches'); 
        
        if (empResponse.ok) {
          const dbEmployees = await empResponse.json();
          const employees = Array.isArray(dbEmployees) ? dbEmployees : dbEmployees.data || [];
          
          let batches = [];
          if (batchResponse.ok) {
            const dbBatches = await batchResponse.json();
            batches = Array.isArray(dbBatches) ? dbBatches : dbBatches.data || [];
          }

          if (reportType === 'attendance') {
            const formattedAttendance = employees.map(emp => ({
              id: emp.empId || emp._id,
              name: emp.fullName || emp.name || "Unknown",
              daysPresent: emp.daysPresent || 0, 
              daysAbsent: emp.daysAbsent || 0,   
              status: emp.attendanceStatus || (emp.attendancePercentage && emp.attendancePercentage >= 75 ? "Good" : (emp.attendancePercentage ? "Defaulter" : "-")),
              leaveReason: emp.leaveReason || "-" 
            }));
            setAttendanceData(formattedAttendance);
          }

          if (reportType === 'workload') {
            const trainers = employees.filter(emp => emp.designation && emp.designation.toLowerCase().includes('trainer'));
            
            const formattedWorkload = trainers.map(trainer => {
              const trainerName = trainer.fullName || trainer.name || "";
              
              const myBatches = batches.filter(b => 
                (b.trainerName && b.trainerName.toLowerCase() === trainerName.toLowerCase()) || 
                (b.trainer && b.trainer.toLowerCase() === trainerName.toLowerCase())
              );

              const activeBatchesList = myBatches.filter(b => b.status !== 'Completed');
              const historyBatchesList = myBatches.filter(b => b.status === 'Completed');

              const getStudentCount = (batchList) => batchList.reduce((sum, batch) => {
                let count = 0;
                if (Array.isArray(batch.students)) count = batch.students.length;
                else if (Array.isArray(batch.enrolledStudents)) count = batch.enrolledStudents.length;
                else count = Number(batch.studentsCount || batch.studentCount || batch.numberOfStudents || batch.students || 0);
                return sum + count;
              }, 0);

              let finalWeeklyHours = 0;
              
              if (trainer.weeklyHours) {
                finalWeeklyHours = Number(trainer.weeklyHours); 
              } else if (trainer.todayCheckIn && trainer.todayCheckOut && trainer.todayCheckIn !== "-" && trainer.todayCheckOut !== "-") {
                const [inH, inM] = trainer.todayCheckIn.split(':').map(Number);
                const [outH, outM] = trainer.todayCheckOut.split(':').map(Number);
                
                if (!isNaN(inH) && !isNaN(outH)) {
                  const inMinsTotal = (inH * 60) + (inM || 0);
                  const outMinsTotal = (outH * 60) + (outM || 0);
                  
                  let diffMins = outMinsTotal - inMinsTotal;
                  if (diffMins < 0) diffMins += 24 * 60; 
                  
                  const dailyHours = diffMins / 60;
                  finalWeeklyHours = Math.round(dailyHours * 5);
                }
              }
              
              if (isNaN(finalWeeklyHours)) finalWeeklyHours = 0;

              return {
                trainerId: trainer.empId || trainer._id,
                name: trainerName || "Unknown",
                designation: trainer.designation || "Trainer",
                activeBatches: activeBatchesList.length, 
                activeStudents: getStudentCount(activeBatchesList),
                historyBatches: historyBatchesList.length,
                historyStudents: getStudentCount(historyBatchesList),
                weeklyHours: finalWeeklyHours
              };
            });
            setWorkloadData(formattedWorkload);
          }
        }
      } 
      else if (reportType === 'course') {
        setActiveCourseTab('Ongoing'); 
        const batchResponse = await fetch('https://vinsup-4vt5.onrender.com/api/batches');
        if (batchResponse.ok) {
          const dbBatches = await batchResponse.json();
          const batches = Array.isArray(dbBatches) ? dbBatches : dbBatches.data || [];

          if (batches.length > 0) {
            const formattedCourses = batches.map(batch => ({
              batchId: batch.batchId || batch._id,
              course: batch.courseName || "Unknown Course",
              trainer: batch.trainerName || batch.trainer || "Unassigned",
              startDate: batch.startDate || "-",
              progress: batch.progress || 0, 
              status: batch.status || "Ongoing"
            }));
            setCourseData(formattedCourses);
          } else {
             setCourseData([]);
          }
        } else {
          setCourseData([]);
        }
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type) => {
    switch(type) {
      case 'Course Progress': return { color: '#2563eb', bg: '#eff6ff' };
      case 'Attendance Log': return { color: '#16a34a', bg: '#dcfce7' };
      case 'Employee Workload': return { color: '#8b5cf6', bg: '#f5f3ff' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const filteredCourseData = courseData.filter(data => {
      if (activeCourseTab === 'Ongoing') return data.status !== 'Completed';
      else return data.status === 'Completed';
  });

  return (
    <div className="employees-container" style={{ position: 'relative' }}>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#0f172a' }}>Reports & Analytics</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Dashboard &gt; Reports</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 20px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
          <i className="fas fa-plus"></i> Send Report
        </button>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderTop: activeReport === 'attendance' ? '4px solid #10b981' : '1px solid #e2e8f0', transition: '0.3s' }}>
          <i className="fas fa-user-check" style={{ fontSize: '28px', color: '#10b981', marginBottom: '15px' }}></i>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>Attendance Log</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>View detailed working days, present/absent logs, and defaulters list.</p>
          <button onClick={() => fetchReportData('attendance')} style={{ width: '100%', background: activeReport === 'attendance' ? '#10b981' : '#f0fdf4', color: activeReport === 'attendance' ? '#fff' : '#16a34a', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: '0.3s' }}>
            {loading && activeReport === 'attendance' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eye" style={{ marginRight: '5px' }}></i>} View Details
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderTop: activeReport === 'course' ? '4px solid #3b82f6' : '1px solid #e2e8f0', transition: '0.3s' }}>
          <i className="fas fa-book-open" style={{ fontSize: '28px', color: '#3b82f6', marginBottom: '15px' }}></i>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>Course Progress</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>Track batch-wise syllabus completion and timeline progress.</p>
          <button onClick={() => fetchReportData('course')} style={{ width: '100%', background: activeReport === 'course' ? '#3b82f6' : '#eff6ff', color: activeReport === 'course' ? '#fff' : '#2563eb', border: '1px solid #bfdbfe', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: '0.3s' }}>
            {loading && activeReport === 'course' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eye" style={{ marginRight: '5px' }}></i>} View Progress
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderTop: activeReport === 'workload' ? '4px solid #8b5cf6' : '1px solid #e2e8f0', transition: '0.3s' }}>
          <i className="fas fa-briefcase" style={{ fontSize: '28px', color: '#8b5cf6', marginBottom: '15px' }}></i>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>Employee Workload</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>Analyze trainer active batches and total assigned student counts.</p>
          <button onClick={() => fetchReportData('workload')} style={{ width: '100%', background: activeReport === 'workload' ? '#8b5cf6' : '#f5f3ff', color: activeReport === 'workload' ? '#fff' : '#8b5cf6', border: '1px solid #ddd6fe', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: '0.3s' }}>
            {loading && activeReport === 'workload' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eye" style={{ marginRight: '5px' }}></i>} View Analytics
          </button>
        </div>
      </div>

      {/* DYNAMIC REAL-TIME VIEWER SECTION */}
      {activeReport && (
        <div className="print-area" style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s ease-in-out', marginBottom: '30px' }}>
          <div className="flex-between" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeReport === 'attendance' && <><i className="fas fa-user-check" style={{ color: '#10b981' }}></i> Attendance Summary</>}
                {activeReport === 'course' && <><i className="fas fa-book-open" style={{ color: '#3b82f6' }}></i> Batch Progress Data</>}
                {activeReport === 'workload' && <><i className="fas fa-briefcase" style={{ color: '#8b5cf6' }}></i> Trainer Workload Analytics</>}
              </h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#64748b' }}>Date Range: {fromDate} to {toDate}</p>
            </div>
            
            <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
              <button style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }} onClick={() => window.print()}>
                <i className="fas fa-print"></i> Print Report
              </button>
              <button onClick={() => setActiveReport(null)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                <i className="fas fa-times"></i> Close View
              </button>
            </div>
          </div>

          {activeReport === 'course' && (
            <div className="no-print" style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div 
                onClick={() => setActiveCourseTab('Ongoing')} 
                style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeCourseTab === 'Ongoing' ? '#2563eb' : '#64748b', borderBottom: activeCourseTab === 'Ongoing' ? '3px solid #2563eb' : '3px solid transparent', transition: '0.2s' }}
              >
                Ongoing Batches
              </div>
              <div 
                onClick={() => setActiveCourseTab('Completed')} 
                style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeCourseTab === 'Completed' ? '#16a34a' : '#64748b', borderBottom: activeCourseTab === 'Completed' ? '3px solid #16a34a' : '3px solid transparent', transition: '0.2s' }}
              >
                Completed Batches
              </div>
            </div>
          )}

          {activeReport === 'workload' && (
            <div className="no-print" style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div 
                onClick={() => setActiveWorkloadTab('Active')} 
                style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeWorkloadTab === 'Active' ? '#8b5cf6' : '#64748b', borderBottom: activeWorkloadTab === 'Active' ? '3px solid #8b5cf6' : '3px solid transparent', transition: '0.2s' }}
              >
                Active Workload
              </div>
              <div 
                onClick={() => setActiveWorkloadTab('History')} 
                style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeWorkloadTab === 'History' ? '#16a34a' : '#64748b', borderBottom: activeWorkloadTab === 'History' ? '3px solid #16a34a' : '3px solid transparent', transition: '0.2s' }}
              >
                Past History (Old)
              </div>
            </div>
          )}

          <div className="table-container" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            {activeReport === 'attendance' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Emp ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Employee Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Days Present</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Days Absent</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Recent Leave Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                     <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Fetching Real Data...</td></tr>
                  ) : attendanceData.length > 0 ? attendanceData.map((data, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#64748b' }}>{data.id}</td>
                      <td style={{ padding: '12px' }}>{data.name}</td>
                      <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>{data.daysPresent} Days</td>
                      <td style={{ padding: '12px', color: data.daysAbsent > 0 ? '#ef4444' : '#475569', fontWeight: 'bold' }}>{data.daysAbsent} Days</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: data.status === 'Defaulter' ? '#fee2e2' : (data.status === 'Good' ? '#dcfce7' : '#f1f5f9'), color: data.status === 'Defaulter' ? '#ef4444' : (data.status === 'Good' ? '#16a34a' : '#64748b') }}>
                          {data.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontStyle: 'italic', fontSize: '13px', color: '#64748b' }}>{data.leaveReason}</td>
                    </tr>
                  )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No Attendance Data Found</td></tr>}
                </tbody>
              </table>
            )}

            {activeReport === 'course' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th className="no-print" style={{ padding: '12px', textAlign: 'left' }}>Batch ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Course Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Trainer</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Start Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Progress</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                     <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Fetching Batches...</td></tr>
                  ) : filteredCourseData.length > 0 ? filteredCourseData.map((data, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td className="no-print" style={{ padding: '12px', fontWeight: 'bold', color: '#64748b' }}>{data.batchId}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{data.course}</td>
                      <td style={{ padding: '12px' }}>{data.trainer}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{data.startDate}</td>
                      <td style={{ padding: '12px', width: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '10px', height: '8px' }}>
                            <div style={{ background: data.status === 'Completed' ? '#16a34a' : '#3b82f6', height: '8px', borderRadius: '10px', width: `${data.progress}%` }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: data.status === 'Completed' ? '#16a34a' : '#3b82f6' }}>{data.progress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', background: data.status === 'Completed' ? '#dcfce7' : '#fef9c3', color: data.status === 'Completed' ? '#16a34a' : '#ca8a04' }}>
                          {data.status}
                        </span>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No {activeCourseTab} Batches Found</td></tr>}
                </tbody>
              </table>
            )}

            {activeReport === 'workload' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Trainer ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Trainer Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Designation</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>
                      {activeWorkloadTab === 'History' ? 'Completed Batches' : 'Active Batches'}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>
                      {activeWorkloadTab === 'History' ? 'Students Trained' : 'Total Students'}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>
                      {activeWorkloadTab === 'History' ? 'Logged Hours' : 'Weekly Hours'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                     <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Calculating Workloads...</td></tr>
                  ) : workloadData.length > 0 ? workloadData.map((data, i) => {
                    const isHistory = activeWorkloadTab === 'History';
                    const batchesCount = isHistory ? data.historyBatches : data.activeBatches;
                    const studentsCount = isHistory ? data.historyStudents : data.activeStudents;
                    const labelStudents = isHistory ? 'Trained' : 'Students';
                    
                    const badgeColor = isHistory 
                        ? { bg: '#dcfce7', text: '#16a34a' } 
                        : { bg: '#f5f3ff', text: '#8b5cf6' };

                    return (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#64748b' }}>{data.trainerId}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{data.name}</td>
                      <td style={{ padding: '12px' }}>{data.designation}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: batchesCount > 0 ? badgeColor.bg : '#f1f5f9', color: batchesCount > 0 ? badgeColor.text : '#64748b', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                            {batchesCount}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: studentsCount > 0 ? '#f0fdf4' : '#f1f5f9', color: studentsCount > 0 ? '#16a34a' : '#64748b', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                            {studentsCount} {labelStudents}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: data.weeklyHours > 40 ? '#ef4444' : (isHistory ? '#16a34a' : '#475569'), fontWeight: 'bold' }}>
                        {data.weeklyHours} Hrs
                      </td>
                    </tr>
                  )}) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No Trainers Found</td></tr>}
                </tbody>
              </table>
            )}

          </div>
        </div>
      )}

      {/* GENERATED REPORTS HISTORY TABLE */}
      <div className="no-print" style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginTop: activeReport ? '0px' : '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: '0', fontSize: '18px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="far fa-list-alt" style={{ color: '#2563eb' }}></i> Generated Reports History
          </h3>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Showing all sent reports</span>
        </div>

        {/* 🔥 FIX: Added max-height: 400px and overflowY for scrolling after 6 items 🔥 */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Report Title</th>
                <th style={{ padding: '12px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Sent To</th>
                <th style={{ padding: '12px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '12px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Date Created</th>
                <th style={{ padding: '12px', fontSize: '13px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {generatedReportsHistory.length > 0 ? (
                generatedReportsHistory.map((report, idx) => {
                  const targetEmp = allEmployees.find(emp => emp.email === report.empEmail || emp._id === report.empId || emp.empId === report.empId);
                  
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
                    <tr key={report._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {report.reportName}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {finalImage ? (
                            <img src={finalImage} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13px', color: '#475569', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>
                              {report.empName ? report.empName.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{report.empName || report.empEmail || 'Unknown User'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: getTypeStyle(report.reportType).bg, color: getTypeStyle(report.reportType).color, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {report.reportType}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDeleteReport(report._id)}
                          style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: '0.2s' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2' }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#fee2e2' }}
                        >
                          <i className="fas fa-trash-alt"></i> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No reports generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE REPORT MODAL */}
      {isModalOpen && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: '500px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>Send Report</h2>
              <i className="fas fa-times" onClick={() => setIsModalOpen(false)} style={{ color: '#475569', cursor: 'pointer', fontSize: '18px' }}></i>
            </div>
            
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Select Employee <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.empId}
                  onChange={handleEmployeeChange}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', background: '#fff' }}>
                  <option value="">-- Choose Target Employee --</option>
                  {allEmployees.map(emp => {
                    const empName = emp.name || emp.firstName || emp.fullName || emp.email || 'Unknown';
                    return <option key={emp._id || emp.empId} value={emp._id || emp.empId}>{empName}</option>
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Report Type <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  
                  <label style={{ flex: 1, padding: '10px', border: formData.reportType === 'Attendance Log' ? '1px solid #16a34a' : '1px solid #e2e8f0', background: formData.reportType === 'Attendance Log' ? '#dcfce7' : '#fff', color: formData.reportType === 'Attendance Log' ? '#16a34a' : '#64748b', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="radio" name="reportType" value="Attendance Log" checked={formData.reportType === 'Attendance Log'} onChange={handleInputChange} style={{ display: 'none' }} /> Attendance Log
                  </label>
                  
                  <label style={{ flex: 1, padding: '10px', border: formData.reportType === 'Course Progress' ? '1px solid #2563eb' : '1px solid #e2e8f0', background: formData.reportType === 'Course Progress' ? '#eff6ff' : '#fff', color: formData.reportType === 'Course Progress' ? '#2563eb' : '#64748b', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="radio" name="reportType" value="Course Progress" checked={formData.reportType === 'Course Progress'} onChange={handleInputChange} style={{ display: 'none' }} /> Course Progress
                  </label>
                  
                  <label style={{ flex: 1, padding: '10px', border: formData.reportType === 'Employee Workload' ? '1px solid #8b5cf6' : '1px solid #e2e8f0', background: formData.reportType === 'Employee Workload' ? '#f5f3ff' : '#fff', color: formData.reportType === 'Employee Workload' ? '#8b5cf6' : '#64748b', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="radio" name="reportType" value="Employee Workload" checked={formData.reportType === 'Employee Workload'} onChange={handleInputChange} style={{ display: 'none' }} /> Employee Workload
                  </label>

                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Summary Details <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea 
                  name="summary" 
                  value={formData.summary} 
                  onChange={handleInputChange} 
                  rows="4" 
                  placeholder="Enter the main points of this report..." 
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit' }}></textarea>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', padding: '20px 25px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              
              <button onClick={handleGenerateReport} style={{ padding: '10px 20px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Send Report</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Reports;