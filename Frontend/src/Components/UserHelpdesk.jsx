import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserHelpdesk = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPriority, setSelectedPriority] = useState('Medium');

  // Backend Integration States
  const [tickets, setTickets] = useState([]); 
  const [activeTab, setActiveTab] = useState('All Tickets');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🔥 PAGINATION STATES 🔥
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;
  
  // 🔥 Real user email edukkura logic (Dummy ID-kku bathila) 🔥
  const getStoredEmail = () => {
    try {
      const auth = JSON.parse(localStorage.getItem('userAuth') || '{}');
      return auth.email || 'muhammadshifan@gmail.com';
    } catch (e) {
      return 'muhammadshifan@gmail.com';
    }
  };
  const employeeId = getStoredEmail();

  const [formData, setFormData] = useState({
    subject: '',
    category: 'Technical Issue',
    description: '',
    date: ''
  });

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`https://vinsup-4vt5.onrender.com/api/tickets/${employeeId}`);
      setTickets(response.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchTickets();
    }
  }, [currentView]);

  // Reset to page 1 when Tab or Search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const ticketData = { ...formData, priority: selectedPriority, employeeId };
      const response = await axios.post('https://vinsup-4vt5.onrender.com/api/tickets/add', ticketData);
      alert(response.data.message || "Ticket successfully raised!");
      setFormData({ subject: '', category: 'Technical Issue', description: '', date: '' });
      setCurrentView('dashboard');
    } catch (err) {
      console.error(err);
      alert("Error raising ticket!");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;

    try {
      await axios.delete(`https://vinsup-4vt5.onrender.com/api/tickets/${ticketId}`);
      fetchTickets();
    } catch (err) {
      console.error("Error deleting ticket:", err);
      alert("Failed to delete ticket. Please check backend.");
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return { color: '#ef4444', bg: '#fee2e2', dot: '#ef4444', border: '#fca5a5' };
      case 'Medium': return { color: '#f59e0b', bg: '#ffedd5', dot: '#f59e0b', border: '#fdba74' };
      case 'Low': return { color: '#10b981', bg: '#dcfce7', dot: '#10b981', border: '#86efac' };
      case 'Urgent': return { color: '#9333ea', bg: '#f3e8ff', dot: '#9333ea', border: '#d8b4fe' };
      default: return { color: '#64748b', bg: '#f1f5f9', dot: '#64748b', border: '#cbd5e1' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Progress': return { color: '#2563eb', bg: '#eff6ff' };
      case 'Open': return { color: '#2563eb', bg: '#eff6ff' };
      case 'Resolved': return { color: '#10b981', bg: '#dcfce7' };
      default: return { color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getCategoryStyle = (cat) => {
    switch(cat) {
      case 'Technical Issue': return { bg: '#eff6ff', color: '#2563eb' };
      case 'Certificate': return { bg: '#dcfce7', color: '#16a34a' };
      case 'Course Access': return { bg: '#f3e8ff', color: '#9333ea' };
      case 'Payment': return { bg: '#cffafe', color: '#0891b2' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesTab = activeTab === 'All Tickets' || ticket.status === activeTab;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // 🔥 PAGINATION LOGIC 🔥
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress' || t.status === 'Open').length;

  const padZero = (num) => (num < 10 ? `0${num}` : num);

  // ==========================================
  // VIEW 1: FULL DASHBOARD
  // ==========================================
  const renderDashboard = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 'bold' }}>Helpdesk</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>We're here to help you. Raise a ticket or view your existing requests.</p>
        </div>
        <button 
          onClick={() => setCurrentView('raise_ticket')}
          style={{ padding: '10px 20px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-plus"></i> Raise New Ticket
        </button>
      </div>

      <div className="user-helpdesk-grid">
        {/* === LEFT COLUMN === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px' }}>
            {[
              { title: 'My Tickets', count: padZero(totalTickets), icon: 'fas fa-ticket-alt', color: '#2563eb', bg: '#eff6ff', sub: 'All Time' },
              { title: 'Resolved', count: padZero(resolvedTickets), icon: 'far fa-check-circle', color: '#16a34a', bg: '#dcfce7', sub: 'All Time' },
              { title: 'In Progress', count: padZero(inProgressTickets), icon: 'far fa-clock', color: '#f59e0b', bg: '#ffedd5', sub: 'Currently open' }
            ].map((stat, i) => (
              <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ background: stat.bg, width: '48px', height: '48px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: stat.color, fontSize: '20px', flexShrink: 0 }}>
                  <i className={stat.icon}></i>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>{stat.count}</h3>
                  <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#1e293b', fontWeight: '600' }}>{stat.title}</p>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(16px, 2vw, 25px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #f1f5f9', overflowX: 'auto', maxWidth: '100%' }}>
                {['All Tickets', 'In Progress', 'Resolved'].map((tab, i) => (
                  <span 
                    key={i} 
                    onClick={() => setActiveTab(tab)}
                    style={{ paddingBottom: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '-2px', color: activeTab === tab ? '#2563eb' : '#64748b', borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                    {tab}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '15px', width: 'auto' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8', fontSize: '13px' }}></i>
                  <input 
                    type="text" 
                    placeholder="Search tickets..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '9px 15px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', width: 'min(220px, 100%)', color: '#1e293b', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600', borderRadius: '8px 0 0 8px' }}>Ticket ID</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Subject</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Priority</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>Created On</th>
                    <th style={{ padding: '16px 20px', width: '50px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: '600', borderRadius: '0 8px 8px 0' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTickets.length > 0 ? (
                    currentTickets.map((ticket, i) => (
                      <tr key={ticket._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '20px', fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>
                          #TK-{ticket._id ? ticket._id.substring(ticket._id.length - 4).toUpperCase() : 'NEW'}
                        </td>
                        <td style={{ padding: '20px' }}>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{ticket.subject}</h4>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {ticket.description ? ticket.description.substring(0, 40) + '...' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '20px' }}><span style={{ background: getCategoryStyle(ticket.category).bg, color: getCategoryStyle(ticket.category).color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{ticket.category}</span></td>
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPriorityStyle(ticket.priority).dot }}></span>
                             <span style={{ color: getPriorityStyle(ticket.priority).color, fontWeight: '600', fontSize: '13px' }}>{ticket.priority}</span>
                          </div>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <span style={{ color: getStatusStyle(ticket.status === 'Open' ? 'In Progress' : ticket.status).color, background: getStatusStyle(ticket.status === 'Open' ? 'In Progress' : ticket.status).bg, padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            {ticket.status === 'Open' ? 'In Progress' : ticket.status}
                          </span>
                        </td>
                        <td style={{ padding: '20px', fontSize: '13px', color: '#475569' }}>{ticket.date}</td>
                        <td style={{ padding: '20px', textAlign: 'center' }}>
                          <i 
                            className="fas fa-trash-alt" 
                            onClick={() => handleDeleteTicket(ticket._id)}
                            style={{ color: '#ef4444', cursor: 'pointer', fontSize: '14px', transition: '0.2s', opacity: 0.8 }}
                            title="Delete Ticket"
                            onMouseOver={(e) => e.target.style.opacity = 1}
                            onMouseOut={(e) => e.target.style.opacity = 0.8}
                          ></i>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No tickets found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '15px' }}>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={prevPage} 
                    disabled={currentPage === 1}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: currentPage === 1 ? '#94a3b8' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page}
                      onClick={() => paginate(page)}
                      style={{ 
                        padding: '6px 14px', 
                        border: page === currentPage ? 'none' : '1px solid #e2e8f0', 
                        background: page === currentPage ? '#2563eb' : '#fff', 
                        borderRadius: '6px', 
                        color: page === currentPage ? '#fff' : '#475569', 
                        fontWeight: '600',
                        cursor: 'pointer' 
                      }}>
                      {page}
                    </button>
                  ))}

                  <button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: currentPage === totalPages ? '#94a3b8' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN (SIDEBAR) === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(16px, 2vw, 25px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Support Hours</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <i className="far fa-clock" style={{ fontSize: '26px', color: '#94a3b8' }}></i>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>Monday - Saturday</p>
                <span style={{ fontSize: '13px', color: '#64748b' }}>09:00 AM - 06:00 PM</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>We usually respond within</p>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#2563eb', fontWeight: 'bold' }}>2 - 4 hours</h4>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(16px, 2vw, 25px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Help Resources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <a href="#" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}><i className="far fa-file-alt" style={{ color: '#94a3b8' }}></i> How to access my course?</a>
              <a href="#" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}><i className="far fa-file-alt" style={{ color: '#94a3b8' }}></i> How to download certificate?</a>
              <a href="#" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}><i className="far fa-file-alt" style={{ color: '#94a3b8' }}></i> Payment and refund policy</a>
            </div>
            <a href="#" style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>View All Articles <i className="fas fa-arrow-right" style={{ fontSize: '12px' }}></i></a>
          </div>

        </div>
      </div>
    </>
  );

  // ==========================================
  // VIEW 2: RAISE TICKET FORM 
  // ==========================================
  const renderRaiseTicket = () => (
    <>
      <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
          <span onClick={() => setCurrentView('dashboard')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}>Helpdesk</span>
          <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span>Raise New Ticket</span>
        </div>
        <h1 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 'bold' }}>Raise New Ticket</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Submit a new request to our support team. We'll get back to you as soon as possible.</p>
      </div>

      <div className="user-helpdesk-grid">
        
        {/* === LEFT COLUMN (FORM) === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(18px, 2.5vw, 30px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>Ticket Information</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#1e293b', marginBottom: '8px', fontWeight: '600' }}>Subject <span style={{ color: '#ef4444' }}>*</span></label>
              <input name="subject" value={formData.subject} onChange={handleInputChange} type="text" placeholder="Enter a short description of your issue" style={{ width: '100%', padding: '14px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '14px', color: '#1e293b' }} />
            </div>

            <div style={{ marginBottom: '20px', width: 'min(100%, 350px)' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#1e293b', marginBottom: '8px', fontWeight: '600' }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
              <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#475569', background: '#fff', boxSizing: 'border-box' }}>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Payment">Payment</option>
                <option value="Course Access">Course Access</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#1e293b', marginBottom: '8px', fontWeight: '600' }}>Priority <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {['Low', 'Medium', 'High', 'Urgent'].map(level => (
                  <div 
                    key={level} 
                    onClick={() => setSelectedPriority(level)}
                    style={{ 
                      padding: '14px', borderRadius: '8px', cursor: 'pointer',
                      border: selectedPriority === level ? `1px solid ${getPriorityStyle(level).border}` : '1px solid #e2e8f0',
                      background: selectedPriority === level ? '#fff' : '#f8fafc',
                      boxShadow: selectedPriority === level ? `0 0 0 1px ${getPriorityStyle(level).border}` : 'none',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      justifyContent: 'center',
                      boxSizing: 'border-box'
                    }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getPriorityStyle(level).dot, flexShrink: 0 }}></div>
                    <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: selectedPriority === level ? '600' : '500' }}>{level}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#1e293b', marginBottom: '8px', fontWeight: '600' }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="5" placeholder="Please provide detailed information about your issue..." style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '14px', color: '#1e293b', resize: 'vertical' }}></textarea>
              </div>
            </div>

            <div style={{ marginBottom: '35px', width: 'min(100%, 350px)' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#1e293b', marginBottom: '8px', fontWeight: '600' }}>When did the issue occur? <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <i className="far fa-calendar-alt" style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b' }}></i>
                <input name="date" value={formData.date} onChange={handleInputChange} type="date" style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '14px', color: '#475569', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentView('dashboard')} style={{ padding: '12px 25px', background: '#fff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={handleSubmit} style={{ padding: '12px 25px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Submit Ticket</button>
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN (FORM SIDEBAR) === */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(16px, 2vw, 25px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 25px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>What happens next?</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, fontSize: '16px' }}><i className="fas fa-paper-plane"></i></div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>Ticket Submitted</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>We'll receive your ticket and notify our team.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, fontSize: '16px' }}><i className="fas fa-search"></i></div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>Under Review</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>Our team will review and investigate the issue.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f8fafc', color: '#475569', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, fontSize: '16px' }}><i className="far fa-comment-dots"></i></div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>We'll Get Back</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>You'll receive an update or solution shortly.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: 'clamp(16px, 2vw, 25px)', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
              <i className="far fa-lightbulb" style={{ color: '#2563eb' }}></i> Helpful Tips
            </h3>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b', lineHeight: '1.5' }}>
                <i className="fas fa-check" style={{ color: '#2563eb', marginTop: '3px' }}></i> Provide as much detail as possible
              </li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b', lineHeight: '1.5' }}>
                <i className="fas fa-check" style={{ color: '#2563eb', marginTop: '3px' }}></i> Include screenshots if applicable
              </li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#1e293b', lineHeight: '1.5' }}>
                <i className="fas fa-check" style={{ color: '#2563eb', marginTop: '3px' }}></i> Mention the steps to reproduce the issue
              </li>
            </ul>
          </div>

        </div>
      </div>
    </>
  );

  return (
    <div style={{ padding: 'clamp(14px, 2.5vw, 30px)', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        .user-helpdesk-grid {
          display: grid;
          grid-template-columns: minmax(0, 3fr) 300px;
          gap: 25px;
          align-items: start;
        }
        @media (max-width: 992px) {
          .user-helpdesk-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      {currentView === 'dashboard' ? renderDashboard() : renderRaiseTicket()}
    </div>
  );
};

export default UserHelpdesk;