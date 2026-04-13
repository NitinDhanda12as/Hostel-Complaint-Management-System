import api from './api';

// Submit a new complaint
export const submitComplaint = async (data) => {
  const res = await api.post('/complaints', data);
  return res.data;
};

// Get student's personal complaints
export const getMyComplaints = async (section) => {
  const res = await api.get('/complaints/my', { params: { section } });
  return res.data;
};

// Get general complaints for student's floor
export const getFloorComplaints = async (section) => {
  const res = await api.get('/complaints/floor', { params: { section } });
  return res.data;
};

// Admin: get all complaints with filters
export const getAllComplaints = async (filters = {}) => {
  const res = await api.get('/complaints/all', { params: filters });
  return res.data;
};

// Get complaint stats
export const getStats = async () => {
  const res = await api.get('/complaints/stats');
  return res.data;
};

// Admin: advance complaint status
export const advanceStatus = async (id, adminNote) => {
  const res = await api.patch(`/complaints/${id}/status`, { adminNote });
  return res.data;
};

// Student/MHMC: verify resolution
export const verifyResolution = async (id) => {
  const res = await api.patch(`/complaints/${id}/verify`);
  return res.data;
};

// Student/MHMC: reject resolution
export const rejectResolution = async (id, reason) => {
  const res = await api.patch(`/complaints/${id}/reject`, { reason });
  return res.data;
};

// Admin: roll back to In Progress
export const rollbackComplaint = async (id) => {
  const res = await api.patch(`/complaints/${id}/rollback`);
  return res.data;
};

// Upvote a general complaint
export const upvoteComplaint = async (id) => {
  const res = await api.patch(`/complaints/${id}/upvote`);
  return res.data;
};

// Repost a resolved complaint
export const repostComplaint = async (id) => {
  const res = await api.post(`/complaints/${id}/repost`);
  return res.data;
};

// Admin: get analytics
export const getAnalytics = async () => {
  const res = await api.get('/complaints/analytics');
  return res.data;
};

// Admin: list students
export const listStudents = async (filters = {}) => {
  const res = await api.get('/admin/students', { params: filters });
  return res.data;
};

// Admin: create student
export const createStudent = async (data) => {
  const res = await api.post('/admin/students', data);
  return res.data;
};

// Admin: update student
export const updateStudent = async (id, data) => {
  const res = await api.patch(`/admin/students/${id}`, data);
  return res.data;
};
