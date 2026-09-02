import React, { useState, useEffect } from 'react';
import './Employees.css';

const Batches = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [batchList, setBatchList] = useState([]);
  
  const [trainersList, setTrainersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);

  const [searchInput, setSearchInput] = useState('');

  const [activeBatchTab, setActiveBatchTab] = useState('Active');

  const [viewBatch, setViewBatch] = useState(null);
  const [activeViewTab, setActiveViewTab] = useState('Overview');

  const initialFormState = {
    batchName: '', batchType: '', courseName: '', trainerName: '',
    studentsCount: '', startDate: '', endDate: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const fetchBatches = async () => {
    try {
      const response = await fetch('https://vinsup-4vt5.onrender.com/api/batches');
      const result = await response.json();
      if (result.success) { setBatchList(result.data); }
    } catch (error) { console.error("Error fetching batches:", error); }
  };

  const fetchTrainers = async () => {
    try {
      const response = await fetch('https://vinsup-4vt5.onrender.com/api/employees');
      const result = await response.json();
      if (result.success) { 
        const trainers = result.data.filter(emp => emp.designation === 'Trainer');
        setTrainersList(trainers); 
      }
    } catch (error) { console.error("Error fetching trainers:", error); }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('https://vinsup-4vt5.onrender.com/api/courses');
      const result = await response.json();
      if (result.success) { 
        setCoursesList(result.data); 
      }
    } catch (error) { console.error("Error fetching courses:", error); }
  };

  useEffect(() => { 
    fetchBatches(); 
    fetchTrainers();
    fetchCourses(); 
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDelete = async (batchToDelete, e) => {
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete ${batchToDelete.batchName}?`)) {
      try {
        const response = await fetch(`https://vinsup-4vt5.onrender.com/api/batches/delete/${batchToDelete._id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          setBatchList(prevList => prevList.filter(b => b._id !== batchToDelete._id));
          alert("Batch Deleted Successfully! 🗑️");
        }
      } catch (error) { alert("Failed to delete batch!"); }
    }
  };

  const handleEdit = (batchToEdit, e) => {
    e.preventDefault();
    setFormData({
      batchName: batchToEdit.batchName, 
      batchType: batchToEdit.batchType,
      courseName: batchToEdit.courseName, 
      trainerName: batchToEdit.trainerName,
      studentsCount: batchToEdit.studentsCount, 
      startDate: batchToEdit.startDate, 
      endDate: batchToEdit.endDate
    });
    setEditId(batchToEdit._id); 
    setShowAddForm(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    try {
      let isSuccess = false;
      let isEdit = !!editId;

      if (isEdit) {
        const response = await fetch(`https://vinsup-4vt5.onrender.com/api/batches/update/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
        });
        if ((await response.json()).success) { 
          alert("Batch Updated Successfully! ✏️"); 
          isSuccess = true; 
        }
      } else {
        const response = await fetch('https://vinsup-4vt5.onrender.com/api/batches/add', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, progress: 0, status: 'Ongoing' }) 
        });
        if ((await response.json()).success) { 
          alert("New Batch Added! 🚀"); 
          isSuccess = true; 
        }
      }

      if (isSuccess) {
        fetchBatches();

        // 🔥 PUDHU FIX: Only send notification from Frontend if it's an EDIT. Backend handles NEW batch notification automatically. 🔥
        if (isEdit && formData.trainerName) {
          const assignedTrainer = trainersList.find(t => t.fullName === formData.trainerName);
          if (assignedTrainer && assignedTrainer.email) {
            const notifPayload = {
              type: 'Batch',
              title: 'Batch Updated',
              message: `Admin updated details for your batch: ${formData.batchName}.`,
              recipientEmail: assignedTrainer.email.toLowerCase().trim()
            };

            await fetch('https://vinsup-4vt5.onrender.com/api/notifications/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notifPayload)
            }).catch(err => console.log("Notification send error:", err));
          }
        }
      }

      setShowAddForm(false); setEditId(null); setFormData(initialFormState); 
    } catch (error) { alert("Something went wrong!"); }
  };

  const filteredByTab = batchList.filter(batch => {
    if (activeBatchTab === 'Active') {
      return batch.status !== 'Completed';
    } else {
      return batch.status === 'Completed'; 
    }
  });

  const displayedBatches = filteredByTab.filter(batch => {
    if (!searchInput) return true;
    const query = searchInput.toLowerCase();
    return batch.batchName?.toLowerCase().includes(query) || batch.courseName?.toLowerCase().includes(query);
  });

  const totalBatches = batchList.length;
  const completedBatches = batchList.filter(b => b.status === 'Completed').length; 
  const currentBatches = totalBatches - completedBatches; 
  const totalStudents = batchList.reduce((acc, curr) => acc + (Number(curr.studentsCount) || 0), 0);
  
  const currentStudents = batchList
    .filter(b => b.status !== 'Completed')
    .reduce((acc, curr) => acc + (Number(curr.studentsCount) || 0), 0);

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const getTrainerDetails = (trainerName) => {
    const trainer = trainersList.find(t => t.fullName === trainerName);
    let imageUrl = defaultAvatar;
    
    if (trainer && trainer.profilePhoto) {
      if (trainer.profilePhoto.startsWith('http') || trainer.profilePhoto.startsWith('data:')) {
        imageUrl = trainer.profilePhoto;
      } else {
        let cleanPath = trainer.profilePhoto.replace(/\\/g, '/');
        if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
        imageUrl = `https://vinsup-4vt5.onrender.com/${cleanPath}`;
      }
    }
    return { ...trainer, displayImage: imageUrl };
  };

  if (showAddForm) {
    return (
      <div className="employees-container form-view">
        <div className="page-header flex-between">
          <div>
            <h2>{editId ? "Edit Batch" : "Add Batch"}</h2>
            <p className="breadcrumb">Dashboard &gt; Batches &gt; {editId ? "Edit" : "Add"}</p>
          </div>
          <button className="btn-secondary" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); }}>
            <i className="fas fa-arrow-left"></i> Back to List
          </button>
        </div>
        <form className="add-employee-form" onSubmit={handleSaveBatch}>
          <div className="form-section">
            <h3>👥 Batch Information</h3>
            <div className="form-grid">
              <div className="input-group"><label>Batch Name *</label><input type="text" name="batchName" value={formData.batchName} onChange={handleInputChange} required /></div>
              <div className="input-group"><label>Batch Type (Schedule) *</label><input type="text" name="batchType" value={formData.batchType} onChange={handleInputChange} required /></div>
              
              <div className="input-group">
                <label>Course Name *</label>
                <select name="courseName" value={formData.courseName} onChange={handleInputChange} required>
                  <option value="">Select a Course</option>
                  {coursesList.map((course) => (
                    <option key={course._id} value={course.courseName}>
                      {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Trainer Name</label>
                <select name="trainerName" value={formData.trainerName} onChange={handleInputChange}>
                  <option value="">Select a Trainer</option>
                  {trainersList.map((trainer) => (
                    <option key={trainer._id} value={trainer.fullName}>
                      {trainer.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group"><label>Students Count</label><input type="number" name="studentsCount" value={formData.studentsCount} onChange={handleInputChange} min="0" /></div>
              <div className="input-group"><label>Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} /></div>
              <div className="input-group"><label>End Date</label><input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} /></div>
            </div>
          </div>
          <hr className="divider" />
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); }}>Cancel</button>
            <button type="button" className="btn-reset" onClick={() => setFormData(initialFormState)}>Reset</button>
            <button type="submit" className="btn-save">{editId ? "Update Batch" : "Save Batch"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="employees-container" style={{ position: 'relative' }}>
      <div className="page-header flex-between">
        <div>
          <h2>Batches</h2>
          <p className="breadcrumb">Dashboard &gt; Batches</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAddForm(true); setEditId(null); setFormData(initialFormState); }}>
          <i className="fas fa-plus"></i> Add Batch
        </button>
      </div>

      <div className="emp-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' }}>
        <div className="emp-stat-card">
            <div className="icon" style={{ background: '#fff7ed', color: '#ea580c', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                <i className="fas fa-spinner"></i>
            </div>
            <div className="info"><p>Current Batches</p><h3>{currentBatches}</h3></div>
        </div>
        <div className="emp-stat-card">
            <div className="icon" style={{ background: '#f0fdfa', color: '#14b8a6', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                <i className="fas fa-user-graduate"></i>
            </div>
            <div className="info"><p>Current Students</p><h3>{currentStudents}</h3></div>
        </div>
        <div className="emp-stat-card">
          <div className="icon blue"><i className="fas fa-layer-group"></i></div>
          <div className="info"><p>Total Batches</p><h3>{totalBatches}</h3></div>
        </div>
        <div className="emp-stat-card">
          <div className="icon pink"><i className="fas fa-users"></i></div>
          <div className="info"><p>Total Students</p><h3>{totalStudents}</h3></div>
        </div>
        <div className="emp-stat-card">
          <div className="icon purple"><i className="fas fa-check-circle"></i></div>
          <div className="info"><p>Completed Batches</p><h3>{completedBatches}</h3></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div 
          onClick={() => setActiveBatchTab('Active')} 
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeBatchTab === 'Active' ? '#2563eb' : '#64748b', borderBottom: activeBatchTab === 'Active' ? '3px solid #2563eb' : '3px solid transparent', transition: '0.2s' }}
        >
          Active Batches
        </div>
        <div 
          onClick={() => setActiveBatchTab('History')} 
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeBatchTab === 'History' ? '#16a34a' : '#64748b', borderBottom: activeBatchTab === 'History' ? '3px solid #16a34a' : '3px solid transparent', transition: '0.2s' }}
        >
          Old Batches
        </div>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '10px', background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div className="search-box" style={{ flex: 1 }}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder={`Search ${activeBatchTab === 'Active' ? 'ongoing' : 'completed'} batches by name or course...`} 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
          />
        </div>
      </div>

      <div className="table-container" style={{ marginTop: '20px', borderRadius: '10px', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Batch Name</th>
              <th>Course</th>
              <th>Trainer</th>
              <th>Students</th>
              <th>Start Date</th>
              <th>Status</th>
              <th style={{ width: '150px' }}>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedBatches.length > 0 ? (
              displayedBatches.map((batch, index) => {
                const currentTrainer = getTrainerDetails(batch.trainerName); 
                const isCompleted = batch.status === 'Completed';
                
                return (
                <tr key={batch._id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>{batch.batchName}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{batch.batchType}</span>
                  </td>
                  <td style={{ fontWeight: '500', color: '#334155' }}>{batch.courseName}</td>
                  <td style={{ color: '#475569' }}>
                    {batch.trainerName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={currentTrainer.displayImage} alt="Trainer" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontWeight: '500' }}>{batch.trainerName}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>{batch.studentsCount || 0}</td>
                  <td style={{ color: '#475569', fontSize: '13px' }}>{batch.startDate || '-'}</td>
                  
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', background: isCompleted ? '#dcfce7' : '#fef9c3', color: isCompleted ? '#16a34a' : '#ca8a04' }}>
                      {isCompleted ? 'Completed' : 'Ongoing'}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: isCompleted ? '#16a34a' : '#3b82f6', minWidth: '35px' }}>{batch.progress || 0}%</span>
                      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${batch.progress || 0}%`, background: isCompleted ? '#16a34a' : '#3b82f6', height: '100%', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button type="button" className="action-btn" onClick={() => { setViewBatch(batch); setActiveViewTab('Overview'); }} style={{ marginRight: '8px', color: '#8b5cf6', background: '#f5f3ff' }}><i className="fas fa-eye"></i></button>
                    <button type="button" className="action-btn edit" onClick={(e) => handleEdit(batch, e)} style={{ marginRight: '8px', color: '#3b82f6', background: '#eff6ff' }}><i className="fas fa-edit"></i></button>
                    <button type="button" className="action-btn delete" onClick={(e) => handleDelete(batch, e)} style={{ color: '#ef4444', background: '#fef2f2' }}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              )})
            ) : (
              <tr>
                <td colSpan="9" className="empty-table" style={{ padding: '40px 0', color: '#94a3b8' }}>
                  {searchInput 
                    ? `No ${activeBatchTab === 'Active' ? 'ongoing' : 'completed'} batches found matching your search.` 
                    : `No ${activeBatchTab === 'Active' ? 'ongoing' : 'completed'} batches available.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewBatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', width: '95%', maxWidth: '900px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: '0 0 20px', color: '#1e293b' }}>Batch Details</h2>
              <button onClick={() => setViewBatch(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}><i className="fas fa-times"></i></button>
            </div>

            <div style={{ overflowY: 'auto', padding: '25px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <div style={{ width: '55px', height: '55px', background: '#ef4444', color: '#fff', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                  {viewBatch.batchName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {viewBatch.batchName} 
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Status: {viewBatch.status || 'Ongoing'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#f8fafc', borderRadius: '10px', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Course</span>
                    <strong style={{ color: '#334155', fontSize: '15px' }}>{viewBatch.courseName}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={getTrainerDetails(viewBatch.trainerName).displayImage} alt="Trainer" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Trainer</span>
                    <strong style={{ color: '#334155', fontSize: '15px' }}>{viewBatch.trainerName || 'Not Assigned'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '26px', color: '#3b82f6' }}><i className="far fa-clock"></i></div>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Duration</span>
                    <strong style={{ color: '#334155', fontSize: '15px' }}>{viewBatch.startDate || '-'} to {viewBatch.endDate || '-'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '26px', color: '#6366f1' }}><i className="far fa-calendar-alt"></i></div>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Schedule</span>
                    <strong style={{ color: '#334155', fontSize: '15px' }}>{viewBatch.batchType || '-'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>Students</span>
                    <strong style={{ color: '#334155', fontSize: '15px' }}>{viewBatch.studentsCount || 0}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #e2e8f0', marginBottom: '25px' }}>
                {['Overview', `Students (${viewBatch.studentsCount || 0})`].map(tab => (
                  <div key={tab} onClick={() => setActiveViewTab(tab)} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '600', color: activeViewTab === tab ? '#2563eb' : '#64748b', borderBottom: activeViewTab === tab ? '3px solid #2563eb' : '3px solid transparent', transition: '0.2s' }}>
                    {tab}
                  </div>
                ))}
              </div>

              {activeViewTab === 'Overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Batch Description</h4>
                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                      This batch covers the complete {viewBatch.courseName} from basics to advanced level with real-time projects. Exclusively mapped for {viewBatch.batchType}.
                    </p>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Progress Overview</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke={viewBatch.status === 'Completed' ? '#16a34a' : '#3b82f6'} strokeWidth="8" strokeDasharray={`${(viewBatch.progress || 0) * 2.51} 251`} strokeDashoffset="0" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s ease-in-out' }} />
                        </svg>
                        
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <strong style={{ fontSize: '20px', color: '#0f172a' }}>{viewBatch.progress || 0}%</strong>
                        </div>
                        
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#16a34a' }}></div>
                          <span style={{ fontSize: '14px', color: '#475569' }}>Completed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
                          <span style={{ fontSize: '14px', color: '#475569' }}>In Progress</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Batch Information</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#475569' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span>• Batch Type</span><strong>{viewBatch.batchType}</strong></li>
                      <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span>• Start Date</span><strong>{viewBatch.startDate || '-'}</strong></li>
                      <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span>• End Date</span><strong>{viewBatch.endDate || '-'}</strong></li>
                      <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span>• Total Students</span><strong>{viewBatch.studentsCount || 0}</strong></li>
                    </ul>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Assigned Trainer</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                      <img src={getTrainerDetails(viewBatch.trainerName).displayImage} alt="Trainer" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <strong style={{ display: 'block', color: '#1e293b', fontSize: '16px' }}>{viewBatch.trainerName || 'Not Assigned'}</strong>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Primary Trainer</span>
                      </div>
                    </div>
                    {viewBatch.trainerName && (
                      <div style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><i className="fas fa-envelope"></i> {getTrainerDetails(viewBatch.trainerName).email || 'Not Provided'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><i className="fas fa-phone"></i> {getTrainerDetails(viewBatch.trainerName).phone || 'Not Provided'}</div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeViewTab !== 'Overview' && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
                  <i className="fas fa-user-graduate" style={{ fontSize: '40px', marginBottom: '15px', color: '#94a3b8' }}></i>
                  <h3 style={{ color: '#475569', margin: '0 0 10px 0' }}>Students List Coming Soon</h3>
                  <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '14px' }}>
                    Student details including Name, Age, Phone Number, Std ID, Email, and DOB will be populated here directly from the user portal later.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Batches;