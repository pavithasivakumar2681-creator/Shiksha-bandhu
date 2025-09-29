import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient.ts';
import { PiCheckCircle, PiXCircle } from 'react-icons/pi';

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

type QuestionState = 'unanswered' | 'correct' | 'incorrect';

export function Lesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [xpReward, setXpReward] = useState<number>(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<Record<string, Option[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [totalXpEarned, setTotalXpEarned] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect', explanation: string } | null>(null);
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

        // Initialize states
        const initialStates = Object.fromEntries(
          qList.map(q => [q.id, 'unanswered' as const])
        ) as Record<string, QuestionState>;
        setQuestionStates(initialStates);
      }
      setIsLoading(false);
    };
    load();
  }, [lessonId]);

  const totalQuestions: number = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const xpPerQuestion = Math.floor(xpReward / totalQuestions);
  const numCorrect: number = useMemo(() => {
    return questions.reduce((sum, q) => {
      const state = questionStates[q.id];
      return sum + (state === 'correct' ? 1 : 0);
    }, 0);
  }, [questionStates, questions]);
  const scorePercent: number = useMemo(() => totalQuestions === 0 ? 0 : Math.round((numCorrect / totalQuestions) * 100), [numCorrect, totalQuestions]);
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = async (optionId: string) => {
    if (questionStates[currentQuestion.id] !== 'unanswered') return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      navigate('/auth');
      return;
    }

    const options = optionsByQ[currentQuestion.id] || [];
    const selectedOption = options.find(o => o.id === optionId);
    const isCorrect = selectedOption?.is_correct || false;
    const newStates = { ...questionStates, [currentQuestion.id]: isCorrect ? 'correct' : 'incorrect' } as Record<string, QuestionState>;
    setQuestionStates(newStates);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));

    if (isCorrect) {
      const xpEarned = xpPerQuestion;
      setTotalXpEarned(prev => prev + xpEarned);
      await supabase.from('xp_ledger').insert({
        student_id: user.id,
        amount: xpEarned,
        reason: `Question ${currentQuestionIndex + 1} in ${title}`
      });
    }

    setFeedback({
      type: isCorrect ? 'correct' : 'incorrect',
      explanation: currentQuestion.explanation || ''
    });

    // Mark daily activity if first question
    if (currentQuestionIndex === 0) {
      const today = new Date().toISOString().slice(0,10);
      await supabase.from('daily_activity').upsert({ student_id: user.id, activity_date: today }, { onConflict: 'student_id,activity_date' });
    }

    setSubmitting(false);

    // Auto-advance after feedback
    setTimeout(async () => {
      setFeedback(null);
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Final score
        const percent = scorePercent;
        setScore(percent);
        // Upsert progress
        await supabase.from('student_progress').upsert({
          student_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          best_score: percent,
          last_attempt_at: new Date().toISOString(),
        }, { onConflict: 'student_id,lesson_id' });
        setDone(true);
      }
    }, 2500);
  };

  const restartLesson = () => {
    setAnswers({});
    const initialStates = Object.fromEntries(
      questions.map(q => [q.id, 'unanswered' as const])
    ) as Record<string, QuestionState>;
    setQuestionStates(initialStates);
    setTotalXpEarned(0);
    setCurrentQuestionIndex(0);
    setDone(false);
    setFeedback(null);
    setScore(0);
  };

  if (!lessonId || isLoading) return <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-xl font-medium text-gray-600">Loading Lesson...</p>
    </div>
  </main>;
  if (totalQuestions === 0) return <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center">
    <div className="text-center">
      <p className="text-xl font-medium text-gray-600">No questions found for this lesson.</p>
      <button onClick={() => navigate('/student')} className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold">Back to Dashboard</button>
    </div>
  </main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button onClick={() => navigate('/student')} className="flex items-center text-gray-600 hover:text-orange-600 font-medium transition-colors">
            <span className="mr-2">←</span> Back to Dashboard
          </button>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">{title}</h1>
        <p className="text-gray-600 text-center mb-8">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">{numCorrect} correct so far</p>
        </div>

        {!done ? (
          <div className="space-y-6">
            {/* Current Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                    {currentQuestionIndex + 1}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 flex-1">{currentQuestion.prompt}</h2>
                </div>

                <div className="grid gap-4">
                  {optionsByQ[currentQuestion.id]?.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.id;
                    const isCorrectOption = option.is_correct;
                    const state = questionStates[currentQuestion.id];
                    let buttonClass = 'relative rounded-2xl p-6 text-left font-semibold transition-all duration-300 cursor-pointer shadow-lg border-2 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]';
                    let textClass = 'text-gray-800';
                    let icon = null;

                    if (state === 'correct' && isCorrectOption) {
                      buttonClass += ' bg-green-50 border-green-300';
                      textClass = 'text-green-800';
                      icon = <PiCheckCircle className="absolute top-4 right-4 text-green-500 text-2xl" />;
                    } else if (state === 'incorrect' && isSelected) {
                      buttonClass += ' bg-red-50 border-red-300';
                      textClass = 'text-red-800';
                      icon = <PiXCircle className="absolute top-4 right-4 text-red-500 text-2xl" />;
                    } else if (isSelected && state === 'unanswered') {
                      buttonClass += ' bg-orange-50 border-orange-300';
                      textClass = 'text-orange-800';
                    } else {
                      buttonClass += ' bg-white border-gray-200 hover:border-orange-300';
                    }

                    return (
                      <motion.button
                        key={option.id}
                        className={buttonClass}
                        onClick={() => handleOptionSelect(option.id)}
                        disabled={state !== 'unanswered' || submitting}
                        whileHover={state === 'unanswered' ? { scale: 1.02 } : {}}
                        whileTap={state === 'unanswered' ? { scale: 0.98 } : {}}
                      >
                        {icon}
                        <span className={textClass}>{option.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {feedback && (
                  <motion.div
                    className={`mt-6 p-4 rounded-2xl ${feedback.type === 'correct' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`flex items-center ${feedback.type === 'correct' ? 'text-green-800' : 'text-red-800'}`}>
                      <span className={`mr-2 text-2xl ${feedback.type === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                        {feedback.type === 'correct' ? '🎉' : '💔'}
                      </span>
                      <span className="font-semibold">
                        {feedback.type === 'correct' ? `Correct! +${xpPerQuestion} XP` : 'Incorrect. Keep trying!'}
                      </span>
                    </div>
                    {feedback.explanation && (
                      <p className={`mt-2 text-sm ${feedback.type === 'correct' ? 'text-green-700' : 'text-red-700'} italic`}>
                        {feedback.explanation}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* XP Earned So Far */}
            {totalXpEarned > 0 && (
              <motion.div
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <p className="text-yellow-800 font-bold">Total XP Earned: {totalXpEarned} ⭐</p>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`rounded-3xl p-8 shadow-2xl border-4 ${score >= 70 ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'}`}>
              <motion.div
                className={`text-6xl font-extrabold mb-4 ${score >= 70 ? 'text-green-600' : 'text-orange-600'}`}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {score}%
              </motion.div>
              <p className={`text-2xl font-bold ${score >= 70 ? 'text-green-800' : 'text-orange-800'}`}>
                {score >= 70 ? 'Excellent! Lesson Mastered!' : 'Good effort! Practice makes perfect.'}
              </p>
              <p className="text-lg text-gray-600 mt-2">Total XP: {totalXpEarned}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={restartLesson}
                className="px-8 py-4 bg-gray-500 text-white rounded-2xl font-bold shadow-lg hover:bg-gray-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Retry Lesson
              </motion.button>
              <motion.button
                onClick={() => navigate('/student')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl font-bold shadow-lg hover:from-orange-600 hover:to-yellow-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 Next Lesson
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
