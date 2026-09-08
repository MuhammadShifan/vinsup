import { useState } from 'react';
import "../App.css"; 
import logoImage from "../assets/logo.png";
import backgroundImage from "../assets/loginbg.png";

const TrainingManagementSystem = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); 

    if (!email.trim() && !password.trim()) {
      alert("Please enter both Email Address and Password!");
      return;
    } else if (!email.trim()) {
      alert("Please enter your Email Address!");
      return;
    } else if (!password.trim()) {
      alert("Please enter your Password!");
      return;
    }

    try {
      const response = await fetch('https://vinsup-4vt5.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Login successful! Welcome ${result.user.name}.`);
        
        const userData = { 
          email: email.toLowerCase().trim(), 
          role: result.user.role, 
          name: result.user.name,
          profilePhoto: result.user.profilePhoto || ''
        };

        // 🔥 JWT TOKEN & USER DATA STORAGE 🔥
        localStorage.setItem('token', result.token); // JWT Token store panrom
        localStorage.setItem('userAuth', JSON.stringify(userData));
        
        onLoginSuccess(userData); 
      } else {
        alert(result.message || "Invalid Email or Password! Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error! Backend run aagudha nu check pannunga bawa.");
    }
  };

  const features = [
    { icon: 'fas fa-users', title: 'Teacher Tracking', description: 'Track attendance and performance' },
    { icon: 'fas fa-book', title: 'Syllabus Tracking', description: 'Track topics, completion and progress' },
    { icon: 'fas fa-calendar-alt', title: 'Roadmap Planning', description: 'Plan classes, topics and schedules' },
    { icon: 'fas fa-chart-line', title: 'Progress Reports', description: 'Detailed reports and analytics' },
    { icon: 'fas fa-clipboard-check', title: 'Batch Management', description: 'Manage batches and assign teachers' },
    { icon: 'fas fa-bell', title: 'Notifications', description: 'Get important updates and reminders' },
  ];

  const renderDots = () => {
    return Array.from({ length: 32 }).map((_, index) => (
      <div key={index} className="dot"></div>
    ));
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        <div className="left-panel" style={{ backgroundImage: `url(${backgroundImage})` }}>
          <div className="left-content-overlay">
            <div className="header-logo">
              <div className="logo-box">
                 <img src={logoImage} alt="Vinsup Academy Logo" />
              </div>
            </div>
            
            <div className="system-details">
              <h1>Training <span>Management</span> System</h1>
              <p>Track teachers, batches, attendance, syllabus and roadmaps in one powerful platform.</p>
            </div>

            <div className="feature-grid">
              {features.map((feature, index) => (
                <div className="feature-card" key={index}>
                  <div className="icon-container">
                    <i className={feature.icon}></i>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="dot-pattern">{renderDots()}</div>
          </div>
        </div>

        <div className="right-panel">
          <div className="welcome-section">
            <h2>Welcome Back! <span className="wave">👋</span></h2>
            <p>Sign in to continue to your account</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon-wrapper">
                <i className="far fa-envelope"></i>
                <input 
                  type="email" 
                  id="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrapper">
                <i className="fas fa-lock"></i>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i 
                  className={showPassword ? "far fa-eye password-toggle" : "far fa-eye-slash password-toggle"} 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: 'pointer' }}
                  title={showPassword ? "Hide password" : "Show password"}
                ></i>
              </div>
            </div>
            <button type="submit" className="login-button">
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrainingManagementSystem;