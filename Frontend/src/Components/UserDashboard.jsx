import React, { useState, useEffect, useRef } from 'react';
import API, { getImageUrl, getBaseUrl } from '../utils/api';
import './AdminDashboard.css';
import logoImage from '../assets/logo.png';
import MyProfile from './MyProfile';
import UserAttendance from './UserAttendance';
import UserLeaveRequest from './UserLeaveRequest';
import UserSchedule from './UserSchedule';
import UserTasks from './UserTasks';
import UserHelpdesk from './UserHelpdesk';
import UserReports from './UserReports';
import UserCourses from './UserCourses';
import EmployeeAnnouncements from './EmployeeAnnouncements';
import EmployeeMyClasses from './EmployeeMyClasses';
import EmployeeQuizzes from './EmployeeQuizzes';
import UserAdminChat from './UserAdminChat';
import EmployeeBatchChat from './EmployeeBatchChat';
import CompanyGroupChat from './CompanyGroupChat';
import socket from '../utils/socket';

const UserDashboard = ({ userName, userEmail, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 992);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const auth = JSON.parse(localStorage.getItem('userAuth') || '{}');
  const storedEmail = localStorage.getItem('loggedInEmail');
  const activeEmail = (userEmail || auth.email || storedEmail || "").toLowerCase().trim();

  const [notifications, setNotifications] = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [studentChatsUnreadCount, setStudentChatsUnreadCount] = useState(0);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'Admin Chat') {
      API.put('/privatechat/mark-read', {
        receiverEmail: currentUserEmail,
        senderEmail: 'admin@vinsup.com'
      }).catch(() => {});
      setChatUnreadCount(0);
    }
    if (tabName === 'Student Chats') {
      setStudentChatsUnreadCount(0);
    }
    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const [trainerData, setTrainerData] = useState({
    profile: { name: "Loading...", role: "Employee", profilePic: "" },
    profileDetails: {
      fullName: "Loading...",
      role: "Employee",
      empId: "N/A", joinedOn: "N/A", email: userEmail || "N/A", phone: "N/A",
      dob: "N/A", location: "N/A", gender: "N/A",
      address: { current: "N/A", permanent: "N/A" },
      summary: { experience: "0 Years", batches: 0, students: 0 },
      account: { username: "Loading...", lastLogin: "Today" }
    },
    attendanceToday: { status: "Pending", checkInTime: "--:--", checkOutTime: "--:--", date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), day: new Date().toLocaleDateString('en-GB', { weekday: 'short' }), isCheckedIn: false },
    myBatchesData: [],
    tasksData: [],
    scheduleToday: [],
    leaveBalance: {
      totalAvailable: 8,
      totalDays: 8,
      breakdown: [
        { type: "Casual Leave", used: 0, total: 2, color: "#10b981" },
        { type: "Sick Leave", used: 0, total: 2, color: "#3b82f6" },
        { type: "Privilege Leave", used: 0, total: 1, color: "#a855f7" },
        { type: "Comp Off", used: 0, total: 3, color: "#f59e0b" }
      ]
    },
    birthdays: []
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem('userAuth') || '{}');
        const incomingEmail = (activeEmail || auth.email || localStorage.getItem('loggedInEmail') || "").toLowerCase().trim();
        let exactDBName = userName || auth.name || (incomingEmail ? incomingEmail.split('@')[0] : "Trainer");

        let empData = [];
        try {
          const empResponse = await API.get('/employees');
          empData = Array.isArray(empResponse.data) ? empResponse.data : (empResponse.data.data || []);
        } catch (e) {
          console.warn("Employees fetch warning:", e.message);
        }

        const currentUser = empData.find(emp =>
          (incomingEmail && (emp.email || '').toLowerCase().trim() === incomingEmail) ||
          (exactDBName && (emp.fullName || emp.name || '').toLowerCase().trim() === exactDBName.toLowerCase().trim()) ||
          (exactDBName && (emp.username || '').toLowerCase().trim() === exactDBName.toLowerCase().trim()) ||
          (incomingEmail && (emp.username || '').toLowerCase().trim() === incomingEmail.split('@')[0])
        );

        if (currentUser) {
          exactDBName = currentUser.fullName || currentUser.name || exactDBName;
          const rawImage = currentUser.profilePhoto || currentUser.profilePic || currentUser.image || currentUser.avatar || currentUser.photo || currentUser.pic || currentUser.profileImage || currentUser.empImage || currentUser.file;

          let finalImage = "";
          if (rawImage && !rawImage.includes('randomuser.me')) {
            finalImage = getImageUrl(rawImage);
          }

          setTrainerData(prev => ({
            ...prev,
            profile: { ...prev.profile, name: exactDBName, role: currentUser.designation || currentUser.role || "Trainer", profilePic: finalImage },
            profileDetails: {
              ...prev.profileDetails,
              fullName: exactDBName,
              email: currentUser.email || incomingEmail || prev.profileDetails.email,
              phone: currentUser.phone || prev.profileDetails.phone,
              role: currentUser.designation || currentUser.role || "Trainer",
              empId: currentUser.empId || currentUser.employeeId || currentUser.id || "N/A",
              dob: currentUser.dob || currentUser.dateOfBirth || "N/A",
              gender: currentUser.gender || "N/A",
              joinedOn: currentUser.doj || currentUser.joinedOn || currentUser.joinDate || "N/A",
              location: currentUser.location || currentUser.city || currentUser.address || "N/A",
              address: { current: currentUser.address || "N/A", permanent: currentUser.address || "N/A" },
              account: { username: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : "Trainer"), lastLogin: "Today" },
              summary: { ...prev.profileDetails.summary, experience: currentUser.experience ? `${currentUser.experience} Years` : "0 Years" }
            },
            attendanceToday: {
                ...prev.attendanceToday,
                status: (currentUser.todayStatus && currentUser.todayStatus !== 'Not Marked') ? currentUser.todayStatus : "Pending",
                checkInTime: (currentUser.todayCheckIn && currentUser.todayCheckIn !== "-") ? currentUser.todayCheckIn : "--:--",
                checkOutTime: (currentUser.todayCheckOut && currentUser.todayCheckOut !== "-") ? currentUser.todayCheckOut : "--:--"
            }
          }));
        }

        let myTasks = [];
        try {
          const taskResponse = await API.get('/tasks');
          const tasks = Array.isArray(taskResponse.data) ? taskResponse.data : (taskResponse.data.data || []);
          myTasks = tasks.filter(t => {
            const assigned = (t.assignedTo || '').toLowerCase().trim();
            return assigned === exactDBName.toLowerCase().trim() ||
                   assigned === (currentUser?.fullName || '').toLowerCase().trim() ||
                   assigned === (currentUser?.name || '').toLowerCase().trim() ||
                   assigned === (currentUser?.username || '').toLowerCase().trim() ||
                   assigned === incomingEmail ||
                   (incomingEmail && assigned === incomingEmail.split('@')[0]);
          });
        } catch (e) {
          console.warn("Tasks fetch warning:", e.message);
        }
        const activeTasks = myTasks.filter(t => t.status !== 'Completed');
        setTrainerData(prev => ({ ...prev, tasksData: activeTasks }));

        let myBatches = [];
        try {
          const batchResponse = await API.get('/batches');
          const allBatches = Array.isArray(batchResponse.data) ? batchResponse.data : (batchResponse.data.data || []);
          myBatches = allBatches.filter(b => {
            const trainer = (b.trainerName || b.trainer || b.assignedTo || b.faculty || '').toLowerCase().trim();
            return trainer === exactDBName.toLowerCase().trim() ||
                   trainer === (currentUser?.fullName || '').toLowerCase().trim() ||
                   trainer === (currentUser?.name || '').toLowerCase().trim() ||
                   trainer === (currentUser?.username || '').toLowerCase().trim() ||
                   trainer === incomingEmail ||
                   (incomingEmail && trainer === incomingEmail.split('@')[0]);
          });
        } catch (e) {
          console.warn("Batches fetch warning:", e.message);
        }

        const allocatedBatches = myBatches.map((b, idx) => {
          let tTime = "09:00 AM"; let eTime = "10:30 AM";
          let bDays = "Mon, Wed, Fri";
          if (b.schedule && b.schedule.length > 0) {
            tTime = b.schedule[0].startTime || tTime;
            eTime = b.schedule[0].endTime || eTime;
            if(Array.isArray(b.schedule[0].days)) bDays = b.schedule[0].days.join(', ');
            else if(b.schedule[0].days) bDays = b.schedule[0].days;
          }
          let studentsCount = Array.isArray(b.students) ? b.students.length : (Array.isArray(b.enrolledStudents) ? b.enrolledStudents.length : Number(b.studentsCount || 0));

          return {
            id: b._id || idx,
            course: b.courseName || b.course || "Training Class",
            batchName: String(b.batchName || b.batchId || `Batch-${idx+1}`).trim(),
            students: studentsCount,
            days: bDays,
            time: `${tTime} - ${eTime}`,
            room: b.room || "Lab 1",
            status: b.status || "Ongoing",
            color: idx % 2 === 0 ? "#3b82f6" : "#a855f7",
            bgColor: idx % 2 === 0 ? "#eff6ff" : "#f3e8ff",
            initial: `B${idx+1}`
          };
        });

        const activeAllocatedBatches = allocatedBatches.filter(batch => batch.status !== 'Completed' && batch.status !== 'completed');

        let usedCasual = 0, usedSick = 0, usedPrivilege = 0, usedCompOff = 0;
        try {
          const leavesResponse = await API.get('/leaves');
          const allLeaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : (leavesResponse.data.data || []);
          const myLeaves = allLeaves.filter(l =>
            (l.empEmail || '').toLowerCase().trim() === incomingEmail ||
            (l.empName || '').toLowerCase().trim() === exactDBName.toLowerCase().trim() ||
            (l.empName || '').toLowerCase().trim() === (currentUser?.fullName || '').toLowerCase().trim()
          );

          myLeaves.forEach(l => {
            if (l.status === 'Approved') {
              const lType = (l.leaveType || '').toLowerCase();
              if (lType.includes('sick')) usedSick += Number(l.totalDays || 0);
              else if (lType.includes('privilege')) usedPrivilege += Number(l.totalDays || 0);
              else if (lType.includes('comp')) usedCompOff += Number(l.totalDays || 0);
              else usedCasual += Number(l.totalDays || 0);
            }
          });
        } catch (e) {
          console.warn("Leaves fetch warning:", e.message);
        }

        const today = new Date(); today.setHours(0, 0, 0, 0);

        let myScheduleToday = [];
        try {
          let allEvents = [];
          try {
            const schedRes = await API.get(`/schedule/${incomingEmail}`);
            allEvents = Array.isArray(schedRes.data) ? schedRes.data : (schedRes.data.data || []);
          } catch(err1) {
            const schedRes = await API.get(`/schedule`).catch(() => ({ data: [] }));
            const allSched = Array.isArray(schedRes.data) ? schedRes.data : (schedRes.data.data || []);
            allEvents = allSched.filter(ev =>
              (ev.email && ev.email.toLowerCase() === incomingEmail) ||
              (ev.empEmail && ev.empEmail.toLowerCase() === incomingEmail) ||
              (ev.assignedTo && ev.assignedTo.toLowerCase() === exactDBName.toLowerCase())
            );
          }

          const y = today.getFullYear();
          const m = String(today.getMonth() + 1).padStart(2, '0');
          const d = String(today.getDate()).padStart(2, '0');

          const formatYMD = `${y}-${m}-${d}`;
          const formatDMY = `${d}-${m}-${y}`;

          myScheduleToday = allEvents.filter(ev => {
            const evDate = ev.startDate || ev.date || ev.scheduleDate || "";
            return evDate.includes(formatYMD) || evDate.includes(formatDMY);
          });

          const localEventsRaw = localStorage.getItem('myScheduleEvents');
          if (localEventsRaw) {
             const parsedLocalEvents = JSON.parse(localEventsRaw);
             const todayLocalEvents = parsedLocalEvents.filter(ev => ev.date === formatDMY).map(ev => ({
                 title: ev.title,
                 type: ev.type,
                 startTime: ev.time
             }));
             myScheduleToday = [...myScheduleToday, ...todayLocalEvents];
          }

        } catch (err) {
          console.error("Error fetching schedule:", err);
        }

        const totalAvail = Math.max(0, 2 - usedCasual) + Math.max(0, 2 - usedSick) + Math.max(0, 1 - usedPrivilege) + Math.max(0, 3 - usedCompOff);

        setTrainerData(prev => ({
          ...prev,
          myBatchesData: activeAllocatedBatches,
          scheduleToday: myScheduleToday,
          profileDetails: {
            ...prev.profileDetails,
            summary: {
              ...prev.profileDetails.summary,
              batches: activeAllocatedBatches.length,
              students: activeAllocatedBatches.reduce((sum, batch) => sum + batch.students, 0)
            }
          },
          leaveBalance: {
            totalAvailable: totalAvail,
            totalDays: 8,
            breakdown: [
              { type: "Casual Leave", used: usedCasual, total: 2, color: "#10b981" },
              { type: "Sick Leave", used: usedSick, total: 2, color: "#3b82f6" },
              { type: "Privilege Leave", used: usedPrivilege, total: 1, color: "#a855f7" },
              { type: "Comp Off", used: usedCompOff, total: 3, color: "#f59e0b" }
            ]
          }
        }));
      } catch (error) { console.error("Error fetching user data:", error); }
    };

    fetchUserData();
  }, [userName, userEmail, activeEmail, activeTab]);

  const fetchNotifications = async () => {
    if (!activeEmail) return;
    try {
      const res = await API.get(`/notifications/user/${activeEmail}`);
      const notifData = Array.isArray(res.data) ? res.data : (res.data.notifications || res.data.data || []);
      setNotifications(notifData);
    } catch (err) {
      try {
        const resAlt = await API.get(`/notifications?email=${activeEmail}`);
        const notifDataAlt = Array.isArray(resAlt.data) ? resAlt.data : (resAlt.data.notifications || resAlt.data.data || []);
        setNotifications(notifDataAlt);
      } catch (err2) {
        console.error("Error fetching notifications:", err2);
        setNotifications([]);
      }
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await API.put(`/notifications/mark-read/${id}`);
      fetchNotifications();
    } catch(err) {
      console.error("Error marking read:", err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch(err) {
      console.error("Error deleting notification:", err);
    }
  };

  useEffect(() => {
    if (activeEmail) {
      fetchNotifications();

      const interval = setInterval(() => {
        fetchNotifications();
      }, 15000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [activeEmail]);

  const displayName = (trainerData.profile.name && trainerData.profile.name !== "Loading...")
    ? trainerData.profile.name
    : (userName || auth.name || (activeEmail ? activeEmail.split('@')[0] : "Trainer"));
  const firstName = displayName.split(' ')[0] || "Trainer";
  const currentUserEmail = (trainerData.profileDetails.email && trainerData.profileDetails.email !== "Loading..." && trainerData.profileDetails.email !== "N/A")
    ? trainerData.profileDetails.email
    : (activeEmail || "trainer@vinsup.com");

  const fetchChatUnreadCount = async () => {
    try {
      const emailToUse = (currentUserEmail || activeEmail).toLowerCase().trim();
      if (!emailToUse) return;
      const res = await API.get(`/privatechat/unread/${emailToUse}`);
      if (res.data && res.data.success) {
        setChatUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {}
  };

  const checkStudentChatsUnread = async () => {
    try {
      const bRes = await API.get('/batches').catch(() => null);
      const allB = Array.isArray(bRes?.data) ? bRes.data : (bRes?.data?.data || []);
      const trainerBatches = allB.filter(b => {
        const trainerStr = (b.trainer || b.trainerName || b.assignedTo || b.faculty || '').toLowerCase().trim();
        return trainerStr === (displayName || "").toLowerCase().trim() || trainerStr === (currentUserEmail || "").toLowerCase().trim() || trainerStr === 'admin';
      });
      const batchNames = [...new Set(trainerBatches.map(b => String(b.batchName || b.courseName || '').trim()).filter(Boolean))];

      let totalUnread = 0;
      await Promise.all(batchNames.map(async (batch) => {
        const res = await API.get(`/batchchat/${encodeURIComponent(batch)}`).catch(() => null);
        if (res && res.data && Array.isArray(res.data)) {
          const lastRead = localStorage.getItem(`chat_last_read_${batch}`) || 0;
          const unread = res.data.filter(m => new Date(m.timestamp).getTime() > parseInt(lastRead) && (m.senderEmail || '').toLowerCase() !== (currentUserEmail || '').toLowerCase()).length;
          totalUnread += unread;
        }
      }));
      setStudentChatsUnreadCount(totalUnread);
    } catch (e) {}
  };

  useEffect(() => {
    if (!currentUserEmail) return;
    socket.emit('join_user', currentUserEmail);
    const handleUnreadUpdate = () => fetchChatUnreadCount();
    socket.on('unread_count_update', handleUnreadUpdate);
    socket.on('receive_private_message', handleUnreadUpdate);
    fetchChatUnreadCount();
    checkStudentChatsUnread();

    const interval = setInterval(() => {
      fetchChatUnreadCount();
      checkStudentChatsUnread();
    }, 8000);

    return () => {
      clearInterval(interval);
      socket.off('unread_count_update', handleUnreadUpdate);
      socket.off('receive_private_message', handleUnreadUpdate);
    };
  }, [currentUserEmail]);

  useEffect(() => {
    const handleBatchMsg = () => {
      if (activeTab === 'Student Chats') return;
      checkStudentChatsUnread();
    };
    socket.on('receive_batch_message', handleBatchMsg);
    return () => socket.off('receive_batch_message', handleBatchMsg);
  }, [activeTab]);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  const sidebarMenu = [
    { name: 'Dashboard', icon: 'fas fa-th-large' },
    { name: 'My Profile', icon: 'far fa-user' },
    { name: 'My Classes', icon: 'fas fa-book-reader' },
    { name: 'Admin Chat', icon: 'far fa-comment-dots' },
    { name: 'Student Chats', icon: 'fas fa-comments' },
    { name: 'Quizzes', icon: 'fas fa-check-square' },
    { name: 'Attendance', icon: 'far fa-calendar-check' },
    { name: 'Leave Request', icon: 'far fa-envelope-open' },
    { name: 'My Schedule', icon: 'far fa-calendar-alt' },
    { name: 'Courses', icon: 'fas fa-book' },
    { name: 'Tasks', icon: 'fas fa-tasks' },
    { name: 'Reports', icon: 'fas fa-chart-bar' },
    { name: 'Announcements', icon: 'fas fa-bullhorn' },
    { name: 'Helpdesk', icon: 'far fa-life-ring' }
  ];

  return (
    <div className="admin-layout">

      <style>
        {`
          .batch-scroll-container::-webkit-scrollbar { width: 6px; }
          .batch-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
          .batch-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .batch-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}
      </style>

      {isSidebarOpen && (
        <div
          className="sidebar-backdrop active"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo"><img src={logoImage} alt="Vinsup Logo" /></div>
        <ul className="sidebar-menu">
          {sidebarMenu.map((item, index) => (
            <li key={index} className={item.name === activeTab ? 'active' : ''}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleTabClick(item.name);
                }}
                style={{ display: 'flex', alignItems: 'center', width: '100%' }}
              >
                  <i className={item.icon}></i>
                  <span>{item.name}</span>
                  {item.name === 'Tasks' && trainerData.tasksData.length > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#ea580c', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {trainerData.tasksData.length}
                    </span>
                  )}
                  {item.name === 'Admin Chat' && chatUnreadCount > 0 && (
                    <span className="chat-badge" style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </span>
                  )}
                  {item.name === 'Student Chats' && studentChatsUnreadCount > 0 && (
                    <span className="chat-badge" style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {studentChatsUnreadCount > 99 ? '99+' : studentChatsUnreadCount}
                    </span>
                  )}
              </a>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <a href="#" className="logout-btn" onClick={(e) => { e.preventDefault(); onLogout(); }}><i className="fas fa-sign-out-alt"></i> Logout</a>
        </div>
      </aside>

      <main className={`main-content ${isSidebarOpen ? 'shrink' : 'expand'}`}>

        <header className="top-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <i className="fas fa-bars menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}></i>
            <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>{getGreeting()}, <strong style={{ color: '#111827' }}>{firstName}</strong></span>
          </div>

          <div className="header-right">

            <div className="date-display">
              <i className="far fa-calendar-alt"></i> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>

            <div style={{ position: 'relative' }}>
              <div onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="notification-icon">
                <i className="far fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="dot" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '16px', height: '16px', fontSize: '10px', color: '#fff', background: '#ef4444', borderRadius: '50%', position: 'absolute', top: '-6px', right: '-8px', border: '2px solid #fff', fontWeight: 'bold' }}>{unreadCount}</span>
                )}
              </div>

              {isNotificationOpen && (
                <div style={{ position: 'absolute', top: '40px', right: 0, width: 'min(360px, calc(100vw - 30px))', maxWidth: 'calc(100vw - 30px)', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden', textAlign: 'left' }}>
                  <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#111827', fontWeight: 'bold' }}>Notifications</h3>
                    <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', cursor: 'pointer' }} onClick={() => setIsNotificationOpen(false)}>Close</span>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? notifications.map(notif => (
                      <div key={notif._id} style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', background: notif.isRead ? '#fff' : '#eff6ff', transition: '0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#111827', fontWeight: '600' }}>{notif.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                               {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <i
                              className="fas fa-trash-alt"
                              onClick={() => handleDeleteNotification(notif._id)}
                              style={{ fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
                              title="Delete Notification"
                            ></i>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#4b5563', lineHeight: '1.4' }}>{notif.message}</p>
                        {!notif.isRead && (
                          <div style={{ textAlign: 'right' }}>
                            <button onClick={() => handleMarkNotificationRead(notif._id)} style={{ background: '#f1f5f9', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: '0.2s' }}>Mark as Read</button>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                        <i className="far fa-bell-slash" style={{ fontSize: '30px', color: '#d1d5db', marginBottom: '10px', display: 'block' }}></i>
                        You have no new notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile">
              <div className="avatar">
                {trainerData.profile.profilePic ? (
                  <img src={trainerData.profile.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <span>{firstName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="user-info" style={{ textAlign: 'left' }}>
                <strong>{displayName}</strong>
                <span>{trainerData.profile.role !== "Loading..." ? trainerData.profile.role : "Trainer"} <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '3px' }}></i></span>
              </div>
            </div>

          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="dashboard-container">
            <div className="page-header">
              <h1 style={{ color: '#0f172a', fontWeight: 'bold' }}>Welcome back, {firstName}!</h1>
              <p>Here is what is happening with your work today.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}><div style={{ background: '#f0fdf4', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: '24px' }}><i className="far fa-calendar-check"></i></div><div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Attendance Today</p><h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.attendanceToday.status}</h3><span style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}><i className={trainerData.attendanceToday.status !== 'Pending' ? "fas fa-check-circle" : "far fa-clock"}></i> {trainerData.attendanceToday.status !== 'Pending' ? 'Checked In' : 'Waiting'}</span></div></div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ background: '#e0e7ff', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '24px' }}><i className="fas fa-briefcase"></i></div>
                <div style={{ width: '100%' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Batches Allocated</p>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.myBatchesData.length} Batches</h3>
                  <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleTabClick('My Classes')}>View Batches &rarr;</span>
                </div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}><div style={{ background: '#fff7ed', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '24px' }}><i className="far fa-clipboard"></i></div><div style={{ width: '100%' }}><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Pending Tasks</p><h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.tasksData.length} Tasks</h3><span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleTabClick('Tasks')}>View Tasks &rarr;</span></div></div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}><div style={{ background: '#faf5ff', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', fontSize: '24px' }}><i className="far fa-calendar-alt"></i></div><div style={{ width: '100%' }}><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Leaves Balance</p><h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.leaveBalance.totalAvailable} Days</h3><span style={{ fontSize: '12px', color: '#9333ea', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleTabClick('Leave Request')}>Apply Leave &rarr;</span></div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px', alignItems: 'start' }}>
              <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Today's Attendance</h3>
                <div style={{ background: '#f4fdf8', borderRadius: '12px', padding: '35px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #eefbf3' }}>
                  <div style={{ width: '50px', height: '50px', background: trainerData.attendanceToday.status !== 'Pending' ? '#dcfce7' : '#f1f5f9', borderRadius: '50%', color: trainerData.attendanceToday.status !== 'Pending' ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 15px auto' }}><i className={trainerData.attendanceToday.status !== 'Pending' ? "fas fa-check" : "far fa-clock"}></i></div>
                  <h4 style={{ margin: '0 0 30px 0', color: trainerData.attendanceToday.status !== 'Pending' ? '#16a34a' : '#64748b', fontSize: '15px', fontWeight: '700' }}>{trainerData.attendanceToday.status !== 'Pending' ? 'You are checked in!' : 'Not Checked In'}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '25px' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}><p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px' }}>Check-in Time</p><strong style={{ color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><i className="far fa-clock"></i> {trainerData.attendanceToday.checkInTime}</strong></div>
                    <div style={{ width: '1px', background: '#e2e8f0' }}></div>
                    <div style={{ textAlign: 'center', flex: 1 }}><p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px' }}>Check-out Time</p><strong style={{ color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><i className="far fa-clock"></i> {trainerData.attendanceToday.checkOutTime}</strong></div>
                  </div>
                  <div style={{ marginBottom: '25px', width: '100%' }}><p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px' }}>Date</p><strong style={{ color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><i className="far fa-calendar-alt"></i> {trainerData.attendanceToday.date} ({trainerData.attendanceToday.day})</strong></div>
                  <button style={{ padding: '10px 20px', background: '#fff', border: '1px solid #c7d2fe', borderRadius: '6px', color: '#4f46e5', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' }} onClick={() => handleTabClick('Attendance')}>View Attendance History</button>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>My Batches (Allocated)</h3>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleTabClick('My Classes'); }} style={{ color: '#2563eb', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>View All Batches</a>
                </div>
                <div className="batch-scroll-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '315px', overflowY: 'auto', paddingRight: '10px' }}>
                  {trainerData.myBatchesData.length > 0 ? trainerData.myBatchesData.map((batch, idx) => (
                    <div key={batch.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'center', padding: '15px 0', borderBottom: idx !== trainerData.myBatchesData.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: batch.bgColor, color: batch.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>{batch.initial}</div>
                      <div><h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}>{batch.course}</h4><p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px' }}>Batch: {batch.batchName}</p><span style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><i className="fas fa-users" style={{ color: '#94a3b8' }}></i> {batch.students} Students</span></div>
                      <div style={{ textAlign: 'left', fontSize: '12px', color: '#0f172a' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px auto', gap: '10px', marginBottom: '5px' }}><span style={{ color: '#64748b' }}>Days</span><span style={{ fontWeight: '500' }}>{batch.days}</span></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px auto', gap: '10px', marginBottom: '8px' }}><span style={{ color: '#64748b' }}>Time</span><span style={{ fontWeight: '500' }}>{batch.time}</span></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px auto', gap: '10px', alignItems: 'center' }}><span style={{ color: '#64748b' }}>Room</span><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: '500' }}>{batch.room}</span><span style={{ padding: '3px 8px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontSize: '10px', fontWeight: 'bold', marginLeft: '10px' }}>{batch.status}</span></div></div>
                      </div>
                    </div>
                  )) : (<div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>No active batches assigned.</div>)}
                </div>
                <div style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', color: '#0f172a', fontSize: '13px', fontWeight: 'bold' }}>Total Batches Allocated: {trainerData.myBatchesData.length}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Leave Balance</h3><a href="#" onClick={(e) => { e.preventDefault(); handleTabClick('Leave Request'); }} style={{ color: '#2563eb', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>View Leave History</a></div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ background: '#f8fafc', padding: '20px 15px', borderRadius: '12px', textAlign: 'center', minWidth: '90px', border: '1px solid #f1f5f9' }}><h2 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.leaveBalance.totalAvailable}</h2><p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#0f172a', fontWeight: '600' }}>Days Available</p><span style={{ fontSize: '10px', color: '#64748b' }}>Total {trainerData.leaveBalance.totalDays} Days</span></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {trainerData.leaveBalance.breakdown.map((leave, i) => (
                        <div key={i}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}>{leave.type}</span><span style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>{leave.used} / {leave.total} Days</span></div><div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${(leave.used / leave.total) * 100}%`, height: '100%', background: leave.color, borderRadius: '2px' }}></div></div></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Today's Schedule</h3>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleTabClick('My Schedule'); }} style={{ color: '#2563eb', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>View All</a>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }} className="batch-scroll-container">
                    {trainerData.scheduleToday.length > 0 ? trainerData.scheduleToday.map((ev, i) => {
                      let dotColor = '#64748b'; let bgLight = '#f8fafc';

                      const evType = ev.type || ev.eventType || 'Other';
                      const evTitle = ev.title || ev.eventName || ev.taskName || 'Scheduled Event';
                      const evTime = ev.startTime || ev.time || 'All Day';

                      if(evType === 'Class') { dotColor = '#2563eb'; bgLight = '#eff6ff'; }
                      else if(evType === 'Lab') { dotColor = '#9333ea'; bgLight = '#f3e8ff'; }
                      else if(evType === 'Meeting') { dotColor = '#ea580c'; bgLight = '#fff7ed'; }
                      else if(evType === 'Standup') { dotColor = '#16a34a'; bgLight = '#dcfce7'; }
                      else if(evType === 'Review') { dotColor = '#db2777'; bgLight = '#fce7f3'; }

                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: bgLight, borderRadius: '8px', borderLeft: `3px solid ${dotColor}` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', textTransform: 'capitalize' }}>{evTitle}</span>
                            <span style={{ fontSize: '11px', color: dotColor, fontWeight: '500' }}>{evType}</span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }}>{evTime}</span>
                        </div>
                      )
                    }) : (
                      <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '15px 0' }}>No events scheduled for today. Relax! ☕</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'My Profile' && <MyProfile trainerData={trainerData} />}
        {activeTab === 'Admin Chat' && <UserAdminChat userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Student Chats' && <EmployeeBatchChat userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Attendance' && <UserAttendance userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Leave Request' && <UserLeaveRequest userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'My Schedule' && <UserSchedule userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Tasks' && <UserTasks userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Helpdesk' && <UserHelpdesk userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Courses' && <UserCourses userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'My Classes' && <EmployeeMyClasses userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Reports' && <UserReports userName={displayName} userEmail={currentUserEmail} />}
        {activeTab === 'Announcements' && <EmployeeAnnouncements trainerData={trainerData} />}
        {activeTab === 'Quizzes' && (<EmployeeQuizzes userName={displayName} userEmail={currentUserEmail} />)}

      </main>

      <CompanyGroupChat
        currentUserName={displayName}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
};

export default UserDashboard;