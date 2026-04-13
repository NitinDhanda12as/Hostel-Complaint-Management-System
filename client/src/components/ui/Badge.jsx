import './Badge.css';

const Badge = ({ status, size = 'md', className = '' }) => {
  const statusClass = status
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <span className={`badge badge-${statusClass} badge-${size} ${className}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
};

export default Badge;
