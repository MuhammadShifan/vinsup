import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminHelpdesk = () => {
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch ALL tickets on load
  const fetchAllTickets = async () => {
    try {
      const response = await axios.get('https://vinsup-4vt5.onrender.com/api/tickets');
      setTickets(response.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, []);

  // 2. Update Status Function
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await axios.put(`https://vinsup-4vt5.onrender.com/api/tickets/${ticketId}`, { status: newStatus });
      // Update state locally without reloading the whole page
      setTickets(tickets.map(ticket => 
        ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      alert(`Ticket status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  // Styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Progress': return { color: '#2563eb', bg: '#eff6ff' };
      case 'Open': return { color: '#f59e0b', bg: '#ffedd5' };
      case 'Resolved': return { color: '#10b981', bg: '#dcfce7' };
      case 'Closed': return { color: '#475569', bg: '#f1f5f9' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return { color: '#ef4444' };
      case 'Medium': return { color: '#f59e0b' };
      case 'Low': return { color: '#10b981' };
      case 'Urgent': return { color: '#9333ea' };
      default: return { color: '#64748b' };
    }
  };

  // Filter Search
  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 'clamp(14px, 2.5vw, 30px)', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .admin-helpdesk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .admin-helpdesk-search-wrap {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
          width: 100%;
        }
        @media (max-width: 600px) {
          .admin-helpdesk-search-wrap,
          .admin-helpdesk-search-wrap > div,
          .admin-helpdesk-search-wrap input {
            width: 100% !important;
          }
        }
      `}</style>
      
      {/* HEADER */}
      <div className="admin-helpdesk-header">
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 'bold' }}>Admin Helpdesk</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Manage and resolve employee tickets here.</p>
        </div>
      </div>

      {/* SEARCH AND TABLE CONTAINER */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(16px, 2vw, 25px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        
        {/* Search Bar */}
        <div className="admin-helpdesk-search-wrap">
           <div style={{ position: 'relative' }}>
             <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8', fontSize: '12px' }}></i>
             <input 
               type="text" 
               placeholder="Search by subject or category..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{ padding: '8px 12px 8px 35px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', width: '250px', boxSizing: 'border-box' }} 
             />
           </div>
        </div>

        {/* Tickets Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Ticket ID</th>
                <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Issue Details</th>
                <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Priority</th>
                <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '15px 10px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>Status (Update)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket, i) => (
                  <tr key={ticket._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 10px', fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>
                      #TK-{ticket._id.substring(ticket._id.length - 4).toUpperCase()}
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>{ticket.subject}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{ticket.category}</span>
                    </td>
                    <td style={{ padding: '15px 10px', fontSize: '13px', fontWeight: '600', color: getPriorityStyle(ticket.priority).color }}>
                      {ticket.priority}
                    </td>
                    <td style={{ padding: '15px 10px', fontSize: '13px', color: '#475569' }}>
                      {ticket.date}
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      {/* ADMIN STATUS DROPDOWN */}
                      <select 
                        value={ticket.status} 
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                        style={{ 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          border: `1px solid ${getStatusStyle(ticket.status).color}`, 
                          background: getStatusStyle(ticket.status).bg, 
                          color: getStatusStyle(ticket.status).color,
                          outline: 'none', 
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHelpdesk;