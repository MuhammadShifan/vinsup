import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../AdminDashboard.css'; 
import logoImage from '../../assets/logo.png'; 
import StudentMyCourse from './StudentMyCourse'; 
import StudentQuizzes from './StudentQuizzes'; 
import StudentAnnouncements from './StudentAnnouncements';
import StudentBatchChat from './StudentBatchChat'; 

const StudentDashboard = ({ userName, userEmail, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  // 🔥 Sidebar Red Badge Counts for All Three 🔥
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadQuizCount, setUnreadQuizCount] = useState(0);
  const [unreadAnnCount, setUnreadAnnCount] = useState(0);

  const [myBatch, setMyBatch] = useState("");
  
  const [incompleteQuizzes, setIncompleteQuizzes] = useState([]);
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [batchMembers, setBatchMembers] = useState([]);
  const [trainerInfo, setTrainerInfo] = useState({ name: 'Assigned Trainer', email: '', photo: '' });
  const [studentPhoto, setStudentPhoto] = useState("");

  const firstName = userName ? userName.split(' ')[0] : 'Student';

  const sidebarMenu = [
    { name: 'Dashboard', icon: 'fas fa-th-large' },
    { name: 'My Course', icon: 'fas fa-book-open' },
    { name: 'Quizzes', icon: 'fas fa-check-square' },
    { name: 'Announcements', icon: 'fas fa-bullhorn' },
    { name: 'Batch Chat', icon: 'fas fa-comments' } 
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getPhotoUrl = (rawPath, fallbackName) => {
    if (!rawPath || typeof rawPath !== 'string') return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'U')}&background=random&color=fff`;
    if (rawPath.startsWith('http') || rawPath.startsWith('data:image')) return rawPath;
    let cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
    return `https://vinsup-4vt5.onrender.com/${cleanPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activeEmail = (userEmail || "").toLowerCase().trim();
        const stuRes = await axios.get('https://vinsup-4vt5.onrender.com/api/students').catch(() => null);
        const allStudents = stuRes?.data?.data || stuRes?.data || [];
        const currentStudent = allStudents.find(s => (s.email || '').toLowerCase().trim() === activeEmail);
        
        if (currentStudent) {
            const rawPhoto = currentStudent.profilePhoto || currentStudent.photo || currentStudent.image || currentStudent.avatar || '';
            setStudentPhoto(getPhotoUrl(rawPhoto, firstName));
        }

        const batchRaw = currentStudent ? (currentStudent.batch || currentStudent.Batch || currentStudent.course || '') : '';
        const batchName = String(batchRaw).trim();
        setMyBatch(batchName);

        if (batchName) {
            const members = allStudents.filter(s => String(s.batch || s.Batch || s.course || '').trim().toLowerCase() === batchName.toLowerCase());
            setBatchMembers(members);

            const batchRes = await axios.get('https://vinsup-4vt5.onrender.com/api/batches').catch(() => null);
            const allBatches = Array.isArray(batchRes?.data) ? batchRes.data : (batchRes?.data?.data || []);
            const currentBatch = allBatches.find(b => String(b.batchName || b.courseName || '').trim().toLowerCase() === batchName.toLowerCase());
            
            if (currentBatch && (currentBatch.trainer || currentBatch.trainerName)) {
                const trainerQuery = String(currentBatch.trainer || currentBatch.trainerName).toLowerCase().trim();
                const empRes = await axios.get('https://vinsup-4vt5.onrender.com/api/employees').catch(() => null);
                const allEmp = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.data || []);
                const trainerObj = allEmp.find(e => (e.fullName || '').toLowerCase().trim() === trainerQuery || (e.email || '').toLowerCase().trim() === trainerQuery);
                
                if (trainerObj) {
                    setTrainerInfo({
                        name: trainerObj.fullName || trainerObj.name || trainerQuery,
                        email: trainerObj.email || '',
                        photo: getPhotoUrl(trainerObj.profilePhoto || trainerObj.photo || trainerObj.image, trainerObj.fullName || 'Trainer')
                    });
                } else {
                    setTrainerInfo({ name: currentBatch.trainer || currentBatch.trainerName, email: '', photo: getPhotoUrl('', 'Trainer') });
                }
            }
        }

        const quizRes = await axios.get('https://vinsup-4vt5.onrender.com/api/quizzes/all').catch(() => null);
        const allQuizzes = Array.isArray(quizRes?.data) ? quizRes.data : (quizRes?.data?.data || quizRes?.data?.quizzes || []);
        
        const resultsRes = await axios.get(`https://vinsup-4vt5.onrender.com/api/quizzes/results/${activeEmail}`).catch(() => null);
        const myResults = Array.isArray(resultsRes?.data) ? resultsRes.data : [];
        const completedQuizIds = myResults.map(r => String(r.quizId));

        const incomplete = allQuizzes.filter(q => !completedQuizIds.includes(String(q._id || q.id)));
        setIncompleteQuizzes(incomplete);

        // 🔥 QUIZ UNREAD COUNT FOR SIDEBAR 🔥
        const quizCacheKey = `read_quizzes_v3_${activeEmail}`;
        const readQuizzes = JSON.parse(localStorage.getItem(quizCacheKey) || '[]');
        if (activeTab === 'Quizzes') {
          const allQIds = allQuizzes.map(q => String(q._id || q.id));
          localStorage.setItem(quizCacheKey, JSON.stringify(allQIds));
          setUnreadQuizCount(0);
        } else {
          const unreadQ = allQuizzes.filter(q => !readQuizzes.includes(String(q._id || q.id))).length;
          setUnreadQuizCount(unreadQ);
        }

        const annRes = await axios.get('https://vinsup-4vt5.onrender.com/api/announcements').catch(() => null);
        let allAnn = [];
        if (Array.isArray(annRes?.data)) allAnn = annRes.data;
        else if (Array.isArray(annRes?.data?.data)) allAnn = annRes.data.data;
        else if (Array.isArray(annRes?.data?.announcements)) allAnn = annRes.data.announcements;
        setAnnouncementsCount(allAnn.length);

        // 🔥 ANNOUNCEMENTS UNREAD COUNT FOR SIDEBAR 🔥
        const annCacheKey = `read_anns_v3_${activeEmail}`;
        const readAnns = JSON.parse(localStorage.getItem(annCacheKey) || '[]');
        if (activeTab === 'Announcements') {
          const allAIds = allAnn.map(a => String(a._id || a.id));
          localStorage.setItem(annCacheKey, JSON.stringify(allAIds));
          setUnreadAnnCount(0);
        } else {
          const unreadA = allAnn.filter(a => !readAnns.includes(String(a._id || a.id))).length;
          setUnreadAnnCount(unreadA);
        }

      } catch (err) { console.log("Error loading dashboard data:", err); }
    };
    fetchData();
  }, [userEmail, firstName, activeTab]);

  useEffect(() => {
    let interval;
    const fetchAllCounts = async () => {
      if (!myBatch) return;
      const activeEmail = (userEmail || "").toLowerCase().trim(); 

      try {
        const chatRes = await axios.get(`https://vinsup-4vt5.onrender.com/api/batchchat/${encodeURIComponent(myBatch)}`).catch(()=>null);
        if (chatRes && chatRes.data) {
          const msgs = chatRes.data;
          const cacheKey = `chat_last_read_v3_${myBatch}_${activeEmail}`;
          if (activeTab === 'Batch Chat') {
            localStorage.setItem(cacheKey, Date.now());
            setUnreadChatCount(0);
          } else {
            const lastRead = localStorage.getItem(cacheKey) || 0;
            const unreadChats = msgs.filter(m => new Date(m.timestamp).getTime() > parseInt(lastRead) && (m.senderEmail || "").toLowerCase() !== activeEmail).length;
            setUnreadChatCount(unreadChats);
          }
        }
      } catch (err) { console.log(err); }
    };

    if (myBatch) {
      fetchAllCounts();
      interval = setInterval(fetchAllCounts, 3000); 
    }
    return () => clearInterval(interval);
  }, [myBatch, activeTab, userEmail]);

  const renderBadge = (count) => {
    if (count <= 0) return null;
    return (
      <span style={{
        background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold',
        minWidth: '22px', height: '22px', borderRadius: '12px', display: 'flex',
        justifyContent: 'center', alignItems: 'center', marginLeft: 'auto', padding: '0 6px',
        boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
      }}>
          {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div className="admin-layout">
      
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo"><img src={logoImage} alt="Vinsup Logo" /></div>
        <ul className="sidebar-menu">
          {sidebarMenu.map((item, index) => (
            <li key={index} className={item.name === activeTab ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(item.name); }} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <i className={item.icon} style={{ width: '25px' }}></i>
                  <span>{item.name}</span>
                  {item.name === 'Batch Chat' && renderBadge(unreadChatCount)}
                  {item.name === 'Quizzes' && renderBadge(unreadQuizCount)}
                  {item.name === 'Announcements' && renderBadge(unreadAnnCount)}
              </a>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <a href="#" className="logout-btn" onClick={(e) => { e.preventDefault(); onLogout(); }}>
              <i className="fas fa-sign-out-alt"></i> Logout
          </a>
        </div>
      </aside>

      <main className={`main-content ${isSidebarOpen ? 'shrink' : 'expand'}`}>
        
        <header className="top-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <i className="fas fa-bars menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}></i>
            <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>
                {getGreeting()}, <strong style={{ color: '#111827' }}>{firstName}</strong> 👋
            </span>
          </div>

          <div className="header-right">
            <div className="date-display">
              <i className="far fa-calendar-alt"></i> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            
            <div className="user-profile">
              <div className="avatar">
                <img 
                  src={studentPhoto || `https://ui-avatars.com/api/?name=${firstName}&background=f1f5f9&color=2563eb`} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${firstName}&background=f1f5f9&color=2563eb`; }}
                />
              </div>
              <div className="user-info" style={{ textAlign: 'left' }}>
                <strong>{firstName}</strong>
                <span>Student <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '3px' }}></i></span>
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, position: 'relative' }}>
          
          {activeTab === 'Dashboard' && (
             <div className="dashboard-container" style={{ padding: '30px 40px', background: '#f8fafc', minHeight: 'calc(100vh - 80px)', boxSizing: 'border-box' }}>
               
               <div className="page-header" style={{ marginBottom: '25px' }}>
                 <h1 style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '24px', margin: '0 0 5px 0' }}>Welcome back, {firstName}! 🚀</h1>
                 <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Here is your academic overview and batch activities for today.</p>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
                 
                 <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                   <div style={{ background: '#eff6ff', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: '22px' }}><i className="fas fa-book-reader"></i></div>
                   <div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Active Batch</p><h3 style={{ margin: '0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{myBatch || 'General'}</h3></div>
                 </div>

                 <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                   <div style={{ background: '#fff7ed', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '22px' }}><i className="fas fa-check-square"></i></div>
                   <div style={{ width: '100%' }}>
                     <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Incomplete Quizzes</p>
                     <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{incompleteQuizzes.length} Pending</h3>
                     <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600', cursor: 'pointer' }} onClick={() => setActiveTab('Quizzes')}>Take Quiz &rarr;</span>
                   </div>
                 </div>

                 <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                   <div style={{ background: '#f0fdf4', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: '22px' }}><i className="fas fa-bullhorn"></i></div>
                   <div style={{ width: '100%' }}>
                     <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Announcements</p>
                     <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{announcementsCount} Total</h3>
                     <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', cursor: 'pointer' }} onClick={() => setActiveTab('Announcements')}>View All &rarr;</span>
                   </div>
                 </div>

                 <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                   <div style={{ background: '#faf5ff', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', fontSize: '22px' }}><i className="fas fa-users"></i></div>
                   <div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Batchmates</p><h3 style={{ margin: '0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{batchMembers.length} Students</h3></div>
                 </div>

               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '20px', alignItems: 'start' }}>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   
                   <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                       <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Incomplete Quizzes</h3>
                       <span onClick={() => setActiveTab('Quizzes')} style={{ color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>View All</span>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                       {incompleteQuizzes.length > 0 ? incompleteQuizzes.slice(0, 3).map((q, i) => (
                         <div key={i} style={{ padding: '12px 15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                             <h4 style={{ margin: '0 0 3px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{q.title || q.quizTitle}</h4>
                             <span style={{ fontSize: '11px', color: '#64748b' }}>Marks: {q.totalMarks || '-'}</span>
                           </div>
                           <button onClick={() => setActiveTab('Quizzes')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Start</button>
                         </div>
                       )) : (
                         <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>All quizzes completed! 🎉</div>
                       )}
                     </div>
                   </div>

                 </div>

                 <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                   <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Batchmates ({batchMembers.length})</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }} className="custom-scroll">
                     {batchMembers.length > 0 ? batchMembers.map((member, i) => (
                       <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                         <img 
                           src={getPhotoUrl(member.profilePhoto || member.photo || member.image, member.fullName || member.name)} 
                           alt="member" 
                           style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} 
                         />
                         <div>
                           <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{member.fullName || member.name || 'Student'}</h4>
                           <span style={{ fontSize: '11px', color: '#64748b' }}>{member.email}</span>
                         </div>
                       </div>
                     )) : (
                       <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>No batchmates found.</div>
                     )}
                   </div>
                 </div>

                 <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', textAlign: 'center' }}>
                   <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold', textAlign: 'left' }}>Assigned Trainer</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
                     <img 
                       src={trainerInfo.photo} 
                       alt="Trainer" 
                       style={{ width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: '3px solid #eff6ff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} 
                     />
                     <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{trainerInfo.name}</h4>
                     <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b' }}>{trainerInfo.email || 'Trainer & Mentor'}</p>
                     <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Trainerr</span>
                   </div>
                 </div>

               </div>

             </div>
          )}

          {activeTab === 'My Course' && <StudentMyCourse userName={userName} userEmail={userEmail} />}
          {activeTab === 'Quizzes' && <StudentQuizzes userEmail={userEmail} />}
          {activeTab === 'Announcements' && <StudentAnnouncements userEmail={userEmail} />}
          {activeTab === 'Batch Chat' && <StudentBatchChat userName={userName} userEmail={userEmail} />}

        </div>
      </main>
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default StudentDashboard;