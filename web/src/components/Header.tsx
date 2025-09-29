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
    <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-2xl bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Shiksha Bandhu</Link>
        <nav className="flex items-center gap-4">
          {session && (
            <>
              {profileRole === 'teacher' ? (
                <Link to="/teacher" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-xl hover:bg-orange-50 transition-colors">Dashboard</Link>
              ) : profileRole === 'student' ? (
                <Link to="/student" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-xl hover:bg-orange-50 transition-colors">Dashboard</Link>
              ) : (
                <Link to="/onboarding" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-xl hover:bg-orange-50 transition-colors">Onboarding</Link>
              )}
              <Link to="/leaderboard" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-xl hover:bg-orange-50 transition-colors">Leaderboard</Link>
              <Link to="/quests" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-xl hover:bg-orange-50 transition-colors">Quests</Link>
              <button 
                onClick={logout} 
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl hover:from-gray-900 hover:to-black shadow-md transition-all"
              >
                Logout
              </button>
            </>
          )}
          {!session && (
            <Link 
              to="/auth" 
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-md transition-all"
            >
              Get Started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}


