import { useState } from react;
import { useNavigate, Link } from react-router-dom;
import { supabase } from ../../lib/supabaseClient;

export default function Signup() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [fullName, setFullName] = useState();
  const [role, setRole] = useState(student);
  const [grade, setGrade] = useState(11);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError();

    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, grade: role === student ? Number(grade) : null }
      }
    });
    if (signErr) { setError(signErr.message); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setLoading(false); return; }

    if (role === student) {
      await supabase.from(student_profiles).upsert({ id: userId, full_name: fullName, grade: Number(grade) });
      navigate(/student);
    } else {
      await supabase.from(teacher_profiles).upsert({ id: userId, full_name: fullName });
      navigate(/teacher);
    }
    setLoading(false);
  };

  return (
    <div className="auth-card">
      <h1>Create account</h1>
      <form onSubmit={onSubmit}>
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <div className="segmented">
          <label><input type="radio" name="role" value="student" checked={role===student} onChange={() => setRole(student)} /> Student</label>
          <label><input type="radio" name="role" value="teacher" checked={role===teacher} onChange={() => setRole(teacher)} /> Teacher</label>
        </div>

        {role === student && (
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        )}

        {error && <div className="error">{error}</div>}
        <button disabled={loading} type="submit">{loading ? Creating... : Sign
