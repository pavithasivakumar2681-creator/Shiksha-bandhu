import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
type SessionLike = { user?: { id: string } } | null;
import { supabase, envOk } from './lib/supabaseClient.ts';

import { Header } from './components/Header.tsx';
import { Landing } from './pages/Landing.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { StudentOnboarding } from './pages/StudentOnboarding.tsx';
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard.tsx';
import { Lesson } from './pages/student/Lesson.tsx';
import { Leaderboard } from './pages/Leaderboard.tsx';
import { Quests } from './pages/Quests.tsx';

function App() {
  const [session, setSession] = useState<SessionLike>(null);
  const [profileRole, setProfileRole] = useState<'student' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s?.user) {
          const userId = s.user.id;
          const [{ data: student }, { data: teacher }] = await Promise.all([
            supabase.from('student_profiles').select('id, grade').eq('id', userId).maybeSingle(),
            supabase.from('teacher_profiles').select('id').eq('id', userId).maybeSingle(),
          ]);
          if (student) setProfileRole('student');
          else if (teacher) setProfileRole('teacher');
          else setProfileRole(null);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Init error', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession as unknown as SessionLike);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!envOk) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Config required</h1>
        <p>Add your Supabase credentials in <code>.env.local</code> based on <code>env.example</code>.</p>
        <pre>VITE_SUPABASE_URL=...{'\n'}VITE_SUPABASE_ANON_KEY=...</pre>
      </div>
    );
  }

  const DebugBar = (
    <div style={{ position: 'fixed', bottom: 8, right: 8, background: '#111827', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, opacity: 0.7 }}>
      env:{String(envOk)} load:{String(isLoading)} ses:{String(Boolean(session))} role:{profileRole||'-'}
    </div>
  );

  if (isLoading) return <div style={{ padding: 24 }}>Loading…{DebugBar}</div>;

  return (
    <BrowserRouter>
      <Header session={session} profileRole={profileRole} />
      {DebugBar}
      <Routes>
        <Route path="/" element={!session ? <Landing /> : (profileRole === 'student' ? <Navigate to="/student" replace /> : (profileRole === 'teacher' ? <Navigate to="/teacher" replace /> : <Navigate to="/onboarding" replace />))} />
        <Route path="/auth" element={!session ? <AuthPage /> : (profileRole === 'student' ? <Navigate to="/student" replace /> : (profileRole === 'teacher' ? <Navigate to="/teacher" replace /> : <Navigate to="/onboarding" replace />))} />
        <Route path="/onboarding" element={session ? <StudentOnboarding /> : <Navigate to="/auth" replace />} />
        <Route path="/student" element={session ? <StudentDashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/teacher" element={session && profileRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/lesson/:lessonId" element={session && profileRole === 'student' ? <Lesson /> : <Navigate to="/auth" replace />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/quests" element={session ? <Quests /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
