import { HiOutlineBars3 } from 'react-icons/hi2';
import './Header.css';

const Header = ({ title, subtitle, onMenuClick, children }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuClick} aria-label="Menu">
          <HiOutlineBars3 size={24} />
        </button>
        <div className="header-titles">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="header-right">{children}</div>}
    </header>
  );
};

export default Header;
