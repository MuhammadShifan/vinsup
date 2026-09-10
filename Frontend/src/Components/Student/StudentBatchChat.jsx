import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const StudentBatchChat = ({ userName, userEmail }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [studentBatch, setStudentBatch] = useState("");
  const [myAvatar, setMyAvatar] = useState("");
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
    return `https://vinsup-4vt5.onrender.com/${cleanPath}`;
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const activeEmail = (userEmail || "").toLowerCase().trim();
        const stuRes = await axios.get('https://vinsup-4vt5.onrender.com/api/students').catch(() => null);
        const allStudents = stuRes?.data?.data || stuRes?.data || [];
        const currentStudent = allStudents.find(s => (s.email || '').toLowerCase().trim() === activeEmail);
        
        const studentBatchRaw = currentStudent ? (currentStudent.batch || currentStudent.Batch || currentStudent.course || '') : '';
        const myBatch = String(studentBatchRaw).trim();
        setStudentBatch(myBatch);

        const rawPhoto = currentStudent?.profilePhoto || currentStudent?.photo || currentStudent?.image || currentStudent?.avatar || '';
        setMyAvatar(getPhotoUrl(rawPhoto, userName || "Student"));

        if (myBatch) fetchMessages(myBatch);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setLoading(false);
      }
    };
    initChat();
  }, [userEmail, userName]);

  const fetchMessages = async (batch) => {
    try {
      const res = await axios.get(`https://vinsup-4vt5.onrender.com/api/batchchat/${encodeURIComponent(batch)}`);
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (studentBatch && messages.length > 0) {
      localStorage.setItem(`chat_last_read_${studentBatch}`, Date.now());
    }
  }, [messages, studentBatch]);

  useEffect(() => {
    let interval;
    if (studentBatch) {
      interval = setInterval(() => fetchMessages(studentBatch), 3000);
    }
    return () => clearInterval(interval);
  }, [studentBatch]);

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
    if ((!newMessage.trim() && selectedFiles.length === 0) || !studentBatch) return;

    try {
      const payload = {
        batch: studentBatch,
        senderName: userName || "Student",
        senderEmail: userEmail,
        senderRole: 'Student',
        senderAvatar: myAvatar, // 🔥 Dynamically fetched student avatar 🔥
        text: newMessage.trim(),
        attachments: selectedFiles
      };
      await axios.post('https://vinsup-4vt5.onrender.com/api/batchchat/send', payload);
      setNewMessage("");
      setSelectedFiles([]);
      if(fileInputRef.current) fileInputRef.current.value = "";
      fetchMessages(studentBatch);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. File might be too large.");
    }
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Loading Chat...</div>;
  if (!studentBatch) return <div style={{padding:'40px', textAlign:'center', color:'#ef4444'}}>You are not assigned to any batch yet.</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="ch-info">
          <div className="ch-avatar"><i className="fas fa-users"></i></div>
          <div>
            <h2>{studentBatch} - Batch Chat</h2>
            <p>You, your batchmates, and Trainer</p>
          </div>
        </div>
      </div>

      <div className="chat-body custom-scroll">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Say Hi! 👋</div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderRole === 'Student' && msg.senderEmail.toLowerCase() === (userEmail||"").toLowerCase();
            
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
                
                <div className={`chat-bubble ${isMe ? 'my-bubble' : 'other-bubble'} ${msg.senderRole === 'Trainer' ? 'trainer-bubble' : ''}`}>
                  {!isMe && (
                    <div className="msg-sender">
                      {msg.senderName} {msg.senderRole === 'Trainer' && <span className="trainer-badge">Trainer</span>}
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
        
        <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" disabled={!newMessage.trim() && selectedFiles.length === 0}><i className="fas fa-paper-plane"></i></button>
      </form>

      <style>{`
        .chat-container { display: flex; flex-direction: column; height: calc(100vh - 120px); background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin: clamp(10px, 2vw, 20px) clamp(10px, 2.5vw, 32px); border: 1px solid #e2e8f0; overflow: hidden; font-family: 'Inter', sans-serif;}
        .chat-header { padding: 14px clamp(14px, 2vw, 24px); background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .ch-info { display: flex; align-items: center; gap: 15px; }
        .ch-avatar { width: 42px; height: 42px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; justify-content: center; align-items: center; font-size: 16px; flex-shrink: 0; }
        .ch-info h2 { margin: 0; font-size: 16px; color: #0f172a; font-weight: 700; word-break: break-word; }
        .ch-info p { margin: 2px 0 0 0; font-size: 12px; color: #64748b; }
        
        .chat-body { flex: 1; padding: clamp(14px, 2vw, 24px); overflow-y: auto; background: #f1f5f9; display: flex; flex-direction: column; gap: 16px; }
        .no-messages { text-align: center; color: #94a3b8; margin-top: 50px; font-size: 14px; }
        .chat-msg-row { display: flex; gap: 10px; align-items: flex-end; width: 100%; }
        .chat-msg-row.me { justify-content: flex-end; }
        .chat-msg-row.others { justify-content: flex-start; }
        
        .msg-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0; margin-bottom: 25px; background: #e2e8f0;}
        .msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
        
        .chat-bubble { max-width: min(450px, 80%); padding: 10px 14px; border-radius: 12px; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.05);}
        .my-bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
        .other-bubble { background: #fff; color: #0f172a; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
        .trainer-bubble { border: 1px solid #3b82f6; background: #eff6ff; }
        .msg-sender { font-size: 11px; font-weight: 700; margin-bottom: 4px; color: #3b82f6; display: flex; align-items: center; gap: 6px; }
        .trainer-bubble .msg-sender { color: #2563eb; }
        .trainer-badge { background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px; }
        .msg-text { font-size: 14px; line-height: 1.4; word-wrap: break-word;}
        .msg-time { font-size: 10px; text-align: right; margin-top: 5px; opacity: 0.8; }
        .my-bubble .msg-time { color: #dbeafe; }
        .other-bubble .msg-time { color: #94a3b8; }
        
        .msg-attachments-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
        .chat-image { max-width: 100%; max-height: 200px; border-radius: 8px; display: block; border: 1px solid rgba(0,0,0,0.1); }
        .chat-file-link { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 10px 14px; border-radius: 8px; color: inherit; text-decoration: none; font-size: 13px; font-weight: 600; }
        .chat-file-link:hover { background: rgba(0,0,0,0.1); }
        
        .file-preview-area { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px clamp(14px, 2vw, 24px); background: #f8fafc; border-top: 1px solid #e2e8f0; max-height: 80px; overflow-y: auto;}
        .file-preview-item { background: #fff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 6px 12px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.05);}
        .file-preview-item button { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0; display: flex; font-size: 14px;}

        .chat-footer { padding: 14px clamp(14px, 2vw, 24px); background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        .attach-btn { background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; width: 42px; height: 42px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 16px; transition: 0.2s; flex-shrink: 0;}
        .attach-btn:hover { background: #e2e8f0; }
        .chat-footer input[type="text"] { flex: 1; min-width: 0; padding: 12px 16px; border-radius: 20px; border: 1px solid #cbd5e1; outline: none; font-size: 13px; font-family: inherit; }
        .chat-footer input[type="text"]:focus { border-color: #3b82f6; }
        .chat-footer button[type="submit"] { width: 42px; height: 42px; border-radius: 50%; background: #2563eb; color: #fff; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 15px; transition: 0.2s; flex-shrink: 0;}
        .chat-footer button[type="submit"]:disabled { background: #94a3b8; cursor: not-allowed; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        @media (max-width: 768px) {
          .chat-container {
            margin: 6px;
            height: calc(100dvh - 80px);
          }
          .chat-bubble {
            max-width: 88%;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentBatchChat;