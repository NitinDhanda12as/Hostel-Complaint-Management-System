import './Input.css';

const Input = ({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input type={type} className={`input-field ${icon ? 'has-icon' : ''}`} {...props} />
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export const TextArea = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <textarea className="input-field textarea-field" {...props} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export const Select = ({
  label,
  error,
  options = [],
  placeholder = 'Select...',
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <select className="input-field select-field" {...props}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default Input;
