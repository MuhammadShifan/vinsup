import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const UserAdminChat = ({ userName, userEmail }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingMsgText, setEditingMsgText] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);

  const activeEmail = userEmail || localStorage.getItem('loggedInEmail') || "test@vinsup.com";
  const activeName = userName || "Employee";

  const fetchChatMessages = async () => {
    try {
      if (activeEmail) {
        const res = await axios.get(`https://vinsup-4vt5.onrender.com/api/privatechat/${activeEmail}`);
        setChatMessages(res.data);
      }
    } catch (err) {
      console.error("Error fetching private chat:", err);
    }
  };

  useEffect(() => {
    let interval;
    if (!editingMsgId) { 
      fetchChatMessages();
      interval = setInterval(fetchChatMessages, 3000); 
    }
    return () => clearInterval(interval);
  }, [activeEmail, editingMsgId]);

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

    try {
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const filePayload = {
            fileName: selectedFiles[i].name,
            fileType: selectedFiles[i].type,
            fileData: selectedFiles[i].data
          };

          await axios.post('https://vinsup-4vt5.onrender.com/api/privatechat/send', { 
            senderName: activeName, 
            senderEmail: activeEmail, 
            message: i === 0 ? newMsg : "", 
            file: filePayload
          });
        }
      } else {
        await axios.post('https://vinsup-4vt5.onrender.com/api/privatechat/send', { 
          senderName: activeName, 
          senderEmail: activeEmail, 
          message: newMsg,
          file: null
        });
      }

      const shortMsg = newMsg.length > 30 ? newMsg.substring(0, 30) + '...' : (newMsg || `Sent ${selectedFiles.length} attachment(s)`);
      await axios.post('https://vinsup-4vt5.onrender.com/api/notifications/add', {
        type: 'Message',
        title: `New Message from ${activeName}`,
        message: shortMsg
      }).catch(err => console.log("Notification error:", err));

      setNewMsg("");
      setSelectedFiles([]);
      fetchChatMessages(); 
    } catch (err) { 
      console.error("Error sending message:", err); 
      alert("Failed to send message.");
    }
  };

  const handleDeleteMessage = async (id) => {
    if(!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await axios.delete(`https://vinsup-4vt5.onrender.com/api/privatechat/delete/${id}`);
      fetchChatMessages();
    } catch(err) { console.error("Error deleting message:", err); }
  };

  const handleUpdateMessage = async (id) => {
    if(!editingMsgText.trim()) return;
    try {
      await axios.put(`https://vinsup-4vt5.onrender.com/api/privatechat/edit/${id}`, { message: editingMsgText });
      setEditingMsgId(null);
      setEditingMsgText("");
      fetchChatMessages();
    } catch(err) { console.error("Error updating message:", err); }
  };

  return (
    <div style={{ padding: '25px 30px', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: '#f8fafc', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
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

      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '22px', fontWeight: 'bold' }}>Chat with Admin</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Direct and secure conversation with the administration team.</p>
      </div>

      {/* 🔥 FIX: Wrapped entire chat container inside a CSS Grid with minmax(0, 1fr) 🔥 */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)', width: '100%', minHeight: 0 }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px', background: '#fff', flexShrink: 0 }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0f172a', fontSize: '18px', fontWeight: 'bold', border: '1px solid #cbd5e1', flexShrink: 0 }}>
              A
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Admin Support</h3>
            </div>
          </div>

          <div className="chat-scroll" style={{ flex: 1, padding: '25px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: '100%' }}>
                      <div style={{ background: isMe ? '#2563eb' : '#fff', color: isMe ? '#fff' : '#1e293b', padding: '14px 20px', borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0', maxWidth: '400px', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: isMe ? 'none' : '1px solid #e2e8f0', wordWrap: 'break-word', overflow: 'hidden' }}>
                        
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
                        <div className="msg-actions" style={{ display: 'flex', gap: '12px' }}>
                          <i className="fas fa-pen" onClick={() => { setEditingMsgId(msg._id); setEditingMsgText(msg.message); }} style={{ fontSize: '13px', color: '#94a3b8', cursor: 'pointer', transition: '0.2s' }} title="Edit"></i>
                          <i className="fas fa-trash" onClick={() => handleDeleteMessage(msg._id)} style={{ fontSize: '13px', color: '#ef4444', cursor: 'pointer', opacity: 0.8, transition: '0.2s' }} title="Delete"></i>
                        </div>
                      )}
                    </div>
                  )}

                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', marginRight: isMe ? '5px' : '0', marginLeft: !isMe ? '5px' : '0' }}>
                    {msgTime} {editingMsgId !== msg._id && msg.createdAt !== msg.updatedAt && ""}
                  </span>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                  <i className="far fa-comment-dots" style={{ fontSize: '30px', color: '#cbd5e1' }}></i>
                </div>
                <h3 style={{ margin: '0 0 5px 0', color: '#475569', fontSize: '16px' }}>No messages yet</h3>
                <p style={{ margin: 0 }}>Start a direct conversation with the Admin.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 🔥 File Previews Container 🔥 */}
          {selectedFiles.length > 0 && (
            <div style={{ width: '100%', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '10px 25px', boxSizing: 'border-box', flexShrink: 0, overflow: 'hidden' }}>
              <div className="chat-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
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

          {/* 🔥 Message Form 🔥 */}
          <form onSubmit={handleSendMessage} style={{ padding: '20px 25px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center', width: '100%', boxSizing: 'border-box', flexShrink: 0 }}>
            <label style={{ cursor: 'pointer', color: '#64748b', fontSize: '20px', display: 'flex', alignItems: 'center', flexShrink: 0 }} title="Attach Files">
              <i className="fas fa-paperclip"></i>
              <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            <input 
              type="text" 
              value={newMsg} 
              onChange={(e) => setNewMsg(e.target.value)} 
              placeholder="Type your message to Admin..." 
              disabled={!!editingMsgId} 
              style={{ flex: 1, minWidth: 0, padding: '15px 25px', borderRadius: '30px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: editingMsgId ? '#f1f5f9' : '#f8fafc', color: '#1e293b', boxSizing: 'border-box' }} 
            />
            <button 
              type="submit" 
              disabled={(!newMsg.trim() && selectedFiles.length === 0) || !!editingMsgId} 
              style={{ background: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? '#2563eb' : '#cbd5e1', color: '#fff', border: 'none', width: '50px', height: '50px', borderRadius: '50%', cursor: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', transition: '0.2s', flexShrink: 0, boxShadow: (newMsg.trim() || selectedFiles.length > 0) && !editingMsgId ? '0 4px 6px rgba(37, 99, 235, 0.2)' : 'none' }}>
              <i className="fas fa-paper-plane" style={{ marginLeft: '-2px' }}></i>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default UserAdminChat;