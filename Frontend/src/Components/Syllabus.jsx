import React, { useState, useEffect } from 'react';
import './Employees.css';

const Syllabus = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [syllabusList, setSyllabusList] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  // Dynamic Courses Dropdown
  const [coursesList, setCoursesList] = useState([]);

  // View Modal State
  const [viewSyllabus, setViewSyllabus] = useState(null);

  // Basic Info State
  const initialFormState = { courseName: '', duration: '', description: '' };
  const [formData, setFormData] = useState(initialFormState);

  // Dynamic Modules State
  const [modules, setModules] = useState([{ title: '', topics: [''] }]);

  // 1. FETCH SYLLABUS API (GET)
  const fetchSyllabus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/syllabus');
      const result = await response.json();
      if (result.success) {
        setSyllabusList(result.data);
      }
    } catch (error) {
      console.error("Error fetching syllabus:", error);
    }
  };

  // 2. FETCH COURSES API (GET)
  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/courses');
      const result = await response.json();
      if (result.success) {
        setCoursesList(result.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    fetchSyllabus();
    fetchCourses(); 
  }, []);

  // 🔥 UPDATED: Auto-fill Logic Added Here 🔥
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'courseName') {
      // Select aana course-oda data-va coursesList-la irundhu edukurom
      const selectedCourse = coursesList.find(c => c.courseName === value);
      
      setFormData({ 
        ...formData, 
        courseName: value,
        // Course data irundha adha fill pannum, illana empty aakkidum
        duration: selectedCourse?.duration || '',
        description: selectedCourse?.description || ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ================= MODULE BUILDER LOGICS =================
  const handleAddModule = () => {
    setModules([...modules, { title: '', topics: [''] }]);
  };

  const handleRemoveModule = (modIndex) => {
    const updated = [...modules];
    updated.splice(modIndex, 1);
    setModules(updated);
  };

  const handleModuleTitleChange = (text, modIndex) => {
    const updated = [...modules];
    updated[modIndex].title = text;
    setModules(updated);
  };

  const handleAddTopic = (modIndex) => {
    const updated = [...modules];
    updated[modIndex].topics.push('');
    setModules(updated);
  };

  const handleRemoveTopic = (modIndex, topicIndex) => {
    const updated = [...modules];
    updated[modIndex].topics.splice(topicIndex, 1);
    setModules(updated);
  };

  const handleTopicChange = (text, modIndex, topicIndex) => {
    const updated = [...modules];
    updated[modIndex].topics[topicIndex] = text;
    setModules(updated);
  };
  // =========================================================

  // DELETE API
  const handleDelete = async (syllabusToDelete, e) => {
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete ${syllabusToDelete.courseName} syllabus?`)) {
      try {
        const response = await fetch(`http://localhost:5001/api/syllabus/delete/${syllabusToDelete._id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          setSyllabusList(prev => prev.filter(s => s._id !== syllabusToDelete._id));
          alert("Syllabus Deleted Successfully! 🗑️");
        }
      } catch (error) { alert("Failed to delete syllabus!"); }
    }
  };

  // EDIT SETUP
  const handleEdit = (syllabusToEdit, e) => {
    e.preventDefault();
    setFormData({
      courseName: syllabusToEdit.courseName,
      duration: syllabusToEdit.duration,
      description: syllabusToEdit.description
    });
    setModules(syllabusToEdit.modules && syllabusToEdit.modules.length > 0 ? syllabusToEdit.modules : [{ title: '', topics: [''] }]);
    setEditId(syllabusToEdit._id);
    setShowAddForm(true);
  };

  // SAVE / UPDATE API
  const handleSaveSyllabus = async (e) => {
    e.preventDefault();
    const submitData = { ...formData, modules: modules };

    try {
      if (editId) {
        const response = await fetch(`http://localhost:5001/api/syllabus/update/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData)
        });
        if ((await response.json()).success) { alert("Syllabus Updated Successfully! ✏️"); fetchSyllabus(); }
      } else {
        const response = await fetch('http://localhost:5001/api/syllabus/add', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData)
        });
        if ((await response.json()).success) { alert("New Syllabus Added! 🚀"); fetchSyllabus(); }
      }
      setShowAddForm(false); setEditId(null); 
      setFormData(initialFormState); setModules([{ title: '', topics: [''] }]);
    } catch (error) { alert("Something went wrong!"); }
  };

  // Live Filter
  const displayedSyllabus = syllabusList.filter(s => {
    if (!searchInput) return true;
    const query = searchInput.toLowerCase();
    return s.courseName?.toLowerCase().includes(query);
  });

  if (showAddForm) {
    return (
      <div className="employees-container form-view">
        <div className="page-header flex-between">
          <div>
            <h2>{editId ? "Edit Syllabus" : "Syllabus Management"}</h2>
            <p className="breadcrumb">Dashboard &gt; Syllabus {editId ? "> Edit" : ""}</p>
          </div>
          <button className="btn-secondary" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); setModules([{ title: '', topics: [''] }]); }}>
            <i className="fas fa-arrow-left"></i> Back to List
          </button>
        </div>

        <form className="add-employee-form" onSubmit={handleSaveSyllabus}>
          <div className="form-section">
            <h3>📚 Course Syllabus Basic Info</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Course Name *</label>
                <select 
                  name="courseName" 
                  value={formData.courseName} 
                  onChange={handleInputChange} 
                  required 
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', background: '#fff' }}
                >
                  <option value="">Select Course</option>
                  {coursesList.map(c => (
                    <option key={c._id} value={c.courseName}>{c.courseName}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Total Duration *</label>
                <input type="text" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="e.g., 60-80 hrs" required style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="input-group full-width">
                <label>Course Description</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} placeholder="Brief about the course..." style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="form-section" style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>📦 Module Builder</h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Create modules and add topics step-by-step.</p>
              </div>
              <button type="button" onClick={handleAddModule} style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                <i className="fas fa-plus"></i> Add New Module
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {modules.map((mod, mIndex) => (
                <div key={mIndex} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ background: '#334155', color: '#fff', width: '30px', height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{mIndex + 1}</div>
                    <input 
                      type="text" 
                      placeholder={`Module ${mIndex + 1} Title`} 
                      value={mod.title} 
                      onChange={(e) => handleModuleTitleChange(e.target.value, mIndex)} 
                      style={{ flex: 1, padding: '10px 15px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }} 
                      required 
                    />
                    {modules.length > 1 && (
                      <button type="button" onClick={() => handleRemoveModule(mIndex)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', width: '40px', height: '40px', borderRadius: '6px', cursor: 'pointer' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>

                  <div style={{ paddingLeft: '45px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px' }}>Topics Covered:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {mod.topics.map((topic, tIndex) => (
                        <div key={tIndex} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <i className="fas fa-play" style={{ color: '#94a3b8', fontSize: '10px' }}></i>
                          <input 
                            type="text" 
                            placeholder="Enter topic name..." 
                            value={topic} 
                            onChange={(e) => handleTopicChange(e.target.value, mIndex, tIndex)} 
                            style={{ flex: 1, padding: '8px 15px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', fontSize: '14px' }} 
                            required 
                          />
                          {mod.topics.length > 1 && (
                            <button type="button" onClick={() => handleRemoveTopic(mIndex, tIndex)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}>
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => handleAddTopic(mIndex)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fas fa-plus-circle"></i> Add Topic
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>

          <hr className="divider" />

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); setModules([{ title: '', topics: [''] }]); }}>Cancel</button>
            <button type="submit" className="btn-save">{editId ? "Update Syllabus" : "Save Syllabus"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="employees-container" style={{ position: 'relative' }}>
      <div className="page-header flex-between">
        <div>
          <h2>Syllabus Management</h2>
          <p className="breadcrumb">Dashboard &gt; Syllabus</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAddForm(true); setEditId(null); setFormData(initialFormState); setModules([{ title: '', topics: [''] }]); }}>
          <i className="fas fa-plus"></i> Create Syllabus
        </button>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '10px', background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
        <div className="search-box" style={{ flex: 1 }}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search syllabus by course name..." 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
          />
        </div>
      </div>

      <div className="table-container" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Course Name</th>
              <th>Duration</th>
              <th>Total Modules</th>
              <th style={{ width: '40%' }}>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedSyllabus.length > 0 ? (
              displayedSyllabus.map((syllabus, index) => (
                <tr key={syllabus._id || index}>
                  <td>{index + 1}</td>
                  <td><strong style={{ color: '#1e293b' }}>{syllabus.courseName}</strong></td>
                  <td style={{ color: '#475569', fontWeight: '500' }}>{syllabus.duration}</td>
                  <td>
                    <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {syllabus.modules?.length || 0} Modules
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                    {syllabus.description ? (syllabus.description.length > 60 ? syllabus.description.substring(0, 60) + '...' : syllabus.description) : '-'}
                  </td>
                  <td>
                    <button type="button" className="action-btn" onClick={() => setViewSyllabus(syllabus)} style={{ marginRight: '8px', color: '#8b5cf6', background: '#f5f3ff' }}><i className="fas fa-eye"></i></button>
                    <button type="button" className="action-btn edit" onClick={(e) => handleEdit(syllabus, e)} style={{ marginRight: '8px', color: '#3b82f6', background: '#eff6ff' }}><i className="fas fa-edit"></i></button>
                    <button type="button" className="action-btn delete" onClick={(e) => handleDelete(syllabus, e)} style={{ color: '#ef4444', background: '#fef2f2' }}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-table" style={{ padding: '40px 0', color: '#94a3b8' }}>
                  {searchInput ? "No syllabus found matching your search." : "No syllabus created yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== VIEW SYLLABUS MODAL ===================== */}
      {viewSyllabus && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', width: '95%', maxWidth: '800px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{viewSyllabus.courseName}</h2>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Complete Course Syllabus</span>
              </div>
              <button onClick={() => setViewSyllabus(null)} style={{ background: '#e2e8f0', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ overflowY: 'auto', padding: '25px' }}>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', background: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>Duration</span>
                  <strong style={{ color: '#1e3a8a', fontSize: '15px' }}>{viewSyllabus.duration}</strong>
                </div>
                <div style={{ borderLeft: '1px solid #93c5fd', paddingLeft: '20px' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>Total Modules</span>
                  <strong style={{ color: '#1e3a8a', fontSize: '15px' }}>{viewSyllabus.modules?.length || 0} Modules</strong>
                </div>
              </div>

              {viewSyllabus.description && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '15px' }}>Course Overview</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>{viewSyllabus.description}</p>
                </div>
              )}

              <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                <i className="fas fa-layer-group" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                Curriculum Breakdown
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {viewSyllabus.modules && viewSyllabus.modules.length > 0 ? (
                  viewSyllabus.modules.map((mod, mIdx) => (
                    <div key={mIdx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ background: '#2563eb', color: '#fff', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                          M{mIdx + 1}
                        </div>
                        <h5 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>{mod.title}</h5>
                      </div>
                      <div style={{ padding: '15px' }}>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {mod.topics && mod.topics.length > 0 ? (
                            mod.topics.map((topic, tIdx) => (
                              <li key={tIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#475569' }}>
                                <i className="far fa-check-circle" style={{ color: '#10b981', marginTop: '3px' }}></i>
                                <span>{topic}</span>
                              </li>
                            ))
                          ) : (
                            <li style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No topics added.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    No modules available for this syllabus.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Syllabus;