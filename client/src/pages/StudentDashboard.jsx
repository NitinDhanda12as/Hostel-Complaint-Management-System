import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import Loader from '../components/ui/Loader';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ComplaintCard from '../components/complaints/ComplaintCard';
import ComplaintModal from '../components/complaints/ComplaintModal';
import SubmitComplaintForm from '../components/complaints/SubmitComplaintForm';
import {
  getMyComplaints,
  getFloorComplaints,
  getStats,
  submitComplaint,
  upvoteComplaint,
  verifyResolution,
  rejectResolution,
  repostComplaint
} from '../services/complaintService';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckCircle
} from 'react-icons/hi2';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user, isMHMC } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsData = await getStats();
      setStats(statsData.stats);

      // Fetch complaints based on active tab
      let allComplaints = [];
      const section = activeTab === 'submit' ? null : activeTab;

      if (section) {
        const [personalData, floorData] = await Promise.all([
          getMyComplaints(section),
          getFloorComplaints(section)
        ]);

        // Combine and deduplicate
        const personalComplaints = personalData.complaints || [];
        const floorComplaints = floorData.complaints || [];

        const idSet = new Set();
        allComplaints = [...floorComplaints, ...personalComplaints].filter(c => {
          if (idSet.has(c._id)) return false;
          idSet.add(c._id);
          return true;
        });
      }

      setComplaints(allComplaints);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'submit') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeTab, fetchData]);

  const handleSubmitComplaint = async (data) => {
    setActionLoading(true);
    try {
      await submitComplaint(data);
      toast.success(`${data.type} complaint submitted!`);
      setActiveTab('active');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpvote = async (id) => {
    setActionLoading(true);
    try {
      const result = await upvoteComplaint(id);
      toast.success('Complaint upvoted!');
      setSelectedComplaint(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upvote.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (id) => {
    setActionLoading(true);
    try {
      await verifyResolution(id);
      toast.success('Complaint verified as resolved!');
      setSelectedComplaint(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id, reason) => {
    setActionLoading(true);
    try {
      await rejectResolution(id, reason);
      toast.success('Resolution rejected. Admin will be notified.');
      setSelectedComplaint(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject resolution.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepost = async (id) => {
    setActionLoading(true);
    try {
      await repostComplaint(id);
      toast.success('Complaint reposted!');
      setSelectedComplaint(null);
      setActiveTab('active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to repost.');
    } finally {
      setActionLoading(false);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'active': return 'Active Complaints';
      case 'pending': return 'Pending Verification';
      case 'resolved': return 'Resolved Complaints';
      case 'submit': return 'Submit Complaint';
      default: return 'Dashboard';
    }
  };

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'active': return 'New complaints awaiting upvotes or currently in progress';
      case 'pending': return 'Complaints resolved by hostel side and awaiting your verification';
      case 'resolved': return 'Recently resolved complaints (last 7 days)';
      case 'submit': return 'File a new general or personal complaint';
      default: return '';
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="dashboard-main">
        <Header
          title={getTabTitle()}
          subtitle={getTabSubtitle()}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <div className="dashboard-content">
          {/* Stats */}
          {stats && (
            <div className="stats-grid stagger-children">
              <StatCard
                icon={<HiOutlineClipboardDocumentList />}
                label="My Complaints"
                value={stats.myComplaints}
                color="var(--accent)"
                delay={0}
              />
              <StatCard
                icon={<HiOutlineExclamationCircle />}
                label="Floor Issues"
                value={stats.floorIssues}
                color="var(--status-submitted)"
                delay={60}
              />
              <StatCard
                icon={<HiOutlineClock />}
                label="Pending"
                value={stats.pending}
                color="var(--status-done-hostel)"
                delay={120}
              />
              <StatCard
                icon={<HiOutlineCheckCircle />}
                label="Resolved"
                value={stats.resolved}
                color="var(--status-completed)"
                delay={180}
              />
            </div>
          )}

          {/* Content */}
          {activeTab === 'submit' ? (
            <SubmitComplaintForm onSubmit={handleSubmitComplaint} loading={actionLoading} />
          ) : loading ? (
            <Loader text="Loading complaints..." />
          ) : complaints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {activeTab === 'active' ? '📋' : activeTab === 'pending' ? '⏳' : '🎉'}
              </div>
              <h3>{activeTab === 'resolved' ? 'No resolved complaints' : 'No complaints here'}</h3>
              <p>
                {activeTab === 'active'
                  ? 'No active complaints for your floor. File a new one!'
                  : activeTab === 'pending'
                    ? 'No complaints awaiting verification.'
                    : 'No recently resolved complaints.'}
              </p>
              {activeTab === 'active' && (
                <Button variant="primary" onClick={() => setActiveTab('submit')}>
                  Submit Complaint
                </Button>
              )}
            </div>
          ) : (
            <div className="complaints-grid stagger-children">
              {complaints.map((c) => (
                <ComplaintCard
                  key={c._id}
                  complaint={c}
                  onClick={setSelectedComplaint}
                  showType
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Complaint Detail Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint Details"
        size="lg"
      >
        {selectedComplaint && (
          <ComplaintModal
            complaint={selectedComplaint}
            onUpvote={handleUpvote}
            onVerify={handleVerify}
            onReject={handleReject}
            onRepost={handleRepost}
            loading={actionLoading}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentDashboard;
