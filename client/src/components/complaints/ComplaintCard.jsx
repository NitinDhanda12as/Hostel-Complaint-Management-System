import Badge from '../ui/Badge';
import { timeAgo, getDisplayStatus } from '../../utils/constants';
import { HiOutlineHandThumbUp, HiOutlineChatBubbleLeft } from 'react-icons/hi2';
import './ComplaintCard.css';

const ComplaintCard = ({ complaint, onClick, showType = false }) => {
  const displayStatus = getDisplayStatus(complaint);
  const {
    type,
    issue,
    description,
    upvotes = [],
    adminNote,
    createdAt,
    isAutoUpgraded,
    block,
    floor,
    room
  } = complaint;

  return (
    <div className="complaint-card" onClick={() => onClick(complaint)} role="button" tabIndex={0}>
      <div className="complaint-card-header">
        <div className="complaint-card-tags">
          {showType && (
            <span className={`complaint-type-tag type-${type.toLowerCase()}`}>
              {type}
            </span>
          )}
          {isAutoUpgraded && (
            <span className="complaint-auto-tag">⚡ Auto-Upgraded</span>
          )}
          {complaint.isRejected && (
            <span className="complaint-rejected-tag">⚠️ Rejected</span>
          )}
        </div>
        <Badge status={displayStatus} size="sm" />
      </div>

      <h4 className="complaint-card-title">{issue}</h4>

      {description && (
        <p className="complaint-card-desc">{description.slice(0, 120)}{description.length > 120 ? '...' : ''}</p>
      )}

      <div className="complaint-card-footer">
        <div className="complaint-card-meta">
          {type === 'General' && (
            <span className="complaint-meta-item">
              <HiOutlineHandThumbUp />
              <span>{upvotes.length} upvotes</span>
            </span>
          )}
          {type === 'Personal' && room && (
            <span className="complaint-meta-item">
              Room {room}
            </span>
          )}
          {adminNote && (
            <span className="complaint-meta-item complaint-has-note">
              <HiOutlineChatBubbleLeft />
              <span>Note</span>
            </span>
          )}
        </div>
        <span className="complaint-card-time">{timeAgo(createdAt)}</span>
      </div>

      <div className="complaint-card-location">
        Block {block} · {floor} Floor
      </div>
    </div>
  );
};

export default ComplaintCard;
