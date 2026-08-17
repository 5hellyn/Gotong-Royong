import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const navItems = user
    ? [{ label: 'Home', path: '/dashboard' }, { label: 'Browse Events', path: '/listing' }]
    : [{ label: 'Browse Events', path: '/listing' }];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="top-nav">
        <Link to="/" className="brand" aria-label="Go to welcome page">
          Gotong Royong
        </Link>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
          {!loading && (
            user ? (
              <>
                <Link
                  to="/profile"
                  className={location.pathname === '/profile' ? 'active' : ''}
                >
                  {`${user.firstName} ${user.lastName}`.trim()}
                </Link>
                <button type="button" className="button tertiary small" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={location.pathname === '/login' ? 'active' : ''}
              >
                Log in
              </Link>
            )
          )}
        </nav>
      </header>
      <main className="page-layout">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
