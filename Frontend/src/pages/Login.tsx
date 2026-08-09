import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginPayload } from '../api/api';
import { useAuth } from '../auth/AuthContext';

type LoginForm = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#6b7384');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (key: keyof LoginForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      setMessage('Please enter both email and password.');
      setMessageColor('#d14343');
      return;
    }

    setIsSubmitting(true);
    setMessage('Signing in...');
    setMessageColor('#6b7384');

    const payload: LoginPayload = {
      email: form.email.trim(),
      password: form.password,
    };

    try {
      await login(payload);
      setMessage('Login successful! Redirecting...');
      setMessageColor('#27a45b');
      setTimeout(() => navigate('/dashboard'), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to login.');
      setMessageColor('#d14343');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h1>Log In</h1>
      <p>Sign in to access your dashboard and manage volunteer events.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password <span className="required">*</span></label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="button primary" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </div>

        <p className="small-note">
          Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
        </p>
        <p className="form-message" style={{ color: messageColor }}>
          {message}
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
