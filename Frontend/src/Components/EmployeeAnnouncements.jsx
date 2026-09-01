import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeAnnouncements = ({ trainerData }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [searchQuery, setSearchQuery] = useState("");

  // Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('All Students'); 
  const [selectedBatch, setSelectedBatch] = useState('');

  // Data States
  const [myBatches, setMyBatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Fetch Trainer's Assigned Batches & Their Announcements
  useEffect(() => {
    const fetchData = async () => {
      try {
        const trainerName = trainerData?.profileDetails?.fullName;
        const trainerId = trainerData?.profileDetails?.empId || trainerData?._id;
        
        if (!trainerName || !trainerId) return;

        // 1. Fetch Batches (Filter only for this trainer)
        const batchRes = await axios.get('http://localhost:5001/api/batches');
        const allBatches = Array.isArray(batchRes.data) ? batchRes.data : (batchRes.data.data || []);
        
        const filteredBatches = allBatches.filter(b => 
          (b.trainerName && b.trainerName.toLowerCase() === trainerName.toLowerCase()) || 
          (b.trainer && b.trainer.toLowerCase() === trainerName.toLowerCase())
        );
        setMyBatches(filteredBatches);

        // 2. Fetch Announcements history for this trainer
        fetchAnnouncements(trainerId);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (trainerData) {
      fetchData();
    }
  }, [trainerData]);

  const fetchAnnouncements = async (trainerId) => {
    try {
      const res = await axios.get(`http://localhost:5001/api/announcements/trainer/${trainerId}`);
      setAnnouncements(res.data.data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!title || !message) {
      alert("Please fill in all mandatory fields (*)");
      return;
    }
    if (audience === 'By Batch' && !selectedBatch) {
      alert("Please select a batch.");
      return;
    }

    const trainerId = trainerData?.profileDetails?.empId || trainerData?._id;
    const trainerName = trainerData?.profileDetails?.fullName;

    // 🔥 AUTO GENERATE CURRENT LOCAL DATE & TIME 🔥
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const autoPublishDate = `${yyyy}-${mm}-${dd}`; // Format: YYYY-MM-DD
    
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const autoPublishTime = `${hh}:${min}`; // Format: HH:MM

    const payload = {
      title,
      message,
      audienceType: audience,
      targetBatch: audience === 'By Batch' ? selectedBatch : '',
      publishDate: autoPublishDate, // Automatic Date
      publishTime: autoPublishTime, // Automatic Time
      sentBy: trainerName,
      trainerId: trainerId,
      status: 'Published'
    };

    try {
      await axios.post('http://localhost:5001/api/announcements', payload);
      alert("Announcement Sent Successfully! 🚀");
      
      // Reset Form
      setTitle('');
      setMessage('');
      setAudience('All Students');
      setSelectedBatch('');
      
      // Refresh Table
      fetchAnnouncements(trainerId);
      setActiveTab('list'); // Automatically go back to list after sending
    } catch (error) {
      console.error("Error sending announcement:", error);
      alert("Failed to send announcement.");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await axios.delete(`http://localhost:5001/api/announcements/${id}`);
        setAnnouncements(announcements.filter(a => a._id !== id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  // Preview Helpers
  const previewAudienceBadge = audience === 'All Students' ? 'All Students' : (selectedBatch || 'Select a batch');

  // 🔥 FIX: Filter for List View (Now searches ONLY in Title) 🔥
  const filteredAnnouncements = announcements.filter(anc => {
    const query = searchQuery.toLowerCase();
    const t = (anc.title || "").toLowerCase();
    return t.includes(query); // Removed audience checking here!
  });

  return (
    <div style={{ padding: '30px 40px', fontFamily: "'Inter', sans-serif", background: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {activeTab === 'list' ? (
        /* 🔥 1. ALL ANNOUNCEMENTS LIST VIEW 🔥 */
        <div className="anc-list-view" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', color: '#020617', fontWeight: '800', letterSpacing: '-0.5px' }}>Announcements</h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Create and manage announcements to keep students informed.</p>
            </div>
            <button 
              onClick={() => setActiveTab('create')} 
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
            >
              <i className="fas fa-plus"></i> Create Announcement
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', width: '340px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
              <input 
                type="text" 
                placeholder="Search announcements by title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#0f172a', width: '100%', fontFamily: 'inherit' }}
              />
              <i className="fas fa-search" style={{ color: '#94a3b8', fontSize: '14px' }}></i>
            </div>
          </div>

          {/* Table Section */}
          <div className="custom-scroll" style={{ borderRadius: '12px', border: '1px solid #f1f5f9', overflow: 'hidden', background: '#fff', maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ background: '#fff', padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>Title</th>
                  <th style={{ background: '#fff', padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>Audience</th>
                  <th style={{ background: '#fff', padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>Sent On</th>
                  <th style={{ background: '#fff', padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>Created By</th>
                  <th style={{ background: '#fff', padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 10, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((anc, idx) => {
                  // Dynamic icon color based on index
                  const colors = ['#eff6ff', '#f0fdf4', '#faf5ff', '#fff7ed'];
                  const textColors = ['#2563eb', '#16a34a', '#a855f7', '#ea580c'];
                  const icons = ['fas fa-bullhorn', 'far fa-file-alt', 'far fa-calendar-alt', 'far fa-bell'];
                  const colorIdx = idx % 4;

                  const isAllStudents = anc.audienceType === 'All Students';

                  return (
                    <tr key={anc._id}>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', flexShrink: 0, marginTop: '2px', background: colors[colorIdx], color: textColors[colorIdx] }}>
                            <i className={icons[colorIdx]}></i>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{anc.title}</h4>
                            <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.5', maxWidth: '380px' }}>
                              {anc.message.length > 80 ? anc.message.substring(0, 80) + '...' : anc.message}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', verticalAlign: 'top' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', background: isAllStudents ? '#eff6ff' : '#f0fdf4', color: isAllStudents ? '#2563eb' : '#16a34a' }}>
                          {isAllStudents ? 'All Students' : anc.targetBatch}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{anc.publishDate}</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{anc.publishTime}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', verticalAlign: 'top' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{anc.sentBy}</span>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="anc-action-btn edit" title="Edit"><i className="far fa-edit"></i></button>
                          <button className="anc-action-btn delete" title="Delete" onClick={() => handleDelete(anc._id)}><i className="far fa-trash-alt"></i></button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px'}}>
                      No announcements found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Showing 1 to {filteredAnnouncements.length} of {announcements.length} announcements</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="anc-page-btn"><i className="fas fa-chevron-left"></i></button>
              <button className="anc-page-btn active">1</button>
              <button className="anc-page-btn"><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>
        </div>

      ) : (

        /* 🔥 2. CREATE ANNOUNCEMENT FORM VIEW 🔥 */
        <div className="anc-create-view" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#0f172a', fontWeight: 'bold' }}>Send Announcement</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Dashboard &gt; Announcements &gt; Send Announcement</p>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setActiveTab('list')}
                style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', color: '#2563eb', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}
              >
                View All Announcements
              </button>
              <button 
                onClick={handleSendAnnouncement} 
                style={{ padding: '10px 20px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
              >
                <i className="fas fa-paper-plane"></i> Send Announcement
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px' }}>
            
            {/* LEFT COLUMN - FORM */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Announcement Details</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value.substring(0, 100))}
                    placeholder="Enter announcement title" 
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                  <span style={{ position: 'absolute', right: '15px', top: '12px', fontSize: '12px', color: '#94a3b8' }}>{title.length}/100</span>
                </div>
              </div>

              {/* Message Field */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Message <span style={{ color: '#ef4444' }}>*</span></label>
                <div>
                  <textarea 
                    rows="6" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value.substring(0, 2000))}
                    placeholder="Type your announcement message here..." 
                    style={{ width: '100%', padding: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}>
                  </textarea>
                  <div style={{ textAlign: 'right', padding: '4px 4px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                    {message.length}/2000
                  </div>
                </div>
              </div>

              {/* Audience */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '12px', fontWeight: '600' }}>Audience <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: '40px' }}>
                  
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={audience === 'All Students'} 
                      onChange={() => setAudience('All Students')}
                      style={{ accentColor: '#2563eb', marginTop: '3px', width: '16px', height: '16px' }} 
                    />
                    <div>
                      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>All Students</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Send to all students</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={audience === 'By Batch'} 
                      onChange={() => setAudience('By Batch')}
                      style={{ accentColor: '#2563eb', marginTop: '3px', width: '16px', height: '16px' }} 
                    />
                    <div>
                      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>By Batch</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Send to students of selected batch</div>
                    </div>
                  </label>

                </div>

                {/* Batch Dropdown */}
                {audience === 'By Batch' && (
                  <div style={{ marginTop: '15px', animation: 'fadeIn 0.3s' }}>
                    <select 
                      value={selectedBatch} 
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', background: '#fff' }}
                    >
                      <option value="">-- Select Your Batch --</option>
                      {myBatches.map(b => {
                        const batchName = b.batchName || b.batchId || `Batch ${b._id.slice(-4)}`;
                        const courseInfo = b.courseName ? ` (${b.courseName})` : '';
                        return (
                          <option key={b._id} value={batchName}>{batchName}{courseInfo}</option>
                        )
                      })}
                    </select>
                    {myBatches.length === 0 && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px', display: 'block' }}>You don't have any active batches assigned.</span>}
                  </div>
                )}
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <i className="fas fa-info-circle" style={{ color: '#3b82f6', marginTop: '3px' }}></i>
                <span style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>The announcement will be published immediately upon sending.</span>
              </div>

            </div>

            {/* RIGHT COLUMN - PREVIEW & TIPS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Preview</h3>
                
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '25px' }}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ width: '45px', height: '45px', background: '#eff6ff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563eb', fontSize: '18px', flexShrink: 0 }}>
                      <i className="fas fa-bullhorn"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold', wordBreak: 'break-word' }}>
                        {title || "Announcement Title"}
                      </h4>
                      {/* 🔥 LIVE PREVIEW DATE AND TIME 🔥 */}
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', marginBottom: '25px', whiteSpace: 'pre-wrap', minHeight: '60px' }}>
                    {message || "This is how your announcement will appear to the students. Please make sure the information is correct before sending."}
                  </div>

                  <div style={{ display: 'inline-block', background: '#eff6ff', color: '#2563eb', padding: '6px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    For: {previewAudienceBadge}
                  </div>
                </div>
              </div>

              <div style={{ background: '#fef3c7', borderRadius: '12px', border: '1px solid #fde68a', padding: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <i className="far fa-lightbulb" style={{ color: '#d97706', fontSize: '18px' }}></i>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#92400e', fontWeight: 'bold' }}>Tips</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '13px', lineHeight: '1.8' }}>
                  <li>Keep the title clear and concise.</li>
                  <li>Provide all necessary details in the message.</li>
                  <li>Use this feature to share important updates with students.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        .anc-action-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; }
        .anc-action-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .anc-action-btn.view i { color: #64748b; font-size: 13px; }
        .anc-action-btn.edit i { color: #2563eb; font-size: 13px; }
        .anc-action-btn.delete i { color: #ef4444; font-size: 13px; }
        
        .anc-page-btn { width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s; }
        .anc-page-btn:hover { background: #f8fafc; }
        .anc-page-btn.active { background: #2563eb; border-color: #2563eb; color: #ffffff; }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default EmployeeAnnouncements;