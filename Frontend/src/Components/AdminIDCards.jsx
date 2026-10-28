import React, { useState, useEffect } from 'react';
import API, { getImageUrl, getAlternativeImageUrl } from '../utils/api';

const AdminIDCards = () => {
  const [activeTab, setActiveTab] = useState('employee');
  const [employees, setEmployees] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const BRAND_BLUE = '#0A2B88';
  const BRAND_RED = '#dc2626';
  const TEXT_DARK = '#0f172a';
  const TEXT_GRAY = '#64748b';
  const BORDER_COLOR = '#e2e8f0';
  const THEME_BLUE = '#2563eb';

  const getInitials = (name) => {
    if (!name) return 'ID';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    setImgFailed(false);
  }, [selectedPerson?._id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSelectedPerson(null);
      try {
        if (activeTab === 'employee') {
          const response = await API.get('/employees');
          const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
          setEmployees(data);
          if (data.length > 0) setSelectedPerson(data[0]);
        } else {
          const response = await API.get('/students');
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
    <div className="id-cards-container">

      <style>{`
        .id-cards-container {
          padding: clamp(14px, 2.5vw, 30px);
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
          width: 100%;
        }
        .id-cards-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 15px;
          flex-wrap: wrap;
        }
        .id-cards-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 25px;
          align-items: start;
        }
        .id-card-preview-box {
          display: flex;
          justify-content: center;
          background: #f8fafc;
          padding: clamp(16px, 3vw, 40px);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          box-sizing: border-box;
        }
        @media (max-width: 900px) {
          .id-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 576px) {
          .id-cards-header {
            flex-direction: column;
            align-items: stretch;
          }
          .id-cards-header button {
            width: 100%;
            justify-content: center;
          }
          .printable-card {
            width: min(350px, 100%) !important;
          }
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-card, .printable-card * {
            visibility: visible !important;
          }
          .printable-card {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-card img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div className="id-cards-header">
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: TEXT_DARK, fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', fontWeight: 'bold' }}>ID Cards Generator</h1>
          <p style={{ margin: 0, color: TEXT_GRAY, fontSize: '14px' }}>Generate and print professional ID cards for Employees and Students</p>
        </div>
        <button
          onClick={handlePrint}
          style={{ background: THEME_BLUE, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', minHeight: '40px' }}
        >
          Print {activeTab === 'employee' ? 'Employee' : 'Student'} ID
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER_COLOR}`, marginBottom: '25px', background: '#fff', borderRadius: '8px 8px 0 0', flexWrap: 'wrap' }}>
        <TabButton id="employee" label="Employees" />
        <TabButton id="student" label="Students" />
      </div>

      <div className="id-cards-grid">

        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: `1px solid ${BORDER_COLOR}`, maxHeight: '600px', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: TEXT_DARK }}>Select {activeTab === 'employee' ? 'Employee' : 'Student'}</h3>

          {loading && <div style={{textAlign:'center', color: TEXT_GRAY, padding:'20px'}}>Loading...</div>}

          {!loading && currentData.length === 0 && (
              <div style={{textAlign:'center', color: TEXT_GRAY, padding:'20px'}}>No {activeTab}s found.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!loading && currentData.map(person => {
              const personRawPhoto = person.profilePhoto || person.photo || person.image || person.avatar;
              const thumbUrl = personRawPhoto ? getImageUrl(personRawPhoto) : '';
              const isSelected = selectedPerson?._id === person._id;

              return (
                <div
                  key={person._id}
                  onClick={() => setSelectedPerson(person)}
                  style={{
                    padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', transition: '0.2s',
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    border: isSelected ? `1.5px solid ${THEME_BLUE}` : `1px solid ${BORDER_COLOR}`,
                    display: 'flex', alignItems: 'center', gap: '12px'
                  }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
                    background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={person.fullName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          const alt = getAlternativeImageUrl(e.target.src);
                          if (alt && e.target.src !== alt) {
                            e.target.src = alt;
                          } else {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: '100%', height: '100%', display: thumbUrl ? 'none' : 'flex',
                      alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A2B88 0%, #1e40af 100%)',
                      color: '#fff', fontSize: '13px', fontWeight: '700'
                    }}>
                      {getInitials(person.fullName)}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {person.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: TEXT_GRAY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeTab === 'employee'
                        ? `${person.empId} | ${person.designation || 'Staff'}`
                        : `${person.studentId || 'STU'} | ${person.course || person.courseName || 'Course'}`
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="id-card-preview-box">
          {selectedPerson ? (

            <div className="printable-card" style={{
              width: '350px', maxWidth: '100%', minHeight: '530px', background: '#fff', borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #cbd5e1', boxSizing: 'border-box'
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
                    width: '110px', height: '110px', borderRadius: '14px', overflow: 'hidden',
                    background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.12)', border: '2px solid #e2e8f0', position: 'relative'
                }}>
                  {(() => {
                    const rawPhoto = selectedPerson.profilePhoto || selectedPerson.photo || selectedPerson.image || selectedPerson.avatar;
                    const cardPhotoUrl = rawPhoto ? getImageUrl(rawPhoto) : '';
                    if (!imgFailed && cardPhotoUrl) {
                      return (
                        <img
                          src={cardPhotoUrl}
                          alt={selectedPerson.fullName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            const alt = getAlternativeImageUrl(e.target.src);
                            if (alt && e.target.src !== alt) {
                              e.target.src = alt;
                            } else {
                              setImgFailed(true);
                            }
                          }}
                        />
                      );
                    }
                    return (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', background: 'linear-gradient(135deg, #0A2B88 0%, #1e40af 100%)',
                        color: '#fff', fontSize: '36px', fontWeight: '800', letterSpacing: '1px'
                      }}>
                        {getInitials(selectedPerson.fullName)}
                      </div>
                    );
                  })()}
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

                <div style={{ width: '100%', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', boxSizing: 'border-box' }}>

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