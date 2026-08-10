import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupPayload } from '../api/api';
import { useAuth } from '../auth/AuthContext';

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  locationStreet: string;
  locationCity: string;
  locationState: string;
  availability: string;
  interests: string;
};

const SignupPage = () => {
  const [form, setForm] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    locationStreet: '',
    locationCity: '',
    locationState: '',
    availability: '',
    interests: ''
  });
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#6b7384');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleChange = (key: keyof SignupForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { firstName, lastName, email, password, confirmPassword, locationStreet, locationCity, locationState, availability, interests } = form;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setMessage('Please fill in all required fields before creating your account.');
      setMessageColor('#d14343');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please check both fields.');
      setMessageColor('#d14343');
      return;
    }

    setIsSubmitting(true);
    setMessage('Creating account...');
    setMessageColor('#6b7384');

    const payload: SignupPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      locationStreet: locationStreet.trim() || undefined,
      locationCity: locationCity.trim() || undefined,
      locationState: locationState.trim() || undefined,
      availability: availability.trim(),
      interests: interests.trim(),
    };

    try {
      await signup(payload);
      setMessage('Account created successfully! Redirecting...');
      setMessageColor('#27a45b');
      window.setTimeout(() => navigate('/dashboard'), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create account.');
      setMessageColor('#d14343');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.password && form.confirmPassword && !isSubmitting
  );

  return (
    <section className="panel">
      <h1>Sign Up</h1>
      <p>Create your volunteer account to browse and join events.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="firstName">First Name <span className="required">*</span></label>
            <input
              id="firstName"
              value={form.firstName}
              onChange={(event) => handleChange('firstName', event.target.value)}
              type="text"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name <span className="required">*</span></label>
            <input
              id="lastName"
              value={form.lastName}
              onChange={(event) => handleChange('lastName', event.target.value)}
              type="text"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input
            id="email"
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
            type="email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password <span className="required">*</span></label>
          <input
            id="password"
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
            type="password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
          <input
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={(event) => handleChange('confirmPassword', event.target.value)}
            type="password"
            required
          />
        </div>

        <div className="optional-panel">
          <h2>Optional profile info</h2>

          <div className="form-group">
            <label htmlFor="locationStreet">Street address</label>
            <input
              id="locationStreet"
              value={form.locationStreet}
              onChange={(event) => handleChange('locationStreet', event.target.value)}
              type="text"
              placeholder="123 Main St"
            />
          </div>

          <div className="form-group">
            <label htmlFor="locationCity">City</label>
            <input
              id="locationCity"
              value={form.locationCity}
              onChange={(event) => handleChange('locationCity', event.target.value)}
              type="text"
              placeholder="Anytown"
            />
          </div>

          <div className="form-group">
            <label htmlFor="locationState">State</label>
            <input
              id="locationState"
              value={form.locationState}
              onChange={(event) => handleChange('locationState', event.target.value)}
              type="text"
              placeholder="CA"
            />
          </div>

          <div className="form-group">
            <label htmlFor="availability">Availability</label>
            <input
              id="availability"
              value={form.availability}
              onChange={(event) => handleChange('availability', event.target.value)}
              type="text"
              placeholder="Weekdays, Weekends, Evenings"
            />
          </div>

          <div className="form-group">
            <label htmlFor="interests">Interests / Skills</label>
            <input
              id="interests"
              value={form.interests}
              onChange={(event) => handleChange('interests', event.target.value)}
              type="text"
              placeholder="Cleanup, Mentoring, Event support"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="button primary" disabled={!canSubmit}>
            Create Account
          </button>
        </div>

        <p className="small-note">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        <p className="form-message" style={{ color: messageColor }}>
          {message}
        </p>
      </form>
    </section>
  );
};

export default SignupPage;
