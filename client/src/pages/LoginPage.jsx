import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineBuildingOffice } from 'react-icons/hi2';
import './LoginPage.css';

const LoginPage = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password, role);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate(role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-orb orb-3" />
        <div className="login-bg-grid" />
      </div>

      {/* Left panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">
              <HiOutlineBuildingOffice size={32} />
            </div>
            <h1 className="login-brand-name">HostelCare</h1>
          </div>
          <h2 className="login-hero-text">
            Streamline your<br />
            <span className="gradient-text">hostel complaints</span>
          </h2>
          <p className="login-hero-sub">
            A transparent, digital complaint management system for your hostel.
            File, track, and resolve issues efficiently.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <span className="feature-icon">📋</span>
              <div>
                <strong>Easy Filing</strong>
                <span>Submit complaints in seconds</span>
              </div>
            </div>
            <div className="login-feature">
              <span className="feature-icon">📊</span>
              <div>
                <strong>Real-time Tracking</strong>
                <span>Monitor status at every stage</span>
              </div>
            </div>
            <div className="login-feature">
              <span className="feature-icon">✅</span>
              <div>
                <strong>Verified Resolution</strong>
                <span>MHMC-verified quality checks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-form-header">
            <h3>Sign In</h3>
            <p>Access your hostel complaint dashboard</p>
          </div>

          {/* Role toggle */}
          <div className="role-toggle">
            <button
              className={`role-toggle-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
              type="button"
            >
              <span className="role-icon">🎓</span>
              Student
            </button>
            <button
              className={`role-toggle-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
              type="button"
            >
              <span className="role-icon">🛡️</span>
              Admin
            </button>
            <div className={`role-toggle-slider ${role === 'admin' ? 'right' : ''}`} />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'admin' ? 'admin@nit.ac.in' : 'rollno@nit.ac.in'}
              icon={<HiOutlineEnvelope />}
              autoComplete="email"
              id="login-email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={<HiOutlineLockClosed />}
              autoComplete="current-password"
              id="login-password"
            />

            {error && (
              <div className="login-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              Sign In as {role === 'admin' ? 'Admin' : 'Student'}
            </Button>
          </form>

          <p className="login-footer-text">
            Passwords are assigned by the hostel administration.<br />
            Contact the hostel office for login assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
