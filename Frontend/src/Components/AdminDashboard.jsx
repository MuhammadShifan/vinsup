import { useState, useEffect } from 'react';
import './AdminDashboard.css';
import logoImage from '../assets/logo.png'; 
import Employees from './Employees'; 
import Courses from './Courses'; 
import Batches from './Batches'; 
import Syllabus from './Syllabus';
import Attendance from './Attendance';
import Reports from './Reports';
import TicketNotification from './TicketNotification';
import AdminTasks from './AdminTasks';
import AdminLeaveRequests from './AdminLeaveRequests'; 
import AdminUserChat from './AdminUserChat'; 
import AdminIDCards from './AdminIDCards';
import Students from './Students';
import Settings from './Settings'; 

const AdminDashboard = ({ userName, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const [employeesList, setEmployeesList] = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0); 
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0); 

  // 🔥 ADMIN PROFILE STATE FOR GLOBAL HEADER SYNC 🔥
  const [adminProfile, setAdminProfile] = useState({
    name: userName || 'Admin',
    profilePhoto: ''
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Fetch Admin Profile Data for Global Header Sync
  const fetchAdminHeaderProfile = async () => {
    try {
      const res = await fetch('https://vinsup-4vt5.onrender.com/api/admin/profile');
      const data = await res.json();
      if (data.success && data.admin) {
        setAdminProfile({
          name: data.admin.name,
          profilePhoto: data.admin.profilePhoto
        });
      }
    } catch (err) {
      console.error("Error fetching admin header profile:", err);
    }
  };

  const fetchChatUnreadCount = async () => {
    try {
      const response = await fetch('https://vinsup-4vt5.onrender.com/api/privatechat/unread/admin');
      const data = await response.json();
      if (data.success) {
        setChatUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Error fetching admin unread count:", err);
    }
  };

  useEffect(() => {
    fetchAdminHeaderProfile();

    const updateLeaveBadge = () => {
      const storedLeaves = localStorage.getItem('pendingLeaveCount');
      if (storedLeaves) {
        setPendingLeaveCount(parseInt(storedLeaves));
      }
    };

    updateLeaveBadge();
    window.addEventListener('storage', updateLeaveBadge);

    const interval = setInterval(() => {
      updateLeaveBadge();
      fetchChatUnreadCount();
      fetchAdminHeaderProfile(); // Sync profile updates in real-time
    }, 3000);

    return () => {
      window.removeEventListener('storage', updateLeaveBadge);
      clearInterval(interval);
    };
  }, []);

  const sidebarMenu = [
    { name: 'Dashboard', icon: 'fas fa-th-large' },
    { name: 'Employees', icon: 'fas fa-users' },
    { name: 'Students', icon: 'fas fa-user-graduate' },
    { name: 'Courses', icon: 'fas fa-book' },
    { name: 'Batches', icon: 'fas fa-layer-group' },
    { name: 'Syllabus', icon: 'fas fa-clipboard-list' },
    { name: 'Attendance', icon: 'fas fa-calendar-check' },
    { name: 'Leave Requests', icon: 'fas fa-envelope-open-text' }, 
    { name: 'Tasks', icon: 'fas fa-tasks' },
    { name: 'Reports', icon: 'fas fa-chart-line' },
    { name: 'User Chats', icon: 'far fa-comment-dots' }, 
    { name: 'ID Cards', icon: 'fas fa-id-card' },
    { name: 'Settings', icon: 'fas fa-cog' }
  ];

  const [statsCards, setStatsCards] = useState([
    { title: 'Total Employees', count: 0, trend: '', icon: 'fas fa-user-tie', color: '#eef2fa', iconColor: '#3b82f6' },
    { title: 'Total Students', count: 0, trend: '', icon: 'fas fa-user-graduate', color: '#f0fdfa', iconColor: '#14b8a6' },
    { title: 'Total Courses', count: 0, trend: '', icon: 'fas fa-book-open', color: '#edfdf2', iconColor: '#22c55e' },
    { title: 'Total Batches', count: 0, trend: '', icon: 'fas fa-layer-group', color: '#fff9eb', iconColor: '#f59e0b' },
    { title: 'Employees Checked In', count: 0, trend: '', icon: 'fas fa-user-check', color: '#f5f3ff', iconColor: '#8b5cf6' }
  ]);

  const [batchProgress, setBatchProgress] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('https://vinsup-4vt5.onrender.com/api/dashboard/summary');
        const data = await response.json();
        
        const empResponse = await fetch('https://vinsup-4vt5.onrender.com/api/employees');
        const empData = await empResponse.json();
        const employees = Array.isArray(empData) ? empData : (empData.data || []);
        setEmployeesList(employees);

        setStatsCards([
          { title: 'Total Employees', count: data.stats.totalEmployees || 0, trend: '', icon: 'fas fa-user-tie', color: '#eef2fa', iconColor: '#3b82f6' },
          { title: 'Total Students', count: data.stats.totalStudents || 0, trend: '', icon: 'fas fa-user-graduate', color: '#f0fdfa', iconColor: '#14b8a6' },
          { title: 'Total Courses', count: data.stats.totalCourses || 0, trend: '', icon: 'fas fa-book-open', color: '#edfdf2', iconColor: '#22c55e' },
          { title: 'Total Batches', count: data.stats.totalBatches || 0, trend: '', icon: 'fas fa-layer-group', color: '#fff9eb', iconColor: '#f59e0b' },
          { title: 'Employees Checked In', count: data.stats.checkedInToday || 0, trend: '', icon: 'fas fa-user-check', color: '#f5f3ff', iconColor: '#8b5cf6' }
        ]);

        const formattedProgress = (data.batchProgress || [])
          .map(batch => ({
            name: batch.batchName,
            progress: batch.progress || 0,
            color: '#3b82f6'
          }))
          .sort((a, b) => b.progress - a.progress); 

        setBatchProgress(formattedProgress);

        const formattedActivity = (data.recentActivity || []).map(act => {
          const dateObj = new Date(act.date);
          return {
            text: act.message,
            time: `${dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}, ${dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`,
            icon: 'fas fa-circle',
            color: 'green'
          };
        });
        setRecentActivity(formattedActivity);

        const formattedDeadlines = (data.upcomingDeadlines || []).map(dl => ({
          text: `Batch '${dl.batchName}' Ending`,
          date: dl.endDate || 'TBD'
        }));
        setUpcomingDeadlines(formattedDeadlines);

      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      }
    };

    if(activeTab === 'Dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  return (
    <div className="admin-layout">
        
      <style>
        {`
          .chat-badge { background: #ef4444; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 10px; margin-left: auto; font-weight: bold; }
        `}
      </style>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <img src={logoImage} alt="Vinsup Logo" />
        </div>
        <ul className="sidebar-menu">
          {sidebarMenu.map((item, index) => (
            <li key={index} className={item.name === activeTab ? 'active' : ''}>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveTab(item.name); 
                }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <i className={item.icon}></i>
                <span>{item.name}</span>
                
                {item.name === 'User Chats' && chatUnreadCount > 0 && (
                    <span className="chat-badge">{chatUnreadCount}</span>
                )}

                {item.name === 'Leave Requests' && pendingLeaveCount > 0 && (
                    <span className="chat-badge">{pendingLeaveCount}</span>
                )}
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
          <div className="header-left">
            <i 
              className="fas fa-bars menu-toggle" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            ></i>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="date-display">
              <i className="far fa-calendar-alt"></i> {currentDate}
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TicketNotification />
            </div>

            {/* 🔥 TOP RIGHT HEADER: DYNAMIC ADMIN NAME & PHOTO 🔥 */}
            <div className="user-profile">
              <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {adminProfile.profilePhoto ? (
                  <img src={adminProfile.profilePhoto} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </div>
              <div className="user-info">
                <strong>{adminProfile.name}</strong>
                <span>Manager <i className="fas fa-chevron-down"></i></span>
              </div>
            </div>
          </div>
        </header>
        
        {activeTab === 'Dashboard' && (
          <div className="dashboard-container">
            <div className="page-header">
              <h1>Manager Dashboard</h1>
              <p>Welcome back! Here's the latest update.</p>
            </div>

            <div className="stats-grid">
              {statsCards.map((card, index) => (
                <div className="stat-card" key={index}>
                  <div className="icon-box" style={{ backgroundColor: card.color, color: card.iconColor }}>
                    <i className={card.icon}></i>
                  </div>
                  <div className="stat-details">
                    <p className="stat-title">{card.title}</p>
                    <h3 className="stat-count">{card.count}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="middle-grid">
              <div className="dashboard-card progress-card">
                <div className="card-header">
                  <h3>Batch Progress Overview</h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Showing all active batches</span>
                </div>
                
                <div className="progress-scroll-container">
                  <div className="progress-list">
                    {batchProgress.length > 0 ? (
                      batchProgress.map((batch, index) => (
                        <div className="progress-item" key={index}>
                          <div className="progress-info">
                            <span className="dot" style={{ backgroundColor: batch.color }}></span>
                            <span className="batch-name">{batch.name}</span>
                            <span className="progress-percentage">{batch.progress}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${batch.progress}%`, backgroundColor: batch.color }}></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-state">No active batches right now.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bottom-grid">
              
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Recent Activity</h3>
                </div>
                <div className="list-scroll-container">
                  <ul className="activity-list">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <li key={index}>
                          <div className={`icon ${activity.color}`}><i className={activity.icon}></i></div>
                          <div className="text">{activity.text}</div>
                          <div className="time">{activity.time}</div>
                        </li>
                      ))
                    ) : (
                      <p className="empty-state">No recent activities.</p>
                    )}
                  </ul>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Upcoming Deadlines</h3>
                </div>
                <div className="list-scroll-container">
                  <ul className="deadline-list">
                    {upcomingDeadlines.length > 0 ? (
                      upcomingDeadlines.map((deadline, index) => (
                        <li key={index}>
                          <div className="icon red"><i className="far fa-calendar-alt"></i></div>
                          <div className="text">{deadline.text}</div>
                          <div className="date">{deadline.date}</div>
                        </li>
                      ))
                    ) : (
                      <p className="empty-state">No upcoming deadlines.</p>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <footer className="footer-text">
              © 2026 Vinsup Skill Academy. All rights reserved.
            </footer>
          </div>
        )}

        {activeTab === 'Employees' && <Employees />}
        {activeTab === 'Students' && <Students />}
        {activeTab === 'ID Cards' && <AdminIDCards />}
        {activeTab === 'Courses' && <Courses />}
        {activeTab === 'Batches' && <Batches />}
        {activeTab === 'Syllabus' && <Syllabus/>}
        {activeTab === 'Attendance' && <Attendance/>}
        {activeTab === 'Leave Requests' && <AdminLeaveRequests/>} 
        {activeTab === 'Reports' && <Reports/>}
        {activeTab === 'Tasks' && <AdminTasks />}
        {activeTab === 'User Chats' && <AdminUserChat onRead={() => setChatUnreadCount(0)} />}
        {activeTab === 'Settings' && <Settings />}

      </main>
    </div>
  );
};

export default AdminDashboard;