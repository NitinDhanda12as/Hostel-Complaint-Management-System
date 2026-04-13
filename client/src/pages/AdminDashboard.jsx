import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import Loader from '../components/ui/Loader';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input, { Select, TextArea } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import ComplaintCard from '../components/complaints/ComplaintCard';
import ComplaintModal from '../components/complaints/ComplaintModal';
import {
  getAllComplaints,
  getStats,
  advanceStatus,
  rollbackComplaint,
  getAnalytics,
  listStudents,
  createStudent,
  updateStudent
} from '../services/complaintService';
import { BLOCKS, FLOORS, STATUSES, formatDate } from '../utils/constants';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass
} from 'react-icons/hi2';
import './Dashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ block: '', floor: '', type: '', status: '' });

  // Analytics
  const [analytics, setAnalytics] = useState(null);

  // Students
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '', email: '', password: '', rollNo: '',
    block: '', floor: '', room: '', phone: '', isMHMC: false
  });

  const fetchComplaints = useCallback(async (filterOverride) => {
    setLoading(true);
    try {
      const f = filterOverride || filters;
      const params = {};
      if (f.block) params.block = f.block;
      if (f.floor) params.floor = f.floor;
      if (f.type) params.type = f.type;

      if (activeTab === 'needs-action') {
        params.status = 'Submitted';
      } else if (activeTab === 'pending') {
        params.status = 'Done from Hostel Side';
      } else if (f.status) {
        params.status = f.status;
      }

      const [complaintsData, statsData] = await Promise.all([
        getAllComplaints(params),
        getStats()
      ]);
      setComplaints(complaintsData.complaints || []);
      setStats(statsData.stats);
    } catch (err) {
      toast.error('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, statsData] = await Promise.all([
        getAnalytics(),
        getStats()
      ]);
      setAnalytics(analyticsData.analytics);
      setStats(statsData.stats);
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsData, statsData] = await Promise.all([
        listStudents({ search: studentSearch }),
        getStats()
      ]);
      setStudents(studentsData.students || []);
      setStats(statsData.stats);
    } catch (err) {
      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [studentSearch]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'students') {
      fetchStudents();
    } else {
      fetchComplaints();
    }
  }, [activeTab, fetchComplaints, fetchAnalytics, fetchStudents]);

  const handleAdvanceStatus = async (id, adminNote) => {
    setActionLoading(true);
    try {
      await advanceStatus(id, adminNote);
      toast.success('Status advanced!');
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to advance status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (id) => {
    setActionLoading(true);
    try {
      await rollbackComplaint(id);
      toast.success('Complaint rolled back to In Progress.');
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to roll back.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminNoteChange = async (id, note) => {
    setActionLoading(true);
    try {
      await advanceStatus(id, note);
      toast.success('Note saved!');
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      // If we can't advance (already at max), just try to save the note
      toast.error('Save note by advancing status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createStudent(newStudent);
      toast.success('Student created!');
      setShowCreateStudent(false);
      setNewStudent({
        name: '', email: '', password: '', rollNo: '',
        block: '', floor: '', room: '', phone: '', isMHMC: false
      });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMHMC = async (student) => {
    try {
      await updateStudent(student._id, { isMHMC: !student.isMHMC });
      toast.success(`MHMC ${!student.isMHMC ? 'assigned' : 'removed'} for ${student.name}`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'all': return 'All Complaints';
      case 'needs-action': return 'Needs Action';
      case 'pending': return 'Pending Verification';
      case 'analytics': return 'Analytics';
      case 'students': return 'Manage Students';
      default: return 'Admin Dashboard';
    }
  };

  // Analytics render helpers
  const maxCount = (data) => Math.max(...(data || []).map(d => d.count), 1);

  const barColors = ['var(--accent)', 'var(--status-inprogress)', 'var(--status-submitted)', 'var(--status-done-hostel)', 'var(--status-completed)', 'var(--info)'];

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
          onMenuClick={() => setMobileMenuOpen(true)}
        >
          {activeTab === 'students' && (
            <Button variant="primary" size="sm" icon={<HiOutlinePlus />} onClick={() => setShowCreateStudent(true)}>
              Add Student
            </Button>
          )}
        </Header>

        <div className="dashboard-content">
          {/* Stats */}
          {stats && (
            <div className="stats-grid stagger-children">
              <StatCard icon={<HiOutlineClipboardDocumentList />} label="Total" value={stats.total} color="var(--accent)" />
              <StatCard icon={<HiOutlineExclamationCircle />} label="Needs Action" value={stats.needsAction} color="var(--status-submitted)" />
              <StatCard icon={<HiOutlineClock />} label="In Progress" value={stats.inProgress} color="var(--status-inprogress)" />
              <StatCard icon={<HiOutlineCheckCircle />} label="Resolved" value={stats.resolved} color="var(--status-completed)" />
              {stats.alerts > 0 && (
                <StatCard
                  icon={<HiOutlineExclamationCircle />}
                  label="Rejections"
                  value={stats.alerts}
                  color="var(--danger)"
                  className="animate-pulse"
                />
              )}
            </div>
          )}

          {/* Filters for complaint tabs */}
          {['all', 'needs-action', 'pending'].includes(activeTab) && (
            <div className="filters-bar">
              <span className="filter-label">Filters:</span>
              <Select
                value={filters.block}
                onChange={(e) => setFilters(f => ({ ...f, block: e.target.value }))}
                options={BLOCKS.map(b => ({ value: b, label: `Block ${b}` }))}
                placeholder="All Blocks"
              />
              <Select
                value={filters.floor}
                onChange={(e) => setFilters(f => ({ ...f, floor: e.target.value }))}
                options={FLOORS.map(f => ({ value: f, label: `${f} Floor` }))}
                placeholder="All Floors"
              />
              <Select
                value={filters.type}
                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                options={[{ value: 'General', label: 'General' }, { value: 'Personal', label: 'Personal' }]}
                placeholder="All Types"
              />
              {activeTab === 'all' && (
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  options={STATUSES.map(s => ({ value: s, label: s }))}
                  placeholder="All Statuses"
                />
              )}
              <Button variant="ghost" size="sm" onClick={() => {
                setFilters({ block: '', floor: '', type: '', status: '' });
              }}>
                Clear
              </Button>
            </div>
          )}

          {/* Complaints List */}
          {['all', 'needs-action', 'pending'].includes(activeTab) && (
            loading ? (
              <Loader text="Loading complaints..." />
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No complaints found</h3>
                <p>Try adjusting your filters or check back later.</p>
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
            )
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            loading ? (
              <Loader text="Loading analytics..." />
            ) : analytics ? (
              <div className="analytics-grid stagger-children">
                {/* By Block */}
                <div className="analytics-card">
                  <h4>Complaints by Block</h4>
                  <div className="analytics-bar-chart">
                    {analytics.byBlock.map((item, i) => (
                      <div key={item._id} className="analytics-bar-item">
                        <span className="analytics-bar-label">Block {item._id}</span>
                        <div className="analytics-bar-track">
                          <div
                            className="analytics-bar-fill"
                            style={{
                              width: `${(item.count / maxCount(analytics.byBlock)) * 100}%`,
                              background: barColors[i % barColors.length]
                            }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Status */}
                <div className="analytics-card">
                  <h4>Complaints by Status</h4>
                  <div className="analytics-bar-chart">
                    {analytics.byStatus.map((item, i) => (
                      <div key={item._id} className="analytics-bar-item">
                        <span className="analytics-bar-label">{item._id}</span>
                        <div className="analytics-bar-track">
                          <div
                            className="analytics-bar-fill"
                            style={{
                              width: `${(item.count / maxCount(analytics.byStatus)) * 100}%`,
                              background: barColors[i % barColors.length]
                            }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Type */}
                <div className="analytics-card">
                  <h4>General vs Personal</h4>
                  <div className="analytics-bar-chart">
                    {analytics.byType.map((item, i) => (
                      <div key={item._id} className="analytics-bar-item">
                        <span className="analytics-bar-label">{item._id}</span>
                        <div className="analytics-bar-track">
                          <div
                            className="analytics-bar-fill"
                            style={{
                              width: `${(item.count / maxCount(analytics.byType)) * 100}%`,
                              background: item._id === 'General' ? 'var(--info)' : '#a855f7'
                            }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Issues */}
                <div className="analytics-card">
                  <h4>Top Issue Types</h4>
                  <div className="analytics-bar-chart">
                    {analytics.byIssue.map((item, i) => (
                      <div key={item._id} className="analytics-bar-item">
                        <span className="analytics-bar-label" title={item._id}>{item._id}</span>
                        <div className="analytics-bar-track">
                          <div
                            className="analytics-bar-fill"
                            style={{
                              width: `${(item.count / maxCount(analytics.byIssue)) * 100}%`,
                              background: barColors[i % barColors.length]
                            }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null
          )}

          {/* Students Management */}
          {activeTab === 'students' && (
            <>
              <div className="filters-bar">
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name, email, roll no, or room..."
                  icon={<HiOutlineMagnifyingGlass />}
                  style={{ minWidth: '300px' }}
                />
                <Button variant="secondary" size="sm" onClick={fetchStudents}>
                  Search
                </Button>
              </div>

              {loading ? (
                <Loader text="Loading students..." />
              ) : (
                <div className="students-table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll No</th>
                        <th>Email</th>
                        <th>Block</th>
                        <th>Floor</th>
                        <th>Room</th>
                        <th>MHMC</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s._id}>
                          <td>{s.name}</td>
                          <td>{s.rollNo}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{s.email}</td>
                          <td>{s.block}</td>
                          <td>{s.floor}</td>
                          <td>{s.room}</td>
                          <td>
                            {s.isMHMC ? <span className="mhmc-badge">MHMC</span> : '—'}
                          </td>
                          <td>
                            <Button
                              variant={s.isMHMC ? 'danger' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleMHMC(s)}
                            >
                              {s.isMHMC ? 'Remove MHMC' : 'Set MHMC'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
                      <p>No students found.</p>
                    </div>
                  )}
                </div>
              )}
            </>
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
            onAdvanceStatus={handleAdvanceStatus}
            onAdminNoteChange={handleAdminNoteChange}
            onRollback={handleRollback}
            loading={actionLoading}
          />
        )}
      </Modal>

      {/* Create Student Modal */}
      <Modal
        isOpen={showCreateStudent}
        onClose={() => setShowCreateStudent(false)}
        title="Create Student Account"
        size="md"
      >
        <form className="create-student-form" onSubmit={handleCreateStudent}>
          <Input
            label="Full Name"
            value={newStudent.name}
            onChange={(e) => setNewStudent(s => ({ ...s, name: e.target.value }))}
            placeholder="Student name"
            required
          />
          <Input
            label="Roll Number"
            value={newStudent.rollNo}
            onChange={(e) => setNewStudent(s => ({ ...s, rollNo: e.target.value }))}
            placeholder="e.g. NITAG01"
            required
          />
          <Input
            label="Email"
            type="email"
            value={newStudent.email}
            onChange={(e) => setNewStudent(s => ({ ...s, email: e.target.value }))}
            placeholder="student@nit.ac.in"
            required
          />
          <Input
            label="Password"
            type="password"
            value={newStudent.password}
            onChange={(e) => setNewStudent(s => ({ ...s, password: e.target.value }))}
            placeholder="Initial password"
            required
          />
          <Select
            label="Block"
            value={newStudent.block}
            onChange={(e) => setNewStudent(s => ({ ...s, block: e.target.value }))}
            options={BLOCKS.map(b => ({ value: b, label: `Block ${b}` }))}
            required
          />
          <Select
            label="Floor"
            value={newStudent.floor}
            onChange={(e) => setNewStudent(s => ({ ...s, floor: e.target.value }))}
            options={FLOORS.map(f => ({ value: f, label: `${f} Floor` }))}
            required
          />
          <Input
            label="Room"
            value={newStudent.room}
            onChange={(e) => setNewStudent(s => ({ ...s, room: e.target.value }))}
            placeholder="e.g. A-G01"
            required
          />
          <Input
            label="Phone"
            value={newStudent.phone}
            onChange={(e) => setNewStudent(s => ({ ...s, phone: e.target.value }))}
            placeholder="Phone number"
          />
          <div className="full-width" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={newStudent.isMHMC}
                onChange={(e) => setNewStudent(s => ({ ...s, isMHMC: e.target.checked }))}
                style={{ accentColor: 'var(--accent)' }}
              />
              Assign as MHMC member
            </label>
          </div>
          <div className="full-width" style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowCreateStudent(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={actionLoading}>Create Student</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
