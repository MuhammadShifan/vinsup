import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminTasks = () => {
  const [currentView, setCurrentView] = useState('list');
  const [activeTab, setActiveTab] = useState('All Tasks');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    time: '11:59 PM',
    assignedTo: '',
    employeeId: '',
    role: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const taskResponse = await axios.get('http://localhost:5001/api/tasks'); 
        const taskData = Array.isArray(taskResponse.data) ? taskResponse.data : (taskResponse.data.data || []);
        setTasks(taskData);
        
        if (taskData.length > 0) {
          setSelectedTask(taskData[0]);
        }

        const empResponse = await axios.get('http://localhost:5001/api/employees');
        const empData = Array.isArray(empResponse.data) ? empResponse.data : (empResponse.data.data || []);
        setEmployeesList(empData);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  const handleEmployeeChange = (e) => {
    const val = e.target.value;
    const selectedEmp = employeesList?.find(emp => String(emp._id) === String(val) || String(emp.empId) === String(val)); 
    
    if (selectedEmp) {
      const empName = selectedEmp.name || selectedEmp.firstName || selectedEmp.fullName || selectedEmp.username || selectedEmp.email || 'Employee';
      const empRole = selectedEmp.role || selectedEmp.designation || 'Employee';
      
      setNewTask({ 
        ...newTask, 
        employeeId: selectedEmp._id || selectedEmp.empId, 
        assignedTo: empName,
        role: empRole 
      });
    } else {
      setNewTask({ ...newTask, employeeId: '', assignedTo: '', role: '' });
    }
  };

  const handleAssignTask = async () => {
    if (!newTask.title || !newTask.employeeId) {
      alert("Please fill all the mandatory fields! (*)");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/tasks', newTask);
      setTasks([response.data.task, ...tasks]);

      setNewTask({ title: '', description: '', priority: 'Medium', time: '11:59 PM', assignedTo: '', employeeId: '', role: '' });
      setCurrentView('list');
      alert("Task Assigned Successfully!");
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Failed to assign task.");
    }
  };

  const handleDeleteTask = async (id) => {
    if(window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`http://localhost:5001/api/tasks/${id}`);
        setTasks(tasks.filter(t => t._id !== id));
        setSelectedTask(null);
        alert("Task deleted!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filteredTasks = safeTasks.filter(task => {
    const matchesTab = activeTab === 'All Tasks' || task.status === activeTab;
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = safeTasks.filter(t => t.status === 'In Progress').length;

  const padZero = (num) => (num < 10 ? `0${num}` : num);

  const getPriorityStyle = (priority) => {
    switch(priority) {
      case 'High': return { color: '#ef4444', bg: '#fee2e2' };
      case 'Medium': return { color: '#f59e0b', bg: '#ffedd5' };
      case 'Low': return { color: '#10b981', bg: '#dcfce7' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'In Progress': return { color: '#2563eb', bg: '#eff6ff' };
      case 'Completed': return { color: '#10b981', bg: '#dcfce7' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getEmployeeImage = (emp) => {
    if (!emp) return "";
    const rawImage = emp.profilePhoto || emp.profilePic || emp.image || emp.avatar || emp.photo || emp.pic || emp.profileImage || emp.empImage || emp.picture || (emp.profile && emp.profile.pic) || emp.file;
    if (!rawImage) return "";
    
    if (rawImage.includes('randomuser.me') || rawImage.startsWith('http') || rawImage.startsWith('data:image')) {
      return rawImage;
    }
    
    let cleanPath = rawImage.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
    return `http://localhost:5001/${cleanPath}`;
  };

  const previewEmp = employeesList?.find(emp => String(emp._id) === String(newTask.employeeId) || String(emp.empId) === String(newTask.employeeId));
  const previewName = previewEmp ? (previewEmp.name || previewEmp.firstName || previewEmp.fullName || previewEmp.username || previewEmp.email || 'Unknown') : '';
  const finalPreviewImageUrl = getEmployeeImage(previewEmp);

  if (currentView === 'assign') {
    return (
      <div style={{ padding: '30px 50px', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>Assign Task</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Create a new task and assign it to a user.</p>
          </div>
          <button 
            onClick={() => setCurrentView('list')}
            style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-arrow-left"></i> Back to Tasks
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 350px', gap: '25px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '30px' }}>
            
            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold' }}>1</div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Task Details</h3>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Task Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Create Monthly Report UI" 
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Task Description</label>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                  <textarea 
                    rows="5" 
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    placeholder="Explain the task requirements..." 
                    style={{ width: '100%', padding: '15px', border: 'none', outline: 'none', fontSize: '14px', color: '#1e293b', boxSizing: 'border-box', resize: 'vertical' }}>
                  </textarea>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '14px' }}>
                      <i className="fas fa-bold" style={{ cursor: 'pointer' }}></i>
                      <i className="fas fa-italic" style={{ cursor: 'pointer' }}></i>
                      <i className="fas fa-underline" style={{ cursor: 'pointer' }}></i>
                      <i className="fas fa-list-ul" style={{ cursor: 'pointer' }}></i>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{(newTask.description || '').length}/2000</span>
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '35px 0' }} />

            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold' }}>2</div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Assign To</h3>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Select User <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={newTask.employeeId}
                    onChange={handleEmployeeChange}
                    style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', boxSizing: 'border-box', appearance: 'none', background: '#fff' }}>
                    <option value="">-- Choose Employee --</option>
                    {employeesList?.map(emp => {
                      const displayOptionName = emp.name || emp.firstName || emp.fullName || emp.username || emp.email || 'Unknown';
                      return (
                        <option key={emp._id || emp.empId} value={emp._id || emp.empId}>
                          {displayOptionName} 
                        </option>
                      )
                    })}
                  </select>
                  <i className="fas fa-user-circle" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '16px', pointerEvents: 'none' }}></i>
                  <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '12px', pointerEvents: 'none' }}></i>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '35px 0' }} />

            <div style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold' }}>3</div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Priority</h3>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px', fontWeight: '600' }}>Priority <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ flex: 1, padding: '10px', border: newTask.priority === 'High' ? '1px solid #ef4444' : '1px solid #e2e8f0', background: newTask.priority === 'High' ? '#fee2e2' : '#fff', color: newTask.priority === 'High' ? '#ef4444' : '#64748b', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name="priority" value="High" checked={newTask.priority === 'High'} onChange={handleInputChange} style={{ display: 'none' }} /> High
                  </label>
                  <label style={{ flex: 1, padding: '10px', border: newTask.priority === 'Medium' ? '1px solid #f59e0b' : '1px solid #e2e8f0', background: newTask.priority === 'Medium' ? '#ffedd5' : '#fff', color: newTask.priority === 'Medium' ? '#f59e0b' : '#64748b', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name="priority" value="Medium" checked={newTask.priority === 'Medium'} onChange={handleInputChange} style={{ display: 'none' }} /> Medium
                  </label>
                  <label style={{ flex: 1, padding: '10px', border: newTask.priority === 'Low' ? '1px solid #10b981' : '1px solid #e2e8f0', background: newTask.priority === 'Low' ? '#dcfce7' : '#fff', color: newTask.priority === 'Low' ? '#10b981' : '#64748b', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="radio" name="priority" value="Low" checked={newTask.priority === 'Low'} onChange={handleInputChange} style={{ display: 'none' }} /> Low
                  </label>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0 20px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button 
                onClick={() => setCurrentView('list')}
                style={{ padding: '10px 25px', background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button 
                onClick={handleAssignTask}
                style={{ padding: '10px 25px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                Assign Task
              </button>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px' }}>
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Task Summary</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Title</span>
                  <strong style={{ color: '#0f172a', fontSize: '13px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {newTask.title || "---"}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Priority</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPriorityStyle(newTask.priority).color }}></div>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>{newTask.priority}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px' }}>
                  <i className="fas fa-user-check"></i>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Assignment Preview</h3>
              </div>

              {previewEmp ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: 'bold', overflow: 'hidden', position: 'relative' }}>
                      <span style={{ zIndex: 0 }}>{previewName.charAt(0).toUpperCase()}</span>
                      {finalPreviewImageUrl && (
                        <img 
                          src={finalPreviewImageUrl} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }} 
                          onError={(e) => { e.target.style.display='none'; }} 
                        />
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 3px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>{previewName}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{previewEmp.role || previewEmp.designation || 'Employee'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a', fontSize: '13px', fontWeight: '500' }}>
                      <i className="far fa-envelope" style={{ color: '#64748b', fontSize: '14px', width: '16px' }}></i> {previewEmp.email || 'No email provided'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a', fontSize: '13px', fontWeight: '500' }}>
                      <i className="fas fa-phone-alt" style={{ color: '#64748b', fontSize: '14px', width: '16px' }}></i> {previewEmp.phone || 'No phone provided'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                  <i className="fas fa-user-slash" style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                  <p style={{ margin: 0, fontSize: '13px' }}>Select a user to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 50px', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>Task Management</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Assign and monitor tasks across all employees</p>
        </div>
        <button 
          onClick={() => setCurrentView('assign')}
          style={{ padding: '10px 20px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-plus"></i> Assign New Task
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#eff6ff', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563eb', fontSize: '24px' }}>
            <i className="fas fa-list-ul"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{padZero(totalTasks)}</h3>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>Total Tasks Assigned</p>
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#dcfce7', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#16a34a', fontSize: '24px' }}>
            <i className="far fa-check-circle"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{padZero(completedTasks)}</h3>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>Completed</p>
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#ffedd5', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f59e0b', fontSize: '24px' }}>
            <i className="fas fa-spinner"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{padZero(inProgressTasks)}</h3>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>In Progress</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '66% 32%', gap: '2%' }}>
        
        <div style={{ minWidth: 0 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #e2e8f0', minHeight: '600px' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '25px', paddingTop: '10px' }}>
                {['All Tasks', 'In Progress', 'Completed'].map(tab => (
                  <span 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    style={{ 
                      paddingBottom: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '-1px',
                      color: activeTab === tab ? '#2563eb' : '#64748b',
                      borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            {/* 🔥 FIX: Increased maxHeight to 530px so it fits ~8 items before scrolling 🔥 */}
            <div style={{ maxHeight: '530px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Task Title</th>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Assigned To</th>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Priority</th>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks?.length > 0 ? (
                    filteredTasks.map((task) => {
                      const matchedEmployee = employeesList?.find(e => 
                        String(e._id) === String(task.employeeId) || 
                        String(e.empId) === String(task.employeeId) ||
                        e.name === task.assignedTo ||
                        e.fullName === task.assignedTo
                      );
                      const taskImageUrl = getEmployeeImage(matchedEmployee);

                      return (
                        <tr 
                          key={task._id} 
                          onClick={() => setSelectedTask(task)}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedTask?._id === task._id ? '#f8fafc' : '#fff' }}
                        >
                          <td style={{ padding: '15px 10px' }}>
                            <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{task.title}</h4>
                          </td>
                          <td style={{ padding: '15px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '11px', color: '#475569', fontWeight: 'bold', overflow: 'hidden', position: 'relative' }}>
                                <span style={{ zIndex: 0 }}>{task.assignedTo ? task.assignedTo.charAt(0).toUpperCase() : 'U'}</span>
                                {taskImageUrl && (
                                  <img 
                                    src={taskImageUrl} 
                                    alt="" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }} 
                                    onError={(e) => { e.target.style.display='none'; }} 
                                  />
                                )}
                              </div>

                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{task.assignedTo || 'Unassigned'}</h4>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{task.role || 'Employee'}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '15px 10px' }}>
                            <span style={{ color: getPriorityStyle(task.priority || 'Medium').color, fontWeight: '600', fontSize: '12px' }}>{task.priority || 'Medium'}</span>
                          </td>
                          <td style={{ padding: '15px 10px' }}>
                            <span style={{ background: getStatusStyle(task.status || 'In Progress').bg, color: getStatusStyle(task.status || 'In Progress').color, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                              {task.status || 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No tasks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            
            {selectedTask ? (
              <>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Task Overview</h3>
                  <i className="fas fa-times" onClick={() => setSelectedTask(null)} style={{ color: '#64748b', cursor: 'pointer', fontSize: '16px' }}></i>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getStatusStyle(selectedTask.status || 'In Progress').color, fontSize: '13px', fontWeight: '600' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusStyle(selectedTask.status || 'In Progress').color }}></div> {selectedTask.status || 'In Progress'}
                    </span>
                    <span style={{ background: getPriorityStyle(selectedTask.priority || 'Medium').bg, color: getPriorityStyle(selectedTask.priority || 'Medium').color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      {selectedTask.priority || 'Medium'} Priority
                    </span>
                  </div>

                  <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{selectedTask.title}</h2>
                  <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{selectedTask.description || 'No description provided.'}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', fontSize: '13px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="far fa-user"></i> Assigned To</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(() => {
                           const stEmp = employeesList?.find(e => String(e._id) === String(selectedTask.employeeId) || e.name === selectedTask.assignedTo);
                           const stImg = getEmployeeImage(stEmp);
                           return stImg ? (
                             <img src={stImg} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                           ) : (
                             <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                {selectedTask.assignedTo ? selectedTask.assignedTo.charAt(0).toUpperCase() : 'U'}
                             </div>
                           )
                        })()}
                        <strong style={{ color: '#2563eb' }}>{selectedTask.assignedTo || 'Unassigned'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '15px' }}>
                  <button 
                    onClick={() => handleDeleteTask(selectedTask._id)}
                    style={{ flex: 1, padding: '10px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                    Delete Task
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                  <i className="fas fa-list-ul" style={{ fontSize: '24px', color: '#94a3b8' }}></i>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>No Task Selected</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', textAlign: 'center', maxWidth: '250px', lineHeight: '1.6' }}>Select a task to view details or modify.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminTasks;