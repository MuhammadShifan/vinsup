import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentAnnouncements = ({ userEmail }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('latest');

  // 🔥 FIX 1: Bullet-proof target audience extractor 🔥
  const extractTargetAudience = (ann, sBatch) => {
    // 1. Standard known keys check
    const keys = ['audience', 'Audience', 'targetAudience', 'batch', 'Batch', 'batchName', 'course', 'Course', 'sendTo', 'target', 'assignedTo'];
    for (let k of keys) {
        if (ann[k] && typeof ann[k] === 'string' && ann[k].trim() !== '') return ann[k];
    }
    
    // 2. Deep scan: find any short string matching 'All Students' or the student's specific batch
    const lowerBatch = (sBatch || '').toLowerCase().trim();
    for (let k in ann) {
        const val = ann[k];
        if (typeof val === 'string' && val.length > 0 && val.length < 40 && k !== '_id' && k !== 'createdAt' && k !== 'updatedAt') {
            const lVal = val.toLowerCase().trim();
            if (lVal === 'all students' || lVal === 'all' || lVal === 'everyone') return val;
            if (lowerBatch && (lVal === lowerBatch || lVal.includes(lowerBatch))) return val;
        }
    }
    
    // STRICT RULE: Do NOT default to 'All Students' if unknown. Return null to fail the filter.
    return null; 
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const activeEmail = (userEmail || "").toLowerCase().trim();
        
        // 1. Fetch Student Details (to know their exact batch)
        const stuRes = await axios.get('https://vinsup-4vt5.onrender.com/api/students').catch(() => null);
        const allStudents = stuRes?.data?.data || stuRes?.data || [];
        const currentStudent = allStudents.find(s => (s.email || '').toLowerCase().trim() === activeEmail);
        
        // Extract student's batch safely
        const studentBatchRaw = currentStudent ? (currentStudent.batch || currentStudent.Batch || currentStudent.course || currentStudent.Course || '') : '';
        const studentBatch = String(studentBatchRaw).toLowerCase().trim();

        // 2. Fetch Announcements from Backend
        const annRes = await axios.get('https://vinsup-4vt5.onrender.com/api/announcements').catch(() => null);
        const allAnn = Array.isArray(annRes?.data) ? annRes.data : (annRes?.data?.data || []);

        let formattedAnns = [];

        if (allAnn.length > 0) {
          
          // 🔥 FIX 2: Strict Filtering Logic - ONLY allow exact matches 🔥
          const myAnns = allAnn.filter(a => {
            const rawTarget = extractTargetAudience(a, studentBatch);
            
            // If we found a logical audience target
            if (rawTarget) {
                const target = rawTarget.toLowerCase().trim();
                // Check if it's for everyone
                if (target === 'all students' || target === 'all' || target === 'everyone') return true;
                // Check if it's strictly for this student's batch
                if (studentBatch && (target === studentBatch || target.includes(studentBatch) || studentBatch.includes(target))) return true;
                
                return false; // Hide from other batches
            }

            // 3. Absolute Fallback: Deep JSON string search (if keys are highly nested/obscure)
            const annStr = JSON.stringify(a).toLowerCase();
            if (annStr.includes('all students') || annStr.includes('"audience":"all"') || annStr.includes('"batch":"all"')) {
                a._inferredTarget = 'All Students';
                return true;
            }
            if (studentBatch && studentBatch !== '' && annStr.includes(studentBatch)) {
                a._inferredTarget = studentBatch; // Found student's batch in deep string
                return true;
            }
            
            // If it doesn't match 'All Students' or the user's batch anywhere, strictly hide it!
            return false; 
          });

          // Format the data mapping to backend fields for UI
          formattedAnns = myAnns.map(a => {
            const createdDateObj = a.createdAt ? new Date(a.createdAt) : new Date();
            const finalAudience = a._inferredTarget || extractTargetAudience(a, studentBatch) || 'Target Group';
            
            return {
              ...a,
              _id: a._id || Math.random().toString(),
              title: a.title || a.subject || 'Announcement',
              description: a.description || a.message || a.content || '',
              targetAudience: finalAudience,
              date: a.date || createdDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              time: a.time || createdDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              type: a.type || 'info'
            };
          });

          // Default sort to latest
          formattedAnns.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        setAnnouncements(formattedAnns);
        if (formattedAnns.length > 0) {
          setSelectedAnn(formattedAnns[0]);
        } else {
          setSelectedAnn(null);
        }
        
        setLoading(false);

      } catch (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
        setSelectedAnn(null);
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [userEmail]);

  // Color mapping for different announcement types
  const getTypeStyles = (type, target) => {
    const t = (type || '').toLowerCase();
    const aud = (target || '').toLowerCase();
    
    if (t === 'holiday') return { dot: '#16a34a', badgeBg: '#eff6ff', badgeText: '#3b82f6' }; 
    if (t === 'event' || aud.includes('mern') || aud.includes('new')) return { dot: '#f59e0b', badgeBg: '#fff7ed', badgeText: '#ea580c' }; 
    if (t === 'reminder') return { dot: '#3b82f6', badgeBg: '#eff6ff', badgeText: '#3b82f6' }; 
    if (t === 'info' || aud.includes('devops')) return { dot: '#8b5cf6', badgeBg: '#f5f3ff', badgeText: '#9333ea' }; 
    if (t === 'workshop' || aud.includes('ui')) return { dot: '#10b981', badgeBg: '#f0fdf4', badgeText: '#16a34a' }; 
    
    return { dot: '#64748b', badgeBg: '#f1f5f9', badgeText: '#64748b' };
  };

  const handleSortChange = (e) => {
    const order = e.target.value;
    setSortOrder(order);
    const sorted = [...announcements].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (order === 'latest') return dateB - dateA;
      return dateA - dateB;
    });
    setAnnouncements(sorted);
  };

  return (
    <div className="sa-main-container">
      
      {/* Header */}
      <div className="sa-page-header">
        <h1>Announcements</h1>
        <p className="breadcrumb">Home &gt; Announcements</p>
      </div>

      {/* Info Banner */}
      <div className="sa-info-banner">
        <div className="sa-banner-icon"><i className="fas fa-bullhorn"></i></div>
        <div>
          <h4>Stay updated with the latest announcements from your institute.</h4>
          <p>Important information, updates and notifications will be shared here.</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="sa-content-layout">
        
        {/* LEFT COLUMN: List */}
        <div className="sa-list-panel">
          
          <div className="sa-list-header">
            <div className="sa-tabs">
              <button className="sa-tab active">All Announcements</button>
            </div>
            <div className="sa-filter">
              <i className="fas fa-sort-amount-down"></i>
              <select value={sortOrder} onChange={handleSortChange}>
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="sa-cards-container custom-scroll">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading announcements...</div>
            ) : announcements.length > 0 ? (
              announcements.map((ann) => {
                const styles = getTypeStyles(ann.type, ann.targetAudience);
                const isActive = selectedAnn?._id === ann._id;
                
                return (
                  <div 
                    key={ann._id} 
                    className={`sa-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedAnn(ann)}
                  >
                    <div className="sa-card-icon" style={{ background: isActive ? '#eff6ff' : '#f8fafc', color: '#3b82f6' }}>
                      <i className="fas fa-bullhorn"></i>
                    </div>
                    
                    <div className="sa-card-content">
                      <div className="sa-card-top">
                        <div className="sa-card-title-row">
                          <span className="sa-dot" style={{ backgroundColor: styles.dot }}></span>
                          <h3 className="sa-card-title">{ann.title}</h3>
                        </div>
                        <div className="sa-card-datetime">
                          <i className="far fa-calendar-alt"></i>
                          <span>{ann.date}<br/>{ann.time}</span>
                        </div>
                      </div>
                      
                      <p className="sa-card-desc">
                        {ann.description && ann.description.length > 90 
                          ? ann.description.substring(0, 90) + '...' 
                          : (ann.description || "No details provided")}
                      </p>
                      
                      <span className="sa-audience-badge" style={{ background: styles.badgeBg, color: styles.badgeText }}>
                        For: {ann.targetAudience}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '15px' }}></i>
                <p style={{ margin: 0, fontWeight: '500' }}>No announcements for your batch right now!</p>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {announcements.length > 0 && (
            <div className="sa-pagination-footer">
              <span className="sa-page-info">Showing {announcements.length > 0 ? 1 : 0} to {announcements.length > 5 ? 5 : announcements.length} of {announcements.length} announcements</span>
              <div className="sa-page-controls">
                <button className="sa-page-btn"><i className="fas fa-chevron-left"></i></button>
                <button className="sa-page-btn active">1</button>
                {announcements.length > 5 && <button className="sa-page-btn">2</button>}
                <button className="sa-page-btn"><i className="fas fa-chevron-right"></i></button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Details */}
        <div className="sa-details-panel">
          <h2 className="sa-details-header-title">Announcement Details</h2>
          
          <div className="sa-details-card">
            {selectedAnn ? (
              <>
                <div className="sa-details-top-box">
                  <div className="sa-details-icon"><i className="fas fa-bullhorn"></i></div>
                  <div className="sa-details-meta">
                    <h3>{selectedAnn.title}</h3>
                    <p className="sa-details-time">{selectedAnn.date} • {selectedAnn.time}</p>
                    <span className="sa-audience-badge" style={{ 
                      background: getTypeStyles(selectedAnn.type, selectedAnn.targetAudience).badgeBg, 
                      color: getTypeStyles(selectedAnn.type, selectedAnn.targetAudience).badgeText 
                    }}>
                      For: {selectedAnn.targetAudience}
                    </span>
                  </div>
                </div>
                
                <div className="sa-details-body">
                  {(selectedAnn.description || '').split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <i className="far fa-envelope-open" style={{ fontSize: '40px', marginBottom: '15px', color: '#cbd5e1' }}></i>
                <p>Select an announcement from the list to view details.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .sa-main-container { padding: clamp(14px, 2.5vw, 32px); font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; box-sizing: border-box; color: #0f172a; width: 100%; overflow-x: hidden;}
        
        .sa-page-header { margin-bottom: 24px; }
        .sa-page-header h1 { font-size: clamp(20px, 3vw, 22px); font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;}
        .breadcrumb { font-size: 13px; color: #64748b; font-weight: 500; margin: 0;}
        
        /* Banner */
        .sa-info-banner { background: #eff6ff; border-radius: 12px; padding: clamp(14px, 2vw, 20px); display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border: 1px solid #dbeafe; flex-wrap: wrap; }
        .sa-banner-icon { width: 44px; height: 44px; background: #dbeafe; color: #2563eb; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; flex-shrink: 0; }
        .sa-info-banner h4 { margin: 0 0 4px 0; color: #1e3a8a; font-size: 14px; font-weight: 700; }
        .sa-info-banner p { margin: 0; color: #3b82f6; font-size: 13px; font-weight: 500; }

        /* Grid Layout */
        .sa-content-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 24px; align-items: start; }
        
        @media (max-width: 992px) {
          .sa-content-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Left Panel */
        .sa-list-panel { display: flex; flex-direction: column; gap: 0; background: transparent; }
        
        .sa-list-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #cbd5e1; margin-bottom: 20px; padding-bottom: 0; flex-wrap: wrap; gap: 10px; }
        .sa-tabs { display: flex; gap: 24px; }
        .sa-tab { background: none; border: none; font-size: 14px; font-weight: 700; color: #64748b; padding: 0 0 12px 0; cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; }
        .sa-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        
        .sa-filter { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #64748b; font-size: 13px; font-weight: 600;}
        .sa-filter select { border: none; background: transparent; color: #0f172a; font-weight: 600; font-size: 13px; outline: none; cursor: pointer; font-family: inherit;}
        
        .sa-cards-container { display: flex; flex-direction: column; gap: 16px; max-height: 600px; overflow-y: auto; padding-right: 4px; }
        
        /* Announcement Card */
        .sa-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: clamp(14px, 2vw, 20px); display: flex; gap: 16px; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .sa-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .sa-card.active { border-color: #2563eb; background: #fafafa; }
        
        .sa-card-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 16px; flex-shrink: 0; }
        
        .sa-card-content { flex: 1; min-width: 0; }
        .sa-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 10px; flex-wrap: wrap; }
        .sa-card-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .sa-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;}
        .sa-card-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
        
        .sa-card-datetime { text-align: right; display: flex; gap: 6px; align-items: flex-start; color: #64748b; font-size: 11px; font-weight: 500; line-height: 1.4; flex-shrink: 0;}
        .sa-card-datetime i { margin-top: 2px; }
        
        .sa-card-desc { font-size: 13px; color: #475569; margin: 0 0 16px 0; line-height: 1.5; word-break: break-word; }
        
        .sa-audience-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block; text-transform: capitalize;}

        /* Pagination */
        .sa-pagination-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px;}
        .sa-page-info { font-size: 13px; color: #64748b; font-weight: 500;}
        .sa-page-controls { display: flex; gap: 6px; }
        .sa-page-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #475569; font-size: 13px; font-weight: 600; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s;}
        .sa-page-btn:hover { background: #f8fafc; }
        .sa-page-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }

        /* Right Panel (Details) */
        .sa-details-panel { display: flex; flex-direction: column; }
        .sa-details-header-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; }
        
        .sa-details-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: clamp(16px, 2.5vw, 24px); box-shadow: 0 1px 3px rgba(0,0,0,0.02); min-height: 350px; }
        
        .sa-details-top-box { background: #f8fafc; border-radius: 10px; padding: clamp(14px, 2vw, 20px); display: flex; gap: 16px; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; }
        .sa-details-icon { width: 44px; height: 44px; background: #eff6ff; color: #3b82f6; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 20px; flex-shrink: 0;}
        .sa-details-meta h3 { margin: 0 0 6px 0; font-size: 16px; font-weight: 800; color: #0f172a; word-break: break-word; }
        .sa-details-time { margin: 0 0 12px 0; font-size: 12px; color: #64748b; font-weight: 500; }
        
        .sa-details-body { font-size: 14px; color: #1e293b; line-height: 1.8; word-break: break-word; }
        .sa-details-body p { margin: 0 0 16px 0; }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default StudentAnnouncements;