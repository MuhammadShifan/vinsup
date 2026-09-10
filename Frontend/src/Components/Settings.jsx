import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminSettings = () => {
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePhoto: '',
  });

  const [newName, setNewName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // 🔥 File upload state 🔥
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const fetchAdminSettings = async () => {
    try {
      const res = await axios.get('https://vinsup-4vt5.onrender.com/api/admin/profile');
      if (res.data.success && res.data.admin) {
        setAdminData(res.data.admin);
        setNewName(res.data.admin.name);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // Update Name
  const handleUpdateName = async () => {
    if (!newName.trim()) return alert("Name cannot be empty!");
    try {
      const res = await axios.put('https://vinsup-4vt5.onrender.com/api/admin/update', { name: newName });
      if (res.data.success) {
        alert("Admin name updated successfully! 🎉");
        fetchAdminSettings();
      } else {
        alert(res.data.message || "Failed to update name.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while updating name.");
    }
  };

  // 🔥 Upload Profile Photo as File 🔥
  const handleUpdatePhoto = async () => {
    if (!selectedFile) return alert("Please select an image file first!");
    
    const formData = new FormData();
    formData.append('image', selectedFile); // Backend upload middleware-kku anuppurom

    try {
      // Direct file upload to server uploads folder
      const uploadRes = await axios.post('https://vinsup-4vt5.onrender.com/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => null);

      let photoUrl = '';
      if (uploadRes && uploadRes.data && uploadRes.data.filePath) {
        photoUrl = `https://vinsup-4vt5.onrender.com/${uploadRes.data.filePath.replace(/\\/g, '/')}`;
      } else {
        // Fallback to base64 if upload route is missing
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
          photoUrl = reader.result;
          await savePhotoToDb(photoUrl);
        };
        return;
      }

      await savePhotoToDb(photoUrl);

    } catch (err) {
      console.error(err);
      alert("Error uploading image file.");
    }
  };

  const savePhotoToDb = async (url) => {
    try {
      const res = await axios.put('https://vinsup-4vt5.onrender.com/api/admin/update', { profilePhoto: url });
      if (res.data.success) {
        alert("Profile photo updated successfully! 📸");
        setSelectedFile(null);
        fetchAdminSettings();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save photo in database.");
    }
  };

  // Update Password
  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert("Please fill in all password fields!");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      alert("New password and Confirm password do not match!");
      return;
    }

    try {
      const res = await axios.put('https://vinsup-4vt5.onrender.com/api/admin/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      if (res.data.success) {
        alert("Password updated successfully! 🔒 Please login again if needed.");
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        alert(res.data.message || "Failed to update password.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Incorrect current password!");
    }
  };

  const getPhotoUrl = (rawPath) => {
    if (!rawPath) return "https://randomuser.me/api/portraits/men/1.jpg";
    if (rawPath.startsWith('http') || rawPath.startsWith('data:image')) return rawPath;
    let cleanPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!cleanPath.startsWith('uploads/')) cleanPath = 'uploads/' + cleanPath;
    return `https://vinsup-4vt5.onrender.com/${cleanPath}`;
  };

  return (
    <div className="settings-page-wrapper">
      <style>{`
        .settings-page-wrapper {
          padding: clamp(14px, 2.5vw, 30px);
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          box-sizing: border-box;
          width: 100%;
        }
        .settings-layout-container {
          display: flex;
          gap: 25px;
          align-items: flex-start;
        }
        .settings-profile-card {
          width: 320px;
          background: #fff;
          border-radius: 12px;
          padding: clamp(16px, 2.5vw, 30px);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .settings-forms-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 25px;
          width: 100%;
        }
        .settings-card {
          background: #fff;
          border-radius: 12px;
          padding: clamp(16px, 2.5vw, 30px);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
        }
        .settings-card-inner {
          display: flex;
          gap: 25px;
        }
        .settings-card-header {
          width: 240px;
          display: flex;
          gap: 15px;
          flex-shrink: 0;
        }
        .settings-card-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .settings-input-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          align-items: center;
          gap: 15px;
        }
        @media (max-width: 900px) {
          .settings-layout-container {
            flex-direction: column;
          }
          .settings-profile-card {
            width: 100%;
          }
        }
        @media (max-width: 650px) {
          .settings-card-inner {
            flex-direction: column;
            gap: 15px;
          }
          .settings-card-header {
            width: 100%;
          }
          .settings-input-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }
      `}</style>

      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 'clamp(1.25rem, 2vw, 1.625rem)', fontWeight: '700', color: '#0f172a' }}>Settings</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Manage your account settings and preferences.</p>
      </div>

      <div className="settings-layout-container">
        
        {/* Left Profile Card */}
        <div className="settings-profile-card">
          <h3 style={{ margin: '0 0 25px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Admin Profile</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '15px' }}>
              <img 
                src={getPhotoUrl(adminData.profilePhoto)} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f1f5f9' }} 
              />
            </div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{adminData.name}</h2>
            <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>Administrator</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <i className="far fa-envelope" style={{ color: '#64748b', fontSize: '16px', width: '20px', textAlign: 'center' }}></i>
              <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500', wordBreak: 'break-all' }}>{adminData.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <i className="fas fa-phone-alt" style={{ color: '#64748b', fontSize: '16px', width: '20px', textAlign: 'center' }}></i>
              <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{adminData.phone}</span>
            </div>
          </div>
        </div>

        {/* Right Settings Cards */}
        <div className="settings-forms-col">
          
          {/* Card 1: Change Profile Photo via File Upload */}
          <div className="settings-card">
            <div className="settings-card-inner">
              <div className="settings-card-header">
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f3e8ff', color: '#9333ea', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', flexShrink: 0 }}>
                  <i className="far fa-user"></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Change Profile Photo</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>Upload your profile image from computer.</p>
                </div>
              </div>
              <div className="settings-card-body" style={{ gap: '12px' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', boxSizing: 'border-box' }}
                />
                {selectedFile && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Selected: {selectedFile.name}</span>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                  <button onClick={handleUpdatePhoto} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Upload Photo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Change Name */}
          <div className="settings-card">
            <div className="settings-card-inner">
              <div className="settings-card-header">
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', flexShrink: 0 }}>
                  <i className="far fa-user"></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Change Name</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>Update your full name.</p>
                </div>
              </div>
              <div className="settings-card-body">
                <div className="settings-input-row">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={handleUpdateName} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Update Name
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Change Password */}
          <div className="settings-card">
            <div className="settings-card-inner">
              <div className="settings-card-header">
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', flexShrink: 0 }}>
                  <i className="fas fa-lock"></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Change Password</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>Update your account password securely.</p>
                </div>
              </div>
              <div className="settings-card-body" style={{ gap: '15px' }}>
                
                <div className="settings-input-row">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Current Password</label>
                  <input 
                    type="password" 
                    name="current"
                    placeholder="Enter current password"
                    value={passwords.current} 
                    onChange={handlePasswordChange} 
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="settings-input-row">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>New Password</label>
                  <input 
                    type="password" 
                    name="new"
                    placeholder="Enter new password"
                    value={passwords.new} 
                    onChange={handlePasswordChange} 
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="settings-input-row">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirm"
                    placeholder="Confirm new password"
                    value={passwords.confirm} 
                    onChange={handlePasswordChange} 
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                  <button onClick={handleUpdatePassword} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettings;