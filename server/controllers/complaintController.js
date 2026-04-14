const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const { checkAutoUpgrade } = require('../utils/autoUpgrade');
const { GENERAL_ISSUES, PERSONAL_ISSUES, STATUS_FLOW, UPVOTE_THRESHOLD } = require('../utils/constants');

// POST /api/complaints — Submit new complaint
exports.submitComplaint = async (req, res) => {
  try {
    const { type, issue, description } = req.body;
    const user = req.user;

    // Validate type
    if (!['General', 'Personal'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint type.' });
    }

    // Validate issue against predefined list
    const validIssues = type === 'General' ? GENERAL_ISSUES : PERSONAL_ISSUES;
    if (!issue || !validIssues.includes(issue)) {
      return res.status(400).json({ success: false, message: 'Invalid issue type for this complaint category.' });
    }

    const complaintData = {
      type,
      block: user.block,
      floor: user.floor,
      issue,
      description: description || '',
      submittedBy: user.userId,
      status: 'Submitted'
    };

    if (type === 'General') {
      // For general complaints, submitter is the first upvoter
      complaintData.upvotes = [{
        studentId: user.userId,
        studentName: user.name,
        rollNo: user.rollNo
      }];
    } else {
      // Personal complaint — set room
      complaintData.room = user.room;
    }

    const complaint = new Complaint(complaintData);
    await complaint.save();

    // If personal, check for auto-upgrade
    if (type === 'Personal') {
      await checkAutoUpgrade(user.block, user.floor, issue);
    }

    res.status(201).json({
      success: true,
      message: `${type} complaint submitted successfully.`,
      complaint
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting complaint.' });
  }
};

// GET /api/complaints/my — Get student's own complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { section } = req.query; // active, pending, resolved

    let query = {};
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // CRITICAL: Cast string ID to ObjectId for aggregation $match
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (section === 'active') {
      query = {
        submittedBy: userObjectId,
        type: 'Personal',
        status: { $in: ['Submitted', 'In Progress'] }
      };
    } else if (section === 'pending') {
      query = {
        submittedBy: userObjectId,
        type: 'Personal',
        status: 'Done from Hostel Side'
      };
    } else if (section === 'resolved') {
      query = {
        submittedBy: userObjectId,
        type: 'Personal',
        status: 'Work Completed',
        resolvedAt: { $gte: sevenDaysAgo }
      };
    } else {
      // Return all personal complaints
      query = {
        submittedBy: userObjectId,
        type: 'Personal'
      };
    }

    const complaints = await Complaint.aggregate([
      { $match: query },
      {
        $addFields: {
          sortPriority: {
            $cond: { if: { $eq: ["$status", "Work Completed"] }, then: 1, else: 0 }
          }
        }
      },
      { $sort: { sortPriority: 1, createdAt: 1 } },
      {
        $lookup: {
          from: 'students',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submittedBy'
        }
      },
      { $unwind: { path: '$submittedBy', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'submittedBy.password': 0,
          'submittedBy.email': 0,
          'submittedBy.phone': 0,
          'submittedBy.__v': 0
        }
      }
    ]);

    res.json({ success: true, complaints });
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/complaints/floor — Get general complaints for student's block+floor
exports.getFloorComplaints = async (req, res) => {
  try {
    const { block, floor } = req.user;
    const { section } = req.query;

    let query = { type: 'General', block, floor };
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (section === 'active') {
      query.status = { $in: ['Submitted', 'In Progress'] };
    } else if (section === 'pending') {
      query.status = 'Done from Hostel Side';
    } else if (section === 'resolved') {
      query.status = 'Work Completed';
      query.resolvedAt = { $gte: sevenDaysAgo };
    }

    const complaints = await Complaint.aggregate([
      { $match: query },
      {
        $addFields: {
          sortPriority: {
            $cond: { if: { $eq: ["$status", "Work Completed"] }, then: 1, else: 0 }
          }
        }
      },
      { $sort: { sortPriority: 1, createdAt: 1 } },
      {
        $lookup: {
          from: 'students',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submittedBy'
        }
      },
      { $unwind: { path: '$submittedBy', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'submittedBy.password': 0,
          'submittedBy.email': 0,
          'submittedBy.phone': 0,
          'submittedBy.__v': 0
        }
      }
    ]);

    res.json({ success: true, complaints });
  } catch (error) {
    console.error('Get floor complaints error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/complaints/all — Admin: get all complaints with filters
exports.getAllComplaints = async (req, res) => {
  try {
    const { block, floor, type, status, page = 1, limit = 50 } = req.query;
    
    // Visibility threshold filter for admins
    const visibilityFilter = {
      status: { $ne: 'Upgraded' },
      $or: [
        { type: 'Personal' },
        { isAutoUpgraded: true },
        { type: 'General', $expr: { $gte: [{ $size: "$upvotes" }, UPVOTE_THRESHOLD] } }
      ]
    };

    const baseQuery = {};
    if (block) baseQuery.block = block;
    if (floor) baseQuery.floor = floor;
    if (type) baseQuery.type = type;
    if (status) baseQuery.status = status;

    const query = { $and: [baseQuery, visibilityFilter] };

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.aggregate([
      { $match: query },
      {
        $addFields: {
          sortPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$isRejected", true] }, then: 0 },
                { case: { $eq: ["$status", "Work Completed"] }, then: 2 }
              ],
              default: 1
            }
          }
        }
      },
      { $sort: { sortPriority: 1, createdAt: 1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'students',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submittedBy'
        }
      },
      { $unwind: { path: '$submittedBy', preserveNullAndEmptyArrays: true } }
    ]);

    res.json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/complaints/stats — Get complaint statistics
exports.getStats = async (req, res) => {
  try {
    const { role, userId, block, floor } = req.user;

    if (role === 'admin') {
      const visibilityFilter = {
        status: { $ne: 'Upgraded' },
        $or: [
          { type: 'Personal' },
          { isAutoUpgraded: true },
          { type: 'General', $expr: { $gte: [{ $size: "$upvotes" }, UPVOTE_THRESHOLD] } }
        ]
      };

      const [total, submitted, inProgress, doneFromHostel, workCompleted, alerts] = await Promise.all([
        Complaint.countDocuments(visibilityFilter),
        Complaint.countDocuments({ ...visibilityFilter, status: 'Submitted' }),
        Complaint.countDocuments({ ...visibilityFilter, status: 'In Progress' }),
        Complaint.countDocuments({ ...visibilityFilter, status: 'Done from Hostel Side' }),
        Complaint.countDocuments({ ...visibilityFilter, status: 'Work Completed' }),
        Complaint.countDocuments({ ...visibilityFilter, isRejected: true, status: { $ne: 'Work Completed' } })
      ]);

      return res.json({
        success: true,
        stats: {
          total,
          needsAction: submitted,
          inProgress,
          pendingVerification: doneFromHostel,
          resolved: workCompleted,
          alerts
        }
      });
    }

    // Student stats
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeStatuses = ['Submitted', 'In Progress', 'Done from Hostel Side'];

    const [myInvolvements, floorGeneral, myPending, myResolved] = await Promise.all([
      // My Complaints: Personal (Submitted/Active/Pending) + General Upvoted (Submitted/Active/Pending)
      Complaint.countDocuments({
        $or: [
          { submittedBy: userObjectId, type: 'Personal', status: { $in: activeStatuses } },
          { type: 'General', 'upvotes.studentId': userObjectId, status: { $in: activeStatuses } }
        ]
      }),
      // Floor Issues: All active General complaints on this floor
      Complaint.countDocuments({ type: 'General', block, floor, status: { $in: ['Submitted', 'In Progress'] } }),
      // Pending: Items awaiting verification from this specific student or MHMC on their floor
      Complaint.countDocuments({
        $or: [
          { submittedBy: userObjectId, type: 'Personal', status: 'Done from Hostel Side' },
          { type: 'General', block, floor, status: 'Done from Hostel Side' }
        ]
      }),
      // Resolved: All completed items relevant to the floor/student in the last 7 days
      Complaint.countDocuments({
        $or: [
          { submittedBy: userObjectId, type: 'Personal', status: 'Work Completed', resolvedAt: { $gte: sevenDaysAgo } },
          { type: 'General', block, floor, status: 'Work Completed', resolvedAt: { $gte: sevenDaysAgo } }
        ]
      })
    ]);

    res.json({
      success: true,
      stats: {
        myComplaints: myInvolvements,
        floorIssues: floorGeneral,
        pending: myPending,
        resolved: myResolved
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/complaints/:id/status — Admin advances status
exports.advanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Admin can only advance to the next status, not skip or go backwards
    // Admin cannot set 'Work Completed' — that's done by student/MHMC via verify
    const nextStatus = STATUS_FLOW[complaint.status];
    if (!nextStatus || nextStatus === 'Work Completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot advance from "${complaint.status}". ${complaint.status === 'Done from Hostel Side' ? 'Awaiting student/MHMC verification.' : 'Already at final status.'}`
      });
    }

    complaint.status = nextStatus;
    if (adminNote) {
      complaint.adminNote = adminNote;
    }

    await complaint.save();

    res.json({
      success: true,
      message: `Complaint status updated to "${nextStatus}".`,
      complaint
    });
  } catch (error) {
    console.error('Advance status error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/complaints/:id/verify — Student/MHMC verifies resolution
exports.verifyResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.status !== 'Done from Hostel Side') {
      return res.status(400).json({
        success: false,
        message: 'Complaint is not ready for verification.'
      });
    }

    if (complaint.type === 'Personal') {
      // Only the complaint owner can verify personal complaints
      if (complaint.submittedBy.toString() !== user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the complaint owner can verify personal complaints.'
        });
      }
    } else {
      // General complaint — only MHMC of same block+floor can verify
      if (!user.isMHMC) {
        return res.status(403).json({
          success: false,
          message: 'Only MHMC members can verify general complaints.'
        });
      }
      if (user.block !== complaint.block || user.floor !== complaint.floor) {
        return res.status(403).json({
          success: false,
          message: 'You can only verify complaints on your own floor.'
        });
      }
    }

    complaint.status = 'Work Completed';
    complaint.resolvedAt = new Date();
    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint verified and marked as Work Completed.',
      complaint
    });
  } catch (error) {
    console.error('Verify resolution error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/complaints/:id/upvote — Upvote a general complaint
exports.upvoteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.type !== 'General') {
      return res.status(400).json({ success: false, message: 'Only general complaints can be upvoted.' });
    }

    // Must be same block and floor
    if (user.block !== complaint.block || user.floor !== complaint.floor) {
      return res.status(403).json({ success: false, message: 'You can only upvote complaints on your floor.' });
    }

    // Cannot upvote own complaint
    if (complaint.submittedBy.toString() === user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot upvote your own complaint.' });
    }

    // Cannot upvote twice
    const alreadyUpvoted = complaint.upvotes.some(
      u => u.studentId.toString() === user.userId
    );
    if (alreadyUpvoted) {
      return res.status(400).json({ success: false, message: 'You have already upvoted this complaint.' });
    }

    // Only allow upvoting active complaints
    if (!['Submitted', 'In Progress'].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: 'Cannot upvote a complaint that is no longer active.' });
    }

    complaint.upvotes.push({
      studentId: user.userId,
      studentName: user.name,
      rollNo: user.rollNo
    });

    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint upvoted successfully.',
      upvoteCount: complaint.upvotes.length,
      complaint
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/complaints/:id/rollback — Admin rolls back to In Progress
exports.rollbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    if (complaint.status !== 'Done from Hostel Side') {
      return res.status(400).json({ success: false, message: 'Only complaints in verification state can be rolled back.' });
    }

    complaint.status = 'In Progress';
    complaint.isRejected = false; // Clear rejection if admin manually rolls back
    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint rolled back to In Progress.',
      complaint
    });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/complaints/:id/reject — Student/MHMC rejects resolution
exports.rejectResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    if (complaint.status !== 'Done from Hostel Side') {
      return res.status(400).json({ success: false, message: 'Complaint is not in a state to be rejected.' });
    }

    // Role check (same as verifyResolution)
    if (complaint.type === 'Personal') {
      if (complaint.submittedBy.toString() !== user.userId) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
    } else {
      if (!user.isMHMC || user.block !== complaint.block || user.floor !== complaint.floor) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }
    }

    complaint.status = 'In Progress';
    complaint.isRejected = true;
    complaint.rejectionNote = reason || 'No reason provided';
    await complaint.save();

    res.json({
      success: true,
      message: 'Resolution rejected. Complaint moved back to In Progress.',
      complaint
    });
  } catch (error) {
    console.error('Reject resolution error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/complaints/:id/repost — Repost a resolved complaint
exports.repostComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.status !== 'Work Completed') {
      return res.status(400).json({ success: false, message: 'Only resolved complaints can be reposted.' });
    }

    // Check 7-day window
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (complaint.resolvedAt < sevenDaysAgo) {
      return res.status(400).json({ success: false, message: 'Repost window has expired (7 days).' });
    }

    // Verify the user has permission to repost
    if (complaint.type === 'Personal' && complaint.submittedBy.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: 'You can only repost your own complaints.' });
    }
    if (complaint.type === 'General' && (user.block !== complaint.block || user.floor !== complaint.floor)) {
      return res.status(403).json({ success: false, message: 'You can only repost complaints from your floor.' });
    }

    // Create a new complaint document
    const newComplaintData = {
      type: complaint.type,
      block: complaint.block,
      floor: complaint.floor,
      issue: complaint.issue,
      description: `[Reposted] ${complaint.description || complaint.issue}`,
      submittedBy: user.userId,
      status: 'Submitted'
    };

    if (complaint.type === 'Personal') {
      newComplaintData.room = user.room;
    } else {
      newComplaintData.upvotes = [{
        studentId: user.userId,
        studentName: user.name,
        rollNo: user.rollNo
      }];
    }

    const newComplaint = new Complaint(newComplaintData);
    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: 'Complaint reposted successfully.',
      complaint: newComplaint
    });
  } catch (error) {
    console.error('Repost error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/complaints/analytics — Admin analytics
exports.getAnalytics = async (req, res) => {
  try {
    const [byBlock, byStatus, byType, byIssue] = await Promise.all([
      Complaint.aggregate([
        { $group: { _id: '$block', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$issue', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        byBlock,
        byStatus,
        byType,
        byIssue
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
