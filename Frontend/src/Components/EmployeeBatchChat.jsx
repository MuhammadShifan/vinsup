import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EmployeeBatchChat = ({ userName, userEmail }) => {
  const [myBatches, setMyBatches] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [myAvatar, setMyAvatar] = useState(""); // 🔥 State for Trainer's Photo
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({}); 
  const [loading, setLoading] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const getPhotoUrl = (rawPath, fallbackName) => {
    if (!rawPath || typeof rawPath !== 'string') return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'U')}&background=random&color=fff`;
    if (rawPath.startsWith('http') || rawPath.startsWith('data:image')) return rawPath;
    let cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
    return `http://localhost:5001/${cleanPath}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const activeEmail = (userEmail || "").toLowerCase().trim();
        
        // 1. Fetch Batches
        const bRes = await axios.get('http://localhost:5001/api/batches').catch(() => null);
        const allB = Array.isArray(bRes?.data) ? bRes.data : (bRes?.data?.data || []);
        
        const trainerBatches = allB.filter(b => {
          const trainerStr = (b.trainer || b.trainerName || b.assignedTo || b.faculty || '').toLowerCase().trim();
          return trainerStr === (userName || "").toLowerCase().trim() || trainerStr === activeEmail || trainerStr === 'admin';
        });

        const batchNames = trainerBatches.map(b => String(b.batchName || b.courseName || '').trim()).filter(Boolean);
        const uniqueBatches = [...new Set(batchNames)];
        
        setMyBatches(uniqueBatches);
        if (uniqueBatches.length > 0) setActiveBatch(uniqueBatches[0]);

        // 🔥 2. Fetch Trainer's Profile Photo 🔥
        const empRes = await axios.get('http://localhost:5001/api/employees').catch(() => null);
        const allEmp = Array.isArray(empRes?.data) ? empRes.data : (empRes?.data?.data || []);
        const currentEmp = allEmp.find(e => (e.email || '').toLowerCase().trim() === activeEmail);
        const rawPhoto = currentEmp?.profilePhoto || currentEmp?.photo || currentEmp?.image || '';
        setMyAvatar(getPhotoUrl(rawPhoto, userName || "Trainer"));

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [userEmail, userName]);

  const checkUnreadCounts = async (batchesList) => {
    try {
      const counts = {};
      await Promise.all(batchesList.map(async (b) => {
        const res = await axios.get(`http://localhost:5001/api/batchchat/${encodeURIComponent(b)}`);
        const msgs = res.data;
        const lastRead = localStorage.getItem(`chat_last_read_${b}`) || 0;
        
        const unread = msgs.filter(m => new Date(m.timestamp).getTime() > parseInt(lastRead)).length;
        counts[b] = unread;
      }));
      setUnreadCounts(counts);
    } catch (e) { console.error("Error getting counts:", e); }
  };

  useEffect(() => {
    if (myBatches.length > 0) {
      checkUnreadCounts(myBatches);
      const intv = setInterval(() => checkUnreadCounts(myBatches), 3000);
      return () => clearInterval(intv);
    }
  }, [myBatches]);

  const fetchMessages = async (batch) => {
    try {
      if (!batch) return;
      const res = await axios.get(`http://localhost:5001/api/batchchat/${encodeURIComponent(batch.trim())}`);
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (activeBatch) fetchMessages(activeBatch);
  }, [activeBatch]);

  useEffect(() => {
    if (activeBatch && messages.length > 0) {
      localStorage.setItem(`chat_last_read_${activeBatch}`, Date.now());
      setUnreadCounts(prev => ({ ...prev, [activeBatch]: 0 })); 
    }
  }, [activeBatch, messages]);

  useEffect(() => {
    let interval;
    if (activeBatch) {
      interval = setInterval(() => fetchMessages(activeBatch), 3000);
    }
    return () => clearInterval(interval);
  }, [activeBatch]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newAttachments = [];
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) { 
        alert(`File ${file.name} is larger than 5MB! Skipping.`);
        continue;
      }
      const reader = new FileReader();
      const fileData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      newAttachments.push({ fileData, fileName: file.name, fileType: file.type });
    }
    setSelectedFiles(prev => [...prev, ...newAttachments]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !activeBatch) return;

    try {
      const payload = {
        batch: activeBatch.trim(),
        senderName: userName || "Trainer",
        senderEmail: userEmail || "trainer@admin.com",
        senderRole: 'Trainer',
        senderAvatar: myAvatar, // 🔥 Sending the dynamically fetched Trainer Photo 🔥
        text: newMessage.trim(),
        attachments: selectedFiles 
      };
      
      await axios.post('http://localhost:5001/api/batchchat/send', payload);
      setNewMessage("");
      setSelectedFiles([]);
      if(fileInputRef.current) fileInputRef.current.value = "";
      fetchMessages(activeBatch); 
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message.");
    }
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Loading Chats...</div>;

  return (
    <div className="tr-chat-wrapper">
      
      <div className="tr-chat-sidebar">
        <h3 className="tr-sidebar-title">My Batches</h3>
        {myBatches.length > 0 ? (
          <ul className="tr-batch-list custom-scroll">
            {myBatches.map((b, i) => (
              <li key={i} className={`tr-batch-item ${activeBatch === b ? 'active' : ''}`} onClick={() => setActiveBatch(b)}>
                <div className="tr-batch-icon"><i className="fas fa-users"></i></div>
                <div className="tr-batch-name">{b}</div>
                
                {unreadCounts[b] > 0 && (
                  <div className="unread-badge">{unreadCounts[b]}</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{padding:'20px', color:'#94a3b8', fontSize:'13px', textAlign:'center'}}>No batches assigned to you yet.</div>
        )}
      </div>

      <div className="tr-chat-main">
        {activeBatch ? (
          <>
            <div className="chat-header">
              <div className="ch-info">
                <div className="ch-avatar"><i className="fas fa-users"></i></div>
                <div>
                  <h2>{activeBatch}</h2>
                  <p>Batch Chat - Students & Trainer</p>
                </div>
              </div>
            </div>

            <div className="chat-body custom-scroll">
              {messages.length === 0 ? (
                <div className="no-messages">No messages yet. Send an announcement or say Hi!</div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderRole !== 'Student' && ((userEmail && msg.senderEmail === userEmail) || (userName && msg.senderName === userName));
                  return (
                    <div key={index} className={`chat-msg-row ${isMe ? 'me' : 'others'}`}>
                      
                      {!isMe && (
                        <div className="msg-avatar">
                          <img 
                            src={getPhotoUrl(msg.senderAvatar, msg.senderName)} 
                            alt="User" 
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=random&color=fff`; }}
                          />
                        </div>
                      )}
                      
                      <div className={`chat-bubble ${isMe ? 'my-bubble' : 'other-bubble'}`}>
                        {!isMe && (
                          <div className="msg-sender">
                            {msg.senderName} 
                            {msg.senderRole === 'Student' && <span className="student-badge">Student</span>}
                            {msg.senderRole === 'Admin' && <span className="admin-badge">Admin</span>}
                          </div>
                        )}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="msg-attachments-grid">
                            {msg.attachments.map((att, i) => (
                              <div key={i} className="msg-attachment">
                                {att.fileType && att.fileType.startsWith('image/') ? (
                                  <img src={att.fileData} alt="attachment" className="chat-image" />
                                ) : (
                                  <a href={att.fileData} download={att.fileName} className="chat-file-link">
                                    <i className="fas fa-file-alt"></i> {att.fileName}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.text && <div className="msg-text">{msg.text}</div>}
                        <div className="msg-time">{new Date(msg.timestamp).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {selectedFiles.length > 0 && (
              <div className="file-preview-area custom-scroll">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="file-preview-item">
                    <span><i className={f.fileType.startsWith('image/') ? "far fa-image" : "fas fa-file-alt"}></i> {f.fileName.length > 20 ? f.fileName.substring(0,20)+'...' : f.fileName}</span>
                    <button type="button" onClick={() => removeFile(i)}><i className="fas fa-times-circle"></i></button>
                  </div>
                ))}
              </div>
            )}

            <form className="chat-footer" onSubmit={handleSendMessage}>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{display: 'none'}} />
              <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()}><i className="fas fa-paperclip"></i></button>

              <input type="text" placeholder={`Type a message to ${activeBatch}...`} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              <button type="submit" disabled={!newMessage.trim() && selectedFiles.length === 0}><i className="fas fa-paper-plane"></i></button>
            </form>
          </>
        ) : (
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100%', color:'#94a3b8', flexDirection:'column', gap:'10px'}}>
            <i className="far fa-comments" style={{fontSize:'40px'}}></i>
            <p>Select a batch to start chatting with students</p>
          </div>
        )}
      </div>

      <style>{`
        .tr-chat-wrapper { display: flex; height: calc(100vh - 120px); background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin: 20px 32px; border: 1px solid #e2e8f0; overflow: hidden; font-family: 'Inter', sans-serif;}
        .tr-chat-sidebar { width: 280px; background: #f8fafc; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .tr-sidebar-title { padding: 20px 24px; margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; }
        .tr-batch-list { list-style: none; margin: 0; padding: 10px; overflow-y: auto; flex: 1; }
        .tr-batch-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-bottom: 4px; position: relative;}
        .tr-batch-item:hover { background: #f1f5f9; }
        .tr-batch-item.active { background: #eff6ff; color: #2563eb; }
        .tr-batch-item.active .tr-batch-icon { background: #2563eb; color: #fff; }
        .tr-batch-icon { width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; color: #64748b; display: flex; justify-content: center; align-items: center; font-size: 14px; transition: 0.2s;}
        .tr-batch-name { font-size: 14px; font-weight: 600; color: inherit; flex: 1;}
        
        .unread-badge { background: #ef4444; color: #fff; font-size: 11px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; justify-content: center; align-items: center;}

        .tr-chat-main { flex: 1; display: flex; flex-direction: column; background: #fff;}
        .chat-header { padding: 16px 24px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
        .ch-info { display: flex; align-items: center; gap: 15px; }
        .ch-avatar { width: 45px; height: 45px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; justify-content: center; align-items: center; font-size: 18px; }
        .ch-info h2 { margin: 0; font-size: 16px; color: #0f172a; font-weight: 700; }
        .ch-info p { margin: 2px 0 0 0; font-size: 12px; color: #64748b; }
        .chat-body { flex: 1; padding: 24px; overflow-y: auto; background: #f1f5f9; display: flex; flex-direction: column; gap: 16px; }
        .no-messages { text-align: center; color: #94a3b8; margin-top: 50px; font-size: 14px; }
        .chat-msg-row { display: flex; gap: 10px; align-items: flex-end; width: 100%; }
        .chat-msg-row.me { justify-content: flex-end; }
        .chat-msg-row.others { justify-content: flex-start; }
        
        .msg-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0; margin-bottom: 25px; background: #e2e8f0;}
        .msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
        
        .chat-bubble { max-width: 60%; padding: 10px 14px; border-radius: 12px; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.05);}
        .my-bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
        .other-bubble { background: #fff; color: #0f172a; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
        .msg-sender { font-size: 11px; font-weight: 700; margin-bottom: 4px; color: #64748b; display: flex; align-items: center; gap: 6px; }
        .student-badge { background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; font-size: 9px; }
        .admin-badge { background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 9px; }
        .msg-text { font-size: 14px; line-height: 1.4; word-wrap: break-word;}
        .msg-time { font-size: 10px; text-align: right; margin-top: 5px; opacity: 0.8; }
        .my-bubble .msg-time { color: #dbeafe; }
        .other-bubble .msg-time { color: #94a3b8; }

        .msg-attachments-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
        .chat-image { max-width: 100%; max-height: 200px; border-radius: 8px; display: block; border: 1px solid rgba(0,0,0,0.1); }
        .chat-file-link { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 10px 14px; border-radius: 8px; color: inherit; text-decoration: none; font-size: 13px; font-weight: 600; }
        .chat-file-link:hover { background: rgba(0,0,0,0.1); }
        
        .file-preview-area { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; max-height: 80px; overflow-y: auto;}
        .file-preview-item { background: #fff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.05);}
        .file-preview-item button { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0; display: flex; font-size: 14px;}

        .chat-footer { padding: 16px 24px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; align-items: center; }
        .attach-btn { background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 18px; transition: 0.2s;}
        .attach-btn:hover { background: #e2e8f0; }
        .chat-footer input[type="text"] { flex: 1; padding: 12px 16px; border-radius: 20px; border: 1px solid #cbd5e1; outline: none; font-size: 14px; font-family: inherit; }
        .chat-footer input[type="text"]:focus { border-color: #3b82f6; }
        .chat-footer button[type="submit"] { width: 44px; height: 44px; border-radius: 50%; background: #2563eb; color: #fff; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 16px; transition: 0.2s;}
        .chat-footer button[type="submit"]:disabled { background: #94a3b8; cursor: not-allowed; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default EmployeeBatchChat;