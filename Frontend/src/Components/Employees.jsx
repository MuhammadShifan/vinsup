import React, { useState, useEffect } from 'react';
import './Employees.css';

const Employees = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [employeeList, setEmployeeList] = useState([]); // DB data store panna

  const [searchInput, setSearchInput] = useState('');

  // Form State
  const initialFormState = {
    fullName: '', empId: '', email: '', phone: '', dob: '', gender: '', address: '', profilePhoto: '',
    designation: '', department: '', experience: '', doj: '', empType: '',
    courses: [], batches: [],
    username: '', loginEmail: '', password: '', confirmPassword: '', role: 'Employee',
    workingDays: [], startTime: '', endTime: '',
    notes: '', emergencyContact: '', qualification: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // 1. FETCH API (GET)
  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://vinsup-4vt5.onrender.com/api/employees');
      const result = await response.json();
      if (result.success) {
        setEmployeeList(result.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePhoto: file });
    }
  };

  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    let updatedArray = [...formData[field]];
    if (checked) {
      updatedArray.push(value);
    } else {
      updatedArray = updatedArray.filter(item => item !== value);
    }
    setFormData({ ...formData, [field]: updatedArray });
  };

  // 2. DELETE API
  const handleDelete = async (empToDelete, e) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (window.confirm(`Are you sure you want to delete ${empToDelete.fullName}?`)) {
      try {
        const response = await fetch(`https://vinsup-4vt5.onrender.com/api/employees/delete/${empToDelete._id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
          setEmployeeList(prevList => prevList.filter(emp => emp._id !== empToDelete._id));
          alert("Employee Deleted Successfully! 🗑️");
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee!");
      }
    }
  };

  const handleEdit = (empToEdit, e) => {
    e.preventDefault();
    e.stopPropagation(); 
    setFormData({
      ...empToEdit,
      password: empToEdit.password || '', 
      confirmPassword: empToEdit.password || ''
    });
    setEditId(empToEdit._id); 
    setShowAddForm(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Password and Confirm Password must match!");
      return; 
    }

    const generatedUsername = formData.email ? formData.email.split('@')[0] : '';
    
    const submitData = new FormData();
    
    for (const key in formData) {
      if (Array.isArray(formData[key])) {
        submitData.append(key, JSON.stringify(formData[key]));
      } else {
        submitData.append(key, formData[key]);
      }
    }
    
    submitData.set('username', generatedUsername); 
    submitData.set('role', 'Employee');

    try {
      if (editId) {
        const response = await fetch(`https://vinsup-4vt5.onrender.com/api/employees/update/${editId}`, {
          method: 'PUT',
          body: submitData 
        });
        const result = await response.json();
        
        if (result.success) {
          alert("Employee Updated Successfully! ✏️");
          fetchEmployees(); 
        }
      } else {
        const response = await fetch('https://vinsup-4vt5.onrender.com/api/employees/add', {
          method: 'POST',
          body: submitData 
        });
        const result = await response.json();
        
        if (result.success) {
          alert("New Employee Added with Profile Photo! 🚀");
          fetchEmployees(); 
        } else {
          alert("Error: " + result.message); 
        }
      }
      
      setShowAddForm(false);
      setEditId(null);
      setFormData(initialFormState); 
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Something went wrong!");
    }
  };

  // Live Filter Logic
  const displayedEmployees = employeeList.filter(emp => {
    if (!searchInput) return true;
    
    const query = searchInput.toLowerCase();
    const matchName = emp.fullName?.toLowerCase().includes(query);
    const matchId = emp.empId?.toLowerCase().includes(query);
    
    return matchName || matchId;
  });
  
  // Stats Calculation
  const totalEmp = employeeList.length;
  const maleEmp = employeeList.filter(e => e.gender === 'Male').length;
  const femaleEmp = employeeList.filter(e => e.gender === 'Female').length;

  if (showAddForm) {
    return (
      <div className="employees-container form-view">
        <div className="page-header flex-between">
          <div>
            <h2>{editId ? "Edit Employee" : "Add Employee"}</h2>
            <p className="breadcrumb">Dashboard &gt; Employees &gt; {editId ? "Edit" : "Add"}</p>
          </div>
          <button className="btn-secondary" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); }}>
            <i className="fas fa-arrow-left"></i> Back to List
          </button>
        </div>

        <form className="add-employee-form" onSubmit={handleSaveEmployee}>
          
          <div className="form-section">
            <h3>👤 Basic Information</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} required onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Employee ID *</label>
                <input type="text" name="empId" value={formData.empId} onChange={handleInputChange} required placeholder="e.g. EMP-101" />
              </div>
              <div className="input-group">
                <label>Email Address *</label>
                <input type="email" name="email" value={formData.email} required onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} required onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group full-width">
                <label>Address</label>
                <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange}></textarea>
              </div>
              <div className="input-group">
                <label>Profile Photo</label>
                <input type="file" name="profilePhoto" accept="image/*" onChange={handlePhotoChange} />
              </div>
            </div>
          </div>

          <hr className="divider" />

        <div className="form-section">
          <h4>💼 Professional Information</h4>
          <div className="form-grid">
            <div className="input-group">
              <label>Designation *</label>
              <select name="designation" value={formData.designation} onChange={handleInputChange} required>
                <option value="">Select Designation</option>
                <option value="Trainer">Trainer</option>
              </select>
            </div>
            <div className="input-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleInputChange}>
                <option value="">Select Dept</option>
                <option value="IT">IT</option>
                <option value="Teaching">Teaching</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div className="input-group">
              <label>Experience (Years)</label>
              <input type="number" name="experience" value={formData.experience} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Date of Joining</label>
              <input type="date" name="doj" value={formData.doj} onChange={handleInputChange} />
            </div>
          </div>
        </div>

          <hr className="divider" />

        <div className="form-section">
          <h4>🔐 Login Information</h4>
          <div className="form-grid">
            <div className="input-group">
              <label>Login Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Must be same as above email" />
            </div>
            <div className="input-group">
              <label>Role</label>
              <div className="radio-group">
                <label>
                  <input type="radio" name="role" value="Employee" checked readOnly />
                  Employee
                </label>
              </div>
            </div>
          </div>
          
          <div className="form-grid">
            <div className="input-group">
              <label>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Confirm Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
            </div>
          </div>
        </div>

          <hr className="divider" />

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => { setShowAddForm(false); setEditId(null); setFormData(initialFormState); }}>Cancel</button>
            <button type="button" className="btn-reset" onClick={() => setFormData(initialFormState)}>Reset</button>
            <button type="submit" className="btn-save">{editId ? "Update Employee" : "Save Employee"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="employees-container">
      <div className="page-header flex-between">
        <div>
          <h2>Employees</h2>
          <p className="breadcrumb">Dashboard &gt; Employees</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowAddForm(true); setEditId(null); setFormData(initialFormState); }}>
          <i className="fas fa-plus"></i> Add Employee
        </button>
      </div>

      <div className="emp-stats-grid">
        <div className="emp-stat-card">
          <div className="icon blue"><i className="fas fa-users"></i></div>
          <div className="info">
            <p>Total Employees</p>
            <h3>{totalEmp}</h3>
          </div>
        </div>
        <div className="emp-stat-card">
          <div className="icon green"><i className="fas fa-male"></i></div>
          <div className="info">
            <p>Male Employees</p>
            <h3>{maleEmp}</h3>
          </div>
        </div>
        <div className="emp-stat-card">
          <div className="icon pink"><i className="fas fa-female"></i></div>
          <div className="info">
            <p>Female Employees</p>
            <h3>{femaleEmp}</h3>
          </div>
        </div>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '10px' }}>
        <div className="search-box" style={{ flex: 1 }}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search employees by Name or Employee ID..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>#</th>
              {/* 🔥 Changed to Left Align 🔥 */}
              <th style={{ textAlign: 'left' }}>Employee</th>
              <th style={{ textAlign: 'left' }}>Email</th>
              <th style={{ textAlign: 'center' }}>Phone</th>
              <th style={{ textAlign: 'center' }}>Role</th>
              <th style={{ textAlign: 'center' }}>Join Date</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedEmployees.length > 0 ? (
              displayedEmployees.map((emp, index) => (
                <tr key={emp._id || index}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  {/* 🔥 Left Aligned Column 🔥 */}
                  <td style={{ textAlign: 'left' }}>
                    <div className="emp-name-cell">
                      <div className="emp-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {emp.profilePhoto ? (
                          <img 
                            src={emp.profilePhoto.startsWith('http') || emp.profilePhoto.startsWith('data:image') 
                              ? emp.profilePhoto 
                              : `https://vinsup-4vt5.onrender.com/${emp.profilePhoto.replace(/\\/g, '/').replace(/^\/+/, '').startsWith('uploads/') ? '' : 'uploads/'}${emp.profilePhoto.replace(/\\/g, '/').replace(/^\/+/, '')}`
                            } 
                            alt="Profile" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.outerHTML = '<i class="fas fa-user"></i>'; }} 
                          />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <strong>{emp.fullName}</strong>
                        <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>{emp.empId}</span>
                      </div>
                    </div>
                  </td>
                  {/* 🔥 Left Aligned Column 🔥 */}
                  <td style={{ textAlign: 'left' }}>{emp.email}</td>
                  <td style={{ textAlign: 'center' }}>{emp.phone}</td>
                  <td style={{ textAlign: 'center' }}><span className="badge role-badge">{emp.designation || 'Staff'}</span></td>
                  <td style={{ textAlign: 'center' }}>{emp.doj || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="action-btn edit" onClick={(e) => handleEdit(emp, e)}><i className="fas fa-edit"></i></button>
                    <button type="button" className="action-btn delete" onClick={(e) => handleDelete(emp, e)}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-table" style={{ textAlign: 'center' }}>No employees found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;