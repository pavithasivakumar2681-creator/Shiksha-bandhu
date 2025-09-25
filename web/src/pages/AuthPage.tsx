import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true); // Controls Sign In (true) vs Sign Up (false) view
  const navigate = useNavigate();

  // Existing logic to handle session and redirection
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      
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

  // Combined Auth Handler function
  const handleAuth = async () => {
    setLoading(true);
    setInfo(null); 
    
    if (!email || !password) {
      setInfo('Please enter both email and password.');
      setLoading(false);
      return;
    }
    
    if (!isLogin) {
      // --- SIGN UP LOGIC ---
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        const errorMessage = error.message?.toLowerCase().includes('anonymous') 
          ? 'Supabase: Anonymous sign-ins are disabled. Enable Email provider in Auth settings and try again.'
          : error.message;
        setInfo(errorMessage);
      } else if (!data.session) {
        // Email confirmation case
        localStorage.setItem('sb_pending_role', role);
        setInfo('Check your email to confirm your account, then return here to finish setup.');
      } else {
        // Direct sign-up (no confirmation needed)
        const userId = data.user.id;
        if (role === 'teacher') {
            await supabase.from('teacher_profiles').upsert({ id: userId, full_name: '', school: '' });
            navigate('/teacher');
        } else {
            navigate('/onboarding');
        }
      }
    } else {
      // --- SIGN IN LOGIC ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setInfo(error.message); 
      } else {
        navigate('/');
      }
    }
    setLoading(false);
  };
  
  // Helper function to switch between views and clear state
  const toggleView = () => {
    setIsLogin(prev => !prev);
    setInfo(null);
    setEmail('');
    setPassword('');
  };

  return (
    <main className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100">
        
        {/* Title Block - Matching Screenshot 1.03.32 AM */}
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        <p className="text-gray-500 mb-6 text-center text-sm">Continue your learning journey with Shiksha Bandhu</p>
        
        {/* Info/Error Banner */}
        {info && (
            <div className={`mb-4 text-sm rounded-lg p-3 ${info.includes('Check your email') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'} border`}>
                {info}
            </div>
        )}
        
        {/* Role Toggle (Only visible during Sign Up) */}
        {!isLogin && (
            <div className="flex justify-center gap-4 mb-6">
                <label className={`text-sm font-semibold cursor-pointer p-2 rounded-full transition-all ${role === 'student' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="hidden" />
                    I am a Student
                </label>
                <label className={`text-sm font-semibold cursor-pointer p-2 rounded-full transition-all ${role === 'teacher' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} className="hidden" />
                    I am a Teacher
                </label>
            </div>
        )}

        {/* Input Fields */}
        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
        <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-orange-500 focus:border-orange-500 transition-colors" 
            placeholder="Enter your email" 
        />
        
        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
        <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6 focus:ring-orange-500 focus:border-orange-500 transition-colors" 
            placeholder="Enter your password" 
        />
        
        {/* Main Action Button */}
        <button 
            disabled={loading} 
            onClick={handleAuth} 
            className="w-full rounded-full bg-orange-500 text-white font-bold px-6 py-3 text-lg shadow-lg hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
        >
            {loading ? (isLogin ? 'Signing In...' : 'Signing Up...') : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"} 
          <a onClick={toggleView} className="text-orange-600 font-bold cursor-pointer hover:underline ml-1">
            {isLogin ? 'Sign up here' : 'Sign in here'}
          </a>
        </p>
      </div>
    </main>
  );
}