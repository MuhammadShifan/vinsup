import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Students = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🔥 Edit States 🔥
  const [isEditing, setIsEditing] = useState(false);
  const [editDbId, setEditDbId] = useState(null);

  // Dynamic States for API Data
  const [studentsList, setStudentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [trainersList, setTrainersList] = useState([]);
  const [syllabusList, setSyllabusList] = useState([]);
  
  // Initial Form State
  const initialFormState = {
    studentId: '', fullName: '', email: '', phone: '', dob: '', gender: '', address: '',
    emergencyName: '', emergencyPhone: '', course: '', batch: '', trainer: '', doj: '',
    previousEdu: '', skills: '', remarks: '', profilePhoto: null
  };
  const [formData, setFormData] = useState(initialFormState);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const fetchData = async () => {
    try {
      const stuRes = await axios.get('https://vinsup-4vt5.onrender.com/api/students').catch(() => null);
      const stuData = stuRes?.data?.data || stuRes?.data || [];
      const validStudents = Array.isArray(stuData) ? stuData : [];
      setStudentsList(validStudents);
      
      if (validStudents.length > 0 && !activeStudentId) {
        setActiveStudentId(validStudents[0].studentId);
      }

      const crsRes = await axios.get('https://vinsup-4vt5.onrender.com/api/courses').catch(() => null);
      const crsData = crsRes?.data?.data || crsRes?.data || [];
      setCoursesList(Array.isArray(crsData) ? crsData : []);

      const bthRes = await axios.get('https://vinsup-4vt5.onrender.com/api/batches').catch(() => null);
      const bthData = bthRes?.data?.data || bthRes?.data || [];
      setBatchesList(Array.isArray(bthData) ? bthData : []);

      const empRes = await axios.get('https://vinsup-4vt5.onrender.com/api/employees').catch(() => null);
      const empData = empRes?.data?.data || empRes?.data || [];
      const allEmp = Array.isArray(empData) ? empData : [];
      
      setTrainersList(allEmp.filter(e => {
        const role = (e.designation || e.role || '').toLowerCase();
        return role.includes('trainer') || role.includes('faculty');
      }));

      const sylRes = await axios.get('https://vinsup-4vt5.onrender.com/api/syllabus').catch(() => null);
      const sylData = sylRes?.data?.data || sylRes?.data || [];
      setSyllabusList(Array.isArray(sylData) ? sylData : []);

    } catch (error) {
      console.error("Error fetching dependencies:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'course') {
      setFormData({ ...formData, course: value, batch: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, profilePhoto: e.target.files[0] });
    }
  };

  const handleEditClick = (student) => {
    setFormData({
      studentId: student.studentId || '',
      fullName: student.fullName || '',
      email: student.email || '',
      phone: student.phone || '',
      dob: formatDateForInput(student.dob),
      gender: student.gender || '',
      address: student.address || '',
      emergencyName: student.emergencyName || '',
      emergencyPhone: student.emergencyPhone || '',
      course: student.course || '',
      batch: student.batch || '',
      trainer: student.trainer || '',
      doj: formatDateForInput(student.doj),
      previousEdu: student.previousEdu || '',
      skills: student.skills || '',
      remarks: student.remarks || '',
      profilePhoto: null
    });
    setEditDbId(student._id);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleSaveStudent = async () => {
    if (
      !formData.studentId || !formData.fullName || !formData.email || !formData.phone || 
      !formData.dob || !formData.gender || !formData.address || !formData.course || 
      !formData.batch || !formData.doj
    ) {
      alert("Please fill all required (*) fields!");
      return;
    }

    const submitData = new FormData();
    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        submitData.append(key, formData[key]);
      }
    }

    try {
      let response;
      if (isEditing) {
        response = await axios.put(`https://vinsup-4vt5.onrender.com/api/students/update/${editDbId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post('https://vinsup-4vt5.onrender.com/api/students/add', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (response.data.success) {
        alert(`Student ${isEditing ? 'Updated' : 'Added'} Successfully! 🎉`);
        setShowAddForm(false);
        setIsEditing(false);
        setEditDbId(null);
        setFormData(initialFormState);
        fetchData(); 
      }
    } catch (error) {
      alert(error.response?.data?.message || `Server Error: Failed to ${isEditing ? 'update' : 'add'} student!`);
    }
  };

  const handleDeleteStudent = async (dbId, stuName) => {
    if (window.confirm(`Are you sure you want to delete ${stuName}?`)) {
      try {
        const response = await axios.delete(`https://vinsup-4vt5.onrender.com/api/students/delete/${dbId}`);
        if (response.data.success) {
          alert("Student Deleted! 🗑️");
          setActiveStudentId(null);
          fetchData();
        }
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setIsEditing(false);
    setEditDbId(null);
    setFormData(initialFormState);
  };

  const getPhotoUrl = (rawPath) => {
    if (!rawPath) return null;
    if (rawPath.startsWith('http') || rawPath.startsWith('data:image')) return rawPath;
    let cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
    return `https://vinsup-4vt5.onrender.com/${cleanPath}`;
  };

  const filteredStudents = studentsList.filter(stu => 
    stu.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stu.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stu.course || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStudentData = studentsList.find(s => s.studentId === activeStudentId);

  const displayStudent = activeStudentData ? {
    _id: activeStudentData._id,
    id: activeStudentData.studentId || '---', 
    name: activeStudentData.fullName || '---', 
    status: activeStudentData.status || 'Active',
    course: activeStudentData.course || '---', 
    batch: activeStudentData.batch || '---',
    email: activeStudentData.email || '---', 
    phone: activeStudentData.phone || '---', 
    location: activeStudentData.address || '---',
    doj: activeStudentData.doj ? new Date(activeStudentData.doj).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '---', 
    dob: activeStudentData.dob ? new Date(activeStudentData.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '---', 
    gender: activeStudentData.gender || '---', 
    trainer: activeStudentData.trainer || 'Not Assigned', 
    duration: '6 Months',
    image: getPhotoUrl(activeStudentData.profilePhoto)
  } : {
    id: '---', name: 'No Student Selected', status: 'Pending',
    course: '---', batch: '---', email: '---', phone: '---', location: '---',
    doj: '---', dob: '---', gender: '---', trainer: '---', duration: '---',
    image: null
  };

  // Get Progress from the Specific Batch
  const studentBatch = batchesList.find(b => {
    const bName = String(b.batchName || b.batchId || b.name || "").toLowerCase().trim();
    const sBatch = String(displayStudent.batch || "").toLowerCase().trim();
    return bName === sBatch && bName !== "";
  });
  const batchProgress = studentBatch ? (studentBatch.progress || 0) : 0;

  const currentSyllabus = syllabusList.find(s => 
    (s.courseName || s.course) === displayStudent.course
  );
  const dynamicModules = currentSyllabus && currentSyllabus.modules ? currentSyllabus.modules : [];
  
  let totalSyllabusConcepts = 0;
  dynamicModules.forEach(mod => {
    totalSyllabusConcepts += (mod.totalConcepts || mod.topics?.length || 0);
  });

  // Calculate proportional topics completed
  let tempRemaining = Math.round((batchProgress / 100) * totalSyllabusConcepts);
  
  const modulesWithProgress = dynamicModules.map(mod => {
    const total = mod.totalConcepts || mod.topics?.length || 0;
    let comp = 0;
    if (tempRemaining >= total) {
        comp = total;
        tempRemaining -= total;
    } else {
        comp = tempRemaining;
        tempRemaining = 0;
    }
    const prog = total > 0 ? Math.round((comp / total) * 100) : 0;
    return { ...mod, prog };
  });

  const renderAddStudentForm = () => (
    <div className="students-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEditing ? 'Edit Student' : 'Add Student'}</h1>
          <div className="breadcrumb">Dashboard &nbsp;&gt;&nbsp; Students &nbsp;&gt;&nbsp; <span className="active-bread">{isEditing ? 'Edit Student' : 'Add Student'}</span></div>
        </div>
        <button className="btn-outline" onClick={handleCancelForm}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
      </div>

      <div className="form-container">
        {/* Left Column: Personal Info */}
        <div className="form-column">
          <div className="section-title"><i className="far fa-user"></i> 1. Personal Information</div>
          
          <div className="form-grid-2">
            <div className="form-group">
              <label>Student ID <span className="text-danger">*</span></label>
              <input type="text" name="studentId" value={formData.studentId} onChange={handleInputChange} placeholder="e.g. STU005" className="form-control" readOnly={isEditing} style={isEditing ? {backgroundColor: '#f1f5f9', cursor: 'not-allowed'} : {}} />
            </div>
            <div className="form-group">
              <label>Full Name <span className="text-danger">*</span></label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter full name" className="form-control" />
            </div>
            <div className="form-group">
              <label>Email ID <span className="text-danger">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email address" className="form-control" />
            </div>
            <div className="form-group">
              <label>Phone Number <span className="text-danger">*</span></label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number" className="form-control" />
            </div>
            <div className="form-group">
              <label>Date of Birth <span className="text-danger">*</span></label>
              <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="form-control text-muted" />
            </div>
            <div className="form-group">
              <label>Gender <span className="text-danger">*</span></label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-control text-muted">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-group mt-3">
            <label>Address <span className="text-danger">*</span></label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter full address" className="form-control" rows="3"></textarea>
          </div>

          <div className="form-grid-2 mt-3">
            <div className="form-group">
              <label>Emergency Contact Name</label>
              <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleInputChange} placeholder="Enter contact name" className="form-control" />
            </div>
            <div className="form-group">
              <label>Emergency Contact Number</label>
              <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} placeholder="Enter contact number" className="form-control" />
            </div>
          </div>

          <div className="form-group mt-3">
            <label>Upload Photo {isEditing && <span className="text-muted" style={{fontSize: '11px'}}>(Leave empty to keep current)</span>}</label>
            <div className="upload-box" onClick={() => document.getElementById('stuPhotoInput').click()}>
              <i className="fas fa-cloud-upload-alt text-primary mb-2" style={{fontSize: '24px'}}></i>
              <div className="fw-semibold text-dark">
                {formData.profilePhoto ? formData.profilePhoto.name : (isEditing ? "Click to change photo" : "Click to upload photo")}
              </div>
              <div className="text-muted" style={{fontSize: '12px'}}>JPG, PNG (Max. 2MB)</div>
              <input id="stuPhotoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            </div>
          </div>
        </div>

        {/* Right Column: Academic & Additional */}
        <div className="form-column">
          <div className="section-title"><i className="fas fa-graduation-cap"></i> 2. Academic Information</div>
          
          <div className="form-grid-2">
            <div className="form-group">
              <label>Select Course <span className="text-danger">*</span></label>
              <select name="course" value={formData.course} onChange={handleInputChange} className="form-control text-muted">
                <option value="">Select course</option>
                {coursesList.map(c => {
                   const cName = c.courseName || c.courseTitle || c.title || c.name || "Unnamed Course";
                   return <option key={c._id || c.courseName} value={cName}>{cName}</option>
                })}
              </select>
            </div>
            <div className="form-group">
              <label>Select Batch <span className="text-danger">*</span></label>
              <select name="batch" value={formData.batch} onChange={handleInputChange} className="form-control text-muted">
                <option value="">Select batch</option>
                {batchesList
                  .filter(b => !formData.course || (b.courseName && b.courseName.toLowerCase() === formData.course.toLowerCase()))
                  .map(b => {
                     const bName = b.batchName || b.batchId || b.name || "Unnamed Batch";
                     const cName = b.courseName || "";
                     const displayLabel = cName ? `${cName} - ${bName}` : bName;
                     return <option key={b._id || b.batchName} value={bName}>{displayLabel}</option>
                  })
                }
              </select>
            </div>
            <div className="form-group">
              <label>Trainer</label>
              <select name="trainer" value={formData.trainer} onChange={handleInputChange} className="form-control text-muted">
                <option value="">Select trainer (Optional)</option>
                {trainersList.map(t => {
                   const tName = t.fullName || t.name || t.username || "Unnamed Trainer";
                   return <option key={t._id || t.fullName} value={tName}>{tName}</option>
                })}
              </select>
            </div>
            <div className="form-group">
              <label>Date of Joining <span className="text-danger">*</span></label>
              <input type="date" name="doj" value={formData.doj} onChange={handleInputChange} className="form-control text-muted" />
            </div>
          </div>

          <div className="alert-blue mt-3">
            <div className="fw-semibold text-primary"><i className="fas fa-info-circle me-1"></i> Note</div>
            <div className="text-muted mt-1" style={{fontSize:'13px'}}>{isEditing ? 'Student profile will be updated.' : 'Student will be added and can be managed from the Students list.'}</div>
          </div>

          <div className="section-title mt-5"><i className="fas fa-clipboard-list"></i> 3. Additional Information <span className="text-muted fw-normal" style={{fontSize:'13px'}}>(Optional)</span></div>
          
          <div className="form-group">
            <label>Previous Education</label>
            <input type="text" name="previousEdu" value={formData.previousEdu} onChange={handleInputChange} placeholder="Enter previous education" className="form-control" />
          </div>
          <div className="form-group mt-3">
            <label>Skills / Interests</label>
            <input type="text" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="Enter skills or interests" className="form-control" />
          </div>
          <div className="form-group mt-3">
            <label>Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Enter any remarks" className="form-control" rows="3"></textarea>
          </div>
        </div>
      </div>

      <div className="form-footer">
        <button className="btn-outline-gray" onClick={() => setFormData(initialFormState)}><i className="fas fa-redo-alt me-2"></i> Reset</button>
        <div className="footer-right">
          <button className="btn-outline-gray me-3" onClick={handleCancelForm}>Cancel</button>
          <button className="btn-primary" onClick={handleSaveStudent}><i className="far fa-save me-2"></i> {isEditing ? 'Update Student' : 'Add Student'}</button>
        </div>
      </div>
    </div>
  );

  const renderMainView = () => (
    <div className="students-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Profile</h1>
          <div className="breadcrumb">Dashboard &nbsp;&gt;&nbsp; Students &nbsp;&gt;&nbsp; <span className="active-bread">{displayStudent.name}</span></div>
        </div>
        <button className="btn-primary" onClick={() => { setShowAddForm(true); setIsEditing(false); setFormData(initialFormState); }}>
          <i className="fas fa-plus"></i> Add Student
        </button>
      </div>

      <div className="main-layout">
        
        {/* Left Sidebar List */}
        <div className="students-list-sidebar card-shadow">
          <div className="sidebar-header d-flex justify-content-between align-items-center">
            <span>All Students ({filteredStudents.length})</span>
          </div>
          <div className="sidebar-search">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search student..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sidebar-list custom-scroll">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(stu => {
                const imgUrl = getPhotoUrl(stu.profilePhoto);
                return (
                  <div 
                    key={stu.studentId} 
                    className={`student-list-item ${activeStudentId === stu.studentId ? 'active' : ''}`}
                    onClick={() => setActiveStudentId(stu.studentId)}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={stu.fullName} className="list-avatar" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className="list-avatar align-items-center justify-content-center" style={{background: '#f1f5f9', color: '#94a3b8', display: imgUrl ? 'none' : 'flex'}}><i className="fas fa-user"></i></div>
                    
                    <div className="list-info" style={{ flex: 1 }}>
                      <div className="list-name">{stu.fullName}</div>
                      <div className="list-desc">{stu.studentId}</div>
                      <div className="list-desc">{stu.course}</div>
                      <div className="list-desc mt-1">Batch: <span className="text-dark fw-bold">{stu.batch}</span></div>
                    </div>

                    <div onClick={(e) => { e.stopPropagation(); handleDeleteStudent(stu._id, stu.fullName); }} style={{ color: '#cbd5e1', cursor: 'pointer', padding: '5px' }}>
                       <i className="fas fa-trash-alt hover-danger"></i>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No students found.
              </div>
            )}
          </div>
          <div className="pagination">
            <button className="page-btn"><i className="fas fa-chevron-left"></i></button>
            <button className="page-btn active">1</button>
            <button className="page-btn"><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>

        <div className="student-details-panel">
          
          {/* Main Profile Card */}
          <div className="profile-card card-shadow relative-card">
            {displayStudent.image ? (
              <img src={displayStudent.image} alt="Profile" className="profile-large-avatar" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}/>
            ) : null}
            <div className="profile-large-avatar align-items-center justify-content-center" style={{background: '#f1f5f9', display: displayStudent.image ? 'none' : 'flex', fontSize: '45px', color: '#94a3b8'}}>
              <i className="fas fa-user"></i>
            </div>
            
            <div className="profile-info-full">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  <h2 className="profile-name">{displayStudent.name}</h2>
                  {activeStudentData && <span className="badge-active ml-3">{displayStudent.status}</span>}
                </div>
                {activeStudentData && (
                  <button className="btn-outline" style={{padding: '6px 14px', borderRadius: '20px'}} onClick={() => handleEditClick(activeStudentData)}>
                    <i className="fas fa-pen" style={{fontSize: '11px'}}></i> Edit Profile
                  </button>
                )}
              </div>
              <div className="profile-meta mb-3 mt-1">
                {displayStudent.id} <span className="dot">|</span> {displayStudent.course} <span className="dot">|</span> Batch: <span className="text-dark fw-medium">{displayStudent.batch}</span>
              </div>
              <div className="profile-contact">
                <span><i className="far fa-envelope"></i> {displayStudent.email}</span>
                <span><i className="fas fa-phone-alt"></i> {displayStudent.phone}</span>
                <span><i className="fas fa-map-marker-alt"></i> {displayStudent.location}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="quick-info-grid">
            <div className="quick-card card-shadow">
              <div className="icon-box blue-light"><i className="far fa-calendar-alt text-primary"></i></div>
              <div>
                <div className="info-label">Date of Joining</div>
                <div className="info-value">{displayStudent.doj}</div>
              </div>
            </div>
            <div className="quick-card card-shadow">
              <div className="icon-box purple-light"><i className="fas fa-birthday-cake text-purple"></i></div>
              <div>
                <div className="info-label">Date of Birth</div>
                <div className="info-value">{displayStudent.dob}</div>
              </div>
            </div>
            <div className="quick-card card-shadow">
              <div className="icon-box blue-light"><i className="far fa-user text-primary"></i></div>
              <div>
                <div className="info-label">Gender</div>
                <div className="info-value">{displayStudent.gender}</div>
              </div>
            </div>
          </div>

          {/* 🔥 Progress Grid (Centered Single Card) 🔥 */}
          <div className="progress-grid">
            <div className="progress-card card-shadow">
              <div className="prog-header"><i className="fas fa-book-open text-primary"></i> Syllabus Progress</div>
              <div className="prog-body mb-0 mt-2">
                <div>
                  <div className="prog-percentage">{batchProgress}%</div>
                  <div className="prog-subtext mt-1">Overall Progress</div>
                </div>
                <div className="circular-chart" style={{background: `conic-gradient(#2563eb ${batchProgress}%, #f1f5f9 0)`}}></div>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="bottom-grid">
            
            {/* Enrolled Details */}
            <div className="card-panel card-shadow">
              <h3 className="panel-title">Enrolled Details</h3>
              <div className="details-list">
                <div className="detail-row"><span>Course</span><span className="text-end">{displayStudent.course}</span></div>
                <div className="detail-row"><span>Batch</span><span className="text-end">{displayStudent.batch}</span></div>
                <div className="detail-row"><span>Trainer</span><span className="text-end">{displayStudent.trainer}</span></div>
                <div className="detail-row"><span>Started On</span><span className="text-end">{displayStudent.doj}</span></div>
                <div className="detail-row border-0 mb-0 pb-0 pt-2"><span>Duration</span><span className="text-end">{displayStudent.duration}</span></div>
              </div>
            </div>

            {/* Syllabus Progress */}
            <div className="card-panel card-shadow">
              <h3 className="panel-title">Syllabus Progress</h3>
              <div className="custom-scroll" style={{maxHeight: '320px', overflowY: 'auto', paddingRight: '10px'}}>
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th style={{textAlign: 'left'}}>TOPIC</th>
                      <th style={{textAlign: 'right', width: '150px'}}>PROGRESS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modulesWithProgress.length > 0 ? modulesWithProgress.map((mod, i) => {
                      const prog = mod.prog;
                      const moduleTitle = mod.title || mod.moduleName || `Module ${i+1}`;

                      return (
                        <tr key={i}>
                          <td className="fw-medium text-dark" style={{paddingRight: '15px'}}>{moduleTitle}</td>
                          <td>
                            <div className="d-flex align-items-center justify-content-end gap-2">
                              <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{width: `${prog}%`, background: prog > 0 ? '#2563eb' : 'transparent'}}></div>
                              </div>
                              <span className="fw-bold text-dark" style={{fontSize:'12px', minWidth:'35px', textAlign:'right'}}>{prog}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan="2" className="text-center text-muted" style={{padding: '30px 0'}}>- 0%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .students-wrapper { padding: 24px 32px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; color: #334155; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;}
        .breadcrumb { font-size: 13px; color: #94a3b8; display:flex; align-items:center;}
        .active-bread { color: #0f172a; font-weight: 600; }
        
        .btn-primary { background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;}
        .btn-primary:hover { background: #1d4ed8; }
        .btn-outline { background: #fff; color: #2563eb; border: 1px solid #bfdbfe; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;}
        .btn-outline:hover { background: #eff6ff; }
        .btn-outline-gray { background: #fff; color: #475569; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s;}
        .btn-outline-gray:hover { background: #f8fafc; color: #0f172a;}
        
        .card-shadow { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .relative-card { position: relative; }
        
        /* Main Layout */
        .main-layout { display: flex; gap: 24px; align-items: flex-start; }
        
        /* Left Sidebar List */
        .students-list-sidebar { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; background: #fff; }
        .sidebar-header { padding: 16px 20px; font-weight: 800; color: #0f172a; font-size: 14px; }
        .sidebar-search { padding: 0 16px 16px 16px; border-bottom: 1px solid #f1f5f9; }
        
        /* SEARCH BOX CSS */
        .search-box { position: relative; width: 100%; display: flex; align-items: center; }
        .search-box input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px 10px 38px; font-size: 13px; outline: none; box-sizing: border-box; color: #0f172a; }
        .search-box i { position: absolute; left: 14px; color: #94a3b8; font-size: 14px; }
        
        .sidebar-list { overflow-y: auto; max-height: calc(100vh - 270px); }
        .student-list-item { display: flex; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: 0.2s; position: relative; }
        .student-list-item:hover { background: #f8fafc; }
        .student-list-item.active { background: #eff6ff; border-left: 3px solid #2563eb; }
        .hover-primary:hover { color: #2563eb; }
        .hover-danger:hover { color: #ef4444; }
        
        .list-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .list-name { font-weight: 800; color: #0f172a; font-size: 14px; margin-bottom: 4px; }
        .list-desc { font-size: 12px; color: #64748b; margin-bottom: 2px; }
        
        .pagination { padding: 16px; display: flex; justify-content: center; gap: 12px; border-top: 1px solid #e2e8f0; }
        .page-btn { width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; border-radius: 6px; border: none; background: transparent; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; }
        .page-btn.active { background: #2563eb; color: #fff; }
        
        /* Details Panel */
        .student-details-panel { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
        
        /* Details Top Profile */
        .profile-card { padding: 24px 32px; display: flex; gap: 24px; align-items: center; }
        .profile-large-avatar { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; background: #f1f5f9; flex-shrink: 0; }
        .profile-info-full { flex: 1; }
        .profile-name { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
        .badge-active { background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; }
        .profile-meta { font-size: 13px; color: #64748b; font-weight: 500; }
        .dot { margin: 0 8px; color: #cbd5e1; }
        .profile-contact { display: flex; flex-wrap: wrap; gap: 24px; font-size: 13px; color: #475569; font-weight: 500;}
        .profile-contact span { display: flex; align-items: center; gap: 8px; }
        
        /* Quick Info */
        .quick-info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
        .quick-card { padding: 16px 20px; display: flex; gap: 16px; align-items: center; }
        .icon-box { width: 42px; height: 42px; border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 18px; flex-shrink: 0;}
        .blue-light { background: #eff6ff; }
        .purple-light { background: #f3e8ff; }
        .green-light { background: #f0fdf4; }
        .text-primary { color: #2563eb; }
        .text-purple { color: #9333ea; }
        .text-green { color: #16a34a; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; display: block; }
        .info-label { font-size: 11px; color: #64748b; margin-bottom: 4px; font-weight: 600; }
        .info-value { font-size: 14px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}

        /* 🔥 Progress Grid (Centered Single Card) 🔥 */
        .progress-grid { display: flex; justify-content: center; width: 100%; gap: 24px; }
        .progress-card { padding: 24px; display: flex; flex-direction: column; justify-content: center; width: 100%; max-width: 380px;}
        .prog-header { font-size: 13px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .prog-body { display: flex; justify-content: space-between; align-items: center; }
        .prog-percentage { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1; }
        .prog-subtext { font-size: 12px; color: #64748b; font-weight: 500;}
        .mb-0 { margin-bottom: 0 !important; }
        .mt-2 { margin-top: 8px; }
        .mt-1 { margin-top: 4px; }
        .circular-chart { width: 55px; height: 55px; border-radius: 50%; position: relative; display: flex; justify-content: center; align-items: center; flex-shrink: 0;}
        .circular-chart::before { content: ""; position: absolute; inset: 6px; background: #fff; border-radius: 50%; }

        /* Bottom Grid */
        .bottom-grid { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 24px; align-items: start; }
        .card-panel { padding: 24px; }
        .panel-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 20px 0; }
        
        .details-list { display: flex; flex-direction: column; }
        .detail-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b; gap: 10px; }
        .text-end { text-align: right; flex: 1; word-wrap: break-word; color: #0f172a; font-weight: 800; }
        .badge-enrolled { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        
        /* Table Alignments Fixed */
        .table-clean { width: 100%; border-collapse: collapse; }
        .table-clean th { padding: 0 0 12px 0; color: #64748b; font-weight: 700; border-bottom: 1px solid #f1f5f9; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;}
        .text-right { text-align: right !important; }
        .table-clean td { padding: 14px 0; border-bottom: 1px dashed #f1f5f9; font-size: 13px; vertical-align: middle;}
        .table-clean tr:last-child td { border-bottom: none; }
        
        .progress-bar-bg { width: 100px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; flex-shrink: 0;}
        .progress-bar-fill { height: 100%; border-radius: 3px; transition: 0.3s ease; }

        /* Form Classes */
        .form-container { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; background: #fff; padding: 32px; border-radius: 12px 12px 0 0; border: 1px solid #e2e8f0; border-bottom: none; }
        .section-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
        .form-control { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: #0f172a; outline: none; transition: 0.2s; box-sizing: border-box;}
        .form-control:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .text-danger { color: #ef4444; }
        .text-muted { color: #64748b !important; }
        .mt-3 { margin-top: 20px; }
        .mt-5 { margin-top: 40px; }
        .me-1 { margin-right: 4px; }
        .me-2 { margin-right: 8px; }
        .me-3 { margin-right: 16px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 16px; }
        .ml-3 { margin-left: 16px; }
        .fw-bold { font-weight: 700; }
        .fw-semibold { font-weight: 600; }
        .fw-medium { font-weight: 500; }
        .fw-normal { font-weight: 400; }
        .fs-14 { font-size: 14px; }
        .text-dark { color: #0f172a; }
        .text-center { text-align: center; }
        .d-flex { display: flex; }
        .justify-content-center { justify-content: center; }
        .justify-content-between { justify-content: space-between; }
        .align-items-center { align-items: center; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .border-0 { border: none !important; }
        .pb-0 { padding-bottom: 0 !important; }
        .pt-2 { padding-top: 8px !important; }
        .pt-3 { padding-top: 16px !important; }
        
        .upload-box { border: 2px dashed #bfdbfe; background: #f8fafc; border-radius: 8px; padding: 24px; text-align: center; cursor: pointer; transition: 0.2s; }
        .upload-box:hover { border-color: #2563eb; background: #eff6ff; }
        .alert-blue { background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; }
        
        .form-footer { background: #fff; padding: 24px 32px; display: flex; justify-content: space-between; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; }
        .footer-right { display: flex; }

        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {showAddForm ? renderAddStudentForm() : renderMainView()}
    </>
  );
};

export default Students;