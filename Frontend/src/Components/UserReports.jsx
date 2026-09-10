import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf'; 
import html2canvas from 'html2canvas'; // 🔥 Pudhusa add pannirukom for table snapshot

const UserReports = ({ userName, userEmail }) => {
  const [reports, setReports] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 8; 

  const [viewReport, setViewReport] = useState(null); 
  const [activeModalTab, setActiveModalTab] = useState('Ongoing'); // 🔥 Modal Tabs State

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch Reports
        const repRes = await axios.get('https://vinsup-4vt5.onrender.com/api/reports');
        const allReports = Array.isArray(repRes.data) ? repRes.data : (repRes.data.data || []);
        const myReports = allReports.filter(report => {
          const targetEmail = (report.empEmail || '').toLowerCase().trim();
          const currentEmail = (userEmail || '').toLowerCase().trim();
          return targetEmail === currentEmail || targetEmail === 'all'; 
        });
        setReports(myReports);

        // Fetch Batches for Tables
        const batchRes = await axios.get('https://vinsup-4vt5.onrender.com/api/batches');
        setAllBatches(Array.isArray(batchRes.data) ? batchRes.data : (batchRes.data.data || []));

        // Fetch Employees for Attendance/Workload
        const empRes = await axios.get('https://vinsup-4vt5.onrender.com/api/employees');
        setAllEmployees(Array.isArray(empRes.data) ? empRes.data : (empRes.data.data || []));

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userEmail]);

  const filteredReports = reports.filter(r => 
    (r.reportName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reportType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));

  const attendanceCount = reports.filter(r => (r.reportType || '').toLowerCase().includes('attendance')).length;
  const performanceCount = reports.filter(r => (r.reportType || '').toLowerCase().includes('performance') || (r.reportType || '').toLowerCase().includes('course')).length;
  const taskCount = reports.filter(r => (r.reportType || '').toLowerCase().includes('task') || (r.reportType || '').toLowerCase().includes('workload')).length;

  const getTypeStyling = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('attendance')) return { icon: 'far fa-calendar-alt', color: '#10b981', bg: '#ecfdf5' }; 
    if (t.includes('performance') || t.includes('course')) return { icon: 'fas fa-book-open', color: '#3b82f6', bg: '#eff6ff' }; 
    if (t.includes('task') || t.includes('workload')) return { icon: 'fas fa-briefcase', color: '#8b5cf6', bg: '#f5f3ff' }; 
    return { icon: 'far fa-file-alt', color: '#64748b', bg: '#f1f5f9' }; 
  };

  const openReportModal = (report) => {
    setViewReport(report);
    if ((report.reportType || '').toLowerCase().includes('course')) setActiveModalTab('Ongoing');
    else if ((report.reportType || '').toLowerCase().includes('workload')) setActiveModalTab('Active');
  };

  // 🔥 PUDHU LOGIC: HTML2CANVAS vechu exact table-oda PDF capture panradhu
  const handleDownloadPDF = async (report) => {
    const element = document.getElementById('pdf-download-content');
    if (!element) {
      alert("Failed to locate report content.");
      return;
    }

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${report.reportName || 'Vinsup_Report'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Failed to generate PDF.");
    }
  };

  // 🔥 DATA CALCULATIONS FOR MODAL TABLES 🔥
  const myBatches = allBatches.filter(b => 
    (b.trainerName || '').toLowerCase() === (userName || '').toLowerCase() || 
    (b.trainer || '').toLowerCase() === (userName || '').toLowerCase()
  );

  const ongoingBatches = myBatches.filter(b => b.status !== 'Completed');
  const completedBatches = myBatches.filter(b => b.status === 'Completed');
  const displayBatches = activeModalTab === 'Ongoing' ? ongoingBatches : completedBatches;

  const getStudentCount = (list) => list.reduce((sum, b) => sum + (Number(b.studentsCount || b.students?.length || 0)), 0);

  return (
    <div style={{ padding: 'clamp(14px, 2.5vw, 30px)', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '25px 20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <i className="far fa-calendar-alt"></i>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Attendance Reports</p>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 'bold' }}>{attendanceCount}</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>This Year</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '25px 20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <i className="fas fa-book-open"></i>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Course Reports</p>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 'bold' }}>{performanceCount}</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>This Year</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '25px 20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            <i className="fas fa-briefcase"></i>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Workload Reports</p>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 'bold' }}>{taskCount}</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>This Year</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ position: 'relative', width: 'min(300px, 100%)' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
          <input 
            type="text" 
            placeholder="Search by report name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <i className="fas fa-info-circle"></i> Reports are generated and sent by your admin / manager.
        </div>
      </div>

      {/* Main Table Container */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fafafa', color: '#0f172a', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '15px 25px', fontWeight: '600' }}>Report Name</th>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>Report Type</th>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>Generated On</th>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>Summary Details</th>
                <th style={{ padding: '15px 25px', fontWeight: '600', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Loading reports...
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                currentReports.map((report) => {
                  const style = getTypeStyling(report.reportType);
                  const dateObj = new Date(report.createdAt || Date.now());
                  
                  return (
                    <tr key={report._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '15px 25px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                            <i className={style.icon}></i>
                          </div>
                          <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '500' }}>{report.reportName || "Untitled Report"}</span>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px', color: '#475569', fontSize: '13px' }}>{report.reportType || "General"}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '500' }}>{dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>{dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px', color: '#475569', fontSize: '13px' }}>{report.summary && report.summary.length > 40 ? report.summary.substring(0, 40) + '...' : (report.summary || "Current Period")}</td>
                      <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button onClick={() => openReportModal(report)} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#2563eb', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="far fa-eye" style={{ fontSize: '12px' }}></i> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '40px', color: '#e2e8f0', marginBottom: '15px' }}><i className="fas fa-folder-open"></i></div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>No Reports Found</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>{searchTerm ? "No reports match your search." : "You don't have any reports yet."}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', flexWrap: 'wrap', gap: '10px' }}>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={prevPage} disabled={currentPage === 1} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-chevron-left" style={{ fontSize: '12px' }}></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button key={number} onClick={() => paginate(number)} style={{ width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', border: currentPage === number ? 'none' : '1px solid #e2e8f0', background: currentPage === number ? '#2563eb' : '#fff', color: currentPage === number ? '#fff' : '#475569' }}>
                  {number}
                </button>
              ))}
              <button onClick={nextPage} disabled={currentPage === totalPages} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-chevron-right" style={{ fontSize: '12px' }}></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🔥 ENHANCED VIEW REPORT MODAL 🔥 */}
      {viewReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: 'min(850px, 100%)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#eff6ff', color: '#2563eb', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-file-alt" style={{ fontSize: '14px' }}></i>
                </div>
                Report Details
              </h2>
              <i className="fas fa-times" onClick={() => setViewReport(null)} style={{ color: '#475569', cursor: 'pointer', fontSize: '18px' }}></i>
            </div>
            
            {/* 🔥 ID applied here for HTML2CANVAS capture 🔥 */}
            <div id="pdf-download-content" style={{ padding: '25px', overflowY: 'auto', background: '#fff' }}>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Report Name</p>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{viewReport.reportName}</h4>
              </div>
              
              <div style={{ display: 'flex', gap: '40px', background: '#f8fafc', padding: '15px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Report Type</p>
                  <span style={{ display: 'inline-block', background: getTypeStyling(viewReport.reportType).bg, color: getTypeStyling(viewReport.reportType).color, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                    {viewReport.reportType}
                  </span>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Date Generated</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>
                    {new Date(viewReport.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Full Summary / Reference</p>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {viewReport.summary}
                </div>
              </div>

              {/* 🔥 COURSE PROGRESS TABLES INSIDE MODAL 🔥 */}
              {(viewReport.reportType || '').toLowerCase().includes('course') && (
                <div>
                  <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '15px' }}>
                    <div onClick={() => setActiveModalTab('Ongoing')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeModalTab === 'Ongoing' ? '#2563eb' : '#64748b', borderBottom: activeModalTab === 'Ongoing' ? '3px solid #2563eb' : '3px solid transparent' }}>
                      Ongoing Batches
                    </div>
                    <div onClick={() => setActiveModalTab('Completed')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeModalTab === 'Completed' ? '#16a34a' : '#64748b', borderBottom: activeModalTab === 'Completed' ? '3px solid #16a34a' : '3px solid transparent' }}>
                      Completed Batches
                    </div>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Batch Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Course</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Students</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Start Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Progress</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayBatches.length > 0 ? displayBatches.map((b, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{b.batchName}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#334155' }}>{b.courseName}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#334155' }}>{b.studentsCount || 0}</td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#334155' }}>{b.startDate || '-'}</td>
                          <td style={{ padding: '12px', width: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', height: '6px' }}>
                                <div style={{ background: b.status === 'Completed' ? '#16a34a' : '#3b82f6', height: '6px', borderRadius: '4px', width: `${b.progress || 0}%` }}></div>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: b.status === 'Completed' ? '#16a34a' : '#3b82f6' }}>{b.progress || 0}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: b.status === 'Completed' ? '#dcfce7' : '#fef9c3', color: b.status === 'Completed' ? '#16a34a' : '#ca8a04' }}>
                              {b.status || 'Ongoing'}
                            </span>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>No {activeModalTab} Batches found for you.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 🔥 WORKLOAD TABLES INSIDE MODAL 🔥 */}
              {(viewReport.reportType || '').toLowerCase().includes('workload') && (
                <div>
                  <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '15px' }}>
                    <div onClick={() => setActiveModalTab('Active')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeModalTab === 'Active' ? '#8b5cf6' : '#64748b', borderBottom: activeModalTab === 'Active' ? '3px solid #8b5cf6' : '3px solid transparent' }}>
                      Active Workload
                    </div>
                    <div onClick={() => setActiveModalTab('History')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeModalTab === 'History' ? '#16a34a' : '#64748b', borderBottom: activeModalTab === 'History' ? '3px solid #16a34a' : '3px solid transparent' }}>
                      Past History (Old)
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Trainer Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>{activeModalTab === 'History' ? 'Completed Batches' : 'Active Batches'}</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>{activeModalTab === 'History' ? 'Students Trained' : 'Total Students'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{userName || 'Trainer'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: activeModalTab === 'History' ? '#dcfce7' : '#f5f3ff', color: activeModalTab === 'History' ? '#16a34a' : '#8b5cf6', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                             {activeModalTab === 'History' ? completedBatches.length : ongoingBatches.length}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                             {activeModalTab === 'History' ? getStudentCount(completedBatches) : getStudentCount(ongoingBatches)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

            </div>
            
            {/* Modal Footer Controls */}
            <div style={{ padding: '15px 25px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#fff' }}>
              <button onClick={() => setViewReport(null)} style={{ padding: '10px 16px', background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                 Close
              </button>
              <button onClick={() => handleDownloadPDF(viewReport)} style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
                 <i className="fas fa-download"></i> Download PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default UserReports;