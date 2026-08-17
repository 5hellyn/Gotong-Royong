import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import WelcomePage from './pages/Welcome';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProfilePage from './pages/Profile';
import ListingPage from './pages/Listing';
import DetailPage from './pages/Detail';
import CreateEventPage from './pages/CreateEvent';
import EditEventPage from './pages/EditEvent';

const App = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<WelcomePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="listing" element={<ListingPage />} />
      <Route path="create-event" element={<CreateEventPage />} />
      <Route path="edit-event/:eventId" element={<EditEventPage />} />
      <Route path="detail/:eventId" element={<DetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
