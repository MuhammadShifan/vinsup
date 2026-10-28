import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const AdminHelpdesk = () => {
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const response = await API.get('/tickets');
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await API.put(`/tickets/${ticketId}`, { status: newStatus });
      setTickets(prev => prev.map(ticket =>
        ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await API.delete(`/tickets/${ticketId}`);
      setTickets(prev => prev.filter(t => t._id !== ticketId));
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error("Error deleting ticket:", err);
      alert("Failed to delete ticket");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Progress': return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
      case 'Open': return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' };
      case 'Resolved': return { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
      case 'Closed': return { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
      default: return { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return { color: '#ef4444', bg: '#fef2f2' };
      case 'Urgent': return { color: '#dc2626', bg: '#fee2e2' };
      case 'Medium': return { color: '#f59e0b', bg: '#fffbeb' };
      case 'Low': return { color: '#10b981', bg: '#ecfdf5' };
      default: return { color: '#64748b', bg: '#f8fafc' };
    }
  };

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
  const closedCount = tickets.filter(t => t.status === 'Closed').length;

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      (ticket.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket._id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        .helpdesk-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 25px;
        }
        .helpdesk-stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 18px 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .helpdesk-filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        .helpdesk-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .helpdesk-tab-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .helpdesk-tab-btn.active {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        @media (max-width: 768px) {
          .helpdesk-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .helpdesk-tabs {
            overflow-x: auto;
            padding-bottom: 5px;
          }
          .helpdesk-search-input {
            width: 100% !important;
          }
        }
      `}</style>

      <div className="admin-helpdesk-header">
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 'bold' }}>Admin Helpdesk</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Monitor, track, and resolve employee support tickets.</p>
        </div>
        <button
          onClick={fetchAllTickets}
          disabled={loading}
          style={{
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`} style={{ color: '#2563eb' }}></i>
          Refresh
        </button>
      </div>

      <div className="helpdesk-stats-grid">
        <div className="helpdesk-stat-card">
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Tickets</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{tickets.length}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fas fa-ticket-alt"></i>
          </div>
        </div>

        <div className="helpdesk-stat-card">
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Open</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>{openCount}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fas fa-exclamation-circle"></i>
          </div>
        </div>

        <div className="helpdesk-stat-card">
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>In Progress</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>{inProgCount}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fas fa-spinner"></i>
          </div>
        </div>

        <div className="helpdesk-stat-card">
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Resolved</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>{resolvedCount}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fas fa-check-circle"></i>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', padding: 'clamp(16px, 2vw, 25px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div className="helpdesk-filter-bar">
          <div className="helpdesk-tabs">
            {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(tab => {
              const count = tab === 'All' ? tickets.length : tab === 'Open' ? openCount : tab === 'In Progress' ? inProgCount : tab === 'Resolved' ? resolvedCount : closedCount;
              return (
                <button
                  key={tab}
                  className={`helpdesk-tab-btn ${statusFilter === tab ? 'active' : ''}`}
                  onClick={() => setStatusFilter(tab)}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8', fontSize: '13px' }}></i>
            <input
              type="text"
              className="helpdesk-search-input"
              placeholder="Search tickets, emp ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '13px',
                width: '260px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket ID</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raised By</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issue Details</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map(ticket => {
                  const statusSt = getStatusStyle(ticket.status);
                  const prioSt = getPriorityStyle(ticket.priority);
                  return (
                    <tr key={ticket._id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.15s' }}>
                      <td style={{ padding: '14px', fontSize: '13px', color: '#2563eb', fontWeight: '700' }}>
                        #TK-{ticket._id ? ticket._id.substring(ticket._id.length - 4).toUpperCase() : '----'}
                      </td>
                      <td style={{ padding: '14px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                            <i className="fas fa-user"></i>
                          </div>
                          <span>{ticket.employeeId || 'Employee'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px', maxWidth: '280px' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a', marginBottom: '2px' }}>
                          {ticket.subject}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>
                            {ticket.category || 'General'}
                          </span>
                          {ticket.description && (
                            <span
                              onClick={() => setSelectedTicket(ticket)}
                              style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              View note
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: prioSt.color,
                          background: prioSt.bg
                        }}>
                          {ticket.priority || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {ticket.date || 'N/A'}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${statusSt.border}`,
                            background: statusSt.bg,
                            color: statusSt.color,
                            outline: 'none',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            title="View details"
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="fas fa-eye" style={{ fontSize: '12px' }}></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket._id)}
                            title="Delete ticket"
                            style={{
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="fas fa-trash-alt" style={{ fontSize: '12px' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 12px auto' }}>
                      <i className="fas fa-inbox"></i>
                    </div>
                    No tickets found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Ticket Details</h3>
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
                  #TK-{selectedTicket._id.substring(selectedTicket._id.length - 4).toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '22px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Subject</label>
                <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', marginTop: '2px' }}>{selectedTicket.subject}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Category</label>
                  <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600', marginTop: '2px' }}>{selectedTicket.category || 'General'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Priority</label>
                  <div style={{ fontSize: '13px', color: getPriorityStyle(selectedTicket.priority).color, fontWeight: '700', marginTop: '2px' }}>
                    {selectedTicket.priority || 'Medium'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Raised By</label>
                  <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600', marginTop: '2px' }}>{selectedTicket.employeeId}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Date</label>
                  <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>{selectedTicket.date || 'N/A'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Description / Message</label>
                <div style={{ marginTop: '6px', padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {selectedTicket.description || 'No description provided for this ticket.'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Update Ticket Status
                </label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket._id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleDeleteTicket(selectedTicket._id)}
                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Delete Ticket
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: '#0A2B88', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHelpdesk;