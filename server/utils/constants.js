const BLOCKS = ['A', 'B', 'C', 'D'];
const FLOORS = ['Ground', '1st', '2nd', '3rd'];
const STUDENTS_PER_FLOOR = 21;

const GENERAL_ISSUES = [
  'Water Cooler Not Working',
  'Hot Water Geyser Issue',
  'Dustbin Unavailable',
  'Floor Cleanliness',
  'Bathroom Cleanliness',
  'Broken Tap',
  'Drinking Water Unavailable',
  'Broken Shower',
  'Corridor Lights Broken',
  'Other'
];

const PERSONAL_ISSUES = [
  'Room Light Not Working',
  'Fan Issue',
  'Insect Problem',
  'Electricity Fluctuation',
  'Bulb Fused',
  'Door Lock Broken',
  'Other'
];

const STATUSES = [
  'Submitted',
  'In Progress',
  'Done from Hostel Side',
  'Work Completed'
];

const STATUS_FLOW = {
  'Submitted': 'In Progress',
  'In Progress': 'Done from Hostel Side',
  'Done from Hostel Side': 'Work Completed'
};

const AUTO_UPGRADE_THRESHOLD = 3;
const RESOLVED_RETENTION_DAYS = 7;
const UPVOTE_THRESHOLD = 3;

module.exports = {
  BLOCKS,
  FLOORS,
  STUDENTS_PER_FLOOR,
  GENERAL_ISSUES,
  PERSONAL_ISSUES,
  STATUSES,
  STATUS_FLOW,
  AUTO_UPGRADE_THRESHOLD,
  RESOLVED_RETENTION_DAYS,
  UPVOTE_THRESHOLD
};
