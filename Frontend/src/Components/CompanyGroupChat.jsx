import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import socket from '../utils/socket';

const CompanyGroupChat = ({ currentUserName, currentUserEmail }) => {
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

  const activeEmail = (currentUserEmail || localStorage.getItem('loggedInEmail') || "").toLowerCase().trim();
  const activeName = currentUserName || "User";

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

  const handlePointerUp = () => {
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

  const fetchChatMessages = async () => {
    try {
      const res = await API.get('/groupchat');
      const messages = Array.isArray(res.data) ? res.data : (res.data?.data || []);
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
      console.error("Error fetching group chat:", err);
    }
  };

  useEffect(() => {
    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 5000);
    return () => clearInterval(interval);
  }, [isChatOpen]);

  useEffect(() => {
    const handleReceiveGroupMsg = (msg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m._id && msg._id && m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      if (isChatOpen) {
        setGroupUnreadCount(0);
        localStorage.setItem('groupChatSeenCount', (chatMessages.length + 1).toString());
      } else {
        setGroupUnreadCount((prev) => prev + 1);
      }
    };

    const handleGroupMsgEdited = (updatedMsg) => {
      setChatMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    const handleGroupMsgDeleted = ({ id }) => {
      setChatMessages((prev) => prev.filter((m) => m._id !== id));
    };

    socket.on('receive_group_message', handleReceiveGroupMsg);
    socket.on('group_message_edited', handleGroupMsgEdited);
    socket.on('group_message_deleted', handleGroupMsgDeleted);

    return () => {
      socket.off('receive_group_message', handleReceiveGroupMsg);
      socket.off('group_message_edited', handleGroupMsgEdited);
      socket.off('group_message_deleted', handleGroupMsgDeleted);
    };
  }, [isChatOpen, chatMessages.length]);

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

    const senderName = activeName;
    const senderEmail = activeEmail;

    try {
      if (selectedGroupFiles.length > 0) {
        for (let i = 0; i < selectedGroupFiles.length; i++) {
          const filePayload = {
            fileName: selectedGroupFiles[i].name,
            fileType: selectedGroupFiles[i].type,
            fileData: selectedGroupFiles[i].data
          };

          await API.post('/groupchat/send', {
            senderName,
            senderEmail,
            message: i === 0 ? newMsg : "",
            file: filePayload
          });
        }
      } else {
        await API.post('/groupchat/send', {
          senderName,
          senderEmail,
          message: newMsg,
          file: null
        });
      }

      setNewMsg("");
      setSelectedGroupFiles([]);
      fetchChatMessages();
    } catch (err) {
      console.error("Error sending group message:", err);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await API.delete(`/groupchat/delete/${id}`);
      fetchChatMessages();
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleUpdateMessage = async (id) => {
    if (!editingMsgText.trim()) return;
    try {
      await API.put(`/groupchat/edit/${id}`, { message: editingMsgText });
      setEditingMsgId(null);
      setEditingMsgText("");
      fetchChatMessages();
    } catch (err) {
      console.error("Error updating message:", err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'min(40px, 16px)',
        right: 'min(40px, 16px)',
        zIndex: 1000,
        transform: `translate(${chatPos.x}px, ${chatPos.y}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}
    >
      {isChatOpen && (
        <div style={{ pointerEvents: 'auto', width: 'min(400px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 100px))', background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-out', marginBottom: '15px' }}>
          
          <div
            onPointerDown={handlePointerDown}
            style={{ background: '#2563eb', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: isDragging ? 'grabbing' : 'grab', flexShrink: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563eb', fontSize: '18px' }}>
                <i className="fas fa-users"></i>
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 'bold' }}>Company Group Chat</h3>
                <span style={{ fontSize: '11px', opacity: 0.9 }}>Connect with all colleagues</span>
              </div>
            </div>
            <i 
              className="fas fa-times" 
              onClick={toggleGroupChat} 
              style={{ cursor: 'pointer', fontSize: '16px', padding: '4px', opacity: 0.8 }}
              title="Close chat"
            ></i>
          </div>

          <div className="chat-scroll" style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
            {chatMessages.length > 0 ? chatMessages.map((msg, idx) => {
              const isMe = (msg.senderEmail || '').toLowerCase() === activeEmail;
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
                      <div style={{ background: isMe ? '#2563eb' : '#fff', color: isMe ? '#fff' : '#1e293b', padding: '10px 16px', borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', maxWidth: '260px', fontSize: '13px', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: isMe ? 'none' : '1px solid #e2e8f0', wordWrap: 'break-word', overflow: 'hidden' }}>

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
                        <div className="msg-actions" style={{ display: 'flex', gap: '8px' }}>
                          <i className="fas fa-pen" onClick={() => { setEditingMsgId(msg._id); setEditingMsgText(msg.message); }} style={{ fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }} title="Edit"></i>
                          <i className="fas fa-trash" onClick={() => handleDeleteMessage(msg._id)} style={{ fontSize: '11px', color: '#ef4444', cursor: 'pointer' }} title="Delete"></i>
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

          <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <label style={{ cursor: 'pointer', color: '#64748b', fontSize: '18px', display: 'flex', alignItems: 'center', flexShrink: 0 }} title="Attach Files">
              <i className="fas fa-paperclip"></i>
              <input type="file" multiple onChange={handleGroupFileChange} style={{ display: 'none' }} />
            </label>

            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              disabled={!!editingMsgId}
              style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', background: editingMsgId ? '#f1f5f9' : '#f8fafc', boxSizing: 'border-box' }}
            />

            <button
              type="submit"
              disabled={(!newMsg.trim() && selectedGroupFiles.length === 0) || !!editingMsgId}
              style={{ background: (newMsg.trim() || selectedGroupFiles.length > 0) && !editingMsgId ? '#2563eb' : '#94a3b8', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: (newMsg.trim() || selectedGroupFiles.length > 0) && !editingMsgId ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '13px', transition: '0.2s', flexShrink: 0 }}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}

      <div
        onPointerDown={handlePointerDown}
        onClick={toggleGroupChat}
        style={{
          position: 'relative',
          pointerEvents: 'auto',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#2563eb',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '26px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
          cursor: isDragging ? 'grabbing' : 'pointer',
          transition: isDragging ? 'none' : 'transform 0.2s, background 0.2s',
          transform: isChatOpen ? 'scale(0.9)' : 'scale(1)',
          border: '3px solid #fff'
        }}
        title="Company Group Chat"
      >
        <i className={isChatOpen ? "fas fa-times" : "fas fa-comment-dots"}></i>
        {!isChatOpen && groupUnreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 'bold', width: '22px', height: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', border: '2px solid #fff' }}>
            {groupUnreadCount > 99 ? '99+' : groupUnreadCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default CompanyGroupChat;
