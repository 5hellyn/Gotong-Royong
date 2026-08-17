import { Link } from 'react-router-dom';

const featuredEvents = [
  {
    tag: 'Environment',
    title: 'Beach Cleanup Drive',
    date: 'Sat · 9:00 AM',
    description: 'Help protect local coastlines and make a visible difference in one morning.',
  },
  {
    tag: 'Outreach',
    title: 'Community Food Packing',
    date: 'Sun · 10:30 AM',
    description: 'Support families in need by sorting and packing essentials for local outreach.',
  },
  {
    tag: 'Mentorship',
    title: 'Youth Mentorship Circle',
    date: 'Thu · 6:00 PM',
    description: 'Share time, encouragement, and guidance with young people building brighter futures.',
  },
];

const benefits = [
  {
    title: 'Discover causes that matter',
    text: 'Browse volunteer opportunities that match your values, interests, and skills.',
  },
  {
    title: 'Give on your schedule',
    text: 'Choose events that fit your availability and stay engaged without the hassle.',
  },
  {
    title: 'See your impact',
    text: 'Track the community moments you contribute to and stay motivated to keep going.',
  },
];

const WelcomePage = () => (
  <section className="welcome-page">
    <div className="welcome-hero panel">
      <div className="welcome-copy">
        <p className="eyebrow">Find your next way to make a difference</p>
        <h1>Volunteer for what matters most.</h1>
        <p className="lead">
          Discover meaningful opportunities in your community and make a real impact, one
          event at a time. Join local causes, connect with people who care, and give back in a way
          that fits your life.
        </p>

        <div className="welcome-actions">
          <Link to="/signup" className="button primary large">
            Create account
          </Link>
          <Link to="/listing" className="button secondary large">
            Browse Events
          </Link>
          <Link to="/login" className="button tertiary large">
            Log in
          </Link>
        </div>

        <div className="welcome-trust">
          <div>
            <strong>2,450+</strong>
            <span>volunteers</span>
          </div>
          <div>
            <strong>180+</strong>
            <span>events</span>
          </div>
          <div>
            <strong>4.9/5</strong>
            <span>experience</span>
          </div>
        </div>
      </div>

      <div className="hero-visual" aria-label="Volunteers helping in the community">
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
          alt="Volunteers working together at a community event"
        />
        <div className="floating-stack">
          <div className="floating-card">
            <span className="floating-label">This month</span>
            <strong>36 community events</strong>
            <span>matched to active volunteers</span>
          </div>
          <div className="mini-metrics">
            <div>
              <strong>1.2k</strong>
              <span>new signups</span>
            </div>
            <div>
              <strong>92%</strong>
              <span>event success</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section className="benefits-section">
      <div className="section-header">
        <p className="eyebrow dark">Why volunteers choose us</p>
        <h2>Simple ways to give back.</h2>
      </div>

      <div className="benefits-grid">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="benefit-card">
            <div className="benefit-icon">✦</div>
            <h3>{benefit.title}</h3>
            <p>{benefit.text}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="featured-section">
      <div className="section-header split-header">
        <div>
          <p className="eyebrow dark">Featured opportunities</p>
          <h2>Find your next chance to help.</h2>
        </div>
        <Link to="/listing" className="text-link">
          View all events
        </Link>
      </div>

      <div className="event-grid welcome-event-grid">
        {featuredEvents.map((event) => (
          <article key={event.title} className="event-card welcome-event-card">
            <div className="event-body welcome-event-body">
              <span className="event-tag">{event.tag}</span>
              <div className="event-meta">
                <span>{event.date}</span>
              </div>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <Link to="/listing" className="button primary small">
                Join now
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="organizer-cta">
      <div className="organizer-copy">
        <p className="eyebrow dark">Are you an event organizer?</p>
        <h2>Bring your community together.</h2>
        <p>
          Create and manage volunteer opportunities, reach more people, and keep your events
          organized from sign-up to completion.
        </p>
        <Link to="/signup" className="button secondary large">
          Host an event
        </Link>
      </div>
      <div className="organizer-visual">
        <img
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
          alt="Event organizers coordinating volunteers"
        />
      </div>
    </section>
  </section>
);

export default WelcomePage;
