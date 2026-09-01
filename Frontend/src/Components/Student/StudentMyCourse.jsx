import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentMyCourse = ({ userEmail, userName }) => {
  // 🔥 Initial state-la dummy data thookiyachu. Original data load aagum. 🔥
  const [courseData, setCourseData] = useState({
    courseName: 'Loading...',
    description: 'Loading course details...',
    startedOn: '--',
    duration: '--',
    trainerName: '--',
    batchName: '--',
    overallProgress: 0,
    lastAccessed: '--',
    trainerEmail: '--',
    trainerRole: 'Trainer',
    trainerImage: null
  });

  const [modules, setModules] = useState([]);
  
  // 🔥 Accordion State 🔥
  const [expandedMod, setExpandedMod] = useState(null);

  const toggleMod = (id) => {
    if (expandedMod === id) setExpandedMod(null);
    else setExpandedMod(id);
  };

  useEffect(() => {
    // API Fetch logic for REAL DATA
    const fetchData = async () => {
      try {
        const activeEmail = (userEmail || "").toLowerCase().trim();
        if (!activeEmail) return;

        // Fetch multiple APIs at once
        const [stuRes, empRes, sylRes, batchRes] = await Promise.all([
            axios.get('http://localhost:5001/api/students').catch(() => null),
            axios.get('http://localhost:5001/api/employees').catch(() => null),
            axios.get('http://localhost:5001/api/syllabus').catch(() => null),
            axios.get('http://localhost:5001/api/batches').catch(() => null)
        ]);

        const allStudents = stuRes?.data?.data || stuRes?.data || [];
        const allEmp = empRes?.data?.data || empRes?.data || [];
        const allSyllabus = sylRes?.data?.data || sylRes?.data || [];
        const allBatches = batchRes?.data?.data || batchRes?.data || [];

        const currentStudent = allStudents.find(s => (s.email || '').toLowerCase().trim() === activeEmail);

        if (currentStudent) {
          const trainerInfo = allEmp.find(e => (e.fullName || e.name || '') === currentStudent.trainer);
          const studentBatch = allBatches.find(b => (b.batchName || b.batchId || b.name || '').toLowerCase() === (currentStudent.batch || '').toLowerCase());
          
          const batchProgress = studentBatch ? (studentBatch.progress || 0) : 0;
          const mySyllabus = allSyllabus.find(s => (s.courseName || s.course) === currentStudent.course);

          let trainerImg = null;
          if (trainerInfo && trainerInfo.profilePhoto) {
            let cleanPath = trainerInfo.profilePhoto.replace(/\\/g, '/').replace(/^\/+/, '');
            if (!cleanPath.startsWith('http')) {
               cleanPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
               trainerImg = `http://localhost:5001/${cleanPath}`;
            } else trainerImg = trainerInfo.profilePhoto;
          }

          setCourseData({
            courseName: currentStudent.course || "No Course",
            description: mySyllabus?.description || 'Master your skills with hands-on projects and practical learning.',
            startedOn: currentStudent.doj ? new Date(currentStudent.doj).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "--",
            duration: mySyllabus?.duration || '6 Months',
            trainerName: currentStudent.trainer || "Not Assigned",
            batchName: currentStudent.batch || "Not Assigned",
            overallProgress: batchProgress,
            lastAccessed: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            trainerEmail: trainerInfo ? trainerInfo.email : "--",
            trainerRole: trainerInfo ? (trainerInfo.designation || 'Trainer') : "Trainer",
            trainerImage: trainerImg
          });

          if (mySyllabus && mySyllabus.modules && mySyllabus.modules.length > 0) {
            let totalSyllabusConcepts = 0;
            mySyllabus.modules.forEach(mod => {
                const rawTopics = mod.topics || [];
                totalSyllabusConcepts += (rawTopics.length > 0 ? rawTopics.length : (mod.totalConcepts || 0));
            });

            // Proportionally distribute progress across modules
            let tempRemaining = Math.round((batchProgress / 100) * totalSyllabusConcepts);

            const colors = [
              { color: '#2563eb', bg: '#eff6ff' }, { color: '#16a34a', bg: '#f0fdf4' }, 
              { color: '#c026d3', bg: '#fdf4ff' }, { color: '#d97706', bg: '#fffbeb' }, 
              { color: '#ef4444', bg: '#fef2f2' }, { color: '#9333ea', bg: '#f5f3ff' }
            ];
            
            const fetchedModules = mySyllabus.modules.map((mod, idx) => {
               let rawTopics = Array.isArray(mod.topics) ? [...mod.topics] : [];
               const total = rawTopics.length > 0 ? rawTopics.length : (mod.totalConcepts || 0);
               
               // Generate fallback topics if API only has numbers
               if (rawTopics.length === 0 && total > 0) {
                   for (let i = 0; i < total; i++) {
                       rawTopics.push({ topicName: `Concept ${i + 1}` });
                   }
               }

               let comp = 0;
               if (tempRemaining >= total) {
                   comp = total;
                   tempRemaining -= total;
               } else {
                   comp = tempRemaining;
                   tempRemaining = 0;
               }
               
               const prog = total > 0 ? Math.round((comp / total) * 100) : 0;
               const theme = colors[idx % colors.length];

               // Formating and 🔥 SORTING 🔥 topics
               const formattedTopics = rawTopics.map((t, tIdx) => {
                   const tName = typeof t === 'string' ? t : (t.topicName || t.name || t.title || `Topic ${tIdx + 1}`);
                   return {
                       topicName: tName,
                       isCompleted: tIdx < comp // Based on linear progress
                   };
               });

               // 🔥 Sorting: Completed topics go to the bottom 🔥
               formattedTopics.sort((a, b) => {
                   if (a.isCompleted === b.isCompleted) return 0;
                   return a.isCompleted ? 1 : -1;
               });

               return {
                 id: String(idx + 1).padStart(2, '0'),
                 title: mod.title || mod.moduleName || `Module ${idx+1}`,
                 desc: mod.description ,
                 topicsDone: comp,
                 topicsTotal: total,
                 progress: prog,
                 color: theme.color,
                 bg: theme.bg,
                 topics: formattedTopics // Sorted topics array
               };
            });
            setModules(fetchedModules);
          }
        }
      } catch (error) { console.error("Error fetching course details:", error); }
    };

    fetchData();
  }, [userEmail]);

  return (
    <div className="st-mc-wrapper">
      
      {/* Page Header */}
      <div className="st-mc-header">
        <h1 className="st-mc-title">My Courses</h1>
        <div className="st-mc-breadcrumb">Home <i className="fas fa-chevron-right"></i> <span>My Courses</span></div>
      </div>

      {/* Top Main Course Card */}
      <div className="st-mc-topcard">
        <div className="tc-left">
          <div className="tc-icon-box">
            <i className="fas fa-book-open"></i>
          </div>
          <div className="tc-info">
            <div className="tc-title-row">
              <h2>{courseData.courseName}</h2>
            </div>
            <p className="tc-desc">{courseData.description}</p>
            
            <div className="tc-meta-grid">
              <div className="tc-meta-item">
                <i className="far fa-calendar-alt"></i>
                <div>
                  <span className="meta-lbl">Started on</span>
                  <div className="meta-val">{courseData.startedOn}</div>
                </div>
              </div>
              <div className="tc-meta-item">
                <i className="far fa-clock"></i>
                <div>
                  <span className="meta-lbl">Duration</span>
                  <div className="meta-val">{courseData.duration}</div>
                </div>
              </div>
              <div className="tc-meta-item">
                <i className="far fa-user"></i>
                <div>
                  <span className="meta-lbl">Trainer</span>
                  <div className="meta-val">{courseData.trainerName}</div>
                </div>
              </div>
              <div className="tc-meta-item">
                <i className="fas fa-tags"></i>
                <div>
                  <span className="meta-lbl">Batch</span>
                  <div className="meta-val">{courseData.batchName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tc-divider"></div>

        <div className="tc-right">
          <div className="tc-progress-section">
            <div className="tc-prog-text-col">
              <div className="tc-prog-label">Overall Progress</div>
              <div className="tc-circular-chart" style={{background: `conic-gradient(#2563eb ${courseData.overallProgress}%, #f1f5f9 0)`}}>
                <div className="tc-circular-inner">{courseData.overallProgress}%</div>
              </div>
            </div>
            <div className="tc-prog-details">
              <div className="pd-item">
                <span className="pd-lbl">Course Progress</span>
                <span className="pd-val">{courseData.overallProgress}% Completed</span>
              </div>
              <div className="pd-item mt-3">
                <span className="pd-lbl">Last Accessed</span>
                <span className="pd-val">{courseData.lastAccessed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Layout: Modules + Sidebar */}
      <div className="st-mc-bottom-grid">
        
        {/* Left Column: Course Modules */}
        <div className="st-mc-modules-card">
          <div className="mod-header">
            <h3>Course Modules</h3>
            <p>Track your learning progress in each module.</p>
          </div>
          
          <div className="mod-list">
            {modules.length > 0 ? modules.map((mod, idx) => (
              <div className="mod-item-wrapper" key={idx}>
                <div className="mod-item" onClick={() => toggleMod(mod.id)}>
                  <div className="mod-number" style={{ background: mod.bg, color: mod.color }}>{mod.id}</div>
                  
                  <div className="mod-content">
                    <h4 className="mod-title">{mod.title}</h4>
                    <p className="mod-desc">{mod.desc}</p>
                  </div>
                  
                  <div className="mod-actions">
                    <div className="mod-progress-bar-bg">
                      <div className="mod-progress-bar-fill" style={{ width: `${mod.progress}%`, background: mod.color }}></div>
                    </div>
                    <span className="mod-prog-percent">{mod.progress}%</span>
                    <span className="mod-topics-count">{mod.topicsDone}/{mod.topicsTotal} Topics</span>
                    {/* 🔥 Dynamic Arrow Icon 🔥 */}
                    <i className={`fas fa-chevron-${expandedMod === mod.id ? 'up' : 'down'} mod-dropdown-icon`}></i>
                  </div>
                </div>

                {/* 🔥 Expandable Topics List 🔥 */}
                {expandedMod === mod.id && (
                  <div className="mod-topics-container">
                    {mod.topics.length > 0 ? mod.topics.map((topic, i) => (
                      <div key={i} className={`topic-item ${topic.isCompleted ? 'completed' : 'pending'}`}>
                        <i className={`topic-icon ${topic.isCompleted ? 'fas fa-check-circle done' : 'far fa-circle waiting'}`}></i>
                        <span className="topic-text">{topic.topicName}</span>
                        {topic.isCompleted && <span className="topic-badge">Completed</span>}
                      </div>
                    )) : (
                      <div className="topic-item"><span className="topic-text text-muted">No specific topics defined.</span></div>
                    )}
                  </div>
                )}
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No modules found for your course yet.</div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="st-mc-sidebar">
          
          {/* Trainer Card */}
          <div className="side-card">
            <h3 className="sc-title"><i className="far fa-user"></i> Trainer</h3>
            <div className="trainer-info">
              {courseData.trainerImage ? (
                <img src={courseData.trainerImage} alt="Trainer" className="trainer-avatar" onError={(e)=>{e.target.style.display='none'; e.target.nextSibling.style.display='block';}} />
              ) : null}
              {/* Fallback avatar */}
              <div className="trainer-avatar-placeholder" style={{ display: courseData.trainerImage ? 'none' : 'block' }}>
                 <img src={`https://ui-avatars.com/api/?name=${courseData.trainerName}&background=f1f5f9&color=2563eb`} alt="Trainer" />
              </div>
              <div>
                <div className="trainer-name">{courseData.trainerName}</div>
                <div className="trainer-role">{courseData.trainerRole}</div>
                <div className="trainer-email"><i className="far fa-envelope"></i> {courseData.trainerEmail}</div>
              </div>
            </div>
          </div>

          {/* Course Details Card */}
          <div className="side-card">
            <h3 className="sc-title"><i className="far fa-calendar-alt"></i> Course Details</h3>
            <div className="cd-list">
              <div className="cd-row"><span>Course</span><span className="cd-val">{courseData.courseName}</span></div>
              <div className="cd-row"><span>Batch</span><span className="cd-val">{courseData.batchName}</span></div>
              <div className="cd-row"><span>Started On</span><span className="cd-val">{courseData.startedOn}</span></div>
              <div className="cd-row"><span>Duration</span><span className="cd-val">{courseData.duration}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PURE CSS DESIGN --- */}
      <style>{`
        .st-mc-wrapper { padding: 24px 32px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; color: #0f172a; box-sizing: border-box; }
        
        /* Header */
        .st-mc-header { margin-bottom: 24px; }
        .st-mc-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;}
        .st-mc-breadcrumb { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 8px;}
        .st-mc-breadcrumb i { font-size: 10px; }
        .st-mc-breadcrumb span { color: #0f172a; font-weight: 600; }
        
        /* Top Card */
        .card-shadow { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .st-mc-topcard { display: flex; padding: 32px; margin-bottom: 24px; align-items: center; gap: 32px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;}
        
        .tc-left { display: flex; gap: 24px; flex: 1; align-items: flex-start; }
        .tc-icon-box { width: 80px; height: 80px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: flex; justify-content: center; align-items: center; font-size: 32px; flex-shrink: 0; }
        
        .tc-info { flex: 1; }
        .tc-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .tc-title-row h2 { font-size: 22px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.5px;}
        .badge-enrolled { background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        
        .tc-desc { font-size: 14px; color: #475569; margin: 0 0 20px 0; line-height: 1.5; }
        
        .tc-meta-grid { display: flex; gap: 32px; flex-wrap: wrap; }
        .tc-meta-item { display: flex; align-items: center; gap: 10px; }
        .tc-meta-item i { color: #64748b; font-size: 16px; }
        .meta-lbl { font-size: 11px; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px;}
        .meta-val { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: capitalize;}
        
        .tc-divider { width: 1px; height: 100px; background: #e2e8f0; }
        
        .tc-right { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; }
        .tc-progress-section { display: flex; gap: 24px; align-items: center; }
        .tc-prog-text-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .tc-prog-label { font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;}
        .tc-circular-chart { width: 80px; height: 80px; border-radius: 50%; position: relative; display: flex; justify-content: center; align-items: center; }
        .tc-circular-inner { position: absolute; inset: 8px; background: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: 800; color: #0f172a; }
        
        .tc-prog-details { display: flex; flex-direction: column; gap: 12px; }
        .pd-item { display: flex; flex-direction: column; gap: 2px; }
        .pd-lbl { font-size: 11px; color: #0f172a; font-weight: 800; }
        .pd-val { font-size: 12px; color: #475569; }
        
        /* Bottom Grid */
        .st-mc-bottom-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; margin-bottom: 40px; }
        
        /* Modules Section */
        .st-mc-modules-card { padding: 24px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .mod-header { border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 16px; }
        .mod-header h3 { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
        .mod-header p { font-size: 13px; color: #64748b; margin: 0; }
        
        .mod-list { display: flex; flex-direction: column; }
        .mod-item-wrapper { border-bottom: 1px solid #f1f5f9; }
        .mod-item-wrapper:last-child { border-bottom: none; }
        
        .mod-item { display: flex; align-items: center; gap: 16px; padding: 20px 0; cursor: pointer; transition: 0.2s;}
        .mod-item:hover { opacity: 0.8; }
        
        .mod-number { width: 40px; height: 40px; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 14px; font-weight: 800; flex-shrink: 0; }
        .mod-content { flex: 1; }
        .mod-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .mod-desc { font-size: 12px; color: #64748b; margin: 0; }
        
        .mod-actions { display: flex; align-items: center; gap: 16px; width: 260px; justify-content: flex-end; }
        .mod-progress-bar-bg { width: 80px; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
        .mod-progress-bar-fill { height: 100%; border-radius: 3px; transition: 0.3s ease; }
        .mod-prog-percent { font-size: 11px; font-weight: 600; color: #94a3b8; width: 26px;}
        .mod-topics-count { font-size: 12px; font-weight: 700; color: #0f172a; width: 80px; text-align: right;}
        .mod-dropdown-icon { color: #0f172a; font-size: 12px; padding-left: 8px; transition: transform 0.3s ease;}
        
        /* 🔥 Accordion Topics CSS 🔥 */
        .mod-topics-container { padding: 0 0 20px 56px; animation: slideDown 0.3s ease-out;}
        .topic-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; border: 1px solid transparent; }
        .topic-item:last-child { margin-bottom: 0; }
        
        .topic-item.pending { background: #f8fafc; border-color: #f1f5f9; }
        .topic-item.completed { background: #f1f5f9; opacity: 0.8; }
        
        .topic-icon { font-size: 14px; }
        .topic-icon.waiting { color: #cbd5e1; }
        .topic-icon.done { color: #16a34a; }
        
        .topic-text { font-size: 13px; font-weight: 600; color: #0f172a; flex: 1; }
        .topic-item.completed .topic-text { text-decoration: line-through; color: #64748b; }
        
        .topic-badge { font-size: 10px; background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
        .text-muted { color: #94a3b8; font-weight: 500; }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Sidebar Section */
        .st-mc-sidebar { display: flex; flex-direction: column; gap: 24px; }
        .side-card { padding: 20px 24px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; }
        .sc-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
        .sc-title i { color: #475569; font-size: 14px; }
        
        /* Trainer Info */
        .trainer-info { display: flex; align-items: center; gap: 16px; }
        .trainer-avatar, .trainer-avatar-placeholder img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
        .trainer-name { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 2px;}
        .trainer-role { font-size: 12px; color: #64748b; margin-bottom: 6px;}
        .trainer-email { font-size: 12px; color: #2563eb; display: flex; align-items: center; gap: 6px; font-weight: 500; overflow-wrap: anywhere;}
        
        /* Course Details */
        .cd-list { display: flex; flex-direction: column; }
        .cd-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b; }
        .cd-val { color: #0f172a; font-weight: 800; text-align: right; text-transform: capitalize; }
        .badge-enrolled-sm { background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .border-0 { border-bottom: none !important; }
        .pb-0 { padding-bottom: 0 !important; }

        /* Quick Links */
        .ql-list { display: flex; flex-direction: column; }
        .ql-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f1f5f9; text-decoration: none; transition: 0.2s; }
        .ql-item:hover .ql-left { color: #2563eb; }
        .ql-left { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: #0f172a; transition: 0.2s; }
        .ql-left i { color: #2563eb; font-size: 14px; width: 16px; text-align: center;}
        .ql-arrow { color: #94a3b8; font-size: 12px; }

        /* Footer */
        .st-mc-footer { text-align: center; font-size: 12px; color: #64748b; padding-bottom: 20px; font-weight: 500;}
      `}</style>
    </div>
  );
};

export default StudentMyCourse;