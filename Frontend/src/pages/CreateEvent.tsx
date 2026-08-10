import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createEvent, CreateEventPayload, EventItem } from '../api/api';
import { useAuth } from '../auth/AuthContext';

type FormState = {
  title: string;
  date: string;
  time: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  locationStreet: string;
  locationCity: string;
  locationState: string;
  summary: string;
  category: EventItem['category'] | '';
  organizer: string;
  capacity: string;
  description: string;
  requirements: string;
  schedule: string;
  accessibility: string;
  contact: string;
};

const initialFormState: FormState = {
  title: '',
  date: '',
  time: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  locationStreet: '',
  locationCity: '',
  locationState: '',
  summary: '',
  category: '',
  organizer: '',
  capacity: '',
  description: '',
  requirements: '',
  schedule: '',
  accessibility: '',
  contact: ''
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      organizer: current.organizer || `${user.firstName} ${user.lastName}`.trim() || user.email,
      contact: current.contact || user.email,
    }));
  }, [user]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title || !form.startDate || !form.startTime || !form.endDate || !form.endTime || !form.locationStreet || !form.locationCity || !form.locationState || !form.summary || !form.category || !form.organizer || !form.capacity || !form.description) {
      setMessage('Please fill in all required fields.');
      return;
    }

    const payload: CreateEventPayload = {
      title: form.title.trim(),
      date: `${form.startDate} - ${form.endDate}`,
      time: `${form.startTime} - ${form.endTime}`,
      startDate: form.startDate,
      startTime: form.startTime,
      endDate: form.endDate,
      endTime: form.endTime,
      locationStreet: form.locationStreet.trim(),
      locationCity: form.locationCity.trim(),
      locationState: form.locationState.trim(),
      summary: form.summary.trim(),
      category: form.category as EventItem['category'],
      organizer: form.organizer.trim(),
      capacity: Number(form.capacity),
      description: form.description.trim(),
      requirements: form.requirements
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      schedule: form.schedule.trim(),
      accessibility: form.accessibility.trim(),
      contact: form.contact.trim(),
    };

    try {
      setMessage('Creating event...');
      await createEvent(payload);
      setForm(initialFormState);
      setMessage('Event created! Redirecting to listings...');
      window.setTimeout(() => navigate('/listing'), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create event.');
    }
  };

  return (
    <section className="panel">
      <div className="page-header">
        <h1>Create a New Event</h1>
        <p>Share a volunteer opportunity with the community.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Event title <span className="required">*</span></label>
            <input id="title" value={form.title} onChange={(event) => handleChange('title', event.target.value)} placeholder="e.g. Community Garden Day" />
          </div>

          <div className="form-group">
            <label htmlFor="organizer">Organizer <span className="required">*</span></label>
            <input
              id="organizer"
              value={form.organizer}
              disabled
              placeholder="Your name or organization"
            />
          </div>

          <div className="form-group">
            <label>Start date <span className="required">*</span></label>
            <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Start time <span className="required">*</span></label>
            <input type="time" value={form.startTime} onChange={(e) => handleChange('startTime', e.target.value)} />
          </div>

          <div className="form-group">
            <label>End date <span className="required">*</span></label>
            <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
          </div>

          <div className="form-group">
            <label>End time <span className="required">*</span></label>
            <input type="time" value={form.endTime} onChange={(e) => handleChange('endTime', e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="locationStreet">Street address <span className="required">*</span></label>
            <input id="locationStreet" value={form.locationStreet} onChange={(event) => handleChange('locationStreet', event.target.value)} placeholder="123 Main St" />
          </div>

          <div className="form-group">
            <label htmlFor="locationCity">City <span className="required">*</span></label>
            <input id="locationCity" value={form.locationCity} onChange={(event) => handleChange('locationCity', event.target.value)} placeholder="Anytown" />
          </div>

          <div className="form-group">
            <label htmlFor="locationState">State <span className="required">*</span></label>
            <input id="locationState" value={form.locationState} onChange={(event) => handleChange('locationState', event.target.value)} placeholder="CA" />
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Capacity <span className="required">*</span></label>
            <input id="capacity" type="number" min="1" value={form.capacity} onChange={(event) => handleChange('capacity', event.target.value)} placeholder="20" />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category <span className="required">*</span></label>
            <select id="category" value={form.category} onChange={(event) => handleChange('category', event.target.value)}>
              <option value="">Select a category</option>
              <option value="cleanup">Cleanup</option>
              <option value="education">Education</option>
              <option value="food">Food</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact email</label>
            <input id="contact" value={form.contact} disabled placeholder="contact@example.org" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="summary">Short summary <span className="required">*</span></label>
          <input id="summary" value={form.summary} onChange={(event) => handleChange('summary', event.target.value)} placeholder="Describe the event in one sentence" />
        </div>

        <div className="form-group">
          <label htmlFor="description">Full description <span className="required">*</span></label>
          <textarea id="description" value={form.description} onChange={(event) => handleChange('description', event.target.value)} rows={5} placeholder="Share what volunteers will do" />
        </div>

        <div className="form-group">
          <label htmlFor="requirements">Requirements</label>
          <input id="requirements" value={form.requirements} onChange={(event) => handleChange('requirements', event.target.value)} placeholder="Comma-separated items like gloves, water bottle" />
        </div>

        <div className="form-group">
          <label htmlFor="schedule">Schedule</label>
          <input id="schedule" value={form.schedule} onChange={(event) => handleChange('schedule', event.target.value)} placeholder="Check-in at 9:45 AM" />
        </div>

        <div className="form-group">
          <label htmlFor="accessibility">Accessibility notes</label>
          <input id="accessibility" value={form.accessibility} onChange={(event) => handleChange('accessibility', event.target.value)} placeholder="Wheelchair-friendly route available" />
        </div>

        {message ? <p className="form-message">{message}</p> : null}

        <div className="form-actions">
          <button type="submit" className="button primary">Create Event</button>
          <Link to="/listing" className="button secondary">Cancel</Link>
        </div>
      </form>
    </section>
  );
};

export default CreateEventPage;
