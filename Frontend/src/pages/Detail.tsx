import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EventItem, getEventDetail, registerForEvent, cancelRegistration, getEventAttendees, UserProfile } from '../api/api';
import { useAuth } from '../auth/AuthContext';

const DetailPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');
  const [registering, setRegistering] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [attendees, setAttendees] = useState<UserProfile[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getEventDetail(eventId);
        setEvent(data);
        setIsRegistered(!!data.isRegistered);
        // if current user is organizer, fetch attendees
        try {
          if (data && user && data.createdBy === user.id) {
            setAttendeesLoading(true);
            const list = await getEventAttendees(eventId);
            setAttendees(list);
          }
        } catch (e) {
          setAttendeesError(e instanceof Error ? e.message : 'Unable to load attendees');
        } finally {
          setAttendeesLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load event details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (!eventId) {
    return (
      <section className="panel">
        <h1>Event not found</h1>
        <p>The selected event could not be found.</p>
        <Link to="/listing" className="link-button">
          Back to listings
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="panel">
        <h1>Loading event…</h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h1>Unable to load event</h1>
        <p>{error}</p>
        <Link to="/listing" className="link-button">
          Back to listings
        </Link>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="panel">
        <h1>Event not found</h1>
        <p>The selected event could not be found.</p>
        <Link to="/listing" className="link-button">
          Back to listings
        </Link>
      </section>
    );
  }

  const handleRegister = async () => {
    if (!eventId) return;

    setRegistering(true);
    setRegisterMessage('Registering you for this event...');

    try {
      const response = await registerForEvent(eventId);
      setEvent((current) =>
        current
          ? { ...current, signedUp: response.signedUp }
          : current
      );
      setIsRegistered(true);
      setRegisterMessage('You are successfully registered for this event.');
    } catch (err) {
      setRegisterMessage(err instanceof Error ? err.message : 'Unable to register for this event.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!eventId) return;
    const confirmed = window.confirm('Are you sure you want to cancel your registration for this event?');
    if (!confirmed) return;

    setCanceling(true);
    setRegisterMessage('');
    try {
      const response = await cancelRegistration(eventId);
      setEvent((current) => (current ? { ...current, signedUp: response.signedUp } : current));
      setIsRegistered(false);
      setRegisterMessage('Your registration has been canceled.');
    } catch (err) {
      setRegisterMessage(err instanceof Error ? err.message : 'Unable to cancel registration.');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <section className="panel">
      <h1>{event.title}</h1>
      <p className="subheading">{event.summary}</p>

      <div className="detail-grid">
        <div className="detail-card">
          <p><strong>Date:</strong> {event.date}</p>
          <p><strong>Time:</strong> {event.time}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Organizer:</strong> {event.organizer}</p>
          <p><strong>Capacity:</strong> {event.signedUp} of {event.capacity} signed up</p>
          <span className="tag open">{event.category}</span>
        </div>

        <div className="detail-card">
          {!isRegistered ? (
            <button className="button primary" onClick={handleRegister} disabled={registering}>
              {registering ? 'Registering…' : 'Sign Up'}
            </button>
          ) : (
            <div>
              <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary)' }}>You are registered for this event</div>
              <button className="button tertiary" onClick={handleCancel} disabled={canceling}>
                {canceling ? 'Cancelling…' : 'Cancel registration'}
              </button>
            </div>
          )}
        </div>
      </div>
      {registerMessage ? <p className="form-message">{registerMessage}</p> : null}

      <section className="panel">
        <h2>Description</h2>
        <p>{event.description}</p>

        <h3>What to bring</h3>
        <ul>
          {event.requirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Extra details</h2>
        <p><strong>Schedule:</strong> {event.schedule}</p>
        <p><strong>Accessibility:</strong> {event.accessibility}</p>
        <p><strong>Contact:</strong> {event.contact}</p>
      </section>

      {event.createdBy && user && event.createdBy === user.id && (
        <section className="panel">
          <h2>Attendees</h2>
          {attendeesLoading ? (
            <p>Loading attendees…</p>
          ) : attendeesError ? (
            <p className="form-message">{attendeesError}</p>
          ) : attendees.length === 0 ? (
            <p>No one has signed up for this event yet.</p>
          ) : (
            <ul>
              {attendees.map((a) => (
                <li key={a.id} style={{ marginBottom: '0.5rem' }}>
                  <strong>{a.fullName}</strong> — {a.email}
                  <div style={{ color: 'var(--secondary)', fontSize: '0.95rem' }}>
                    {a.location ? `${a.location} • ` : ''}{a.availability ? `${a.availability} • ` : ''}{a.interests}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p>
        <Link to="/listing" className="link-button">
          Back to listings
        </Link>
      </p>
    </section>
  );
};

export default DetailPage;
