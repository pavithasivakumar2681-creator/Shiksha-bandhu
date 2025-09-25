import { Link } from react-router-dom;
import { supabase } from ../lib/supabaseClient;

export default function Header() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = /login;
  };

  return (
    <header className="header">
      <div className="brand">
        <span className="logo">🟧</span>
        <div>
          <div className="title">Shiksha Bandhu</div>
          <div className="subtitle">Learn. Grow. Shine.</div>
        </div>
      </div>
      <nav className="nav">
        <Link to="/student">Student</Link>
        <Link to="/teacher">Teacher</Link>
        <button className="logout" onClick={handleLogout}>Logout</button>
      </nav>
    </header>
  );
}
