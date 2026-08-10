import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateCurrentUser, changePassword } from '../api/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [location, setLocation] = useState('');
  const [locationStreet, setLocationStreet] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [availability, setAvailability] = useState('');
  const [interests, setInterests] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        // prefer structured fields when available
        setLocationStreet((user as any).locationStreet || '');
        setLocationCity((user as any).locationCity || '');
        setLocationState((user as any).locationState || '');
        setLocation(user.location || '');
        setAvailability(user.availability || '');
        setInterests(user.interests || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await updateCurrentUser({ locationStreet: locationStreet || undefined, locationCity: locationCity || undefined, locationState: locationState || undefined, availability, interests });
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header className="page-header">
        <h1>Edit Profile</h1>
        <p>Update your public profile and account settings.</p>
      </header>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="form-message">{error}</p> : null}
      {message ? <p className="form-message">{message}</p> : null}

      <section className="panel">
        <h2>Profile information</h2>
        <div className="form-group">
          <label>Street address</label>
          <input value={locationStreet} onChange={(e) => setLocationStreet(e.target.value)} placeholder="123 Main St" />
        </div>

        <div className="form-group">
          <label>City</label>
          <input value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="Anytown" />
        </div>

        <div className="form-group">
          <label>State</label>
          <input value={locationState} onChange={(e) => setLocationState(e.target.value)} placeholder="CA" />
        </div>

        <div className="form-group">
          <label>Availability</label>
          <input value={availability} onChange={(e) => setAvailability(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Interests</label>
          <input value={interests} onChange={(e) => setInterests(e.target.value)} />
        </div>

        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="button primary" type="button" onClick={handleSaveProfile} disabled={loading}>
            Save profile
          </button>
          <button className="button secondary" type="button" onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Change password</h2>
        <div className="form-group">
          <label>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>

        <div className="form-group">
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="button primary" type="button" onClick={handleChangePassword} disabled={loading}>
            Change password
          </button>
        </div>
      </section>
    </section>
  );
};

export default ProfilePage;
