import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const dataPath = path.resolve(process.cwd(), 'supabase', 'question_bank_science_2016.json');
if (!fs.existsSync(dataPath)) {
  console.error('Question bank JSON not found at', dataPath);
  process.exit(1);
}

const qb = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function upsertQuestions() {
  // qb structure: { [subjectCode]: { [orderIndex]: { title, questions: [ { prompt, options: [ { label, correct } ] } ] } } }
  for (const subjectCode of Object.keys(qb)) {
    const subjectRes = await supabase.from('subjects').select('id, code').eq('code', subjectCode).maybeSingle();
    if (subjectRes.error || !subjectRes.data) {
      console.warn('Subject not found for code', subjectCode, subjectRes.error?.message);
      continue;
    }
    const subjectId = subjectRes.data.id;
    const units = qb[subjectCode];
    for (const ord of Object.keys(units)) {
      const unit = units[ord];
      const ordNum = Number(ord);
      // ensure lesson exists
      const lessonRes = await supabase
        .from('lessons')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('order_index', ordNum)
        .maybeSingle();
      let lessonId = lessonRes.data?.id;
      if (!lessonId) {
        const ins = await supabase.from('lessons').insert({ subject_id: subjectId, title: unit.title, order_index: ordNum, xp_reward: 10, is_published: true }).select('id').single();
        if (ins.error) {
          console.error('Failed to create lesson', subjectCode, ord, ins.error.message);
          continue;
        }
        lessonId = ins.data.id;
      }
      // insert questions
      for (const q of unit.questions) {
        const qIns = await supabase.from('questions').insert({ lesson_id: lessonId, prompt: q.prompt, explanation: q.explanation || null }).select('id').single();
        if (qIns.error) {
          console.error('Failed to insert question', q.prompt, qIns.error.message);
          continue;
        }
        const qId = qIns.data.id;
        const rows = q.options.map(o => ({ question_id: qId, label: o.label, is_correct: Boolean(o.correct) }));
        const oIns = await supabase.from('options').insert(rows);
        if (oIns.error) {
          console.error('Failed to insert options', q.prompt, oIns.error.message);
        }
      }
    }
  }
}

upsertQuestions().then(() => {
  console.log('Question bank seeding complete');
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
