import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TicketNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch only Admin Notifications
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/notifications/user/admin');
      const notifData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setNotifications(notifData);
    } catch (err) {
      console.error("Error fetching admin notifications:", err);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/mark-read/${id}`);
      fetchNotifications(); // Refresh list after marking as read
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // 🔥 PUDHUSU: Delete Notification Functionality 🔥
  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/notifications/${id}`);
      fetchNotifications(); // Refresh list after deleting
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9' }}
      >
        <i className="far fa-bell" style={{ fontSize: '20px', color: '#475569' }}></i>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            {unreadCount}
          </span>
        )}
      </div>
      
      {isOpen && (
        <div style={{ position: 'absolute', top: '50px', right: '-10px', width: '360px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Updates & Notifications</h3>
            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>Close</span>
          </div>
          
          <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="custom-scroll">
            {notifications.length > 0 ? notifications.map(notif => (
              <div key={notif._id} style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', background: notif.isRead ? '#fff' : '#eff6ff', transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{notif.title}</h4>
                  
                  {/* 🔥 Update: Time and Delete Icon combined 🔥 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
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
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>{notif.message}</p>
                {!notif.isRead && (
                  <div style={{ textAlign: 'right' }}>
                    <button onClick={() => handleMarkRead(notif._id)} style={{ background: '#f1f5f9', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '600', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: '0.2s' }}>
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', margin: '0 auto 10px auto' }}>
                  <i className="fas fa-check"></i>
                </div>
                You're all caught up!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketNotification;