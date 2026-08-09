import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EventItem, getEventDetail, updateEvent } from '../api/api';

const emptyEvent: EventItem = {
  id: '',
  title: '',
  date: '',
  time: '',
  location: '',
  summary: '',
  category: 'cleanup',
  organizer: '',
  capacity: 0,
  signedUp: 0,
  description: '',
  requirements: [],
  schedule: '',
  accessibility: '',
  contact: '',
};

const EditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    summary: '',
    category: 'cleanup',
    organizer: '',
    capacity: '',
    description: '',
    requirements: '',
    schedule: '',
    accessibility: '',
    contact: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      setIsLoading(true);
      setMessage('');
      try {
        const data = await getEventDetail(eventId);
        setEvent(data);
        setForm({
          title: data.title,
          date: data.date,
          time: data.time,
          location: data.location,
          summary: data.summary,
          category: data.category,
          organizer: data.organizer,
          capacity: String(data.capacity),
          description: data.description,
          requirements: data.requirements.join(', '),
          schedule: data.schedule,
          accessibility: data.accessibility,
          contact: data.contact,
        });
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Unable to load event details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventId) return;

    if (!form.title || !form.date || !form.time || !form.location || !form.summary || !form.category || !form.capacity || !form.description) {
      setMessage('Please fill in all required fields.');
      return;
    }

    try {
      setMessage('Saving event details...');
      await updateEvent(eventId, {
        title: form.title.trim(),
        date: form.date.trim(),
        time: form.time.trim(),
        location: form.location.trim(),
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
      });
      setMessage('Event updated successfully. Redirecting to your created events...');
      setTimeout(() => navigate('/my-created-events'), 900);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update event.');
    }
  };

  if (!eventId) {
    return (
      <section className="panel">
        <h1>Event not found</h1>
        <p>The requested event could not be found.</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="panel">
        <h1>Loading event details…</h1>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="page-header">
        <h1>Edit Event</h1>
        <p>Update the details for your event.</p>
      </div>

      {message ? <p className="form-message">{message}</p> : null}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Event title <span className="required">*</span></label>
            <input id="title" value={form.title} onChange={(evt) => handleChange('title', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date <span className="required">*</span></label>
            <input id="date" value={form.date} onChange={(evt) => handleChange('date', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="time">Time <span className="required">*</span></label>
            <input id="time" value={form.time} onChange={(evt) => handleChange('time', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location <span className="required">*</span></label>
            <input id="location" value={form.location} onChange={(evt) => handleChange('location', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="capacity">Capacity <span className="required">*</span></label>
            <input id="capacity" type="number" min="1" value={form.capacity} onChange={(evt) => handleChange('capacity', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category <span className="required">*</span></label>
            <select id="category" value={form.category} onChange={(evt) => handleChange('category', evt.target.value)}>
              <option value="cleanup">Cleanup</option>
              <option value="education">Education</option>
              <option value="food">Food</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="organizer">Organizer</label>
            <input id="organizer" value={form.organizer} onChange={(evt) => handleChange('organizer', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="contact">Contact email</label>
            <input id="contact" value={form.contact} onChange={(evt) => handleChange('contact', evt.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="summary">Short summary <span className="required">*</span></label>
          <input id="summary" value={form.summary} onChange={(evt) => handleChange('summary', evt.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="description">Full description <span className="required">*</span></label>
          <textarea id="description" rows={5} value={form.description} onChange={(evt) => handleChange('description', evt.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="requirements">Requirements</label>
          <input id="requirements" value={form.requirements} onChange={(evt) => handleChange('requirements', evt.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="schedule">Schedule</label>
          <input id="schedule" value={form.schedule} onChange={(evt) => handleChange('schedule', evt.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="accessibility">Accessibility notes</label>
          <input id="accessibility" value={form.accessibility} onChange={(evt) => handleChange('accessibility', evt.target.value)} />
        </div>

        <div className="form-actions">
          <button type="submit" className="button primary">Save changes</button>
          <button type="button" className="button secondary" onClick={() => navigate('/my-created-events')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
};

export default EditEventPage;
