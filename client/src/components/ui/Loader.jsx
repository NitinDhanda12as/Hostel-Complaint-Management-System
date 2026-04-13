import './Loader.css';

const Loader = ({ size = 'md', text = '' }) => {
  return (
    <div className={`loader-container loader-${size}`}>
      <div className="loader-spinner">
        <div className="loader-ring" />
        <div className="loader-ring" />
        <div className="loader-ring" />
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export const InlineLoader = () => (
  <span className="inline-loader">
    <span /><span /><span />
  </span>
);

export default Loader;
