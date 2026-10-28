import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import socket from '../utils/socket';

const UserAdminChat = ({ userName, userEmail }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingMsgText, setEditingMsgText] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);

  const activeEmail = (userEmail || localStorage.getItem('loggedInEmail') || "test@vinsup.com").toLowerCase().trim();
  const activeName = userName || "Employee";
  const [loadingChat, setLoadingChat] = useState(false);
  const activeEmailRef = useRef(activeEmail);

  useEffect(() => {
    activeEmailRef.current = activeEmail;
  }, [activeEmail]);

  useEffect(() => {
    if (!activeEmail) return;

    let isCurrent = true;
    setChatMessages([]);
    setLoadingChat(true);

    socket.emit('join_user', activeEmail);

    const loadChat = async () => {
      try {
        const res = await API.get(`/privatechat/${activeEmail}`);
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

    socket.emit('mark_private_read', {
      receiverEmail: activeEmail,
      senderEmail: 'admin@vinsup.com'
    });

    const handleReceiveMessage = (msg) => {
      const sEmail = (msg.senderEmail || '').toLowerCase().trim();
      const rEmail = (msg.receiverEmail || '').toLowerCase().trim();
      const myEmail = activeEmailRef.current;

      const isForThisChat =
        (sEmail === myEmail && rEmail === 'admin@vinsup.com') ||
        (sEmail === 'admin@vinsup.com' && rEmail === myEmail);

      if (isForThisChat) {
        setChatMessages((prev) => {
          if (prev.some((m) => m._id && msg._id && m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        if (sEmail === 'admin@vinsup.com') {
          socket.emit('mark_private_read', {
            receiverEmail: myEmail,
            senderEmail: 'admin@vinsup.com'
          });
        }
      }
    };

    const handleMessageEdited = (updatedMsg) => {
      setChatMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    };

    const handleMessageDeleted = ({ id }) => {
      setChatMessages((prev) => prev.filter((m) => m._id !== id));
    };

    socket.on('receive_private_message', handleReceiveMessage);
    socket.on('private_message_edited', handleMessageEdited);
    socket.on('private_message_deleted', handleMessageDeleted);

    return () => {
      isCurrent = false;
      socket.off('receive_private_message', handleReceiveMessage);
      socket.off('private_message_edited', handleMessageEdited);
      socket.off('private_message_deleted', handleMessageDeleted);
    };
  }, [activeEmail]);

  useEffect(() => {
    if (messagesEndRef.current && !editingMsgId) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length]);

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
    if (!newMsg.trim() && selectedFiles.length === 0) return;

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
            senderName: activeName,
            senderEmail: activeEmail,
            receiverEmail: 'admin@vinsup.com',
            message: i === 0 ? textToSend : "",
            file: filePayload
          };

          socket.emit('send_private_message', payload);
        }
      } else {
        const payload = {
          senderName: activeName,
          senderEmail: activeEmail,
          receiverEmail: 'admin@vinsup.com',
          message: textToSend,
          file: null
        };

        socket.emit('send_private_message', payload);
      }

      const shortMsg = textToSend.length > 30 ? textToSend.substring(0, 30) + '...' : (textToSend || `Sent ${filesToSend.length} attachment(s)`);
      API.post('/notifications/add', {
        type: 'Message',
        title: `New Message from ${activeName}`,
        message: shortMsg
      }).catch(err => console.log("Notification error:", err));

    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message.");
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      socket.emit('delete_private_message', {
        id,
        senderEmail: activeEmail,
        receiverEmail: 'admin@vinsup.com'
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
        senderEmail: activeEmail,
        receiverEmail: 'admin@vinsup.com'
      });
      await API.put(`/privatechat/edit/${id}`, { message: editingMsgText });
      setChatMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, message: editingMsgText } : m))
      );
      setEditingMsgId(null);
      setEditingMsgText("");
    } catch(err) { console.error("Error updating message:", err); }
  };

  return (
    <div style={{ padding: 'clamp(12px, 2vw, 25px)', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: '#f8fafc', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <style>
        {`
          .chat-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
          .chat-scroll::-webkit-scrollbar-track { background: transparent; }
          .chat-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .chat-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          .msg-actions { opacity: 0; transition: opacity 0.2s; }
          .msg-container:hover .msg-actions { opacity: 1; }
        `}
      </style>

      <div style={{ marginBottom: '15px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '22px', fontWeight: 'bold' }}>Chat with Admin</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Direct and secure conversation with the administration team.</p>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)', width: '100%', minHeight: 0 }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          <div style={{ padding: '14px clamp(14px, 2vw, 25px)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', flexShrink: 0 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', border: '1px solid #cbd5e1', flexShrink: 0 }}>
              A
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Admin Support</h3>
            </div>
          </div>

          <div className="chat-scroll" style={{ flex: 1, padding: 'clamp(14px, 2vw, 25px)', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
            {chatMessages.length > 0 ? chatMessages.map((msg, idx) => {
              const isMe = msg.senderEmail === activeEmail;
              const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg._id || idx} className="msg-container" style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && <span style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px', marginLeft: '5px', fontWeight: '600' }}>Admin</span>}

                  {editingMsgId === msg._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #2563eb', width: '300px', maxWidth: '100%' }}>
                      <input type="text" value={editingMsgText} onChange={(e) => setEditingMsgText(e.target.value)} autoFocus style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => { setEditingMsgId(null); setEditingMsgText(""); }} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', fontWeight: '600' }}>Cancel</button>
                        <button onClick={() => handleUpdateMessage(msg._id)} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600' }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: '100%' }}>
                      <div style={{ background: isMe ? '#2563eb' : '#fff', color: isMe ? '#fff' : '#1e293b', padding: '12px 18px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', maxWidth: 'min(500px, 85vw)', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: isMe ? 'none' : '1px solid #e2e8f0', wordWrap: 'break-word', overflow: 'hidden' }}>

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

                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', marginRight: isMe ? '5px' : '0', marginLeft: !isMe ? '5px' : '0' }}>
                    {msgTime} {editingMsgId !== msg._id && msg.createdAt !== msg.updatedAt && ""}
                  </span>
                </div>
              );
            }) : loadingChat ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8', padding: '40px 0' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '28px', color: '#2563eb', marginBottom: '12px' }}></i>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Loading chat...</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8', padding: '40px 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
                  <i className="far fa-comment-dots" style={{ fontSize: '28px', color: '#cbd5e1' }}></i>
                </div>
                <h3 style={{ margin: '0 0 5px 0', color: '#475569', fontSize: '16px' }}>No messages yet</h3>
                <p style={{ margin: 0 }}>Start a direct conversation with the Admin.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedFiles.length > 0 && (
            <div style={{ width: '100%', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '10px 20px', boxSizing: 'border-box', flexShrink: 0, overflow: 'hidden' }}>
              <div className="chat-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap', flexShrink: 0, maxWidth: '200px' }}>
                    {file.type.startsWith('image/') ? (
                      <img src={file.data} alt="prev" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                    ) : (
                      <i className="fas fa-file-alt" style={{ fontSize: '16px', color: '#2563eb', flexShrink: 0 }}></i>
                    )}
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{file.name}</span>
                    <i className="fas fa-times" onClick={() => removeFile(idx)} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '12px', marginLeft: '5px', flexShrink: 0 }}></i>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} style={{ padding: '14px clamp(12px, 2vw, 25px)', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', width: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
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

        </div>
      </div>
    </div>
  );
};

export default UserAdminChat;