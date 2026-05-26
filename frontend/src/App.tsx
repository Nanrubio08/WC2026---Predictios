import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MatchListPage from './pages/MatchListPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import GroupStandingsPage from './pages/GroupStandingsPage';
import MyPredictionsPage from './pages/MyPredictionsPage';
import AdminPage from './pages/AdminPage';
import GoldenBallPage from './pages/GoldenBallPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import { useAuthToken } from './hooks/useAuthToken';

export default function App() {
  const { user, isAuthenticated, setSession, clearSession } = useAuthToken();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-wc-bg flex flex-col">
        <Navbar
          isAuthenticated={isAuthenticated}
          user={user}
          onLogin={setSession}
          onLogout={clearSession}
        />
        <main className="container mx-auto flex-1 px-4 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/matches" element={<MatchListPage isAuthenticated={isAuthenticated} />} />
            <Route path="/leaderboard" element={<LeaderboardPage currentUser={user} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/groups" element={<GroupStandingsPage />} />
            <Route path="/my-predictions" element={<MyPredictionsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/bonus" element={<GoldenBallPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
