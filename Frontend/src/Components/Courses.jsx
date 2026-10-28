import React, { useState, useEffect } from 'react';
import './Employees.css';
import API from '../utils/api';
import { getCache, setCache, clearCache } from '../utils/cache';

const Courses = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');

  const initialFormState = {
    courseName: '',
    duration: '',
    level: 'Beginner',
    batches: '',
    enrolledStudents: '',
    description: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchCourses = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cachedCourses = getCache('courses');
        if (cachedCourses && Array.isArray(cachedCourses)) {
          setCourseList(cachedCourses);
          return;
        }
      }

      setLoading(true);
      const response = await API.get('/courses');
      const courses = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setCourseList(courses);
      setCache('courses', courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch courses!";
      if (error.response?.status === 401) {
        alert("Session expired or unauthorized! Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDelete = async (courseToDelete, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${courseToDelete.courseName}?`)) {
      try {
        const response = await API.delete(`/courses/delete/${courseToDelete._id}`);
        if (response.data?.success || response.status === 200) {
          clearCache('courses');
          setCourseList(prevList => prevList.filter(c => c._id !== courseToDelete._id));
          alert("Course Deleted Successfully! 🗑️");
        }
      } catch (error) {
        console.error("Error deleting course:", error);
        const msg = error.response?.data?.message || "Failed to delete course!";
        alert(msg);
      }
    }
  };

  const handleEdit = (courseToEdit, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormData({
      courseName: courseToEdit.courseName,
      duration: courseToEdit.duration,
      level: courseToEdit.level,
      batches: courseToEdit.batches || '',
      enrolledStudents: courseToEdit.enrolledStudents || '',
      description: courseToEdit.description,
    });
    setEditId(courseToEdit._id);
    setShowAddForm(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        const response = await API.put(`/courses/update/${editId}`, formData);
        if (response.data?.success || response.status === 200) {
          clearCache('courses');
          alert("Course Updated Successfully! ✏️");
          fetchCourses(true);
        } else {
          alert("Error: " + (response.data?.message || "Could not update course"));
        }
      } else {
        const response = await API.post('/courses/add', formData);
        if (response.data?.success || response.status === 201 || response.status === 200) {
          clearCache('courses');
          alert("New Course Added! 🚀");
          fetchCourses(true);
        } else {
          alert("Error: " + (response.data?.message || "Could not add course"));
        }
      }

      setShowAddForm(false);
      setEditId(null);
      setFormData(initialFormState);
    } catch (error) {
      console.error("Error saving course:", error);
      const msg = error.response?.data?.message || "Something went wrong saving the course!";
      alert("Error: " + msg);
    }
  };

  const displayedCourses = courseList.filter(course => {
    if (!searchInput) return true;
    const query = searchInput.toLowerCase();

    const matchName = course.courseName?.toLowerCase().includes(query);
    const matchDesc = course.description?.toLowerCase().includes(query);

    return matchName || matchDesc;
  });

  const getLevelStyle = (level) => {
    switch (level) {
      case 'Advanced': return { color: '#2563eb', backgroundColor: '#dbeafe', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
      case 'Intermediate': return { color: '#ea580c', backgroundColor: '#ffedd5', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
      case 'Beginner': return { color: '#16a34a', backgroundColor: '#dcfce7', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
      default: return { color: '#4b5563', backgroundColor: '#f3f4f6', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
    }
  };

  if (showAddForm) {
    return (
      <div className="employees-container form-view">
        <div className="page-header flex-between">
          <div>
            <h2>{editId ? "Edit Course" : "Add Course"}</h2>
            <p className="breadcrumb">Dashboard &gt; Courses &gt; {editId ? "Edit" : "Add"}</p>
          </div>
          <button className="btn-secondary" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); }}>
            <i className="fas fa-arrow-left"></i> Back to List
          </button>
        </div>

        <form className="add-employee-form" onSubmit={handleSaveCourse}>
          <div className="form-section">
            <h3>📚 Course Information</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Course Name *</label>
                <input type="text" name="courseName" value={formData.courseName} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>Duration *</label>
                <input type="text" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="e.g. 16 Weeks" required />
              </div>
              <div className="input-group">
                <label>Level</label>
                <select name="level" value={formData.level} onChange={handleInputChange}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="input-group">
                <label>Total Batches</label>
                <input type="number" name="batches" value={formData.batches} onChange={handleInputChange} placeholder="e.g. 4" min="0" />
              </div>
              <div className="input-group">
                <label>Enrolled Students</label>
                <input type="number" name="enrolledStudents" value={formData.enrolledStudents} onChange={handleInputChange} placeholder="e.g. 128" min="0" />
              </div>

              <div className="input-group full-width">
                <label>Description</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange}></textarea>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); }}>Cancel</button>
            <button type="button" className="btn-reset" onClick={() => setFormData(initialFormState)}>Reset</button>
            <button type="submit" className="btn-save">{editId ? "Update Course" : "Save Course"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="employees-container">
      <div className="page-header flex-between">
        <div>
          <h2>Courses</h2>
          <p className="breadcrumb">Dashboard &gt; Courses</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAddForm(true); setEditId(null); setFormData(initialFormState); }}>
          <i className="fas fa-plus"></i> Add Course
        </button>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '10px', background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: 'min(100%, 260px)' }}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search courses by name or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container" style={{ marginTop: '20px', borderRadius: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ minWidth: '750px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>#</th>
              <th style={{ textAlign: 'center' }}>Course</th>
              <th style={{ width: '30%', textAlign: 'center' }}>Description</th>
              <th style={{ textAlign: 'center' }}>Level</th>
              <th style={{ textAlign: 'center' }}>Batches</th>
              <th style={{ textAlign: 'center' }}>Enrolled Students</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedCourses.length > 0 ? (
              displayedCourses.map((course, index) => (
                <tr key={course._id || index}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>

                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <strong style={{ display: 'block', fontSize: '15px', color: '#1e293b' }}>{course.courseName}</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Duration: {course.duration + ' Weeks'}</span>
                      </div>
                    </div>
                  </td>

                  <td style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', textAlign: 'justify' }}>
                    {course.description || '-'}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span style={getLevelStyle(course.level)}>
                      {course.level}
                    </span>
                  </td>

                  <td style={{ fontWeight: '600', color: '#334155', textAlign: 'center' }}>{course.batches || 0}</td>
                  <td style={{ fontWeight: '600', color: '#334155', textAlign: 'center' }}>{course.enrolledStudents || 0}</td>

                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="action-btn edit" onClick={(e) => handleEdit(course, e)} style={{ marginRight: '8px', color: '#3b82f6', background: '#eff6ff' }}><i className="fas fa-edit"></i></button>
                    <button type="button" className="action-btn delete" onClick={(e) => handleDelete(course, e)} style={{ color: '#ef4444', background: '#fef2f2' }}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-table" style={{ padding: '40px 0', color: '#94a3b8', textAlign: 'center' }}>
                  {searchInput ? "No courses found matching your search." : "No courses found. Add a new course to get started!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Courses;