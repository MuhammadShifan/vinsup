import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserCourses = ({ userName, userEmail }) => {
  const [groupedCourses, setGroupedCourses] = useState({});
  const [stats, setStats] = useState({
    overallProgress: 0,
    coursesEnrolled: 0,
    ongoingBatches: 0,
    completedBatches: 0
  });

  const [allSyllabus, setAllSyllabus] = useState([]);
  const [showOldBatches, setShowOldBatches] = useState(false);

  useEffect(() => {
    fetchBatches();
    fetchSyllabus(); 
  }, [userName, userEmail]);

  const fetchSyllabus = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/syllabus');
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setAllSyllabus(data);
    } catch (err) {
      console.error("Error fetching syllabus:", err);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/batches');
      const allBatches = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      const incomingEmail = (userEmail || localStorage.getItem('loggedInEmail') || "").toLowerCase().trim();
      const exactName = (userName || "Employee").toLowerCase().trim();

      const myBatches = allBatches.filter(b => {
        const trainerStr = (b.trainer || b.trainerName || b.assignedTo || b.faculty || '').toLowerCase().trim();
        return trainerStr === exactName || trainerStr === incomingEmail;
      });

      const groups = {};
      let tProgress = 0, tBatches = 0;
      let ongoingCount = 0;
      let completedCount = 0;
      const colors = ['#2563eb', '#8b5cf6', '#16a34a', '#ea580c', '#eab308'];

      myBatches.forEach((b, idx) => {
        const cName = b.courseName || b.course || 'General Course';
        if (!groups[cName]) {
          groups[cName] = {
            courseName: cName,
            startDate: b.startDate || '15 Jun 2026',
            description: b.description || 'Learn and build projects with modern tools and best practices.',
            batches: []
          };
        }
        
        const batchProgress = Number(b.progress) || 0;
        const isCompleted = b.status === 'Completed' || batchProgress === 100;

        if (isCompleted) {
          completedCount++;
        } else {
          ongoingCount++;
        }

        const batchData = {
          ...b,
          progress: batchProgress,
          studentsCount: Array.isArray(b.students) ? b.students.length : (b.studentsCount || 25),
          scheduleStr: b.schedule && b.schedule.length > 0 ? (Array.isArray(b.schedule[0].days) ? b.schedule[0].days.join(', ') : b.schedule[0].days) : 'Mon - Fri',
          color: colors[idx % colors.length],
          iconChar: `B${tBatches + 1}`,
          status: isCompleted ? 'Completed' : 'Ongoing'
        };

        groups[cName].batches.push(batchData);

        tProgress += batchProgress;
        tBatches++;
      });

      setGroupedCourses(groups);
      
      const numCourses = Object.keys(groups).length;
      const avgProg = tBatches > 0 ? Math.round(tProgress / tBatches) : 0;

      setStats({
        overallProgress: avgProg,
        coursesEnrolled: numCourses,
        ongoingBatches: ongoingCount,
        completedBatches: completedCount
      });

    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const displayCourses = Object.values(groupedCourses).map(course => ({
    ...course,
    batches: course.batches.filter(b => showOldBatches ? b.status === 'Completed' : b.status !== 'Completed')
  })).filter(course => course.batches.length > 0);

  return (
    <div style={{ padding: '20px 30px', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>My Courses</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Track your enrolled courses and batch progress.</p>
      </div>

      {/* Stats */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', flexWrap: 'wrap', gap: '20px' }}>
        
        {/* 1. Overall Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold', lineHeight: '1.4' }}>Overall<br/>Progress</span>
          <div style={{ width: '75px', height: '75px', borderRadius: '50%', background: `conic-gradient(#2563eb ${stats.overallProgress}%, #f1f5f9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '61px', height: '61px', background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '2px' }}>{stats.overallProgress}%</span>
            </div>
          </div>
        </div>
        
        <div style={{ width: '1px', height: '45px', background: '#e2e8f0' }}></div>
        
        {/* 2. Ongoing Batches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#fef9c3', color: '#ca8a04', width: '45px', height: '45px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="fas fa-spinner"></i></div>
          <div><h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{stats.ongoingBatches}</h3><span style={{ fontSize: '12px', color: '#64748b' }}>Ongoing Batches</span></div>
        </div>

        <div style={{ width: '1px', height: '45px', background: '#e2e8f0' }}></div>
        
        {/* 3. Completed Batches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#dcfce7', color: '#16a34a', width: '45px', height: '45px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="fas fa-check-circle"></i></div>
          <div><h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{stats.completedBatches}</h3><span style={{ fontSize: '12px', color: '#64748b' }}>Completed Batches</span></div>
        </div>

        <div style={{ width: '1px', height: '45px', background: '#e2e8f0' }}></div>
        
        {/* 4. Courses Enrolled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#eff6ff', color: '#2563eb', width: '45px', height: '45px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}><i className="fas fa-book-open"></i></div>
          <div><h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{stats.coursesEnrolled}</h3><span style={{ fontSize: '12px', color: '#64748b' }}>Courses Enrolled</span></div>
        </div>

      </div>

      {/* Toggle Button for Ongoing / Old Batches */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, fontWeight: 'bold' }}>
          {showOldBatches ? 'Old Batches (Completed)' : 'Active Courses (Ongoing)'}
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowOldBatches(false)}
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: !showOldBatches ? 'none' : '1px solid #cbd5e1', background: !showOldBatches ? '#2563eb' : '#fff', color: !showOldBatches ? '#fff' : '#475569', transition: '0.2s' }}
          >
            Ongoing Batches
          </button>
          <button 
            onClick={() => setShowOldBatches(true)}
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: showOldBatches ? 'none' : '1px solid #cbd5e1', background: showOldBatches ? '#16a34a' : '#fff', color: showOldBatches ? '#fff' : '#475569', transition: '0.2s' }}
          >
            Old Batches
          </button>
        </div>
      </div>

      {/* Course List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {displayCourses.length > 0 ? displayCourses.map((course, cIdx) => (
          <div key={cIdx} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            
            <div style={{ padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ width: '55px', height: '55px', borderRadius: '10px', background: cIdx % 2 === 0 ? '#eff6ff' : '#dcfce7', color: cIdx % 2 === 0 ? '#2563eb' : '#16a34a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px' }}>
                  <i className="fas fa-code"></i>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{course.courseName}</h2>
                    <span style={{ padding: '4px 10px', borderRadius: '4px', background: showOldBatches ? '#e2e8f0' : '#dcfce7', color: showOldBatches ? '#475569' : '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>
                      {showOldBatches ? 'Archived' : 'Active'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px' }}>{course.description}</p>
                  <div style={{ display: 'flex', gap: '25px', fontSize: '12px', color: '#64748b' }}>
                    <span>{course.batches.length} Batch{course.batches.length > 1 ? 'es' : ''} {showOldBatches ? 'Completed' : 'Allocated'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i className="far fa-calendar-alt"></i> Started on {course.startDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 30px 12px 30px' }}><h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Batch Progress</h4></div>

            {/* Batch Rows */}
            <div style={{ padding: '0 30px 25px 30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                <div>Batch Details</div>
                <div>Overall Progress</div>
              </div>

              {course.batches.map((batch, bIdx) => {
                const isCompleted = batch.status === 'Completed';
                
                return (
                <div key={batch._id || bIdx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: '20px', alignItems: 'center', padding: '12px 0', borderBottom: bIdx !== course.batches.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  
                  {/* Col 1: Info */}
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: `${batch.color}15`, color: batch.color, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                      {batch.iconChar}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>{batch.batchName || `Batch - ${bIdx + 1}`}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                        <span>{batch.studentsCount} Students</span>
                        <span style={{ fontSize: '16px', lineHeight: '0' }}>•</span>
                        <span>{batch.scheduleStr}</span>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: isCompleted ? '#dcfce7' : '#fef9c3', color: isCompleted ? '#16a34a' : '#ca8a04', fontSize: '10px', fontWeight: 'bold', marginLeft: '5px' }}>
                          {isCompleted ? 'Completed' : 'Ongoing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Progress Bar Only */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: batch.color, fontWeight: 'bold' }}>{batch.progress}%</span>
                    </div>
                    <div style={{ background: '#f1f5f9', height: '6px', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                      <div style={{ background: batch.color, height: '100%', borderRadius: '3px', width: `${batch.progress}%`, transition: 'width 0.4s ease-in-out' }}></div>
                    </div>
                  </div>

                </div>
              )})}
            </div>

          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            <i className={showOldBatches ? "fas fa-check-double" : "fas fa-book-open"} style={{ fontSize: '30px', color: '#cbd5e1', marginBottom: '10px' }}></i>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
              {showOldBatches ? "You have no completed batches yet." : "No active batches currently allocated to you."}
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

export default UserCourses;