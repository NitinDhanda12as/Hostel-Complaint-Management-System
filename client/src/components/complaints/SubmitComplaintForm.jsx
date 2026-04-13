import { useState } from 'react';
import Button from '../ui/Button';
import Input, { TextArea, Select } from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import { GENERAL_ISSUES, PERSONAL_ISSUES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import './SubmitComplaintForm.css';

const SubmitComplaintForm = ({ onSubmit, loading = false }) => {
  const { user } = useAuth();
  const [type, setType] = useState('General');
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const issueOptions = type === 'General' ? GENERAL_ISSUES : PERSONAL_ISSUES;

  const validate = () => {
    const errs = {};
    if (!issue) errs.issue = 'Please select an issue type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (type === 'Personal') {
      setShowConfirm(true);
    } else {
      doSubmit();
    }
  };

  const doSubmit = () => {
    onSubmit({ type, issue, description });
    setShowConfirm(false);
    // Reset form
    setIssue('');
    setDescription('');
  };

  return (
    <>
      <form className="submit-form" onSubmit={handleSubmit}>
        <div className="submit-form-header">
          <h3>Submit a Complaint</h3>
          <p>Report an issue in your hostel. Your complaint will be tracked until resolution.</p>
        </div>

        {/* Type toggle */}
        <div className="type-toggle-group">
          <label className="type-toggle-label">Complaint Type</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${type === 'General' ? 'active' : ''}`}
              onClick={() => { setType('General'); setIssue(''); }}
            >
              <span className="type-toggle-icon">🏢</span>
              <span className="type-toggle-text">
                <strong>General</strong>
                <small>Floor-wide issue</small>
              </span>
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${type === 'Personal' ? 'active' : ''}`}
              onClick={() => { setType('Personal'); setIssue(''); }}
            >
              <span className="type-toggle-icon">🚪</span>
              <span className="type-toggle-text">
                <strong>Personal</strong>
                <small>Room-specific issue</small>
              </span>
            </button>
          </div>
        </div>

        {/* Complaint info */}
        <div className="submit-form-info">
          <div className="info-chip">
            <span>Block</span>
            <strong>{user?.block}</strong>
          </div>
          <div className="info-chip">
            <span>Floor</span>
            <strong>{user?.floor}</strong>
          </div>
          {type === 'Personal' && (
            <div className="info-chip">
              <span>Room</span>
              <strong>{user?.room}</strong>
            </div>
          )}
        </div>

        {/* Issue select */}
        <Select
          label="Issue Type"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          options={issueOptions}
          placeholder="Select the issue..."
          error={errors.issue}
        />

        {/* Description */}
        <TextArea
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
          rows={4}
        />

        {type === 'General' && (
          <div className="submit-form-note">
            <span className="note-icon">ℹ️</span>
            <span>General complaints start with 1 upvote (yours). Other students on your floor can upvote to support.</span>
          </div>
        )}

        <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
          {type === 'General' ? '📋 Submit General Complaint' : '🔒 Submit Personal Complaint'}
        </Button>
      </form>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={doSubmit}
        title="Personal Complaint"
        message="This is your personal complaint. It will only be visible to you and the hostel admin. Would you like to submit it?"
        confirmText="Yes, Submit"
        cancelText="Cancel"
        loading={loading}
      />
    </>
  );
};

export default SubmitComplaintForm;
