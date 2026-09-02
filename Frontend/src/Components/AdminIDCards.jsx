import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminIDCards = () => {
  const [activeTab, setActiveTab] = useState('employee');
  const [employees, setEmployees] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(false);

  const BRAND_BLUE = '#0A2B88';
  const BRAND_RED = '#dc2626';
  const TEXT_DARK = '#0f172a';
  const TEXT_GRAY = '#64748b';
  const BORDER_COLOR = '#e2e8f0';
  const THEME_BLUE = '#2563eb';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSelectedPerson(null);
      try {
        if (activeTab === 'employee') {
          const response = await axios.get('https://vinsup-4vt5.onrender.com/api/employees');
          const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
          setEmployees(data);
          if (data.length > 0) setSelectedPerson(data[0]);
        } else {
          const response = await axios.get('https://vinsup-4vt5.onrender.com/api/students');
          const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
          setStudents(data);
          if (data.length > 0) setSelectedPerson(data[0]);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}s:`, err);
        if (activeTab === 'employee') setEmployees([]); else setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '10px 25px',
        border: 'none',
        background: 'none',
        fontSize: '15px',
        fontWeight: activeTab === id ? '700' : '500',
        color: activeTab === id ? BRAND_BLUE : TEXT_GRAY,
        borderBottom: activeTab === id ? `3px solid ${BRAND_BLUE}` : `3px solid transparent`,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  const currentData = activeTab === 'employee' ? employees : students;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🔥 FIX: Perfect Print CSS - Hides everything EXCEPT the card */}
      <style>{`
        @media print {
          body * {
            visibility: hidden; /* Hides sidebar, header, etc. */
          }
          .printable-card, .printable-card * {
            visibility: visible; /* Shows ONLY the ID card */
          }
          .printable-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0 !important;
            box-shadow: none !important; /* Removes shadow in print */
            border: 1px solid #cbd5e1 !important; /* Keeps a clean border */
            -webkit-print-color-adjust: exact !important; /* Forces colors/SVGs to print */
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 0mm; /* Removes default browser headers/footers */
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: TEXT_DARK, fontSize: '24px', fontWeight: 'bold' }}>ID Cards Generator</h1>
          <p style={{ margin: 0, color: TEXT_GRAY, fontSize: '14px' }}>Generate and print professional ID cards for Employees and Students</p>
        </div>
        <button 
          onClick={handlePrint}
          style={{ background: THEME_BLUE, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          Print {activeTab === 'employee' ? 'Employee' : 'Student'} ID
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER_COLOR}`, marginBottom: '25px', background: '#fff', borderRadius: '8px 8px 0 0' }}>
        <TabButton id="employee" label="Employees" />
        <TabButton id="student" label="Students" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px', alignItems: 'start' }}>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: `1px solid ${BORDER_COLOR}`, maxHeight: '600px', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: TEXT_DARK }}>Select {activeTab === 'employee' ? 'Employee' : 'Student'}</h3>
          
          {loading && <div style={{textAlign:'center', color: TEXT_GRAY, padding:'20px'}}>Loading...</div>}
          
          {!loading && currentData.length === 0 && (
              <div style={{textAlign:'center', color: TEXT_GRAY, padding:'20px'}}>No {activeTab}s found.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!loading && currentData.map(person => (
              <div 
                key={person._id}
                onClick={() => setSelectedPerson(person)}
                style={{ 
                  padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s',
                  background: selectedPerson?._id === person._id ? '#eff6ff' : '#f8fafc',
                  border: selectedPerson?._id === person._id ? `1px solid ${THEME_BLUE}` : `1px solid ${BORDER_COLOR}`
                }}
              >
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{person.fullName}</div>
                <div style={{ fontSize: '12px', color: TEXT_GRAY }}>
                  {activeTab === 'employee' 
                    ? `${person.empId} | ${person.designation || 'Staff'}` 
                    : `${person.studentId || 'STU'} | ${person.course || person.courseName || 'Course'} | ${person.batch || person.batchName || ''}`
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 100% PERFECT EXACT ID CARD PREVIEW */}
        <div style={{ display: 'flex', justifyContent: 'center', background: '#f8fafc', padding: '40px', borderRadius: '12px', border: `1px solid ${BORDER_COLOR}` }}>
          {selectedPerson ? (
            
            /* 🔥 FIX: Added 'printable-card' class here */
            <div className="printable-card" style={{ 
              width: '350px', height: '530px', background: '#fff', borderRadius: '16px', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #cbd5e1'
            }}>
              
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '120px', zIndex: 1 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 L100,0 L100,45 Q50,0 0,45 Z" fill={BRAND_RED} />
                <path d="M0,0 L100,0 L100,35 Q50,-10 0,35 Z" fill={BRAND_BLUE} />
              </svg>

              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: '25px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '15px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: BRAND_BLUE, letterSpacing: '1px', lineHeight: '1', fontFamily: "'Arial Black', Impact, sans-serif" }}>
                    VINS<span style={{ color: BRAND_RED }}>U</span>P
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: BRAND_BLUE, letterSpacing: '3.5px', marginTop: '2px' }}>
                    SKILL ACADEMY
                  </div>
                  <div style={{ fontSize: '8px', fontWeight: '700', color: BRAND_RED, marginTop: '3px' }}>
                    Building Future - Ready Professionals
                  </div>
                </div>

                <div style={{ 
                    width: '110px', height: '110px', borderRadius: '12px', overflow: 'hidden', 
                    background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {selectedPerson.profilePhoto ? (
                    <img 
                      src={selectedPerson.profilePhoto.startsWith('http') ? selectedPerson.profilePhoto : `https://vinsup-4vt5.onrender.com/${selectedPerson.profilePhoto.replace(/\\/g, '/').replace(/^\/+/, '')}`} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <i className="fas fa-user" style={{ fontSize: '40px', color: '#94a3b8' }}></i>
                  )}
                </div>

                <h2 style={{ margin: '15px 0 2px 0', fontSize: '22px', color: BRAND_BLUE, fontWeight: 'bold' }}>
                  {selectedPerson.fullName}
                </h2>
                
                <div style={{ color: BRAND_RED, fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing:'1px' }}>
                  {activeTab === 'employee' ? (selectedPerson.designation || 'Staff') : 'Student'}
                </div>
                
                <div style={{ color: '#334155', fontSize: '14px' }}>
                  {activeTab === 'employee' 
                    ? `${selectedPerson.department || 'Teaching'} Department`
                    : `${selectedPerson.course || selectedPerson.courseName || 'MERN Stack'} Course`
                  }
                </div>

                <hr style={{ width: '85%', border: '0', borderTop: `1px solid ${BORDER_COLOR}`, margin: '15px 0 12px 0' }} />

                <div style={{ width: '100%', padding: '0 30px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', boxSizing: 'border-box' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{activeTab === 'employee' ? 'Employee ID' : 'Student ID'}</span><span style={{ color: '#475569' }}>:</span>
                    <strong style={{ color: TEXT_DARK }}>{activeTab === 'employee' ? selectedPerson.empId : selectedPerson.studentId || 'N/A'}</strong>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>DOB</span><span style={{ color: '#475569' }}>:</span>
                    <strong style={{ color: TEXT_DARK }}>{formatDate(selectedPerson.dob)}</strong>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>Email</span><span style={{ color: '#475569' }}>:</span>
                    <strong style={{ color: TEXT_DARK, wordBreak: 'break-word', fontSize: '12px' }}>{selectedPerson.email || 'N/A'}</strong>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>Phone</span><span style={{ color: '#475569' }}>:</span>
                    <strong style={{ color: TEXT_DARK }}>{selectedPerson.phone || 'N/A'}</strong>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{activeTab === 'employee' ? 'Date of Joining' : 'Admission Date'}</span><span style={{ color: '#475569' }}>:</span>
                    <strong style={{ color: TEXT_DARK }}>{formatDate(activeTab === 'employee' ? selectedPerson.doj : (selectedPerson.admissionDate || selectedPerson.doj || selectedPerson.courseStartDate))}</strong>
                  </div>

                  {activeTab === 'student' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', alignItems: 'center' }}>
                        <span style={{ color: '#475569', fontWeight: '500' }}>Batch</span><span style={{ color: '#475569' }}>:</span>
                        <strong style={{ color: TEXT_DARK, fontWeight:'bold' }}>{selectedPerson.batch || selectedPerson.batchName || 'N/A'}</strong>
                    </div>
                  )}
                </div>
              </div>

              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '90px', zIndex: 1 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,100 L100,100 L100,55 Q50,100 0,55 Z" fill={BRAND_RED} />
                <path d="M0,100 L100,100 L100,65 Q50,110 0,65 Z" fill={BRAND_BLUE} />
              </svg>

            </div>
          ) : (
            <div style={{ padding: '60px', color: TEXT_GRAY, textAlign: 'center' }}>Please select a {activeTab} to view ID card.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminIDCards;