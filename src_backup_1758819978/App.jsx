import { useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import Header from './components/Header.jsx';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const { data: student } = await supabase.from('student_profiles').select('id, grade').eq('id', userId).single();
      if (student) { navigate('/student'); return; }
      const { data: teacher } = await supabase.from('teacher_profiles').select('id').eq('id', userId).single();
      if (teacher) { navigate('/teacher'); }
    };
    init();
  }, [navigate]);

  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
