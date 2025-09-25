import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.ts';

type Question = {
  id: string;
  prompt: string;
  explanation: string | null;
};

type Option = {
  id: string;
  label: string;
  is_correct: boolean;
};

export function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [xpReward, setXpReward] = useState<number>(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<Record<string, Option[]>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!lessonId) return;
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id,title,subject_id,order_index,xp_reward')
        .eq('id', lessonId)
        .maybeSingle();
      if (!lesson) return;
      setTitle(lesson.title);
      setSubjectId(lesson.subject_id);
      setOrderIndex(lesson.order_index);
      setXpReward(lesson.xp_reward);

      const { data: qs } = await supabase
        .from('questions')
        .select('id,prompt,explanation')
        .eq('lesson_id', lessonId);
      const qList = qs || [];
      setQuestions(qList);
      if (qList.length > 0) {
        const qIds = qList.map(q => q.id);
        const { data: opts } = await supabase
          .from('options')
          .select('id,question_id,label,is_correct')
          .in('question_id', qIds);
        const map: Record<string, Option[]> = {};
        (opts || []).forEach((o: any) => {
          if (!map[o.question_id]) map[o.question_id] = [];
          map[o.question_id].push({ id: o.id, label: o.label, is_correct: o.is_correct });
        });
        setOptionsByQ(map);
      }
    };
    load();
  }, [lessonId]);

  const numCorrect = useMemo(() => {
    return questions.reduce((sum, q) => {
      const chosen = answers[q.id];
      const options = optionsByQ[q.id] || [];
      const correct = options.find(o => o.is_correct)?.id;
      return sum + (chosen && chosen === correct ? 1 : 0);
    }, 0);
  }, [answers, optionsByQ, questions]);

  const submit = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const total = questions.length;
    const correct = numCorrect;
    const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
    setScore(percent);

    // Upsert student progress as completed and update best score
    await supabase.from('student_progress').upsert({
      student_id: user.id,
      lesson_id: lessonId,
      status: 'completed',
      best_score: percent,
      last_attempt_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' });

    // Award XP
    await supabase.from('xp_ledger').insert({
      student_id: user.id,
      amount: Math.round((percent / 100) * xpReward),
      reason: `Lesson ${title} completed`
    });

    // Mark daily activity
    const today = new Date().toISOString().slice(0,10);
    await supabase.from('daily_activity').upsert({ student_id: user.id, activity_date: today }, { onConflict: 'student_id,activity_date' });

    // Unlock next lesson in subject
    if (subjectId) {
      const { data: next } = await supabase
        .from('lessons')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('order_index', orderIndex + 1)
        .maybeSingle();
      if (next?.id) {
        await supabase.from('student_progress').upsert({
          student_id: user.id,
          lesson_id: next.id,
          status: 'unlocked',
        }, { onConflict: 'student_id,lesson_id' });
      }
    }

    setDone(true);
    setSubmitting(false);
  };

  const restart = () => {
    setAnswers({});
    setDone(false);
  };

  if (!lessonId) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600">← Back</button>
      </div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      {!done ? (
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border p-4">
              <div className="font-medium mb-2">{i+1}. {q.prompt}</div>
              <div className="grid gap-2">
                {(optionsByQ[q.id]||[]).map(o => (
                  <label key={o.id} className={`border rounded-xl p-3 cursor-pointer ${answers[q.id]===o.id? 'border-orange-500 bg-orange-50':'hover:bg-gray-50'}`}>
                    <input type="radio" name={`q-${q.id}`} className="mr-2" checked={answers[q.id]===o.id} onChange={()=>setAnswers(prev=>({...prev, [q.id]: o.id}))} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Correct: {numCorrect}/{questions.length}</div>
            <button disabled={submitting} onClick={submit} className="rounded-full bg-orange-500 text-white px-6 py-2">{submitting? 'Submitting...':'Submit lesson'}</button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border p-6 text-center">
          <div className="text-5xl font-extrabold text-orange-600 mb-2">{score}%</div>
          <p className="mb-4">Great job! XP awarded based on your score.</p>
          <div className="flex justify-center gap-3">
            <button onClick={restart} className="rounded-full bg-gray-100 px-4 py-2">Retry</button>
            <button onClick={()=>navigate('/student')} className="rounded-full bg-green-500 text-white px-4 py-2">Back to dashboard</button>
          </div>
        </div>
      )}
    </main>
  );
}


