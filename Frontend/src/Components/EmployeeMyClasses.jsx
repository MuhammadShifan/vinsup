import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeMyClasses = ({ userName, userEmail }) => {
  // Data States
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [syllabusList, setSyllabusList] = useState([]);
  
  // Selection States
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  
  // Stats
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [averageProgress, setAverageProgress] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [completedClasses, setCompletedClasses] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);

  // Syllabus States
  const [availableClasses, setAvailableClasses] = useState([]);
  const [assignBoxTab, setAssignBoxTab] = useState('pending'); // 'students', 'pending', 'completed'

  // Helper for Profile Image
  const getPhotoUrl = (rawPath) => {
    if (!rawPath) return '';
    if (rawPath.startsWith('http') || rawPath.startsWith('data:image')) return rawPath;
    let cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    return `https://vinsup-4vt5.onrender.com/${cleanPath}`;
  };

  const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Student')}&background=f1f5f9&color=64748b`;

  // Helper for Date Formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Fetch API Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const exactDBName = userName || "Employee";
        const incomingEmail = (userEmail || "").toLowerCase().trim();

        // Fetch Batches
        const bRes = await axios.get('https://vinsup-4vt5.onrender.com/api/batches');
        const allB = Array.isArray(bRes.data) ? bRes.data : (bRes.data.data || []);
        const myBatches = allB.filter(b => {
          const trainerStr = (b.trainer || b.trainerName || b.assignedTo || b.faculty || '').toLowerCase().trim();
          return trainerStr === exactDBName.toLowerCase().trim() || trainerStr === incomingEmail;
        });
        setBatches(myBatches);

        // Fetch Students
        const stuRes = await axios.get('https://vinsup-4vt5.onrender.com/api/students').catch(()=>null);
        const stuData = stuRes?.data?.data || stuRes?.data || [];
        setAllStudents(stuData);

        // Fetch Syllabus
        const sRes = await axios.get('https://vinsup-4vt5.onrender.com/api/syllabus').catch(()=>null);
        if (sRes?.data) setSyllabusList(Array.isArray(sRes.data) ? sRes.data : (sRes.data.data || []));

        // Calculate Initial Stats
        if (myBatches.length > 0) {
          const totalProg = myBatches.reduce((sum, b) => sum + (b.progress || 0), 0);
          setAverageProgress(Math.round(totalProg / myBatches.length));
          setSelectedBatchId(myBatches[0]._id || myBatches[0].batchId); // Auto-select first
        }
        
        let stuCount = 0;
        myBatches.forEach(b => {
          const bName = String(b.batchName || "").trim().toLowerCase();
          stuCount += stuData.filter(s => String(s.batch || "").trim().toLowerCase() === bName || s.batchId === (b._id || b.batchId)).length;
        });
        setTotalStudentsCount(stuCount);

        // Calculate Total Unique Courses
        const uniqueCoursesCount = new Set(myBatches.filter(b => b.courseName).map(b => b.courseName.trim().toLowerCase())).size;
        setTotalCourses(uniqueCoursesCount);

      } catch (error) { console.error("Error fetching data:", error); }
    };
    fetchData();
  }, [userName, userEmail]);

  // Calculate Syllabus for Selected Batch
  useEffect(() => {
    if (selectedBatchId && batches.length > 0 && syllabusList.length > 0) {
      const selectedBatch = batches.find(b => b._id === selectedBatchId || b.batchId === selectedBatchId);
      
      if (selectedBatch && selectedBatch.courseName) {
        const matchedSyllabus = syllabusList.find(s => s.courseName?.toLowerCase() === selectedBatch.courseName.toLowerCase());
        if (matchedSyllabus && matchedSyllabus.modules) {
          let extractedTopics = [];
          matchedSyllabus.modules.forEach((mod, mIdx) => {
            (mod.topics || mod.concepts || []).forEach((topic, tIdx) => {
              extractedTopics.push({
                id: `${mIdx}-${tIdx}`, 
                moduleName: mod.title || `Module ${mIdx + 1}`,
                title: typeof topic === 'string' ? topic : topic.title, 
                checked: false
              });
            });
          });
          const currProg = selectedBatch.progress || 0;
          const matchCount = Math.round((currProg / 100) * extractedTopics.length);
          
          let processedTopics = extractedTopics.map((t, i) => ({ 
            ...t, checked: i < matchCount, isCompleted: i < matchCount 
          }));
          setAvailableClasses(processedTopics);
        } else setAvailableClasses([]); 
      }
    }
  }, [selectedBatchId, batches, syllabusList]);

  // Calculate Overall Class Stats
  useEffect(() => {
    let tClasses = 0, cClasses = 0;
    batches.forEach(batch => {
      const matchedSyllabus = syllabusList.find(s => s.courseName?.toLowerCase() === batch.courseName?.toLowerCase());
      let batchTotalTopics = 0;
      if (matchedSyllabus && matchedSyllabus.modules) {
        matchedSyllabus.modules.forEach(m => batchTotalTopics += (m.topics || []).length);
      }
      tClasses += batchTotalTopics;
      cClasses += Math.round(((batch.progress || 0) / 100) * batchTotalTopics);
    });
    setTotalClasses(tClasses);
    setCompletedClasses(cClasses);
  }, [batches, syllabusList]);

  // Handlers
  const toggleClassCheck = (id) => {
    const updatedClasses = availableClasses.map(c => {
      if(c.id === id) {
        if(c.isCompleted) return c; 
        return { ...c, checked: !c.checked };
      }
      return c;
    });
    setAvailableClasses(updatedClasses);
  };

  const handleAssignClasses = async () => {
    if (!selectedBatchId) return;
    const totalTopics = availableClasses.length;
    const checkedCount = availableClasses.filter(c => c.checked).length;
    const newProgress = totalTopics === 0 ? 0 : Math.round((checkedCount / totalTopics) * 100);
    const newStatus = newProgress === 100 ? 'Completed' : 'Ongoing';

    try {
      await axios.put(`https://vinsup-4vt5.onrender.com/api/batches/${selectedBatchId}`, { progress: newProgress, status: newStatus });
      setBatches(batches.map(b => (b._id === selectedBatchId || b.batchId === selectedBatchId) ? { ...b, progress: newProgress, status: newStatus } : b));
      let updatedClasses = availableClasses.map(c => ({ ...c, isCompleted: c.checked }));
      setAvailableClasses(updatedClasses);
      alert(`Syllabus Progress Updated! Now at ${newProgress}% 🚀`);
    } catch (error) { alert("Failed to update syllabus progress. Check backend."); }
  };

  const activeBatch = batches.find(b => (b._id === selectedBatchId || b.batchId === selectedBatchId));
  
  let activeBatchStudentCount = 0;
  let currentBatchStudents = [];
  if (activeBatch) {
    const bName = String(activeBatch.batchName || "").trim().toLowerCase();
    currentBatchStudents = allStudents.filter(s => String(s.batch || "").trim().toLowerCase() === bName || s.batchId === (activeBatch._id || activeBatch.batchId));
    activeBatchStudentCount = currentBatchStudents.length;
  }
  
  const pendingClasses = availableClasses.filter(c => !c.isCompleted);
  const completedClassesList = availableClasses.filter(c => c.isCompleted);

  return (
    <div className="cls-page-wrapper">
      {/* HEADER */}
      <div className="cls-header">
        <div>
          <h1 className="cls-page-title">My Classes</h1>
          <p className="cls-page-subtitle">View your batches, manage students and track progress.</p>
        </div>
      </div>

      {/* MAIN CONTENT LAYOUT */}
      <div className="cls-main-layout">
        
        {/* LEFT COLUMN: STATS & BATCHES LIST */}
        <div className="cls-left-col">    

          {/* TOP STATS GRID (MOVED INSIDE LEFT COL AND MADE COMPACT) */}
          <div className="cls-stats-grid">
            <div className="cls-stat-card">
              <div className="cls-stat-icon" style={{background: '#eff6ff', color: '#2563eb'}}><i className="fas fa-graduation-cap"></i></div>
              <div className="cls-stat-content">
                <span className="cls-stat-label">Total Batches</span>
                <div className="cls-stat-val-row"><span className="cls-stat-number">{batches.length}</span><span className="cls-stat-desc">Active Batches</span></div>
              </div>
            </div>
            <div className="cls-stat-card">
              <div className="cls-stat-icon" style={{background: '#f0fdf4', color: '#16a34a'}}><i className="fas fa-user-friends"></i></div>
              <div className="cls-stat-content">
                <span className="cls-stat-label">Total Students</span>
                <div className="cls-stat-val-row"><span className="cls-stat-number">{totalStudentsCount}</span><span className="cls-stat-desc">Across all batches</span></div>
              </div>
            </div>
          </div>
              
          <div className="cls-batch-list custom-scroll">
            {batches.map((batch, idx) => {
              const bId = batch._id || batch.batchId;
              const isActive = bId === selectedBatchId;
              const prog = batch.progress || 0;
              const bName = String(batch.batchName || "").trim().toLowerCase();
              const stuCount = allStudents.filter(s => String(s.batch || "").trim().toLowerCase() === bName || s.batchId === bId).length;

              return (
                <div key={bId} className={`cls-batch-card ${isActive ? 'active' : ''}`} onClick={() => setSelectedBatchId(bId)}>
                  <div className="cls-bc-top">
                    <div className="cls-bc-info">
                      <h3 className="cls-bc-title">{batch.courseName}</h3>
                      <p className="cls-bc-meta">Batch <span style={{color: '#1e293b', fontWeight: 700}}>{batch.batchName}</span> • Weekdays</p>
                    </div>
                  </div>
                  
                  <div className="cls-bc-bottom">
                    <div className="cls-bc-details">
                      <span><i className="far fa-user"></i> {stuCount} Students</span>
                      <span><i className="far fa-calendar-alt"></i> {formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
                    </div>
                    
                    {/* Circular Progress Bar */}
                    <div className="cls-circle-prog-wrapper">
                      <div className="cls-circle-prog" style={{background: `conic-gradient(${isActive ? '#2563eb' : '#22c55e'} ${prog}%, #f1f5f9 0)`}}>
                        <div className="cls-circle-inner">{prog}%</div>
                      </div>
                      <span className="cls-circle-label">Progress</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cls-pagination-text">Showing 1 to {batches.length} of {batches.length} batches</div>
        </div>

        {/* RIGHT COLUMN: SYLLABUS TRACKER PANEL */}
        <div className="cls-right-col">
          {activeBatch ? (
            <div className="cls-details-panel">
              
              {/* Panel Header */}
              <div className="cls-panel-header">
                <div className="cls-ph-title-row">
                  <h2 className="cls-ph-title">{activeBatch.courseName}</h2>
                  <span className="cls-status-pill">In Progress</span>
                </div>
                <div className="cls-ph-meta-row">
                  <span>Batch Code: <span style={{color: '#1e293b', fontWeight: 700}}>{activeBatch.batchName}</span></span> <span className="cls-dot">•</span>
                  <span>Weekdays (Mon - Fri)</span>
                </div>
                <div className="cls-ph-icons-row">
                  <span><i className="far fa-user"></i> {activeBatchStudentCount} Students</span>
                  <span><i className="far fa-calendar-alt"></i> {formatDate(activeBatch.startDate)} - {formatDate(activeBatch.endDate)}</span>
                </div>
              </div>

              {/* Panel Progress Box */}
              <div className="cls-progress-box">
                <div className="cls-pb-left">
                  <div className="cls-pb-header">
                    <span className="cls-pb-title">Batch Progress</span>
                    <span className="cls-pb-percent">{activeBatch.progress || 0}%</span>
                  </div>
                  <div className="cls-pb-bar-bg">
                    <div className="cls-pb-bar-fill" style={{width: `${activeBatch.progress || 0}%`}}></div>
                  </div>
                  <p className="cls-pb-desc">You've completed {Math.round(((activeBatch.progress || 0)/100)*availableClasses.length)} out of {availableClasses.length} modules</p>
                </div>
              </div>

              {/* 🔥 TABS 🔥 */}
              <div style={{padding: '12px 24px 0 24px', borderBottom: '1px solid #e2e8f0'}}>
                <div className="myc-box-tabs">
                  <button className={`myc-box-tab ${assignBoxTab === 'students' ? 'active' : ''}`} onClick={() => setAssignBoxTab('students')}>
                    Students ({activeBatchStudentCount})
                  </button>
                  <button className={`myc-box-tab ${assignBoxTab === 'pending' ? 'active' : ''}`} onClick={() => setAssignBoxTab('pending')}>
                    Topics to Cover ({pendingClasses.length})
                  </button>
                  <button className={`myc-box-tab ${assignBoxTab === 'completed' ? 'active' : ''}`} onClick={() => setAssignBoxTab('completed')}>
                    Completed ({completedClassesList.length})
                  </button>
                </div>
              </div>

              {/* 🔥 CONTENT AREA 🔥 */}
              <div className="cls-tab-content custom-scroll" style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
                
                {/* 1. Students Tab Content */}
                {assignBoxTab === 'students' ? (
                  <div className="cls-students-list">
                    {currentBatchStudents.length > 0 ? (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '12px'}}>
                        {currentBatchStudents.map((stu, i) => {
                          const avatarSrc = getPhotoUrl(stu.profilePhoto) || fallbackAvatar(stu.fullName);
                          return (
                            <div key={i} className="stu-card-item">
                              <img src={avatarSrc} alt={stu.fullName} className="stu-avatar" onError={(e)=>{e.target.onerror=null; e.target.src=fallbackAvatar(stu.fullName);}} />
                              <div style={{flex: 1}}>
                                <div className="stu-name">{stu.fullName}</div>
                                <div className="stu-subid">{stu.studentId} • {stu.email}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-state">No students enrolled in this batch yet.</div>
                    )}
                  </div>

                /* 2. Topics to Cover (Pending) Tab Content */
                ) : assignBoxTab === 'pending' ? (
                  <div className="myc-class-list">
                    {pendingClasses.length > 0 ? (
                      pendingClasses.map((cls) => (
                        <div className="myc-class-item" key={cls.id} onClick={() => toggleClassCheck(cls.id)}>
                          <input type="checkbox" className="myc-checkbox" checked={cls.checked} readOnly />
                          <div className="myc-cl-info">
                            <h4 className="myc-cl-title">{cls.title}</h4>
                            <p className="myc-cl-topic"><span style={{color: '#3b82f6', fontWeight: 600}}>{cls.moduleName}</span></p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">All classes assigned! 🎉</div>
                    )}
                  </div>
                  
                /* 3. Completed Topics Tab Content */
                ) : (
                  <div className="myc-class-list">
                    {completedClassesList.length > 0 ? (
                      completedClassesList.map((cls) => (
                        <div className="myc-class-item normal-locked" key={cls.id}>
                          <input type="checkbox" className="myc-checkbox" checked={true} disabled readOnly />
                          <div className="myc-cl-info">
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <h4 className="myc-cl-title">{cls.title}</h4>
                              <span className="badge-done">Done</span>
                            </div>
                            <p className="myc-cl-topic"><span style={{color: '#3b82f6', fontWeight: 600}}>{cls.moduleName}</span></p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">No completed concepts yet.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Save Button */}
              {assignBoxTab !== 'students' && (
                <div className="myc-panel-footer">
                  <button className="myc-btn-primary w-100" onClick={handleAssignClasses}>
                    Save Progress
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="cls-empty-panel">
              <i className="fas fa-layer-group"></i>
              <h3>Select a batch to view details</h3>
            </div>
          )}
        </div>

      </div>

      {/* --- PURE CSS DESIGN --- */}
      <style>{`
        .cls-page-wrapper { padding: 24px 32px; font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; color: #0f172a; box-sizing: border-box; }
        
        /* Header */
        .cls-header { margin-bottom: 20px; }
        .cls-page-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
        .cls-page-subtitle { font-size: 14px; color: #64748b; margin: 0; }
        
        /* Main Layout */
        .cls-main-layout { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start; }

        /* Left Col */
        .cls-left-col { display: flex; flex-direction: column; }
        
        /* Stats Grid - Moved inside left col, made compact */
        .cls-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
        .cls-stat-card { background: #fff; padding: 12px 14px; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; gap: 12px; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .cls-stat-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 16px; flex-shrink: 0; }
        .cls-stat-content { display: flex; flex-direction: column; flex: 1; }
        .cls-stat-label { font-size: 11px; color: #475569; font-weight: 600; margin-bottom: 2px; }
        .cls-stat-val-row { display: flex; flex-direction: column; }
        .cls-stat-number { font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.2; }
        .cls-stat-desc { font-size: 10px; color: #64748b; margin-top: 2px; }
        
        /* Batch List */
        .cls-batch-list { display: flex; flex-direction: column; gap: 12px; max-height: calc(100vh - 230px); overflow-y: auto; padding-right: 4px; }
        
        /* Batch Card */
        .cls-batch-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; cursor: pointer; transition: 0.2s; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .cls-batch-card:hover { border-color: #cbd5e1; }
        .cls-batch-card.active { 
          background: #eff6ff; 
          border-color: transparent; 
          border-left: 4px solid #2563eb; 
          padding-left: 11px; 
          box-shadow: none; 
        }

        .cls-bc-top { display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start; }
        .cls-bc-info { flex: 1; min-width: 0; }
        .cls-bc-title { font-size: 14px; font-weight: 800; margin: 0 0 4px 0; color: #020617; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.3px;}
        .cls-bc-meta { font-size: 11px; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .cls-bc-bottom { display: flex; justify-content: space-between; align-items: center; } 
        .cls-bc-details { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #64748b; flex: 1; min-width: 0; padding-right: 12px;} 
        .cls-bc-details span { display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cls-bc-details i { width: 14px; text-align: center; }
        
        /* Circular Progress */
        .cls-circle-prog-wrapper { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
        .cls-circle-prog { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
        .cls-circle-inner { width: 30px; height: 30px; background: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 11px; font-weight: 800; color: #0f172a; z-index: 2;}
        .cls-batch-card.active .cls-circle-inner { background: #eff6ff; }
        .cls-circle-label { font-size: 10px; color: #64748b; font-weight: 600; }
        
        .cls-pagination-text { font-size: 11px; color: #64748b; margin-top: 12px; }

        /* Right Col (Panel) */
        .cls-details-panel { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.03); display: flex; flex-direction: column; height: calc(100vh - 140px); min-height: 550px; overflow: hidden; }
        .cls-empty-panel { height: calc(100vh - 140px); min-height: 550px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #94a3b8; }
        .cls-empty-panel i { font-size: 40px; margin-bottom: 12px; color: #cbd5e1; }
        
        /* Panel Header */
        .cls-panel-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
        .cls-ph-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .cls-ph-title { font-size: 22px; font-weight: 900; margin: 0; color: #020617; letter-spacing: -0.5px;}
        .cls-status-pill { background: #dcfce7; color: #16a34a; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-left: 8px;}
        
        .cls-ph-meta-row { font-size: 13px; color: #475569; margin-bottom: 12px; font-weight: 500; }
        .cls-dot { margin: 0 8px; color: #cbd5e1; }
        .cls-ph-icons-row { display: flex; flex-wrap: wrap; gap: 12px 24px; font-size: 13px; color: #475569; } 
        .cls-ph-icons-row span { display: flex; align-items: center; gap: 6px; }

        /* Panel Progress Box */
        .cls-progress-box { display: flex; gap: 24px; padding: 16px 24px; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .cls-pb-left { flex: 2; padding-right: 20px; } 
        .cls-pb-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
        .cls-pb-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .cls-pb-percent { font-size: 20px; font-weight: 800; color: #2563eb; line-height: 1;}
        .cls-pb-bar-bg { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; margin-bottom: 8px; overflow: hidden; }
        .cls-pb-bar-fill { height: 100%; background: #2563eb; border-radius: 3px; transition: 0.3s ease; }
        .cls-pb-desc { font-size: 12px; color: #64748b; margin: 0; }

        /* Syllabus Section Elements */
        .myc-box-tabs { display: flex; gap: 8px; width: 100%; padding-bottom: 10px; }
        .myc-box-tab { background: transparent; border: none; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: 0.2s; }
        .myc-box-tab.active { background: #eff6ff; color: #2563eb; }

        .myc-panel-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #fff; }
        .myc-btn-primary { background: #2563eb; border: none; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .myc-btn-primary:hover { background: #1d4ed8; }
        .w-100 { width: 100%; }

        /* Syllabus List styling */
        .myc-class-list { display: flex; flex-direction: column; gap: 10px; }
        .myc-class-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; display: flex; gap: 14px; align-items: center; transition: 0.2s; cursor: pointer; background: #fff; }
        .myc-class-item:hover { border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .myc-class-item.normal-locked { background: #f8fafc; cursor: default; }
        .myc-cl-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
        .myc-cl-topic { font-size: 12px; margin: 4px 0 0 0; }
        .myc-checkbox { width: 18px; height: 18px; accent-color: #2563eb; cursor: pointer; }
        .badge-done { font-size: 10px; background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-weight: 700; }

        /* Students Card Item */
        .stu-card-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
        .stu-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1; }
        .stu-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .stu-subid { font-size: 12px; color: #64748b; }

        .empty-state { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; font-weight: 500; }
        
        /* Custom Scrollbar for inner lists */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default EmployeeMyClasses;