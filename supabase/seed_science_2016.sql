-- Seed subjects and lessons for CHSE Odisha Science (2016) - placeholder outline
-- Run this in Supabase SQL editor or via psql against your project.

-- SUBJECTS (grade 11 and 12)
insert into public.subjects (code, name, grade)
values
  ('PHY11', 'Physics', 11),
  ('CHE11', 'Chemistry', 11),
  ('BIO11', 'Biology', 11),
  ('MAT11', 'Mathematics', 11),
  ('ENG11', 'English', 11),
  ('PHY12', 'Physics', 12),
  ('CHE12', 'Chemistry', 12),
  ('BIO12', 'Biology', 12),
  ('MAT12', 'Mathematics', 12),
  ('ENG12', 'English', 12)
ON CONFLICT (code) DO NOTHING;

-- Map codes to IDs
with ids as (
  select code, id from public.subjects where code in ('PHY11','CHE11','BIO11','MAT11','ENG11','PHY12','CHE12','BIO12','MAT12','ENG12')
)
-- LESSONS per subject (placeholder units; replace titles with actual units from PDF)
insert into public.lessons (subject_id, title, order_index, xp_reward, is_published)
select s.id, t.title, t.ord, 10, true
from ids s
join (
  values
    ('PHY11', 1, 'Units and Measurements'),
    ('PHY11', 2, 'Kinematics'),
    ('PHY11', 3, 'Laws of Motion'),
    ('PHY11', 4, 'Work, Energy and Power'),
    ('PHY11', 5, 'Rotational Motion'),
    ('CHE11', 1, 'Some Basic Concepts of Chemistry'),
    ('CHE11', 2, 'Atomic Structure'),
    ('CHE11', 3, 'Chemical Bonding and Molecular Structure'),
    ('BIO11', 1, 'The Living World'),
    ('BIO11', 2, 'Biological Classification'),
    ('BIO11', 3, 'Plant Kingdom'),
    ('MAT11', 1, 'Sets and Relations'),
    ('MAT11', 2, 'Trigonometric Functions'),
    ('ENG11', 1, 'Reading Comprehension'),
    ('PHY12', 1, 'Electrostatics'),
    ('PHY12', 2, 'Current Electricity'),
    ('PHY12', 3, 'Magnetic Effects of Current and Magnetism'),
    ('CHE12', 1, 'Solid State'),
    ('CHE12', 2, 'Solutions'),
    ('CHE12', 3, 'Electrochemistry'),
    ('BIO12', 1, 'Reproduction in Organisms'),
    ('BIO12', 2, 'Genetics and Evolution'),
    ('BIO12', 3, 'Biology and Human Welfare'),
    ('MAT12', 1, 'Relations and Functions'),
    ('MAT12', 2, 'Algebra (Matrices & Determinants)'),
    ('ENG12', 1, 'Reading Comprehension (Advanced)')
) as t(code, ord, title) on t.code = s.code
ON CONFLICT DO NOTHING;

-- SAMPLE QUESTIONS for first Physics-11 lesson
with l as (
  select l.id from public.lessons l
  join public.subjects s on s.id = l.subject_id
  where s.code = 'PHY11' and l.order_index = 1
  limit 1
)
insert into public.questions (lesson_id, prompt, explanation)
select l.id, 'SI base unit of electric current is?', 'Ampere is the SI base unit for electric current.' from l
ON CONFLICT DO NOTHING;

with q as (
  select q.id from public.questions q
  join public.lessons l on l.id = q.lesson_id
  join public.subjects s on s.id = l.subject_id
  where s.code = 'PHY11' and l.order_index = 1
  limit 1
)
insert into public.options (question_id, label, is_correct)
select q.id, x.label, x.is_correct from q
join (
  values
    ('Coulomb', false),
    ('Ampere', true),
    ('Volt', false),
    ('Ohm', false)
) as x(label, is_correct) on true
ON CONFLICT DO NOTHING;

-- You can add more questions/options following the pattern above for each lesson.
