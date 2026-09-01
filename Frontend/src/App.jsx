import { useState, useEffect } from 'react';
import Loginpage from './Components/Loginpage'; 
import AdminDashboard from './Components/AdminDashboard'; 
import UserDashboard from './Components/UserDashboard'; 
// 🔥 Ippo Student Dashboard-a import panniyachu 🔥
import StudentDashboard from './Components/Student/StudentDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState(''); 

  useEffect(() => {
    const savedData = localStorage.getItem('userAuth');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setUserName(parsedData.name || parsedData.email.split('@')[0]);
      setUserRole(parsedData.role);
      setUserEmail(parsedData.email); 
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUserName(userData.name || userData.email.split('@')[0]);
    setUserRole(userData.role); 
    setUserEmail(userData.email); 
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('userAuth');
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('');
    setUserEmail(''); 
  };

  return (
    <div>
      {!isLoggedIn ? (
        <Loginpage onLoginSuccess={handleLogin} />
      ) : userRole === 'Admin' ? (
        <AdminDashboard userName={userName} onLogout={handleLogout} />
      ) : userRole === 'Student' ? (
        // 🔥 FIX: Student-kku StudentDashboard open aagum 🔥
        <StudentDashboard userName={userName} userEmail={userEmail} onLogout={handleLogout} />
      ) : (
        // Matha roles (e.g., Employee/Trainer) aah irundha UserDashboard ku pogum
        <UserDashboard userName={userName} userEmail={userEmail} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;