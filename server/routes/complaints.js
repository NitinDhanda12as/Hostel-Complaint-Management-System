const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  submitComplaint,
  getMyComplaints,
  getFloorComplaints,
  getAllComplaints,
  advanceStatus,
  verifyResolution,
  rollbackStatus,
  rejectResolution,
  upvoteComplaint,
  repostComplaint,
  getStats,
  getAnalytics
} = require('../controllers/complaintController');

// Student routes
router.post('/', auth, roleGuard('student'), submitComplaint);
router.get('/my', auth, roleGuard('student'), getMyComplaints);
router.get('/floor', auth, roleGuard('student'), getFloorComplaints);
router.patch('/:id/upvote', auth, roleGuard('student'), upvoteComplaint);
router.patch('/:id/verify', auth, roleGuard('student'), verifyResolution);
router.patch('/:id/reject', auth, roleGuard('student'), rejectResolution);
router.post('/:id/repost', auth, roleGuard('student'), repostComplaint);

// Stats (both roles)
router.get('/stats', auth, getStats);

// Admin routes
router.get('/all', auth, roleGuard('admin'), getAllComplaints);
router.patch('/:id/status', auth, roleGuard('admin'), advanceStatus);
router.patch('/:id/rollback', auth, roleGuard('admin'), rollbackStatus);
router.get('/analytics', auth, roleGuard('admin'), getAnalytics);

module.exports = router;
