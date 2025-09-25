import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      // If we have a pending role from signup (email confirmation case), create profile now
      const pending = localStorage.getItem('sb_pending_role') as 'student' | 'teacher' | null;
      if (pending) {
        const userId = data.session.user.id;
        if (pending === 'teacher') {
          const { data: exists } = await supabase.from('teacher_profiles').select('id').eq('id', userId).maybeSingle();
          if (!exists) await supabase.from('teacher_profiles').insert({ id: userId, full_name: '', school: '' });
          localStorage.removeItem('sb_pending_role');
          navigate('/teacher');
          return;
        } else {
          const { data: exists } = await supabase.from('student_profiles').select('id').eq('id', userId).maybeSingle();
          if (!exists) {
            // Let onboarding collect grade/section then create
            localStorage.removeItem('sb_pending_role');
            navigate('/onboarding');
            return;
          }
        }
      }
      navigate('/');
    };
    init();
  }, [navigate]);

  const signUp = async () => {
    setLoading(true);
    if (!email || !password) {
      alert('Please enter email and password.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message?.toLowerCase().includes('anonymous')) {
        alert('Supabase: Anonymous sign-ins are disabled. Enable Email provider in Auth settings and try again.');
      } else {
        alert(error.message);
      }
      setLoading(false);
      return;
    }
    // If email confirmation is required, there may be no session yet
    if (!data.session) {
      localStorage.setItem('sb_pending_role', role);
      setInfo('Check your email to confirm your account, then return here to finish setup.');
      setLoading(false);
      return;
    }
    const userId = data.session.user.id;
    if (role === 'teacher') {
      const { data: exists } = await supabase.from('teacher_profiles').select('id').eq('id', userId).maybeSingle();
      if (!exists) await supabase.from('teacher_profiles').insert({ id: userId, full_name: '', school: '' });
      navigate('/teacher');
    } else {
      navigate('/onboarding');
    }
    setLoading(false);
  };

  const signIn = async () => {
    setLoading(true);
    if (!email || !password) {
      alert('Please enter email and password.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
    navigate('/');
  };

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Welcome to Shiksha Bandhu</h2>
        {info && <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2">{info}</div>}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setRole('student')} className={`rounded-full px-4 py-2 ${role==='student'?'bg-orange-500 text-white':'bg-gray-100'}`}>Student</button>
          <button onClick={() => setRole('teacher')} className={`rounded-full px-4 py-2 ${role==='teacher'?'bg-green-500 text-white':'bg-gray-100'}`}>Teacher</button>
        </div>
        <label className="block text-sm mb-1">Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="you@example.com" />
        <label className="block text-sm mb-1">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="••••••••" />
        <div className="flex gap-2">
          <button disabled={loading} onClick={signIn} className="flex-1 rounded-full bg-gray-900 text-white px-4 py-2">Sign in</button>
          <button disabled={loading} onClick={signUp} className="flex-1 rounded-full bg-orange-500 text-white px-4 py-2">Sign up</button>
        </div>
      </div>
    </main>
  );
}


