import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import LessonPath from '../../components/LessonPath';

type Subject = { id: string; name: string; code: string; description: string };
type Lesson = { id: string; subject_id: string; title: string; order_index: number; xp_reward: number };
type Progress = { lesson_id: string; status: 'locked'|'unlocked'|'completed'; best_score: number | null };

export function SubjectView() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressByLesson, setProgressByLesson] = useState<Record<string, Progress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!subjectId) {
        navigate('/student');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const [
        { data: subj },
        { data: allLessons },
        { data: prog }
      ] = await Promise.all([
        // Fetch Subject details (using a placeholder description field for UI)
        supabase.from('subjects').select('id, name, code').eq('id', subjectId).maybeSingle(),
        // Fetch Lessons for this subject
        supabase.from('lessons').select('id, subject_id, title, order_index, xp_reward').eq('subject_id', subjectId).order('order_index'),
        // Fetch User Progress for this subject's lessons
        supabase.from('student_progress').select('lesson_id, status, best_score').eq('student_id', user.id)
      ]);

      if (!subj) {
        navigate('/student');
        return;
      }
      
      // Manually add description placeholder for now
      const subjectData: Subject = { 
          id: subj.id, 
          name: subj.name, 
          code: subj.code, 
          description: `Mastering Grade ${user.user_metadata.grade} ${subj.name} concepts.` 
      };
      setSubject(subjectData);

      // Filter progress to only include lessons relevant to this subject
      const lessonIds = (allLessons || []).map(l => l.id);
      const relevantProgress: Record<string, Progress> = {};
      (prog || []).filter(p => lessonIds.includes(p.lesson_id)).forEach((p: any) => { 
        relevantProgress[p.lesson_id] = p as Progress; 
      });

      setLessons(allLessons || []);
      setProgressByLesson(relevantProgress);
      setIsLoading(false);
    };
    loadData();
  }, [subjectId, navigate]);

  if (isLoading) return <main className="max-w-6xl mx-auto px-4 py-10 text-center text-xl font-medium">Loading Subject Path...</main>;
  if (!subject) return <main className="max-w-6xl mx-auto px-4 py-10 text-center text-xl font-medium">Subject not found.</main>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/student')} className="text-lg font-semibold text-gray-600 mb-6 flex items-center hover:text-orange-600">
        ← Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">{subject.name}</h1>
        <p className="text-xl text-gray-500">{subject.description}</p>
      </div>

      <div className="flex justify-center">
        {lessons.length > 0 ? (
          <LessonPath
            subjectName={subject.name}
            lessons={lessons}
            progressByLesson={progressByLesson}
          />
        ) : (
          <p className="text-center text-gray-500">No lessons found for this subject.</p>
        )}
      </div>
    </main>
  );
}