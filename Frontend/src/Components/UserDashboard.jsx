import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import logoImage from '../assets/logo.png';
import MyProfile from './MyProfile'; 
import UserAttendance from './UserAttendance';
import UserLeaveRequest from './UserLeaveRequest';
import UserSchedule from './UserSchedule'; 
import UserTasks from './UserTasks';
import UserHelpdesk from './UserHelpdesk';
import UserReports from './UserReports';
import UserAdminChat from './UserAdminChat';
import UserCourses from './UserCourses';
import EmployeeAnnouncements from './EmployeeAnnouncements'; 
import EmployeeMyClasses from './EmployeeMyClasses';
import EmployeeQuizzes from './EmployeeQuizzes'; 
import EmployeeBatchChat from './EmployeeBatchChat';


const UserDashboard = ({ userName, userEmail, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard'); 
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const activeEmail = userEmail || JSON.parse(localStorage.getItem('userAuth') || '{}').email || "";

  const [notifications, setNotifications] = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0); 
  
  // 🔥 NEW: Student Chats Unread Count State 🔥
  const [studentChatsUnreadCount, setStudentChatsUnreadCount] = useState(0);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingMsgText, setEditingMsgText] = useState("");

  const [selectedGroupFiles, setSelectedGroupFiles] = useState([]);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);

  const [chatPos, setChatPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialPos: { x: 0, y: 0 }, hasMoved: false });

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

  const handlePointerDown = (e) => {
    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialPos: { ...chatPos },
      hasMoved: false
    };
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e) => {
    if (!dragInfo.current.isDragging) return;
    
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
       dragInfo.current.hasMoved = true;
       setIsDragging(true);
    }

    let newX = dragInfo.current.initialPos.x + dx;
    let newY = dragInfo.current.initialPos.y + dy;

    const maxX = 40; 
    const maxY = 40;
    const minX = -(window.innerWidth - 100);
    const minY = -(window.innerHeight - 100);

    if (newX > maxX) newX = maxX;
    if (newY > maxY) newY = maxY;
    if (newX < minX) newX = minX;
    if (newY < minY) newY = minY;

    setChatPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    dragInfo.current.isDragging = false;
    setTimeout(() => setIsDragging(false), 50); 
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const incomingEmail = activeEmail.toLowerCase().trim();
        let exactDBName = userName || "Employee";

        const empResponse = await axios.get('http://localhost:5001/api/employees');
        const empData = Array.isArray(empResponse.data) ? empResponse.data : (empResponse.data.data || []);
        
        const currentUser = empData.find(emp => (emp.email || '').toLowerCase().trim() === incomingEmail);

        if (currentUser) {
          exactDBName = currentUser.fullName || currentUser.name || "Employee";
          const rawImage = currentUser.profilePhoto || currentUser.profilePic || currentUser.image || currentUser.avatar || currentUser.photo || currentUser.pic || currentUser.profileImage || currentUser.empImage || currentUser.file;
          
          let finalImage = ""; 
          if (rawImage && !rawImage.includes('randomuser.me')) {
            if (rawImage.startsWith('http') || rawImage.startsWith('data:image')) {
              finalImage = rawImage; 
            } else {
              let cleanPath = rawImage.replace(/\\/g, '/').replace(/^\/+/, '');
              if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
              finalImage = `http://localhost:5001/${cleanPath}`;
            }
          }

          setTrainerData(prev => ({
            ...prev,
            profile: { ...prev.profile, name: exactDBName, role: currentUser.designation || currentUser.role || "Employee", profilePic: finalImage },
            profileDetails: {
              ...prev.profileDetails,
              fullName: exactDBName, 
              email: currentUser.email || prev.profileDetails.email, 
              phone: currentUser.phone || prev.profileDetails.phone,
              role: currentUser.designation || currentUser.role || "Employee", 
              empId: currentUser.empId || currentUser.employeeId || currentUser.id || "N/A",
              dob: currentUser.dob || currentUser.dateOfBirth || "N/A", 
              gender: currentUser.gender || "N/A", 
              joinedOn: currentUser.doj || currentUser.joinedOn || currentUser.joinDate || "N/A",
              location: currentUser.location || currentUser.city || currentUser.address || "N/A", 
              address: { current: currentUser.address || "N/A", permanent: currentUser.address || "N/A" },
              account: { username: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : "Employee"), lastLogin: "Today" },
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

        const taskResponse = await axios.get('http://localhost:5001/api/tasks');
        const tasks = Array.isArray(taskResponse.data) ? taskResponse.data : (taskResponse.data.data || []);
        const myTasks = tasks.filter(t => {
          const assigned = (t.assignedTo || '').toLowerCase().trim();
          return assigned === exactDBName.toLowerCase().trim() || assigned === (currentUser?.username || '').toLowerCase().trim();
        });
        const activeTasks = myTasks.filter(t => t.status !== 'Completed');
        setTrainerData(prev => ({ ...prev, tasksData: activeTasks }));

        const batchResponse = await axios.get('http://localhost:5001/api/batches');
        const allBatches = Array.isArray(batchResponse.data) ? batchResponse.data : (batchResponse.data.data || []);
        const myBatches = allBatches.filter(b => {
          const trainer = (b.trainer || b.trainerName || b.assignedTo || b.faculty || '').toLowerCase().trim();
          return trainer === exactDBName.toLowerCase().trim() || trainer === (currentUser?.username || '').toLowerCase().trim() || trainer === 'admin';
        });

        const allocatedBatches = myBatches.map((b, idx) => {
          let tTime = "09:00 AM"; let eTime = "10:30 AM";
          let bDays = "Mon, Wed, Fri";
          if (b.schedule && b.schedule.length > 0) {
            tTime = b.schedule[0].startTime || tTime;
            eTime = b.schedule[0].endTime || eTime;
            if(Array.isArray(b.schedule[0].days)) bDays = b.schedule[0].days.join(', ');
            else if(b.schedule[0].days) bDays = b.schedule[0].days;
          }
          let studentsCount = Array.isArray(b.students) ? b.students.length : (Array.isArray(b.enrolledStudents) ? b.enrolledStudents.length : Number(b.studentsCount || 20));

          return {
            id: b._id || idx, course: b.courseName || b.course || "Training Class", batchName: String(b.batchName || b.batchId || `Batch-${idx+1}`).trim(),
            students: studentsCount, days: bDays, time: `${tTime} - ${eTime}`, room: b.room || "Lab 1", status: b.status || "Ongoing",
            color: idx % 2 === 0 ? "#3b82f6" : "#a855f7", bgColor: idx % 2 === 0 ? "#eff6ff" : "#f3e8ff", initial: `B${idx+1}`
          }
        });

        const activeAllocatedBatches = allocatedBatches.filter(batch => batch.status !== 'Completed' && batch.status !== 'completed');

        const leavesResponse = await axios.get('http://localhost:5001/api/leaves');
        const allLeaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : (leavesResponse.data.data || []);
        const myLeaves = allLeaves.filter(l => (l.empEmail || '').toLowerCase().trim() === incomingEmail || (l.empName || '').toLowerCase().trim() === exactDBName.toLowerCase().trim());
        
        let usedCasual = 0, usedSick = 0, usedPrivilege = 0, usedCompOff = 0;
        myLeaves.forEach(l => {
          if (l.status === 'Approved') {
            const lType = (l.leaveType || '').toLowerCase();
            if (lType.includes('sick')) usedSick += Number(l.totalDays || 0);
            else if (lType.includes('privilege')) usedPrivilege += Number(l.totalDays || 0);
            else if (lType.includes('comp')) usedCompOff += Number(l.totalDays || 0);
            else usedCasual += Number(l.totalDays || 0);
          }
        });

        const today = new Date(); today.setHours(0, 0, 0, 0);
        
        let myScheduleToday = [];
        try {
          let allEvents = [];
          try {
            const schedRes = await axios.get(`http://localhost:5001/api/schedule/${incomingEmail}`);
            allEvents = Array.isArray(schedRes.data) ? schedRes.data : (schedRes.data.data || []);
          } catch(err1) {
            const schedRes = await axios.get(`http://localhost:5001/api/schedule`);
            const allSched = Array.isArray(schedRes.data) ? schedRes.data : (schedRes.data.data || []);
            allEvents = allSched.filter(ev => (ev.email === incomingEmail) || (ev.empEmail === incomingEmail) || (ev.assignedTo === exactDBName));
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
  }, [userName, userEmail, activeEmail]);

  const fetchNotifications = async () => {
    if (!activeEmail) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/notifications/user/${activeEmail}`);
      const notifData = Array.isArray(res.data) ? res.data : (res.data.notifications || res.data.data || []);
      setNotifications(notifData);
    } catch (err) {
      try {
        const resAlt = await axios.get(`http://localhost:5001/api/notifications?email=${activeEmail}`);
        const notifDataAlt = Array.isArray(resAlt.data) ? resAlt.data : (resAlt.data.notifications || resAlt.data.data || []);
        setNotifications(notifDataAlt);
      } catch (err2) {
        console.error("Error fetching notifications:", err2);
        setNotifications([]);
      }
    }
  };

  const fetchChatUnreadCount = async () => {
    if (!activeEmail) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/privatechat/unread/${activeEmail}`);
      if (res.data.success) {
        setChatUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  // 🔥 Polling logic to get total unread Student/Batch chats for the badge 🔥
  useEffect(() => {
    let interval;
    const checkStudentChatsUnread = async () => {
      if (!trainerData.myBatchesData || trainerData.myBatchesData.length === 0) return;
      
      try {
        let totalUnread = 0;
        
        // Extract unique batch names from the trainer's batches state
        const batchNames = [...new Set(trainerData.myBatchesData.map(b => b.batchName))];

        await Promise.all(batchNames.map(async (batch) => {
          if(!batch) return;
          const res = await axios.get(`http://localhost:5001/api/batchchat/${encodeURIComponent(batch)}`).catch(() => null);
          if (res && res.data) {
            const msgs = res.data;
            const lastRead = localStorage.getItem(`chat_last_read_${batch}`) || 0;
            
            const unread = msgs.filter(m => 
              new Date(m.timestamp).getTime() > parseInt(lastRead) && 
              (m.senderEmail || "").toLowerCase() !== activeEmail
            ).length;
            
            totalUnread += unread;
          }
        }));
        
        setStudentChatsUnreadCount(totalUnread);
      } catch (err) {
        // Silently catch to prevent console spam
      }
    };

    if (trainerData.myBatchesData.length > 0) {
      checkStudentChatsUnread();
      interval = setInterval(checkStudentChatsUnread, 4000); // Check every 4s
    }
    
    return () => clearInterval(interval);
  }, [trainerData.myBatchesData, activeEmail]);


  useEffect(() => {
    fetchNotifications();
    fetchChatUnreadCount();
    const interval = setInterval(() => {
        fetchNotifications();
        fetchChatUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeEmail]);

  const handleMarkNotificationRead = async (id) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/mark-read/${id}`);
      fetchNotifications();
    } catch(err) {
      console.error("Error marking read:", err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/notifications/${id}`);
      fetchNotifications();
    } catch(err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleTabClick = async (tabName) => {
    setActiveTab(tabName);
    
    if (tabName === 'Admin Chat') {
        try {
            await axios.put('http://localhost:5001/api/privatechat/mark-read', {
                receiverEmail: activeEmail,
                senderEmail: 'admin@vinsup.com'
            });
            setChatUnreadCount(0);
        } catch (err) {
            console.error("Error marking chat as read:", err);
        }
    }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  const fetchChatMessages = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/groupchat');
      const messages = res.data;
      setChatMessages(messages);

      if (isChatOpen) {
        localStorage.setItem('groupChatSeenCount', messages.length.toString());
        setGroupUnreadCount(0);
      } else {
        const seenCount = parseInt(localStorage.getItem('groupChatSeenCount') || '0', 10);
        if (messages.length > seenCount) {
          setGroupUnreadCount(messages.length - seenCount);
        }
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  };

  useEffect(() => {
    let interval;
    if (!editingMsgId) { 
      fetchChatMessages();
      interval = setInterval(fetchChatMessages, 3000); 
    }
    return () => clearInterval(interval);
  }, [isChatOpen, editingMsgId]);

  useEffect(() => {
    if (messagesEndRef.current && !editingMsgId) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length, isChatOpen]);

  const toggleGroupChat = () => {
    if (!isDragging) {
      const nextState = !isChatOpen;
      setIsChatOpen(nextState);
      if (nextState) {
        localStorage.setItem('groupChatSeenCount', chatMessages.length.toString());
        setGroupUnreadCount(0);
      }
    }
  };

  const handleGroupFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      alert("Some files were larger than 5MB and were skipped.");
    }

    const filePromises = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ name: file.name, type: file.type, size: file.size, data: reader.result });
        };
        reader.readAsDataURL(file);
      });
    });

    const newFilesArray = await Promise.all(filePromises);
    setSelectedGroupFiles(prev => [...prev, ...newFilesArray]);
    e.target.value = null; 
  };

  const removeGroupFile = (indexToRemove) => {
    setSelectedGroupFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() && selectedGroupFiles.length === 0) return;

    const senderName = trainerData.profile.name !== "Loading..." ? trainerData.profile.name : (userName || "Employee");
    const senderEmail = trainerData.profileDetails.email !== "Loading..." ? trainerData.profileDetails.email : (userEmail || "test@vinsup.com");

    try {
      if (selectedGroupFiles.length > 0) {
        for (let i = 0; i < selectedGroupFiles.length; i++) {
          const filePayload = {
            fileName: selectedGroupFiles[i].name,
            fileType: selectedGroupFiles[i].type,
            fileData: selectedGroupFiles[i].data
          };

          await axios.post('http://localhost:5001/api/groupchat/send', { 
            senderName, 
            senderEmail, 
            message: i === 0 ? newMsg : "", 
            file: filePayload 
          });
        }
      } else {
        await axios.post('http://localhost:5001/api/groupchat/send', { 
          senderName, 
          senderEmail, 
          message: newMsg,
          file: null 
        });
      }
      
      setNewMsg("");
      setSelectedGroupFiles([]);
      fetchChatMessages(); 
    } catch (err) { console.error("Error sending message:", err); }
  };

  const handleDeleteMessage = async (id) => {
    if(!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await axios.delete(`http://localhost:5001/api/groupchat/delete/${id}`);
      fetchChatMessages();
    } catch(err) { console.error("Error deleting message:", err); }
  };

  const handleUpdateMessage = async (id) => {
    if(!editingMsgText.trim()) return;
    try {
      await axios.put(`http://localhost:5001/api/groupchat/edit/${id}`, { message: editingMsgText });
      setEditingMsgId(null);
      setEditingMsgText("");
      fetchChatMessages();
    } catch(err) { console.error("Error updating message:", err); }
  };

  const sidebarMenu = [
    { name: 'Dashboard', icon: 'fas fa-th-large' }, 
    { name: 'My Profile', icon: 'far fa-user' }, 
    { name: 'My Classes', icon: 'fas fa-book-reader' },
    { name: 'Quizzes', icon: 'fas fa-check-square' },
    { name: 'Attendance', icon: 'far fa-calendar-check' },
    { name: 'Leave Request', icon: 'far fa-envelope-open' }, 
    { name: 'My Schedule', icon: 'far fa-calendar-alt' }, 
    { name: 'Courses', icon: 'fas fa-book' }, 
    { name: 'Tasks', icon: 'fas fa-tasks' },
    { name: 'Reports', icon: 'fas fa-chart-bar' }, 
    { name: 'Announcements', icon: 'fas fa-bullhorn' },  
    { name: 'Helpdesk', icon: 'far fa-life-ring' }, 
    { name: 'Admin Chat', icon: 'far fa-comment-dots' },
    { name: 'Student Chats', icon: 'fas fa-comments' }
  ];

  const currentUserEmail = trainerData.profileDetails.email !== "Loading..." ? trainerData.profileDetails.email : (userEmail || "test@vinsup.com");

  return (
    <div className="admin-layout">
      
      <style>
        {`
          .batch-scroll-container::-webkit-scrollbar { width: 6px; }
          .batch-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
          .batch-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .batch-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          .chat-scroll::-webkit-scrollbar { width: 4px; }
          .chat-scroll::-webkit-scrollbar-track { background: transparent; }
          .chat-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .msg-actions { opacity: 0; transition: opacity 0.2s; }
          .msg-container:hover .msg-actions { opacity: 1; }
          .chat-badge { background: #ef4444; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 10px; margin-left: auto; font-weight: bold; min-width: 20px; text-align: center;}
        `}
      </style>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo"><img src={logoImage} alt="Vinsup Logo" /></div>
        <ul className="sidebar-menu">
          {sidebarMenu.map((item, index) => (
            <li key={index} className={item.name === activeTab ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); handleTabClick(item.name); }} style={{ display: 'flex', alignItems: 'center' }}>
                  <i className={item.icon}></i>
                  <span>{item.name}</span>
                  {item.name === 'Admin Chat' && chatUnreadCount > 0 && (
                      <span className="chat-badge">{chatUnreadCount}</span>
                  )}
                  {/* 🔥 NEW: RED BADGE FOR STUDENT CHATS 🔥 */}
                  {item.name === 'Student Chats' && studentChatsUnreadCount > 0 && (
                      <span className="chat-badge">{studentChatsUnreadCount > 99 ? '99+' : studentChatsUnreadCount}</span>
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
            <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>{getGreeting()}, <strong style={{ color: '#111827' }}>{trainerData.profile.name.split(' ')[0]}</strong></span>
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
                <div style={{ position: 'absolute', top: '40px', right: '-50px', width: '360px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden', textAlign: 'left' }}>
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
                  <span>{trainerData.profile.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="user-info" style={{ textAlign: 'left' }}>
                <strong>{trainerData.profile.name}</strong>
                <span>{trainerData.profile.role} <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '3px' }}></i></span>
              </div>
            </div>

          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="dashboard-container">
            <div className="page-header">
              <h1 style={{ color: '#0f172a', fontWeight: 'bold' }}>Welcome back, {trainerData.profile.name.split(' ')[0]}!</h1>
              <p>Here is what is happening with your work today.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}><div style={{ background: '#f0fdf4', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: '24px' }}><i className="far fa-calendar-check"></i></div><div><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Attendance Today</p><h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.attendanceToday.status}</h3><span style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}><i className={trainerData.attendanceToday.status !== 'Pending' ? "fas fa-check-circle" : "far fa-clock"}></i> {trainerData.attendanceToday.status !== 'Pending' ? 'Checked In' : 'Waiting'}</span></div></div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ background: '#e0e7ff', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '24px' }}><i className="fas fa-briefcase"></i></div>
                <div style={{ width: '100%' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Batches Allocated</p>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.myBatchesData.length} Batches</h3>
                  <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleTabClick('Courses')}>View Batches &rarr;</span>
                </div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}><div style={{ background: '#fff7ed', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '24px' }}><i className="far fa-clipboard"></i></div><div style={{ width: '100%' }}><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Pending Tasks</p><h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.tasksData.length} Tasks</h3><span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleTabClick('Tasks')}>View Tasks &rarr;</span></div></div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}><div style={{ background: '#faf5ff', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', fontSize: '24px' }}><i className="far fa-calendar-alt"></i></div><div style={{ width: '100%' }}><p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Leaves Balance</p><h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.leaveBalance.totalAvailable} Days</h3><span style={{ fontSize: '12px', color: '#9333ea', fontWeight: '600', cursor: 'pointer' }} onClick={() => handleTabClick('Leave Request')}>Apply Leave &rarr;</span></div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 1fr', gap: '20px', alignItems: 'start' }}>
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
                  <a href="#" onClick={(e) => { e.preventDefault(); handleTabClick('Courses'); }} style={{ color: '#2563eb', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>View All Batches</a>
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

        {/* Other Tabs */}
        {activeTab === 'My Profile' && <MyProfile trainerData={trainerData} />}
        {activeTab === 'Attendance' && <UserAttendance userName={trainerData.profileDetails.fullName} userEmail={trainerData.profileDetails.email} />}
        {activeTab === 'Leave Request' && <UserLeaveRequest userName={trainerData.profileDetails.fullName} userEmail={trainerData.profileDetails.email} />}
        {activeTab === 'My Schedule' && <UserSchedule userName={trainerData.profile.name} userEmail={trainerData.profileDetails.email} />}
        {activeTab === 'Tasks' && <UserTasks userName={trainerData.profile.name} />}
        {activeTab === 'Helpdesk' && <UserHelpdesk />}
        {activeTab === 'Courses' && <UserCourses userName={trainerData.profile.name} userEmail={trainerData.profileDetails.email} />}
        {activeTab === 'My Classes' && <EmployeeMyClasses userName={trainerData.profile.name} userEmail={trainerData.profileDetails.email} />}
        {activeTab === 'Reports' && <UserReports userName={trainerData.profile.name} userEmail={trainerData.profileDetails.email} />}
        {activeTab === 'Announcements' && <EmployeeAnnouncements trainerData={trainerData} />}
        {activeTab === 'Admin Chat' && <UserAdminChat userName={trainerData.profile.name} userEmail={trainerData.profileDetails.email} />}
        {activeTab === 'Quizzes' && (<EmployeeQuizzes userName={userName} userEmail={userEmail} />)}
        {activeTab === 'Student Chats' && (<EmployeeBatchChat userName={userName} userEmail={userEmail} />)}

      </main>

      {/* 🔥 FLOATING CHAT COMPONENT (WITH BADGE AND ATTACHMENTS) 🔥 */}
      <div 
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          zIndex: 1000,
          transform: `translate(${chatPos.x}px, ${chatPos.y}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}
      >
        {isChatOpen && (
          <div style={{ pointerEvents: 'auto', width: '400px', height: '600px', background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-out', marginBottom: '15px' }}>
            
            <div 
              onPointerDown={handlePointerDown} 
              style={{ background: '#2563eb', padding: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px', cursor: isDragging ? 'grabbing' : 'grab', flexShrink: 0 }}
            >
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563eb', fontSize: '20px' }}>
                <i className="fas fa-users"></i>
              </div>
              <div>
                <h3 style={{ margin: '0 0 3px 0', fontSize: '16px', fontWeight: 'bold' }}>Company Group Chat</h3>
              </div>
            </div>

            <div className="chat-scroll" style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
              {chatMessages.length > 0 ? chatMessages.map((msg, idx) => {
                const isMe = msg.senderEmail === currentUserEmail;
                const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={msg._id || idx} className="msg-container" style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', marginLeft: '5px', fontWeight: '600' }}>{msg.senderName}</span>}
                    
                    {editingMsgId === msg._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #2563eb', width: '80%' }}>
                        <input type="text" value={editingMsgText} onChange={(e) => setEditingMsgText(e.target.value)} autoFocus style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => { setEditingMsgId(null); setEditingMsgText(""); }} style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', background: '#f1f5f9', border: 'none', borderRadius: '4px', fontWeight: '600' }}>Cancel</button>
                          <button onClick={() => handleUpdateMessage(msg._id)} style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600' }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: '100%' }}>
                        <div style={{ background: isMe ? '#2563eb' : '#fff', color: isMe ? '#fff' : '#1e293b', padding: '12px 18px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', maxWidth: '250px', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: isMe ? 'none' : '1px solid #e2e8f0', wordWrap: 'break-word', overflow: 'hidden' }}>
                          
                          {msg.file && (
                            <div style={{ marginBottom: msg.message ? '8px' : '0' }}>
                              {msg.file.fileType?.startsWith('image/') ? (
                                <img src={msg.file.fileData} alt="attachment" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '6px', display: 'block', cursor: 'pointer' }} onClick={() => window.open(msg.file.fileData)} />
                              ) : msg.file.fileType?.startsWith('video/') ? (
                                <video controls style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '6px', display: 'block' }}>
                                  <source src={msg.file.fileData} type={msg.file.fileType} />
                                </video>
                              ) : (
                                <a href={msg.file.fileData} download={msg.file.fileName} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMe ? '#fff' : '#2563eb', textDecoration: 'none', background: isMe ? 'rgba(255,255,255,0.15)' : '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                                  <i className="fas fa-file-alt" style={{ fontSize: '14px', flexShrink: 0 }}></i>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.file.fileName}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {msg.message && <div>{msg.message}</div>}
                        </div>
                        
                        {isMe && (
                          <div className="msg-actions" style={{ display: 'flex', gap: '10px' }}>
                            <i className="fas fa-pen" onClick={() => { setEditingMsgId(msg._id); setEditingMsgText(msg.message); }} style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }} title="Edit"></i>
                            <i className="fas fa-trash" onClick={() => handleDeleteMessage(msg._id)} style={{ fontSize: '12px', color: '#ef4444', cursor: 'pointer' }} title="Delete"></i>
                          </div>
                        )}
                      </div>
                    )}

                    <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', marginRight: isMe ? '5px' : '0', marginLeft: !isMe ? '5px' : '0' }}>
                      {msgTime}
                    </span>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '50px' }}>
                  <i className="far fa-comments" style={{ fontSize: '40px', marginBottom: '10px', color: '#cbd5e1' }}></i>
                  <p>No messages yet.<br/>Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedGroupFiles.length > 0 && (
              <div style={{ width: '100%', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '8px 15px', boxSizing: 'border-box', flexShrink: 0, overflow: 'hidden' }}>
                <div className="chat-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', width: '100%' }}>
                  {selectedGroupFiles.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap', flexShrink: 0, maxWidth: '150px' }}>
                      {file.type.startsWith('image/') ? (
                        <img src={file.data} alt="prev" style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                      ) : (
                        <i className="fas fa-file-alt" style={{ fontSize: '12px', color: '#2563eb', flexShrink: 0 }}></i>
                      )}
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <i className="fas fa-times" onClick={() => removeGroupFile(idx)} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '10px', marginLeft: '5px', flexShrink: 0 }}></i>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} style={{ padding: '15px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
              
              <label style={{ cursor: 'pointer', color: '#64748b', fontSize: '18px', display: 'flex', alignItems: 'center', flexShrink: 0 }} title="Attach Files">
                <i className="fas fa-paperclip"></i>
                <input type="file" multiple onChange={handleGroupFileChange} style={{ display: 'none' }} />
              </label>

              <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." disabled={!!editingMsgId} style={{ flex: 1, minWidth: 0, padding: '12px 15px', borderRadius: '30px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', background: editingMsgId ? '#f1f5f9' : '#f8fafc', boxSizing: 'border-box' }} />
              
              <button type="submit" disabled={(!newMsg.trim() && selectedGroupFiles.length === 0) || !!editingMsgId} style={{ background: (newMsg.trim() || selectedGroupFiles.length > 0) && !editingMsgId ? '#2563eb' : '#94a3b8', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: (newMsg.trim() || selectedGroupFiles.length > 0) && !editingMsgId ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', transition: '0.2s', flexShrink: 0 }}>
                <i className="fas fa-paper-plane"></i>
              </button>

            </form>
          </div>
        )}

        <div 
          onPointerDown={handlePointerDown}
          onClick={toggleGroupChat}
          style={{ position: 'relative', pointerEvents: 'auto', width: '65px', height: '65px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)', cursor: isDragging ? 'grabbing' : 'pointer', transition: isDragging ? 'none' : 'transform 0.2s, background 0.2s', transform: isChatOpen ? 'scale(0.9)' : 'scale(1)', border: '3px solid #fff' }}
        >
          <i className={isChatOpen ? "fas fa-times" : "fas fa-comment-dots"}></i>
          {!isChatOpen && groupUnreadCount > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', border: '2px solid #fff' }}>
              {groupUnreadCount > 99 ? '99+' : groupUnreadCount}
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;