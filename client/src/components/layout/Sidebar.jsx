import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IoLogOutOutline } from 'react-icons/io5';
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePlusCircle,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineBuildingOffice
} from 'react-icons/hi2';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange, mobileOpen, onMobileClose }) => {
  const { user, logout, isAdmin, isMHMC } = useAuth();
  const location = useLocation();

  const studentTabs = [
    { id: 'active', label: 'Active', icon: <HiOutlineExclamationCircle /> },
    { id: 'pending', label: 'Pending Verification', icon: <HiOutlineClock /> },
    { id: 'resolved', label: 'Resolved', icon: <HiOutlineCheckCircle /> },
    { id: 'submit', label: 'Submit Complaint', icon: <HiOutlinePlusCircle /> },
  ];

  const adminTabs = [
    { id: 'all', label: 'All Complaints', icon: <HiOutlineClipboardDocumentList /> },
    { id: 'needs-action', label: 'Needs Action', icon: <HiOutlineExclamationCircle /> },
    { id: 'pending', label: 'Pending Verification', icon: <HiOutlineClock /> },
    { id: 'analytics', label: 'Analytics', icon: <HiOutlineChartBar /> },
    { id: 'students', label: 'Manage Students', icon: <HiOutlineUsers /> },
  ];

  const tabs = isAdmin ? adminTabs : studentTabs;

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <HiOutlineBuildingOffice size={24} />
          </div>
          <div className="sidebar-brand-text">
            <h2>HostelCare</h2>
            <span className="sidebar-brand-sub">Complaint Manager</span>
          </div>
        </div>

        {/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-meta">
              {isAdmin ? 'Administrator' : `${user?.block}-Block, ${user?.floor} Floor`}
              {isMHMC && <span className="mhmc-badge">MHMC</span>}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Menu</span>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="sidebar-nav-icon">{tab.icon}</span>
              <span className="sidebar-nav-text">{tab.label}</span>
              {activeTab === tab.id && <span className="sidebar-nav-indicator" />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={logout}>
            <IoLogOutOutline size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
