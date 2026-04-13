const Complaint = require('../models/Complaint');
const { AUTO_UPGRADE_THRESHOLD } = require('./constants');

/**
 * Check if 3+ personal complaints of same issue type exist on the same floor.
 * If so, auto-create a General complaint combining them.
 */
const checkAutoUpgrade = async (block, floor, issue) => {
  try {
    // Look for personal complaints with same issue on same floor created within last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const personalComplaints = await Complaint.find({
      type: 'Personal',
      block,
      floor,
      issue,
      createdAt: { $gte: sevenDaysAgo },
      status: { $ne: 'Work Completed' }
    }).populate('submittedBy', 'name room rollNo');

    if (personalComplaints.length < AUTO_UPGRADE_THRESHOLD) {
      return null;
    }

    // Check if an auto-upgraded General complaint already exists for this combination
    const existingAutoUpgrade = await Complaint.findOne({
      type: 'General',
      block,
      floor,
      issue,
      isAutoUpgraded: true,
      status: { $ne: 'Work Completed' },
      createdAt: { $gte: sevenDaysAgo }
    });

    if (existingAutoUpgrade) {
      // Update existing auto-upgraded complaint with any new rooms
      const existingRooms = new Set(existingAutoUpgrade.autoUpgradedFromRooms);
      const newRooms = personalComplaints.map(c => c.room).filter(r => !existingRooms.has(r));
      
      if (newRooms.length > 0) {
        existingAutoUpgrade.autoUpgradedFromRooms.push(...newRooms);
        const allRooms = existingAutoUpgrade.autoUpgradedFromRooms;
        existingAutoUpgrade.description = `[Auto-Upgraded] Multiple students from rooms ${allRooms.join(', ')} reported: ${issue}. This complaint was automatically created from ${allRooms.length} individual personal complaints.`;
        await existingAutoUpgrade.save();

        // Mark recently added personal complaints as Upgraded
        await Complaint.updateMany(
          { 
            _id: { $in: personalComplaints.map(c => c._id) },
            status: { $ne: 'Upgraded' }
          },
          { $set: { status: 'Upgraded' } }
        );
      }
      return existingAutoUpgrade;
    }

    // Create new auto-upgraded General complaint
    const rooms = personalComplaints.map(c => c.room);
    const submitter = personalComplaints[0].submittedBy;

    const generalComplaint = new Complaint({
      type: 'General',
      block,
      floor,
      issue,
      description: `[Auto-Upgraded] Multiple students from rooms ${rooms.join(', ')} reported: ${issue}. This complaint was automatically created from ${rooms.length} individual personal complaints.`,
      status: 'Submitted',
      submittedBy: submitter._id,
      isAutoUpgraded: true,
      autoUpgradedFromRooms: rooms,
      upvotes: personalComplaints.map(c => ({
        studentId: c.submittedBy._id,
        studentName: c.submittedBy.name,
        rollNo: c.submittedBy.rollNo
      }))
    });

    await generalComplaint.save();
    
    // Mark personal complaints as Upgraded
    await Complaint.updateMany(
      { _id: { $in: personalComplaints.map(c => c._id) } },
      { $set: { status: 'Upgraded' } }
    );

    console.log(`⚡ Auto-upgraded complaint created for ${block}-${floor}: ${issue}`);
    return generalComplaint;
  } catch (error) {
    console.error('Auto-upgrade check error:', error);
    return null;
  }
};

module.exports = { checkAutoUpgrade };
