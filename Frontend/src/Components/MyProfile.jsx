import React, { useState, useEffect } from 'react';

const MyProfile = ({ trainerData }) => {
  const [allocatedCoursesCount, setAllocatedCoursesCount] = useState(0);

  useEffect(() => {
    const fetchRealAllocatedCourses = async () => {
      try {
        const trainerName = trainerData?.profileDetails?.fullName;
        if (!trainerName) return;

        // Fetching batches or courses from backend to calculate the exact real count
        const response = await fetch('http://localhost:5001/api/batches');
        if (response.ok) {
          const result = await response.json();
          const batches = Array.isArray(result) ? result : (result.data || []);
          
          // Filter batches assigned to this trainer
          const trainerBatches = batches.filter(b => 
            (b.trainerName && b.trainerName.toLowerCase() === trainerName.toLowerCase()) || 
            (b.trainer && b.trainer.toLowerCase() === trainerName.toLowerCase())
          );

          // Get unique courses count from trainer batches
          const uniqueCourses = [...new Set(trainerBatches.map(b => b.courseName || b.course))];
          setAllocatedCoursesCount(uniqueCourses.length > 0 ? uniqueCourses.length : trainerBatches.length);
        }
      } catch (error) {
        console.error("Error fetching allocated courses:", error);
      }
    };

    fetchRealAllocatedCourses();
  }, [trainerData]);

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
      <span style={{ color: '#64748b', fontSize: '13px', width: '40%' }}>{label}</span>
      <span style={{ color: '#1e293b', fontSize: '13px', width: '60%', fontWeight: '600' }}>{value || "N/A"}</span>
    </div>
  );

  return (
    <div style={{ padding: '30px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Profile Card */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '35px', border: '1px solid #f1f5f9', display: 'flex', gap: '40px', marginBottom: '30px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        
        {/* Avatar */}
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '42px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <span style={{ zIndex: 0 }}>{(trainerData.profileDetails.fullName || "E").charAt(0).toUpperCase()}</span>
          {trainerData.profile.profilePic && (
            <img 
              src={trainerData.profile.profilePic} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }} 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          )}
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.profileDetails.fullName}</h2>
              <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>{trainerData.profileDetails.role}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '13px', fontWeight: '500' }}><i className="fas fa-user" style={{ width: '16px', color: '#64748b' }}></i> Employee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '13px', fontWeight: '500' }}><i className="far fa-id-badge" style={{ width: '16px', color: '#64748b' }}></i> Employee ID : {trainerData.profileDetails.empId}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '13px', fontWeight: '500' }}><i className="far fa-calendar-alt" style={{ width: '16px', color: '#64748b' }}></i> Joined on : {trainerData.profileDetails.joinedOn}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#475569', fontSize: '13px', fontWeight: '500' }}><i className="far fa-envelope" style={{ width: '16px', marginTop: '2px', color: '#64748b' }}></i> {trainerData.profileDetails.email}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#475569', fontSize: '13px', fontWeight: '500' }}><i className="fas fa-phone-alt" style={{ width: '16px', marginTop: '2px', color: '#64748b' }}></i> {trainerData.profileDetails.phone}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#475569', fontSize: '13px', fontWeight: '500' }}><i className="far fa-calendar" style={{ width: '16px', marginTop: '2px', color: '#64748b' }}></i> {trainerData.profileDetails.dob}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#475569', fontSize: '13px', fontWeight: '500' }}><i className="fas fa-map-marker-alt" style={{ width: '16px', marginTop: '2px', color: '#64748b' }}></i> <span style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}>{trainerData.profileDetails.location}</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '30px', display: 'flex' }}>
        <div style={{ padding: '12px 20px', borderBottom: '2px solid #2563eb', color: '#2563eb', fontWeight: '700', fontSize: '14px' }}>
          Personal Information
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
        
        {/* COLUMN 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <i className="far fa-user" style={{ color: '#2563eb', fontSize: '16px' }}></i>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Personal Information</h3>
            </div>
            <InfoRow label="Full Name" value={trainerData.profileDetails.fullName} />
            <InfoRow label="Date of Birth" value={trainerData.profileDetails.dob} />
            <InfoRow label="Gender" value={trainerData.profileDetails.gender} />
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <i className="fas fa-phone-alt" style={{ color: '#2563eb', fontSize: '16px' }}></i>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Contact Information</h3>
            </div>
            <InfoRow label="Email Address" value={trainerData.profileDetails.email} />
            <InfoRow label="Phone Number" value={trainerData.profileDetails.phone} />
          </div>
        </div>

        {/* COLUMN 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <i className="fas fa-map-marker-alt" style={{ color: '#2563eb', fontSize: '16px' }}></i>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Address</h3>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>Current Address</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e293b', fontWeight: '600', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{trainerData.profileDetails.address.current}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>Permanent Address</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e293b', fontWeight: '600', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{trainerData.profileDetails.address.permanent}</p>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <i className="fas fa-shield-alt" style={{ color: '#2563eb', fontSize: '16px' }}></i>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Account Information</h3>
            </div>
            <InfoRow label="Username" value={trainerData.profileDetails.account.username} />
            <InfoRow label="Employee ID" value={trainerData.profileDetails.empId} />
            <InfoRow label="Last Login" value={trainerData.profileDetails.account.lastLogin} />
          </div>
        </div>

        {/* COLUMN 3: Profile Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <i className="far fa-id-card" style={{ color: '#2563eb', fontSize: '16px' }}></i>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Profile Summary</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {/* Experience */}
              <div style={{ background: '#f4ebff', padding: '20px 15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: '#9333ea', fontSize: '20px' }}><i className="far fa-calendar-alt"></i></div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.profileDetails.summary.experience}</h4>
                <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: '500' }}>Total Experience</span>
              </div>

              {/* Batches Taken */}
              <div style={{ background: '#dcfce7', padding: '20px 15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: '#16a34a', fontSize: '20px' }}><i className="fas fa-layer-group"></i></div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.profileDetails.summary.batches}</h4>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '500' }}>Batches Taken</span>
              </div>

              {/* Students Trained */}
              <div style={{ background: '#ffedd5', padding: '20px 15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: '#ea580c', fontSize: '20px' }}><i className="fas fa-users"></i></div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>{trainerData.profileDetails.summary.students}</h4>
                <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: '500' }}>Students Trained</span>
              </div>

              {/* Allocated Courses (Real Fetch Count) */}
              <div style={{ background: '#e0f2fe', padding: '20px 15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: '#0284c7', fontSize: '20px' }}><i className="fas fa-book"></i></div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 'bold' }}>
                  {allocatedCoursesCount}
                </h4>
                <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '500' }}>Allocated Courses</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyProfile;