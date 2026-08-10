import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EventItem, getEvents } from '../api/api';

type FilterState = {
  search: string;
  location: string;
  category: string;
};

const ListingPage = () => {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({ search: '', location: '', category: '' });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getEvents({
          q: appliedFilters.search,
          location: appliedFilters.location,
          category: appliedFilters.category,
        });
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load events.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [appliedFilters]);

  const filteredEvents = useMemo(() => events, [events]);

  return (
    <section className="panel">
      <h1>Browse Volunteer Events</h1>

      <div className="filter-row">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by keyword"
        />
        <input
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          <option value="cleanup">Cleanup</option>
          <option value="education">Education</option>
          <option value="food">Food</option>
        </select>
        <button
          type="button"
          className="button primary"
          onClick={() => setAppliedFilters({ search, location, category })}
        >
          Apply
        </button>
      </div>

      {isLoading ? (
        <p>Loading available events…</p>
      ) : error ? (
        <p className="form-message">{error}</p>
      ) : (
        <section className="event-list">
          {filteredEvents.length === 0 ? (
            <p>No events match your filters.</p>
          ) : (
            filteredEvents.map((event) => (
              <article key={event.id} className="event-card">
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.date} • {event.time}</p>
                  <p>{event.location || [event.locationStreet, event.locationCity, event.locationState].filter(Boolean).join(', ')}</p>
                  <p className="summary">{event.summary}</p>
                </div>
                <div className="card-actions">
                  <span className="tag open">{event.category}</span>
                  <Link to={`/detail/${event.id}`} className="button secondary small">
                    View Details
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </section>
  );
};

export default ListingPage;
