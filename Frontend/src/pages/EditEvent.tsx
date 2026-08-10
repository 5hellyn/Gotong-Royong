import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EventItem, getEventDetail, updateEvent } from '../api/api';

const EditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    locationStreet: '',
    locationCity: '',
    locationState: '',
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
        const data = await getEventDetail(Number(eventId));
        setEvent(data);
        setForm({
          title: data.title,
          startDate: data.startDate || '',
          startTime: data.startTime || '',
          endDate: data.endDate || '',
          endTime: data.endTime || '',
          locationStreet: data.locationStreet || '',
          locationCity: data.locationCity || '',
          locationState: data.locationState || '',
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

    if (!form.title || !form.startDate || !form.startTime || !form.endDate || !form.endTime || !form.locationStreet || !form.locationCity || !form.locationState || !form.summary || !form.category || !form.capacity || !form.description) {
      setMessage('Please fill in all required fields.');
      return;
    }

    try {
      setMessage('Saving event details...');
      await updateEvent(Number(eventId), {
        title: form.title.trim(),
        startDate: form.startDate.trim(),
        startTime: form.startTime.trim(),
        endDate: form.endDate.trim(),
        endTime: form.endTime.trim(),
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
            <label htmlFor="startDate">Start date <span className="required">*</span></label>
            <input id="startDate" type="date" value={form.startDate} onChange={(evt) => handleChange('startDate', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="startTime">Start time <span className="required">*</span></label>
            <input id="startTime" type="time" value={form.startTime} onChange={(evt) => handleChange('startTime', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End date <span className="required">*</span></label>
            <input id="endDate" type="date" value={form.endDate} onChange={(evt) => handleChange('endDate', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">End time <span className="required">*</span></label>
            <input id="endTime" type="time" value={form.endTime} onChange={(evt) => handleChange('endTime', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="locationStreet">Street address <span className="required">*</span></label>
            <input id="locationStreet" value={form.locationStreet} onChange={(evt) => handleChange('locationStreet', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="locationCity">City <span className="required">*</span></label>
            <input id="locationCity" value={form.locationCity} onChange={(evt) => handleChange('locationCity', evt.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="locationState">State <span className="required">*</span></label>
            <input id="locationState" value={form.locationState} onChange={(evt) => handleChange('locationState', evt.target.value)} />
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
