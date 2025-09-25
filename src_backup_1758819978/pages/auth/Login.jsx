import { useState } from react;
import { useNavigate, Link } from react-router-dom;
import { supabase } from ../../lib/supabaseClient;

export default function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }

    const userId = data.user?.id;
    if (!userId) return;
    const { data: student } = await supabase.from(student_profiles).select(id).eq(id, userId).single();
    if (student) { navigate(/student); return; }
    const { data: teacher } = await supabase.from(teacher_profiles).select(id).eq(id, userId).single();
    if (teacher) { navigate(/teacher); return; }
    navigate(/login);
  };

  return (
    <div className="auth-card">
      <h1>Welcome back</h1>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button disabled={loading} type="submit">{loading ? Signing
