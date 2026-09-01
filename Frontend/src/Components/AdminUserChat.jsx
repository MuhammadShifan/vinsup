import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AdminUserChat = ({ onRead }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingMsgText, setEditingMsgText] = useState("");

  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);

  const adminEmail = "admin@vinsup.com";
  const adminName = "Admin";

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/employees');
        const empData = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setEmployees(empData);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/privatechat/unread-senders/admin`);
      if (res.data && res.data.success) {
        setUnreadCounts(res.data.counts || {});
      }
    } catch (err) {
      console.error("Error fetching unread counts:", err);
    }
  };

  const fetchChatMessages = async () => {
    if (selectedUser && selectedUser.email) {
      try {
        const res = await axios.get(`http://localhost:5001/api/privatechat/${selectedUser.email}`);
        setChatMessages(res.data);
      } catch (err) {
        console.error("Error fetching private chat:", err);
      }
    }
  };

  const markMessagesAsRead = async () => {
    if (selectedUser && selectedUser.email) {
      try {
        await axios.put('http://localhost:5001/api/privatechat/mark-read', {
            receiverEmail: adminEmail,
            senderEmail: selectedUser.email
        });
        fetchUnreadCounts(); 
        if (onRead) onRead(); 
      } catch (err) {
        console.error("Error marking chat as read:", err);
      }
    }
  };

  useEffect(() => {
    if (selectedUser) {
        markMessagesAsRead();
    }
    
    let interval;
    if (selectedUser && !editingMsgId) { 
      fetchChatMessages();
      interval = setInterval(() => {
          fetchChatMessages();
          fetchUnreadCounts();
      }, 3000); 
    } else {
        fetchUnreadCounts();
        interval = setInterval(fetchUnreadCounts, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedUser, editingMsgId]);

  // 🔥 FIX 1: Auto-scroll on new messages ONLY 🔥
  useEffect(() => {
    if (messagesEndRef.current && !editingMsgId) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length, selectedUser]);

  const handleFileChange = async (e) => {
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
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result 
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newFilesArray = await Promise.all(filePromises);
    setSelectedFiles(prev => [...prev, ...newFilesArray]);
    e.target.value = null; 
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMsg.trim() && selectedFiles.length === 0) || !selectedUser) return;

    try {
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const filePayload = {
            fileName: selectedFiles[i].name,
            fileType: selectedFiles[i].type,
            fileData: selectedFiles[i].data
          };

          await axios.post('http://localhost:5001/api/privatechat/send', { 
            senderName: adminName, 
            senderEmail: adminEmail, 
            receiverEmail: selectedUser.email, 
            message: i === 0 ? newMsg : "", 
            file: filePayload
          });
        }
      } else {
        await axios.post('http://localhost:5001/api/privatechat/send', { 
          senderName: adminName, 
          senderEmail: adminEmail, 
          receiverEmail: selectedUser.email, 
          message: newMsg,
          file: null
        });
      }

      setNewMsg("");
      setSelectedFiles([]);
      fetchChatMessages(); 
    } catch (err) { 
      console.error("Error sending message:", err); 
    }
  };

  const handleDeleteMessage = async (id) => {
    if(!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`http://localhost:5001/api/privatechat/delete/${id}`);
      fetchChatMessages();
    } catch(err) { console.error("Error deleting message:", err); }
  };

  const handleUpdateMessage = async (id) => {
    if(!editingMsgText.trim()) return;
    try {
      await axios.put(`http://localhost:5001/api/privatechat/edit/${id}`, { message: editingMsgText });
      setEditingMsgId(null);
      setEditingMsgText("");
      fetchChatMessages();
    } catch(err) { console.error("Error updating message:", err); }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.fullName || emp.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (emp.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // 🔥 FIX 2: Strict height 100vh with overflow hidden 🔥
    <div style={{ padding: '20px 30px', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <style>
        {`
          .scroll-bar::-webkit-scrollbar { width: 5px; height: 5px; }
          .scroll-bar::-webkit-scrollbar-track { background: transparent; }
          .scroll-bar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .msg-actions { opacity: 0; transition: opacity 0.2s; }
          .msg-container:hover .msg-actions { opacity: 1; }
        `}
      </style>

      <div style={{ marginBottom: '15px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '22px', fontWeight: 'bold' }}>User Chats</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Manage 1-to-1 conversations with employees.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '20px', flex: 1, minHeight: 0, width: '100%', boxSizing: 'border-box' }}>
        
        {/* LEFT PANEL */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8', fontSize: '13px' }}></i>
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div className="scroll-bar" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredEmployees.map(emp => {
              const empName = emp.fullName || emp.name || "Employee";
              const isSelected = selectedUser && selectedUser.email === emp.email;
              const unreadMsgCount = unreadCounts[emp.email] || 0; 

              return (
                <div 
                  key={emp._id || emp.email} 
                  onClick={() => setSelectedUser(emp)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: isSelected ? '#eff6ff' : '#fff', borderBottom: '1px solid #f1f5f9', transition: '0.2s', borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#475569', fontWeight: 'bold', flexShrink: 0 }}>
                    {empName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#0f172a', fontWeight: isSelected || unreadMsgCount > 0 ? 'bold' : '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{empName}</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{emp.designation || 'Employee'}</p>
                  </div>
                  
                  {unreadMsgCount > 0 && (
                    <div style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                      {unreadMsgCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: CHAT WINDOW */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, height: '100%' }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '15px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 }}>
                  {(selectedUser.fullName || selectedUser.name || "E").charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{selectedUser.fullName || selectedUser.name}</h3>
                  <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{selectedUser.email}</span>
                </div>
              </div>

              <div className="scroll-bar" style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {chatMessages.length > 0 ? chatMessages.map((msg, idx) => {
                  const isMe = msg.senderEmail === adminEmail;
                  const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={msg._id || idx} className="msg-container" style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', marginLeft: '5px', fontWeight: '600' }}>{msg.senderName}</span>}
                      
                      {editingMsgId === msg._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #2563eb', width: '280px', maxWidth: '100%' }}>
                          <input type="text" value={editingMsgText} onChange={(e) => setEditingMsgText(e.target.value)} autoFocus style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => { setEditingMsgId(null); setEditingMsgText(""); }} style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', background: '#f1f5f9', border: 'none', borderRadius: '4px', fontWeight: '600' }}>Cancel</button>
                            <button onClick={() => handleUpdateMessage(msg._id)} style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600' }}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          <div style={{ background: isMe ? '#2563eb' : '#fff', color: isMe ? '#fff' : '#1e293b', padding: '10px 16px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', maxWidth: '350px', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: isMe ? 'none' : '1px solid #e2e8f0', wordWrap: 'break-word', overflow: 'hidden' }}>
                            
                            {msg.file && (
                              <div style={{ marginBottom: msg.message ? '8px' : '0' }}>
                                {msg.file.fileType?.startsWith('image/') ? (
                                  <img src={msg.file.fileData} alt="attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', display: 'block', cursor: 'pointer' }} onClick={() => window.open(msg.file.fileData)} />
                                ) : msg.file.fileType?.startsWith('video/') ? (
                                  <video controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', display: 'block' }}>
                                    <source src={msg.file.fileData} type={msg.file.fileType} />
                                  </video>
                                ) : (
                                  <a href={msg.file.fileData} download={msg.file.fileName} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMe ? '#fff' : '#2563eb', textDecoration: 'none', background: isMe ? 'rgba(255,255,255,0.15)' : '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                    <i className="fas fa-file-alt" style={{ fontSize: '16px', flexShrink: 0 }}></i>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.file.fileName}</span>
                                  </a>
                                )}
                              </div>
                            )}

                            {msg.message && <div>{msg.message}</div>}
                          </div>
                          
                          {isMe && (
                            <div className="msg-actions" style={{ display: 'flex', gap: '10px' }}>
                              <i className="fas fa-pen" onClick={() => { setEditingMsgId(msg._id); setEditingMsgText(msg.message); }} style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer', transition: '0.2s' }} title="Edit"></i>
                              <i className="fas fa-trash" onClick={() => handleDeleteMessage(msg._id)} style={{ fontSize: '12px', color: '#ef4444', cursor: 'pointer', opacity: 0.8, transition: '0.2s' }} title="Delete"></i>
                            </div>
                          )}
                        </div>
                      )}
                      <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', marginRight: isMe ? '5px' : '0', marginLeft: !isMe ? '5px' : '0' }}>{msgTime}</span>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '80px' }}>
                    <p>No messages yet. Send a message to start.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ width: '100%', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '10px 20px', boxSizing: 'border-box', flexShrink: 0 }}>
                  <div className="scroll-bar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap', flexShrink: 0, maxWidth: '200px' }}>
                        {file.type.startsWith('image/') ? (
                          <img src={file.data} alt="prev" style={{ width: '22px', height: '22px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                        ) : (
                          <i className="fas fa-file-alt" style={{ fontSize: '14px', color: '#2563eb', flexShrink: 0 }}></i>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <i className="fas fa-times" onClick={() => removeFile(idx)} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '12px', marginLeft: '5px', flexShrink: 0 }}></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} style={{ padding: '15px 25px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center', width: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
                <label style={{ cursor: 'pointer', color: '#64748b', fontSize: '18px', display: 'flex', alignItems: 'center', flexShrink: 0 }} title="Attach Files">
                  <i className="fas fa-paperclip"></i>
                  <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                </label>

                <input 
                  type="text" 
                  value={newMsg} 
                  onChange={(e) => setNewMsg(e.target.value)} 
                  placeholder="Type your message to Admin..." 
                  disabled={!!editingMsgId} 
                  style={{ flex: 1, minWidth: 0, padding: '12px 20px', borderRadius: '30px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', background: editingMsgId ? '#f1f5f9' : '#f8fafc', color: '#1e293b', boxSizing: 'border-box' }} 
                />
                <button 
                  type="submit" 
                  disabled={(!newMsg.trim() && selectedFiles.length === 0) || !!editingMsgId} 
                  style={{ background: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? '#2563eb' : '#cbd5e1', color: '#fff', border: 'none', width: '42px', height: '42px', borderRadius: '50%', cursor: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', transition: '0.2s', flexShrink: 0, boxShadow: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? '0 4px 6px rgba(37, 99, 235, 0.2)' : 'none' }}>
                  <i className="fas fa-paper-plane" style={{ marginLeft: '-2px' }}></i>
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                <i className="far fa-comment-dots" style={{ fontSize: '30px', color: '#cbd5e1' }}></i>
              </div>
              <h3 style={{ margin: '0 0 5px 0', color: '#475569', fontSize: '16px' }}>Your Messages</h3>
              <p style={{ margin: 0, fontSize: '13px' }}>Select an employee from the list to view chat.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminUserChat;