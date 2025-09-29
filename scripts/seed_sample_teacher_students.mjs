import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data - assume some test users exist in Supabase auth
// Replace with actual user IDs from your Supabase dashboard or create test users first
const sampleTeachers = ['teacher-uuid-1']; // e.g., '00000000-0000-0000-0000-000000000001'
const sampleStudents = ['student-uuid-1', 'student-uuid-2']; // e.g., '00000000-0000-0000-0000-000000000002', etc.

async function seed() {
  console.log('Seeding sample teacher-students...');

  for (const teacherId of sampleTeachers) {
    for (const studentId of sampleStudents) {
      const { error } = await supabase.from('teacher_students').insert({
        teacher_id: teacherId,
        student_id: studentId
      });
      if (error) {
        console.error(`Error inserting teacher-student link: ${teacherId} - ${studentId}`, error);
      } else {
        console.log(`Added student ${studentId} to teacher ${teacherId}`);
      }
    }
  }

  console.log('Seeding complete. Check your Supabase dashboard for teacher_students table.');
}

seed().catch(console.error);
