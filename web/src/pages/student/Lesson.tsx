import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.ts';

type Question = {
  id: string;
  lesson_id: string;
  prompt: string;
  explanation: string | null;
};

type Option = {
  id: string;
  question_id: string;
  label: string;
  is_correct: boolean;
};

export function Lesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [xpReward, setXpReward] = useState<number>(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<Record<string, Option[]>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setLoading] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!lessonId) return;
      setIsLoading(true);
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id,title,subject_id,order_index,xp_reward')
        .eq('id', lessonId)
        .maybeSingle();
      
      if (!lesson) {
         setIsLoading(false);
         return;
      }
      
      setTitle(lesson.title);
      setSubjectId(lesson.subject_id);
      setOrderIndex(lesson.order_index);
      setXpReward(lesson.xp_reward);

      const { data: qs } = await supabase
        .from('questions')
        .select('id,lesson_id,prompt,explanation')
        .eq('lesson_id', lessonId);
      const qList = qs || [];
      setQuestions(qList as Question[]);

      if (qList.length > 0) {
        const qIds = qList.map(q => q.id);
        const { data: opts } = await supabase
          .from('options')
          .select('id,question_id,label,is_correct')
          .in('question_id', qIds);
        
        const map: Record<string, Option[]> = {};
        (opts || []).forEach((o: any) => {
          if (!map[o.question_id]) map[o.question_id] = [];
          map[o.question_id].push({ 
            id: o.id, 
            question_id: o.question_id,
            label: o.label, 
            is_correct: o.is_correct 
          } as Option);
        });
        setOptionsByQ(map);
      }
      setIsLoading(false);
    };
    load();
  }, [lessonId]);

  const totalQuestions: number = questions.length;
  
  const numCorrect: number = useMemo(() => {
    return questions.reduce((sum, q) => {
      const chosen = answers[q.id];
      const options = optionsByQ[q.id] || [];
      const correctOptionId = options.find(o => o.is_correct)?.id;
      return sum + (chosen && chosen === correctOptionId ? 1 : 0);
    }, 0);
  }, [answers, optionsByQ, questions]);
  
  const isAllAnswered: boolean = Object.keys(answers).length === totalQuestions;
  const scorePercent: number = useMemo(() => totalQuestions === 0 ? 0 : Math.round((numCorrect / totalQuestions) * 100), [numCorrect, totalQuestions]);


  const submit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        navigate('/auth');
        return;
    }
    
    // 1. Calculate Score
    const percent = scorePercent;
    setScore(percent);

    // 2. Upsert student progress as completed and update best score
    await supabase.from('student_progress').upsert({
      student_id: user.id,
      lesson_id: lessonId,
      status: 'completed',
      best_score: percent,
      last_attempt_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' });

    // 3. Award XP
    const awardedXp = Math.round((percent / 100) * xpReward);
    await supabase.from('xp_ledger').insert({
      student_id: user.id,
      amount: awardedXp,
      reason: `Lesson: ${title} (${percent}%)`
    });

    // 4. Mark daily activity
    const today = new Date().toISOString().slice(0,10);
    await supabase.from('daily_activity').upsert({ student_id: user.id, activity_date: today }, { onConflict: 'student_id,activity_date' });

    // 5. Unlock next lesson in subject
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
          status: 'unlocked', // Unlock the next lesson
          best_score: 0,
        }, { onConflict: 'student_id,lesson_id' });
      }
    }

    setDone(true);
    setLoading(false);
  };

  const restart = () => {
    setAnswers({});
    setDone(false);
  };

  if (!lessonId || isLoading) return <main className="max-w-3xl mx-auto px-4 py-6 text-center text-xl font-medium">Loading Lesson...</main>;
  if (totalQuestions === 0) return <main className="max-w-3xl mx-auto px-4 py-6 text-center text-xl font-medium">No questions found for this lesson.</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600">← Back to Dashboard</button>
      </div>
      <h1 className="text-3xl font-extrabold text-orange-600 mb-6">{title}</h1>
      {!done ? (
        <div className="space-y-8">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border p-5 shadow-lg bg-white">
              <div className="font-bold text-lg mb-4 text-gray-800">{i+1}. {q.prompt}</div>
              <div className="grid gap-3">
                {(optionsByQ[q.id]||[]).map(o => (
                  <label key={o.id} className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${answers[q.id]===o.id? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500':'hover:bg-gray-50'}`}>
                    <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        className="mr-3 accent-orange-500 transform scale-125" 
                        checked={answers[q.id]===o.id} 
                        onChange={()=>setAnswers(prev=>({...prev, [q.id]: o.id}))} 
                    />
                    <span className="text-gray-700">{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="sticky bottom-0 bg-white p-4 shadow-[0_-1px_10px_rgba(0,0,0,0.1)] rounded-t-lg border-t flex items-center justify-between">
            <div className={`text-base font-semibold ${isAllAnswered ? 'text-green-600' : 'text-gray-600'}`}>
                {isAllAnswered ? 'All answered!' : `Progress: ${Object.keys(answers).length} / ${totalQuestions}`}
            </div>
            <button 
                disabled={submitting || !isAllAnswered} 
                onClick={submit} 
                className="rounded-full bg-green-500 text-white px-8 py-3 text-lg font-bold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                {submitting ? 'Submitting...' : 'CHECK ANSWERS'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: scorePercent >= 70 ? '#D1FAE5' : '#FEE2E2', borderColor: scorePercent >= 70 ? '#34D399' : '#F87171' }}>
            <div className="text-6xl font-extrabold mb-2" style={{ color: scorePercent >= 70 ? '#059669' : '#DC2626' }}>{score}%</div>
            <p className="text-xl font-semibold mb-4 text-gray-800">
                {scorePercent >= 70 ? 'Fantastic work! You mastered this lesson.' : 'Keep practicing! Review the explanations below.'}
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={restart} className="rounded-full bg-white border border-gray-300 text-gray-700 px-6 py-3 font-semibold hover:bg-gray-50">Retry Lesson</button>
              <button onClick={()=>navigate('/student')} className="rounded-full bg-orange-600 text-white px-6 py-3 font-semibold hover:bg-orange-700">Continue Journey</button>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold border-b pb-2 text-gray-800">Review ({numCorrect}/{totalQuestions} Correct)</h2>
          {questions.map((q, i) => {
            const options = optionsByQ[q.id] || [];
            const chosenOptionId = answers[q.id];
            const correctOption = options.find(o => o.is_correct);
            const isCorrect = chosenOptionId === correctOption?.id;

            return (
              <div key={q.id} className={`rounded-2xl border p-5 shadow-lg ${isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="font-bold text-lg mb-3 flex items-center">
                    {isCorrect ? <span className="text-green-600 mr-2">✔</span> : <span className="text-red-600 mr-2">✖</span>}
                    {i+1}. {q.prompt}
                </div>
                <div className="space-y-2 text-gray-800">
                    {options.map(o => (
                        <div 
                            key={o.id} 
                            className={`p-3 rounded-lg text-sm 
                                ${o.is_correct ? 'bg-green-200 font-bold' : 
                                  (o.id === chosenOptionId ? 'bg-red-200 font-bold' : 'bg-white border')
                                }`}
                        >
                            {o.label} 
                            {o.is_correct ? ' (Correct Answer)' : (o.id === chosenOptionId ? ' (Your Answer)' : '')}
                        </div>
                    ))}
                </div>
                {q.explanation && (
                    <div className="mt-4 p-3 bg-white border-l-4 border-orange-500 rounded-r-lg text-sm text-gray-700">
                        <span className="font-bold text-orange-600">Tip:</span> {q.explanation}
                    </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}