import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, STATUS_CONFIG, getDisplayStatus } from '../../utils/constants';
import { HiOutlineHandThumbUp, HiOutlineUser } from 'react-icons/hi2';
import './ComplaintModal.css';

const ComplaintModal = ({
  complaint,
  onUpvote,
  onVerify,
  onReject,
  onRollback,
  onRepost,
  onAdvanceStatus,
  onAdminNoteChange,
  loading = false
}) => {
  const { user, isAdmin, isMHMC } = useAuth();
  const [adminNote, setAdminNote] = useState(complaint.adminNote || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!complaint) return null;

  const {
    type,
    issue,
    description,
    status,
    block,
    floor,
    room,
    upvotes = [],
    isAutoUpgraded,
    autoUpgradedFromRooms = [],
    createdAt,
    resolvedAt,
    submittedBy
  } = complaint;

  const displayStatus = getDisplayStatus(complaint);

  const hasUpvoted = upvotes.some(u => u.studentId === user?.id);
  const isOwner = submittedBy?._id === user?.id || submittedBy === user?.id;
  const canUpvote = !isAdmin && type === 'General' && !isOwner && !hasUpvoted &&
    user?.block === block && user?.floor === floor &&
    ['Submitted', 'In Progress'].includes(status);

  const canVerify =
    status === 'Done from Hostel Side' &&
    !isAdmin &&
    (
      (type === 'Personal' && isOwner) ||
      (type === 'General' && isMHMC && user?.block === block && user?.floor === floor)
    );

  const canRepost =
    status === 'Work Completed' &&
    !isAdmin &&
    resolvedAt &&
    (new Date() - new Date(resolvedAt)) < 7 * 24 * 60 * 60 * 1000;

  const canAdvance = isAdmin && status !== 'Done from Hostel Side' && status !== 'Work Completed';

  const canRollback = isAdmin && status === 'Done from Hostel Side';
  const canReject = canVerify;

  // Build status timeline
  const statusSteps = [
    { key: 'Submitted', label: displayStatus === 'New Complaint' ? 'New Complaint' : 'Submitted' },
    { key: 'In Progress', label: 'In Progress' },
    { key: 'Done from Hostel Side', label: 'Done from Hostel Side' },
    { key: 'Work Completed', label: 'Work Completed' }
  ];
  const currentStepIdx = statusSteps.findIndex(s => s.key === status);

  return (
    <div className="complaint-detail">
      {/* Rejection Alert */}
      {complaint.isRejected && (
        <div className="detail-rejection-alert animate-fade-in">
          <div className="rejection-alert-header">
            <span className="rejection-icon">⚠️</span>
            <strong>Not Resolved</strong>
          </div>
          <p className="rejection-text">"{complaint.rejectionNote}"</p>
        </div>
      )}

      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <span className={`complaint-type-tag type-${type.toLowerCase()}`}>{type}</span>
          {isAutoUpgraded && <span className="complaint-auto-tag">⚡ Auto-Upgraded</span>}
        </div>
        <Badge status={displayStatus} />
      </div>

      {/* Issue */}
      <h3 className="detail-issue">{issue}</h3>

      {/* Location */}
      <div className="detail-location">
        <span>Block {block} · {floor} Floor</span>
        {room && <span> · Room {room}</span>}
      </div>

      {/* Description */}
      {description && (
        <div className="detail-section">
          <h4 className="detail-section-title">Description</h4>
          <p className="detail-description">{description}</p>
        </div>
      )}

      {/* Auto-upgrade info */}
      {isAutoUpgraded && autoUpgradedFromRooms.length > 0 && (
        <div className="detail-section detail-auto-info">
          <h4 className="detail-section-title">⚡ Auto-Upgraded From</h4>
          <p>Rooms: {autoUpgradedFromRooms.join(', ')}</p>
        </div>
      )}

      {/* Status Timeline */}
      <div className="detail-section">
        <h4 className="detail-section-title">Status Timeline</h4>
        <div className="status-timeline">
          {statusSteps.map((step, idx) => (
            <div
              key={step.key}
              className={`timeline-step ${idx <= currentStepIdx ? 'completed' : ''} ${idx === currentStepIdx ? 'current' : ''}`}
            >
              <div className="timeline-dot">
                {idx <= currentStepIdx ? '✓' : (idx + 1)}
              </div>
              <span className="timeline-label">{step.label}</span>
              {idx < statusSteps.length - 1 && <div className="timeline-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Submitted info */}
      <div className="detail-info-grid">
        <div className="detail-info-item">
          <span className="detail-info-label">Submitted By</span>
          <span className="detail-info-value">{submittedBy?.name || 'Unknown'}</span>
        </div>
        <div className="detail-info-item">
          <span className="detail-info-label">Created</span>
          <span className="detail-info-value">{formatDateTime(createdAt)}</span>
        </div>
        {resolvedAt && (
          <div className="detail-info-item">
            <span className="detail-info-label">Resolved</span>
            <span className="detail-info-value">{formatDateTime(resolvedAt)}</span>
          </div>
        )}
      </div>

      {/* Upvotes (General only) */}
      {type === 'General' && (
        <div className="detail-section">
          <h4 className="detail-section-title">
            <HiOutlineHandThumbUp /> Upvotes ({upvotes.length})
          </h4>
          {upvotes.length > 0 ? (
            <div className="upvote-list">
              {upvotes.map((u, i) => (
                <div key={i} className="upvote-chip">
                  <HiOutlineUser />
                  <span>{u.studentName}</span>
                  <span className="upvote-roll">({u.rollNo})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="detail-empty-text">No upvotes yet</p>
          )}
        </div>
      )}

      {/* Admin note */}
      {(complaint.adminNote || isAdmin) && (
        <div className="detail-section">
          <h4 className="detail-section-title">Admin Note</h4>
          {isAdmin ? (
            <textarea
              className="admin-note-input"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add a note for the student..."
              rows={3}
            />
          ) : (
            complaint.adminNote && <p className="detail-admin-note">{complaint.adminNote}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="detail-actions">
        {canUpvote && (
          <Button
            variant="outline"
            onClick={() => onUpvote(complaint._id)}
            loading={loading}
            icon={<HiOutlineHandThumbUp />}
          >
            Upvote
          </Button>
        )}

        {canVerify && !showRejectInput && (
          <>
            <Button
              variant="success"
              onClick={() => onVerify(complaint._id)}
              loading={loading}
            >
              ✓ Verified / Solved
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowRejectInput(true)}
              loading={loading}
              outline
            >
              ✕ Not Resolved
            </Button>
          </>
        )}

        {showRejectInput && (
          <div className="rejection-form full-width">
            <textarea
              className="admin-note-input"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Tell the admin why it's not resolved..."
              rows={2}
              autoFocus
            />
            <div className="rejection-actions">
              <Button
                variant="danger"
                size="sm"
                onClick={() => onReject(complaint._id, rejectionReason)}
                loading={loading}
              >
                Submit Rejection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRejectInput(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {canRollback && (
          <Button
            variant="secondary"
            onClick={() => onRollback(complaint._id)}
            loading={loading}
          >
            ↩ Roll back to In Progress
          </Button>
        )}

        {canRepost && (
          <Button
            variant="secondary"
            onClick={() => onRepost(complaint._id)}
            loading={loading}
          >
            🔄 Repost Complaint
          </Button>
        )}

        {canAdvance && (
          <Button
            variant="primary"
            onClick={() => onAdvanceStatus(complaint._id, adminNote)}
            loading={loading}
          >
            Advance to: {status === 'Submitted' ? 'In Progress' : 'Done from Hostel Side'}
          </Button>
        )}

        {isAdmin && complaint.adminNote !== adminNote && (
          <Button
            variant="secondary"
            onClick={() => onAdminNoteChange(complaint._id, adminNote)}
            loading={loading}
          >
            Save Note
          </Button>
        )}
      </div>
    </div>
  );
};

export default ComplaintModal;
