import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [grade, setGrade] = useState<number | null>(null);
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
        const pendingEmail = localStorage.getItem('sb_pending_email') || '';
        try {
          if (pending === 'teacher') {
            const { data: exists, error: existsError } = await supabase.from('teacher_profiles').select('id').eq('id', userId).maybeSingle();
            if (existsError) {
              console.error('Error checking teacher profile existence:', existsError);
            }
            if (!exists) {
              const { error: insertError } = await supabase.from('teacher_profiles').insert({ id: userId, full_name: '', school: '', email: pendingEmail });
              if (insertError) {
                console.error('Error inserting teacher profile:', insertError);
              }
            }
            localStorage.removeItem('sb_pending_role');
            localStorage.removeItem('sb_pending_email');
            navigate('/teacher');
            return;
          } else {
            const { data: exists, error: existsError } = await supabase.from('student_profiles').select('id').eq('id', userId).maybeSingle();
            if (existsError) {
              console.error('Error checking student profile existence:', existsError);
            }
            if (!exists) {
              const pendingGrade = localStorage.getItem('sb_pending_grade');
              const defaultGrade = 11; // Default for pending cases
              const { error: insertError } = await supabase.from('student_profiles').insert({ 
                id: userId, 
                grade: pendingGrade ? parseInt(pendingGrade) : defaultGrade, 
                full_name: '', 
                section: '',
                email: pendingEmail
              });
              if (insertError) {
                console.error('Error inserting student profile:', insertError);
              }
            }
            localStorage.removeItem('sb_pending_role');
            localStorage.removeItem('sb_pending_grade');
            localStorage.removeItem('sb_pending_email');
            navigate('/student');
            return;
          }
        } catch (error) {
          console.error('Error handling pending role:', error);
          // Fallback navigation to student dashboard to avoid onboarding
          navigate('/student');
          return;
        }
      }
      navigate('/');
    };
    init();
  }, [navigate]);

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

  const signUp = async () => {
    setLoading(true);
    try {
      console.log('Signup starting for role:', role, 'email:', email);
      if (!email || !password) {
        alert('Please enter email and password.');
        return;
      }
      if (role === 'student' && !grade) {
        alert('Please select your grade.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      console.log('Auth signup response:', data, 'Error:', error);
      if (error) {
        if (error.message?.includes('Email signups are disabled')) {
          alert('Supabase: Email signups are disabled. Enable the Email provider in Auth > Providers in your Supabase dashboard and try again.');
        } else if (error.message?.toLowerCase().includes('anonymous')) {
          alert('Supabase: Anonymous sign-ins are disabled. Enable Email provider in Auth settings and try again.');
        } else {
          alert(error.message);
        }
        return;
      }
      // If email confirmation is required, there may be no session yet
      if (!data.session) {
        console.log('No session, storing pending...');
        localStorage.setItem('sb_pending_role', role);
        localStorage.setItem('sb_pending_email', email);
        if (role === 'student') {
          localStorage.setItem('sb_pending_grade', grade?.toString() || '');
        }
        setInfo('Check your email to confirm your account, then return here and sign in to finish setup.');
        return;
      }
      const userId = data.session.user.id;
      console.log('Session created, user ID:', userId);
      if (role === 'teacher') {
        console.log('Checking teacher profile exists...');
        const { data: exists, error: existsError } = await supabase.from('teacher_profiles').select('id').eq('id', userId).maybeSingle();
        console.log('Teacher exists query:', exists, 'Error:', existsError);
        if (!exists) {
          console.log('Inserting teacher profile...');
          const { error: insertError } = await supabase.from('teacher_profiles').insert({ id: userId, full_name: '', school: '', email });
          console.log('Teacher insert error:', insertError);
          if (insertError) {
            alert('Failed to create teacher profile: ' + insertError.message);
            return;
          }
        }
        console.log('Navigating to /teacher');
        navigate('/teacher');
      } else {
        console.log('Checking student profile exists...');
        const { data: exists, error: existsError } = await supabase.from('student_profiles').select('id').eq('id', userId).maybeSingle();
        console.log('Student exists query:', exists, 'Error:', existsError);
        if (!exists) {
          console.log('Inserting student profile with grade:', grade);
          const { error: insertError } = await supabase.from('student_profiles').insert({
            id: userId,
            grade: grade!,
            full_name: '',
            section: '',
            email
          });
          console.log('Student insert error:', insertError);
          if (insertError) {
            alert('Failed to create student profile: ' + insertError.message);
            return;
          }
        }
        console.log('Navigating to /student');
        navigate('/student');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An unexpected error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {mode === 'signup' ? 'Join as a student or teacher to start learning' : 'Sign in to your account'}
            </p>
          </div>
          {info && <div className="mb-6 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-3">{info}</div>}
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => setRole('student')} 
                  className={`rounded-2xl px-6 py-3 font-medium transition-all ${role==='student'?'bg-orange-500 text-white shadow-md':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Student
                </button>
                <button 
                  onClick={() => setRole('teacher')} 
                  className={`rounded-2xl px-6 py-3 font-medium transition-all ${role==='teacher'?'bg-green-500 text-white shadow-md':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Teacher
                </button>
              </div>
              {role === 'student' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Grade</label>
                  <select 
                    value={grade || ''} 
                    onChange={e => setGrade(parseInt(e.target.value) || null)} 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Choose your grade</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
              )}
            </>
          )}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="you@example.com" 
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="••••••••" 
              />
            </div>
          </div>
          <div className="mb-4">
            <button 
              disabled={loading} 
              onClick={mode === 'signup' ? signUp : signIn} 
              className="w-full rounded-xl bg-orange-500 text-white px-6 py-3 font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
          <div className="text-center mb-6">
            <button 
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} 
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
          {mode === 'signup' && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
