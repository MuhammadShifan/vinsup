import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import socket from '../utils/socket';

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
  const selectedUserRef = useRef(selectedUser);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    // Join Admin room in Socket.io
    socket.emit('join_user', adminEmail);

    const fetchEmployees = async () => {
      try {
        const res = await API.get('/employees');
        const empData = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setEmployees(empData);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    fetchEmployees();
    fetchUnreadCounts();

    // Socket Event: Real-time incoming private message
    const handleReceiveMessage = (msg) => {
      const currentSelected = selectedUserRef.current;
      const sEmail = (msg.senderEmail || '').toLowerCase().trim();
      const rEmail = (msg.receiverEmail || '').toLowerCase().trim();
      const myAdminEmail = adminEmail.toLowerCase().trim();

      if (currentSelected && currentSelected.email) {
        const activeTarget = currentSelected.email.toLowerCase().trim();
        const isForActiveChat =
          (sEmail === activeTarget && rEmail === myAdminEmail) ||
          (sEmail === myAdminEmail && rEmail === activeTarget);

        if (isForActiveChat) {
          setChatMessages((prev) => {
            if (prev.some((m) => m._id && msg._id && m._id === msg._id)) return prev;
            return [...prev, msg];
          });

          if (sEmail === activeTarget) {
            socket.emit('mark_private_read', {
              receiverEmail: adminEmail,
              senderEmail: activeTarget
            });
          }
          return;
        }
      }

      // If message is from someone else, increment unread count for that sender
      if (sEmail && sEmail !== myAdminEmail) {
        setUnreadCounts((prev) => ({
          ...prev,
          [sEmail]: (prev[sEmail] || 0) + 1
        }));
      }
    };

    // Socket Event: Message edited
    const handleMessageEdited = (updatedMsg) => {
      setChatMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    // Socket Event: Message deleted
    const handleMessageDeleted = ({ id }) => {
      setChatMessages((prev) => prev.filter((m) => m._id !== id));
    };

    // Socket Event: Unread counts update
    const handleUnreadUpdate = () => {
      fetchUnreadCounts();
    };

    socket.on('receive_private_message', handleReceiveMessage);
    socket.on('private_message_edited', handleMessageEdited);
    socket.on('private_message_deleted', handleMessageDeleted);
    socket.on('unread_count_update', handleUnreadUpdate);

    return () => {
      socket.off('receive_private_message', handleReceiveMessage);
      socket.off('private_message_edited', handleMessageEdited);
      socket.off('private_message_deleted', handleMessageDeleted);
      socket.off('unread_count_update', handleUnreadUpdate);
    };
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const res = await API.get('/privatechat/unread-senders/admin');
      if (res.data && res.data.success) {
        setUnreadCounts(res.data.counts || {});
      }
    } catch (err) {
      console.error("Error fetching unread counts:", err);
    }
  };

  // Immediate state reset and race-condition free fetch
  useEffect(() => {
    if (!selectedUser || !selectedUser.email) {
      setChatMessages([]);
      return;
    }

    const targetEmail = selectedUser.email.toLowerCase().trim();
    let isCurrent = true;

    // Immediately clear chat to prevent previous user's messages from lingering
    setChatMessages([]);
    setLoadingChat(true);

    const loadChat = async () => {
      try {
        const res = await API.get(`/privatechat/${targetEmail}`);
        if (isCurrent) {
          setChatMessages(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (isCurrent) {
          console.error("Error fetching private chat:", err);
          setChatMessages([]);
        }
      } finally {
        if (isCurrent) {
          setLoadingChat(false);
        }
      }
    };

    loadChat();

    // Mark as read
    socket.emit('mark_private_read', {
      receiverEmail: adminEmail,
      senderEmail: targetEmail
    });
    API.put('/privatechat/mark-read', {
      receiverEmail: adminEmail,
      senderEmail: targetEmail
    }).catch(() => {});

    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[targetEmail];
      return next;
    });

    if (onRead) onRead();

    return () => {
      isCurrent = false;
    };
  }, [selectedUser?.email]);

  // Auto-scroll on new messages
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

    const filesToSend = [...selectedFiles];
    const textToSend = newMsg;

    setNewMsg("");
    setSelectedFiles([]);

    try {
      if (filesToSend.length > 0) {
        for (let i = 0; i < filesToSend.length; i++) {
          const filePayload = {
            fileName: filesToSend[i].name,
            fileType: filesToSend[i].type,
            fileData: filesToSend[i].data
          };

          const payload = {
            senderName: adminName,
            senderEmail: adminEmail,
            receiverEmail: selectedUser.email,
            message: i === 0 ? textToSend : "",
            file: filePayload
          };

          socket.emit('send_private_message', payload);
        }
      } else {
        const payload = {
          senderName: adminName,
          senderEmail: adminEmail,
          receiverEmail: selectedUser.email,
          message: textToSend,
          file: null
        };

        socket.emit('send_private_message', payload);
      }
    } catch (err) { 
      console.error("Error sending message:", err); 
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      socket.emit('delete_private_message', {
        id,
        senderEmail: adminEmail,
        receiverEmail: selectedUser?.email
      });
      await API.delete(`/privatechat/delete/${id}`);
      setChatMessages((prev) => prev.filter((m) => m._id !== id));
    } catch(err) { console.error("Error deleting message:", err); }
  };

  const handleUpdateMessage = async (id) => {
    if (!editingMsgText.trim()) return;
    try {
      socket.emit('edit_private_message', {
        id,
        message: editingMsgText,
        senderEmail: adminEmail,
        receiverEmail: selectedUser?.email
      });
      await API.put(`/privatechat/edit/${id}`, { message: editingMsgText });
      setChatMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, message: editingMsgText } : m))
      );
      setEditingMsgId(null);
      setEditingMsgText("");
    } catch(err) { console.error("Error updating message:", err); }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.fullName || emp.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (emp.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // 🔥 FIX 2: Strict height 100vh with overflow hidden 🔥
    <div style={{ padding: 'clamp(12px, 2vw, 20px)', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <style>
        {`
          .scroll-bar::-webkit-scrollbar { width: 5px; height: 5px; }
          .scroll-bar::-webkit-scrollbar-track { background: transparent; }
          .scroll-bar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .msg-actions { opacity: 0; transition: opacity 0.2s; }
          .msg-container:hover .msg-actions { opacity: 1; }
          
          .admin-chat-grid {
            display: grid;
            grid-template-columns: 320px minmax(0, 1fr);
            gap: 20px;
            flex: 1;
            min-height: 0;
            width: 100%;
            box-sizing: border-box;
          }
          
          .mobile-chat-back {
            display: none;
            background: #f1f5f9;
            border: none;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #475569;
            font-size: 14px;
            flex-shrink: 0;
          }

          @media (max-width: 768px) {
            .admin-chat-grid {
              display: flex;
              flex-direction: column;
              gap: 0;
            }
            .mobile-chat-back {
              display: inline-flex;
            }
            .admin-chat-users {
              display: ${selectedUser ? 'none' : 'flex'} !important;
              width: 100%;
              height: 100%;
            }
            .admin-chat-window {
              display: ${selectedUser ? 'flex' : 'none'} !important;
              width: 100%;
              height: 100%;
            }
          }
        `}
      </style>

      <div style={{ marginBottom: '15px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '22px', fontWeight: 'bold' }}>User Chats</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Manage 1-to-1 conversations with employees.</p>
      </div>

      <div className="admin-chat-grid">
        
        {/* LEFT PANEL */}
        <div className="admin-chat-users" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
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
        <div className="admin-chat-window" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, height: '100%' }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '12px clamp(12px, 2vw, 25px)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', flexShrink: 0 }}>
                <button className="mobile-chat-back" onClick={() => setSelectedUser(null)} title="Back to employee list">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '15px', fontWeight: 'bold', flexShrink: 0 }}>
                  {(selectedUser.fullName || selectedUser.name || "E").charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{selectedUser.fullName || selectedUser.name}</h3>
                  <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{selectedUser.email}</span>
                </div>
              </div>

              <div className="scroll-bar" style={{ flex: 1, padding: 'clamp(12px, 2vw, 20px)', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {loadingChat ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '28px', color: '#2563eb', marginBottom: '12px' }}></i>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Loading conversation...</p>
                  </div>
                ) : chatMessages.length > 0 ? (
                  chatMessages.map((msg, idx) => {
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
                            <div style={{ background: isMe ? '#2563eb' : '#fff', color: isMe ? '#fff' : '#1e293b', padding: '10px 16px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', maxWidth: 'min(450px, 85vw)', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: isMe ? 'none' : '1px solid #e2e8f0', wordWrap: 'break-word', overflow: 'hidden' }}>
                              
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
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                    <i className="far fa-comments" style={{ fontSize: '42px', marginBottom: '12px', color: '#cbd5e1' }}></i>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No messages yet with {selectedUser.fullName || selectedUser.name}.</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Send a message to start the conversation! 👋</p>
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

              <form onSubmit={handleSendMessage} style={{ padding: '12px clamp(12px, 2vw, 25px)', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', width: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
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
                  style={{ flex: 1, minWidth: 0, padding: '10px 18px', borderRadius: '30px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', background: editingMsgId ? '#f1f5f9' : '#f8fafc', color: '#1e293b', boxSizing: 'border-box' }} 
                />
                <button 
                  type="submit" 
                  disabled={(!newMsg.trim() && selectedFiles.length === 0) || !!editingMsgId} 
                  style={{ background: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? '#2563eb' : '#cbd5e1', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '15px', transition: '0.2s', flexShrink: 0, boxShadow: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? '0 4px 6px rgba(37, 99, 235, 0.2)' : 'none' }}>
                  <i className="fas fa-paper-plane" style={{ marginLeft: '-2px' }}></i>
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', padding: '20px', textAlign: 'center' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                <i className="far fa-comment-dots" style={{ fontSize: '28px', color: '#cbd5e1' }}></i>
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