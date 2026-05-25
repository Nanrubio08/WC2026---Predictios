import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MatchListPage from './pages/MatchListPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import { useAuthToken } from './hooks/useAuthToken';

export default function App() {
  const { user, isAuthenticated, setSession, clearSession } = useAuthToken();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-wc-bg">
        <Navbar
          isAuthenticated={isAuthenticated}
          user={user}
          onLogin={setSession}
          onLogout={clearSession}
        />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/matches" element={<MatchListPage isAuthenticated={isAuthenticated} />} />
            <Route path="/leaderboard" element={<LeaderboardPage currentUser={user} />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
