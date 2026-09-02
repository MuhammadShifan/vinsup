import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserTasks = ({ userName }) => {
  const [activeTab, setActiveTab] = useState('All Tasks');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('https://vinsup-4vt5.onrender.com/api/tasks');
        const taskData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        const currentUserName = (userName || "").toLowerCase();
        const myTasks = taskData.filter(task => 
          task.assignedTo && task.assignedTo.toLowerCase() === currentUserName
        );

        setTasks(myTasks);
        if (myTasks.length > 0) {
          setSelectedTask(myTasks[0]);
        } else {
          setSelectedTask(null); 
        }
      } catch (error) {
        console.error("Error fetching user tasks:", error);
      }
    };
    fetchTasks();
  }, [userName]);

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await axios.put(`https://vinsup-4vt5.onrender.com/api/tasks/${taskId}`, { status: newStatus });
      
      const updatedTasks = tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t);
      setTasks(updatedTasks);
      
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      if (newStatus === 'Completed') {
        const currentTask = tasks.find(t => t._id === taskId);
        const taskTitle = currentTask ? currentTask.title : 'a task';

        await axios.post('https://vinsup-4vt5.onrender.com/api/notifications/add', {
          type: 'Task',
          title: 'Task Completed',
          message: `${userName || 'Employee'} has completed the task: ${taskTitle}.`,
          recipientEmail: 'admin' 
        }).catch(err => console.log("Notification send error:", err));
      }

      alert(`Task marked as ${newStatus}!`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filteredTasks = safeTasks.filter(task => activeTab === 'All Tasks' || task.status === activeTab);

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

  return (
    <div style={{ padding: '30px 50px', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>My Tasks</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>View and manage tasks assigned to you</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#eff6ff', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563eb', fontSize: '24px' }}>
            <i className="far fa-calendar-alt"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{padZero(totalTasks)}</h3>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>Total Tasks</p>
            <span style={{ fontSize: '11px', color: '#64748b' }}>All time</span>
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#dcfce7', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#16a34a', fontSize: '24px' }}>
            <i className="far fa-calendar-check"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{padZero(completedTasks)}</h3>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>Completed</p>
            <span style={{ fontSize: '11px', color: '#64748b' }}>All time</span>
          </div>
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ background: '#ffedd5', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f59e0b', fontSize: '24px' }}>
            <i className="far fa-clock"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{padZero(inProgressTasks)}</h3>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>In Progress</p>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Currently ongoing</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '66% 32%', gap: '2%', alignItems: 'start' }}>
        
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #e2e8f0' }}>
            
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

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Task Title</th>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Priority</th>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Assigned By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <tr 
                        key={task._id} 
                        onClick={() => setSelectedTask(task)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedTask?._id === task._id ? '#eff6ff' : '#fff', transition: 'background 0.2s' }}
                      >
                        <td style={{ padding: '15px 10px' }}>
                          <h4 style={{ margin: '0', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{task.title}</h4>
                        </td>
                        <td style={{ padding: '15px 10px' }}>
                          <span style={{ color: getPriorityStyle(task.priority || 'Medium').color, fontWeight: '600', fontSize: '12px' }}>{task.priority || 'Medium'}</span>
                        </td>
                        <td style={{ padding: '15px 10px' }}>
                          <span style={{ background: getStatusStyle(task.status || 'In Progress').bg, color: getStatusStyle(task.status || 'In Progress').color, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                            {task.status || 'In Progress'}
                          </span>
                        </td>
                        <td style={{ padding: '15px 10px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                          Admin
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No tasks assigned to you yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{ padding: '15px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Showing {filteredTasks.length} tasks
              </div>
            </div>
          </div>

        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            
            {selectedTask ? (
              <>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Task Details</h3>
                  <i className="fas fa-times" onClick={() => setSelectedTask(null)} style={{ color: '#64748b', cursor: 'pointer', fontSize: '18px' }}></i>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: getStatusStyle(selectedTask.status || 'In Progress').color, fontSize: '14px', fontWeight: '600' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusStyle(selectedTask.status || 'In Progress').color }}></div> {selectedTask.status || 'In Progress'}
                    </span>
                    <span style={{ background: getPriorityStyle(selectedTask.priority || 'Medium').bg, color: getPriorityStyle(selectedTask.priority || 'Medium').color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {selectedTask.priority || 'Medium'} Priority
                    </span>
                  </div>

                  <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{selectedTask.title}</h2>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{selectedTask.description || 'No description provided by admin.'}</p>

                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', fontSize: '13px' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px' }}><i className="far fa-user-circle"></i> Assigned By</span>
                      <strong style={{ color: '#0f172a' }}>Admin</strong>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>Update Progress</h4>
                    <select 
                      value={selectedTask.status || 'In Progress'}
                      onChange={(e) => handleStatusUpdate(selectedTask._id, e.target.value)}
                      disabled={selectedTask.status === 'Completed'}
                      style={{ 
                        width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', 
                        background: selectedTask.status === 'Completed' ? '#f1f5f9' : '#fff', 
                        cursor: selectedTask.status === 'Completed' ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      <option value="In Progress">In Progress (Working on it)</option>
                      <option value="Completed">Completed (Done)</option>
                    </select>
                    {selectedTask.status === 'Completed' && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                        <i className="fas fa-check-circle"></i> Task has been completed and locked.
                      </p>
                    )}
                  </div>

                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                  <i className="fas fa-tasks" style={{ fontSize: '32px', color: '#94a3b8' }}></i>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>No Task Selected</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', textAlign: 'center', maxWidth: '250px', lineHeight: '1.6' }}>Select a task from the list to view its complete details and update progress.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserTasks;