import React, { useState, useEffect } from 'react';

const MySchedule = () => {
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 7, 1)); 

  // Page load aagumpothu LocalStorage-la irundhu data-va eduthu expire aanatha filter pannum
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem('myScheduleEvents');
    if (savedEvents) {
      const parsed = JSON.parse(savedEvents);
      return filterExpiredEvents(parsed);
    }
    return [
      { id: 1, title: 'urgent meeting', type: 'Meeting', time: '20:35', date: '01-08-2026' },
      { id: 2, title: 'met', type: 'Other', time: '09:53', date: '11-08-2026' }
    ];
  });

  // Pudhusa event add aanalum, delete aanaalum LocalStorage-la update pannidum
  useEffect(() => {
    localStorage.setItem('myScheduleEvents', JSON.stringify(events));
  }, [events]);

  // Prathyega oru second-um expire aannatha check panni automatic-ah delete pannum
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prevEvents => filterExpiredEvents(prevEvents));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function filterExpiredEvents(eventList) {
    const now = new Date();
    return eventList.filter(event => {
      const [day, month, year] = event.date.split('-').map(Number);
      const [hours, minutes] = event.time.split(':').map(Number);
      
      const eventDate = new Date(year, month - 1, day, hours, minutes);
      return eventDate > now; 
    });
  }

  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'Class', date: '', time: '' });

  const currentYear = currentMonthDate.getFullYear();
  const currentMonthIndex = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonthIndex - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonthIndex + 1, 1));
  const handleToday = () => setCurrentMonthDate(new Date());

  const handleDelete = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleAddEventSubmit = (e) => {
    e.preventDefault();
    if(!newEvent.title || !newEvent.date || !newEvent.time) return;

    const [year, month, day] = newEvent.date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    const eventToAdd = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      time: newEvent.time,
      date: formattedDate
    };

    setEvents([...events, eventToAdd]);
    setShowModal(false); 
    setNewEvent({ title: '', type: 'Class', date: '', time: '' }); 
  };

  const classCount = events.filter(e => e.type === 'Class').length;
  const meetingCount = events.filter(e => e.type === 'Meeting').length;
  // 🔥 OTHERS COUNT ADD PANNIRUKEN 🔥
  const otherCount = events.filter(e => e.type === 'Other').length;
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ padding: 'clamp(14px, 2.5vw, 30px)', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .schedule-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }
        .schedule-calendar-card {
          background: #fff;
          padding: clamp(15px, 2vw, 25px);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 992px) {
          .schedule-main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: 'clamp(20px, 3vw, 30px)', borderRadius: '12px', width: 'min(400px, 100%)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Add New Event</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleAddEventSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>Event Title</label>
                <input type="text" placeholder="e.g. React Class" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} required />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>Event Type</label>
                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="Class">Class</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>Date</label>
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} required />
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>Time</label>
                  <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} required />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 15px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 15px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: 'bold' }}>My Schedule</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>View your classes, meetings and work schedule</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <i className="fas fa-plus"></i> Add Event
        </button>
      </div>

      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '25px', display: 'flex' }}>
        <div style={{ padding: '12px 20px', borderBottom: '2px solid #2563eb', color: '#2563eb', fontWeight: '700', fontSize: '14px' }}>
          Monthly View
        </div>
      </div>

      <div className="schedule-main-grid">

        {/* ---------------- LEFT: CALENDAR CARD ---------------- */}
        <div className="schedule-calendar-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: '0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Schedule Calendar</h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}><i className="fas fa-chevron-left"></i></button>
                <strong style={{ fontSize: '14px', color: '#0f172a', minWidth: '110px', textAlign: 'center' }}>{monthName} {currentYear}</strong>
                <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}><i className="fas fa-chevron-right"></i></button>
              </div>
              <button onClick={handleToday} style={{ border: '1px solid #e2e8f0', background: '#fff', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Today</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
            {weekDays.map(day => <div key={day} style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{day}</div>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '15px', textAlign: 'center' }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`blank-${i}`}></div>)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${String(day).padStart(2, '0')}-${String(currentMonthIndex + 1).padStart(2, '0')}-${currentYear}`;
              
              const dayEvents = events.filter(e => e.date === dateStr);
              const hasEvent = dayEvents.length > 0;
              const eventType = hasEvent ? dayEvents[0].type : null;

              let cellBg = 'transparent';
              let cellColor = '#334155';
              let cellBorder = '2px solid transparent';
              let cellFontWeight = '500';
              let cellBorderRadius = '8px';

              if (hasEvent) {
                cellFontWeight = 'bold';
                if (eventType === 'Class') {
                  cellBg = '#10b981'; // Green
                  cellColor = '#ffffff'; 
                } else if (eventType === 'Meeting') {
                  cellBg = '#ef4444'; // Red
                  cellColor = '#ffffff'; 
                } else {
                  cellBg = '#3b82f6'; // Blue
                  cellColor = '#ffffff'; 
                }
              }

              const isToday = today.getDate() === day && today.getMonth() === currentMonthIndex && today.getFullYear() === currentYear;
              
              if (isToday) {
                cellBorderRadius = '50%';
                cellBorder = '2px solid #000000'; 
                if (!hasEvent) {
                  cellBg = 'transparent'; 
                  cellColor = '#0f172a'; 
                  cellFontWeight = 'bold';
                }
              }

              return (
                <div key={day} style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <div style={{
                    width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: cellBorderRadius, background: cellBg, color: cellColor, border: cellBorder, fontWeight: cellFontWeight, fontSize: '14px', cursor: 'pointer', transition: '0.2s'
                  }}>
                    {day}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Class
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> Meeting
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span> Other
            </div>
          </div>
        </div>

        {/* ---------------- RIGHT: SUMMARY & EVENTS ---------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Schedule Summary</h3>
            {/* 🔥 UPDATED GRID COLUMNS TO 3 FOR CLASSES, MEETINGS, & OTHERS 🔥 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
                <strong style={{ fontSize: '20px', color: '#16a34a' }}>{String(classCount).padStart(2, '0')}</strong>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '600' }}>Classes</span>
              </div>
              <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
                <strong style={{ fontSize: '20px', color: '#dc2626' }}>{String(meetingCount).padStart(2, '0')}</strong>
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>Meetings</span>
              </div>
              <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
                <strong style={{ fontSize: '20px', color: '#2563eb' }}>{String(otherCount).padStart(2, '0')}</strong>
                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>Others</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>Month's Events</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
              {events.map(event => (
                <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px dashed #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ 
                      background: event.type === 'Class' ? '#10b981' : event.type === 'Meeting' ? '#ef4444' : '#3b82f6', 
                      color: '#ffffff', 
                      width: '35px', height: '35px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' 
                    }}>
                      <i className="far fa-calendar-alt"></i>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a', textTransform: 'capitalize' }}>{event.title}</strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{event.time}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px', color: '#0f172a' }}>{event.date}</strong>
                    <button onClick={() => handleDelete(event.id)} style={{ background: '#f1f5f9', color: '#94a3b8', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <i className="fas fa-trash-alt" style={{ fontSize: '12px' }}></i>
                    </button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>No events this month.</div>
              )}
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default MySchedule;