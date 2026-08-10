import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardResponse, getDashboard, registerForEvent, cancelRegistration, getMyCreatedEvents, deleteEvent } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null);
  const [cancelingEventId, setCancelingEventId] = useState<number | null>(null);
  const [confirmCancelEventId, setConfirmCancelEventId] = useState<number | null>(null);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [createdEvents, setCreatedEvents] = useState<DashboardResponse['upcomingEvents']>([]);
  const [createdLoading, setCreatedLoading] = useState(false);
  const [createdError, setCreatedError] = useState('');
  const [deletingCreatedEventId, setDeletingCreatedEventId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchCreatedEvents();
  }, []);

  const fetchCreatedEvents = async () => {
    setCreatedLoading(true);
    setCreatedError('');
    try {
      const data = await getMyCreatedEvents();
      setCreatedEvents(data);
    } catch (err) {
      setCreatedError(err instanceof Error ? err.message : 'Unable to load your created events.');
    } finally {
      setCreatedLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    setRegisteringEventId(eventId);
    setActionMessage('');
    try {
      await registerForEvent(eventId);
      setActionMessage('You have successfully signed up for the event.');
      await fetchDashboard();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Unable to sign up for this event.');
    } finally {
      setRegisteringEventId(null);
    }
  };

  const handleCancelOpen = (eventId: number) => {
    setConfirmCancelEventId(eventId);
  };

  const handleCancelClose = () => {
    setConfirmCancelEventId(null);
  };

  const handleCancelConfirm = async () => {
    if (!confirmCancelEventId) {
      return;
    }

    setCancelingEventId(confirmCancelEventId);
    setActionMessage('');
    try {
      await cancelRegistration(confirmCancelEventId);
      setActionMessage('Your registration has been canceled.');
      await fetchDashboard();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Unable to cancel registration.');
    } finally {
      setCancelingEventId(null);
      setConfirmCancelEventId(null);
    }
  };

  const handleDeleteCreated = (eventId: number) => {
    setConfirmDeleteEventId(eventId);
  };

  const handleDeleteClose = () => {
    setConfirmDeleteEventId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteEventId) return;
    setDeletingCreatedEventId(confirmDeleteEventId);
    try {
      await deleteEvent(confirmDeleteEventId);
      setCreatedEvents((current) => current.filter((ev) => ev.id !== confirmDeleteEventId));
    } catch (err) {
      setCreatedError(err instanceof Error ? err.message : 'Unable to cancel the event.');
    } finally {
      setDeletingCreatedEventId(null);
      setConfirmDeleteEventId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Volunteer Dashboard</h1>
          <p>Welcome back{user ? `, ${`${user.firstName} ${user.lastName}`.trim()}` : ''}.</p>
        </div>
      </header>

      {isLoading ? (
        <section className="panel">
          <p>Loading dashboard...</p>
        </section>
      ) : error ? (
        <section className="panel">
          <p className="form-message">{error}</p>
        </section>
      ) : dashboard ? (
        <>
          <section className="grid-3">
            <div className="stat-card">
              <span className="stat-value">{dashboard.stats.eventsSignedUp}</span>
              <span className="stat-label">Events signed up</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{dashboard.stats.hoursVolunteered}</span>
              <span className="stat-label">Hours volunteered</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{dashboard.stats.eventsCreated}</span>
              <span className="stat-label">Events created</span>
            </div>
          </section>

          <section className="panel">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2>Upcoming Events</h2>
              </div>
              <div>
                <Link to="/listing" className="button secondary">Register for Events</Link>
              </div>
            </div>
            {dashboard.upcomingEvents.length === 0 ? (
              <p>No upcoming registered events yet.</p>
            ) : (
              dashboard.upcomingEvents.map((event) => (
                <article key={event.id} className="event-card">
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.date} • {event.time}</p>
                    <p>{event.location}</p>
                  </div>
                  <div className="card-actions">
                    <span className="tag registered">Registered</span>
                    <Link to={`/detail/${event.id}`} className="button secondary small">
                      View Details
                    </Link>
                    <button
                      type="button"
                      className="button tertiary small"
                      onClick={() => handleCancelOpen(event.id)}
                      disabled={cancelingEventId === event.id}
                    >
                      {cancelingEventId === event.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>

          {confirmCancelEventId && (
            <div className="modal-backdrop">
              <div className="modal-panel">
                <h2>Cancellation Confirmation</h2>
                <p>Are you sure you want to cancel your registration to this event?</p>
                <div className="form-actions">
                  <button type="button" className="button tertiary" onClick={handleCancelClose}>
                    Keep registration
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={handleCancelConfirm}
                    disabled={cancelingEventId === confirmCancelEventId}
                  >
                    {cancelingEventId === confirmCancelEventId ? 'Cancelling…' : 'Yes, cancel registration'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmDeleteEventId && (
            <div className="modal-backdrop">
              <div className="modal-panel">
                <h2>Cancellation Confirmation</h2>
                <p>Are you sure you want to cancel this event? This cannot be undone.</p>
                <div className="form-actions">
                  <button type="button" className="button tertiary" onClick={handleDeleteClose}>
                    Keep event
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={handleDeleteConfirm}
                    disabled={deletingCreatedEventId === confirmDeleteEventId}
                  >
                    {deletingCreatedEventId === confirmDeleteEventId ? 'Cancelling…' : 'Yes, cancel event'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My Created Events section (embedded from MyCreatedEvents) */}
          <section className="panel">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2>Events created</h2>
              </div>
              <div>
                <button className="button primary" type="button" onClick={() => navigate('/create-event')}>
                  Create Event
                </button>
              </div>
            </div>
            {createdLoading ? (
              <p>Loading your events…</p>
            ) : createdError ? (
              <p className="form-message">{createdError}</p>
            ) : createdEvents.length === 0 ? (
              <p>You have not created any events yet.</p>
            ) : (
              <section className="event-list">
                {createdEvents.map((event) => (
                  <article key={event.id} className="event-card">
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.date} • {event.time}</p>
                      <p>{event.location || [event.locationStreet, event.locationCity, event.locationState].filter(Boolean).join(', ')}</p>
                      <p className="summary">{event.summary}</p>
                    </div>
                    <div className="card-actions">
                      <Link to={`/detail/${event.id}`} className="button secondary small">View Details</Link>
                      <Link to={`/edit-event/${event.id}`} className="button primary small">Edit</Link>
                      <button
                        type="button"
                        className="button tertiary small"
                        onClick={() => handleDeleteCreated(event.id)}
                        disabled={deletingCreatedEventId === event.id}
                      >
                        {deletingCreatedEventId === event.id ? 'Cancelling…' : 'Cancel event'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            )}
            {actionMessage ? <p className="form-message">{actionMessage}</p> : null}
          </section>

          <section className="panel">
            <h2>Profile summary</h2>
            <p><strong>Location:</strong> {dashboard.profile.location}</p>
            <p><strong>Availability:</strong> {dashboard.profile.availability}</p>
            <p><strong>Interests:</strong> {dashboard.profile.interests}</p>
            <button className="button secondary">Edit Profile</button>
          </section>
        </>
      ) : (
        <section className="panel">
          <p>No dashboard data available.</p>
        </section>
      )}
    </>
  );
};

export default DashboardPage;
