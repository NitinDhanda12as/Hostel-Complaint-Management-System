import './StatCard.css';

const StatCard = ({ icon, label, value, color = 'var(--accent)', delay = 0 }) => {
  return (
    <div
      className="stat-card"
      style={{ '--stat-color': color, animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
      <div className="stat-card-glow" />
    </div>
  );
};

export default StatCard;
