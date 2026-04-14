export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://hostel-complaint-management-system-pd6u.onrender.com/api' 
  : '/api';

export const BLOCKS = ['A', 'B', 'C', 'D'];
export const FLOORS = ['Ground', '1st', '2nd', '3rd'];

export const GENERAL_ISSUES = [
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

export const PERSONAL_ISSUES = [
  'Room Light Not Working',
  'Fan Issue',
  'Insect Problem',
  'Electricity Fluctuation',
  'Bulb Fused',
  'Door Lock Broken',
  'Other'
];

export const STATUSES = [
  'Submitted',
  'In Progress',
  'Done from Hostel Side',
  'Work Completed'
];

export const UPVOTE_THRESHOLD = 3;

export const STATUS_CONFIG = {
  'New Complaint': {
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    label: 'New Complaint',
    icon: '✨'
  },
  'Submitted': {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    label: 'Submitted',
    icon: '📋'
  },
  'In Progress': {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    label: 'In Progress',
    icon: '🔧'
  },
  'Done from Hostel Side': {
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    label: 'Done from Hostel Side',
    icon: '✅'
  },
  'Work Completed': {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    label: 'Work Completed',
    icon: '🎉'
  }
};

export const getDisplayStatus = (complaint) => {
  if (
    complaint.type === 'General' &&
    complaint.status === 'Submitted' &&
    !complaint.isAutoUpgraded &&
    (complaint.upvotes?.length || 0) < UPVOTE_THRESHOLD
  ) {
    return 'New Complaint';
  }
  return complaint.status;
};

export const STATUS_FLOW = {
  'Submitted': 'In Progress',
  'In Progress': 'Done from Hostel Side',
  'Done from Hostel Side': 'Work Completed'
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
};
