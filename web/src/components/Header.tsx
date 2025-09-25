import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

type SessionLike = { user?: { id: string } } | null;

type HeaderProps = {
  session: SessionLike;
  profileRole: 'student' | 'teacher' | null;
};

export function Header({ session, profileRole }: HeaderProps) {
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl text-orange-600">Shiksha Bandhu</Link>
        <nav className="flex items-center gap-3">
          {session && (
            profileRole === 'teacher' ? (
              <Link to="/teacher" className="text-sm text-gray-700">Dashboard</Link>
            ) : profileRole === 'student' ? (
              <Link to="/student" className="text-sm text-gray-700">Dashboard</Link>
            ) : (
              <Link to="/onboarding" className="text-sm text-gray-700">Onboarding</Link>
            )
          )}
          <Link to="/leaderboard" className="text-sm text-gray-700">Leaderboard</Link>
          <Link to="/quests" className="text-sm text-gray-700">Quests</Link>
          {!session ? (
            <Link to="/auth" className="rounded-full bg-orange-500 text-white px-4 py-2 text-sm">Login</Link>
          ) : (
            <button onClick={logout} className="rounded-full bg-gray-900 text-white px-4 py-2 text-sm">Logout</button>
          )}
        </nav>
      </div>
    </header>
  );
}


