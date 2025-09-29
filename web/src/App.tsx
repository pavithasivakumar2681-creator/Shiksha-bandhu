import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
type SessionLike = { user?: { id: string } } | null;
import { supabase, envOk } from './lib/supabaseClient.ts';

import { Header } from './components/Header.tsx';
import { Landing } from './pages/Landing.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard.tsx';
import { Lesson } from './pages/student/Lesson.tsx';
import { Leaderboard } from './pages/Leaderboard.tsx';
import { Quests } from './pages/Quests.tsx';
// === CRITICAL NEW IMPORT ===
import { SubjectView } from './pages/student/SubjectView.tsx'; 

function App() {
  const [session, setSession] = useState<SessionLike>(null);
  const [profileRole, setProfileRole] = useState<'student' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        console.log('App load starting...');
        const { data: { session: s } } = await supabase.auth.getSession();
        console.log('Session:', s ? 'exists' : 'null');
        setSession(s);
        if (s?.user) {
          const userId = s.user.id;
          console.log('User ID:', userId);
          const [{ data: teacher, error: teacherError }, { data: student, error: studentError }] = await Promise.all([
            supabase.from('teacher_profiles').select('id').eq('id', userId).maybeSingle(),
            supabase.from('student_profiles').select('id, grade').eq('id', userId).maybeSingle(),
          ]);
          console.log('Teacher profile query:', teacher, 'Error:', teacherError);
          console.log('Student profile query:', student, 'Error:', studentError);
          if (teacher) {
            console.log('Profile role set to teacher');
            setProfileRole('teacher');
          } else if (student) {
            console.log('Profile role set to student');
            setProfileRole('student');
          } else {
            console.log('No profile found, role null');
            setProfileRole(null);
            // Cannot use navigate here because not inside Router context
            // Consider setting a flag to redirect after render
          }
        } else {
          console.log('No user in session');
        }
      } catch (e) {
        console.error('App init error:', e);
      } finally {
        setIsLoading(false);
        console.log('App load complete');
      }
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('Auth state change:', _event, newSession ? 'session exists' : 'no session');
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

  if (isLoading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <BrowserRouter>
      <Header session={session} profileRole={profileRole} />
      <Routes>
        {profileRole === null && session && (
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        )}
        <Route path="/" element={!session ? <Landing /> : (profileRole === 'student' ? <Navigate to="/student" replace /> : (profileRole === 'teacher' ? <Navigate to="/teacher" replace /> : <Navigate to="/auth" replace />))} />
        <Route path="/auth" element={!session ? <AuthPage /> : (profileRole === 'student' ? <Navigate to="/student" replace /> : (profileRole === 'teacher' ? <Navigate to="/teacher" replace /> : <Navigate to="/auth" replace />))} />
        <Route path="/student" element={session ? <StudentDashboard /> : <Navigate to="/auth" replace />} />
        
        {/* === VERIFIED NEW ROUTE === */}
        <Route path="/subject/:subjectId" element={session ? <SubjectView /> : <Navigate to="/auth" replace />} />
        
        <Route path="/teacher" element={session && profileRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/lesson/:lessonId" element={session && profileRole === 'student' ? <Lesson /> : <Navigate to="/auth" replace />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/quests" element={session ? <Quests /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; App;
