-- Seed subjects and lessons for CHSE Odisha Science (2016) - full Grade 11 and Grade 12 syllabus
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
-- LESSONS (Grade 11 - Ist Year Science)
insert into public.lessons (subject_id, title, order_index, xp_reward, is_published)
select s.id, t.title, t.ord, 10, true
from ids s
join (
  values
    -- PHYSICS (PHY11)
    ('PHY11', 1, 'Physical World and Measurement'),
    ('PHY11', 2, 'Kinematics'),
    ('PHY11', 3, 'Laws of Motion'),
    ('PHY11', 4, 'Work, Energy and Power'),
    ('PHY11', 5, 'Rotational Motion'),
    ('PHY11', 6, 'Gravitation'),
    -- CHEMISTRY (CHE11)
    ('CHE11', 1, 'Some Basic Concepts of Chemistry'),
    ('CHE11', 2, 'Structure of Atom'),
    ('CHE11', 3, 'Classification & Periodicity'),
    ('CHE11', 4, 'Chemical Bonding and Molecular Structure'),
    ('CHE11', 5, 'States of Matter: Gases and Liquids'),
    -- BIOLOGY (BIO11) - Units I, II, III, IV, V combined
    ('BIO11', 1, 'Diversity in Living World & Classification'),
    ('BIO11', 2, 'Structural Organization: Tissues & Cockroach'),
    ('BIO11', 3, 'Cell Structure, Biomolecules, & Division'),
    ('BIO11', 4, 'Plant Physiology: Transport & Nutrition'),
    ('BIO11', 5, 'Human Physiology: Digestion & Circulation'),
    -- MATHEMATICS (MAT11)
    ('MAT11', 1, 'Sets and Functions'),
    ('MAT11', 2, 'Trigonometric Functions'),
    ('MAT11', 3, 'Mathematical Induction, Complex Numbers & Quadratic Equations'),
    ('MAT11', 4, 'Linear Inequalities, Permutations & Combinations'),
    ('MAT11', 5, 'Sequence and Series'),
    ('MAT11', 6, 'Co-ordinate Geometry: Lines & Conics'),
    ('MAT11', 7, 'Limits and Derivatives'),
    -- ENGLISH (ENG11)
    ('ENG11', 1, 'Prose: Standing Up for Yourself & The Legend Behind a Legend'),
    ('ENG11', 2, 'Prose: The Golden Touch & In London In Minus Fours'),
    ('ENG11', 3, 'Poetry: Stopping by Woods & Oft. in the Stilly Night'),
    ('ENG11', 4, 'Non-Detailed: Three Questions & After Twenty Years'),

    -- LESSONS (Grade 12 - 2nd Year Science)
    -- PHYSICS (PHY12)
    ('PHY12', 1, 'Electrostatics: Field, Potential and Capacitance'),
    ('PHY12', 2, 'Current Electricity'),
    ('PHY12', 3, 'Magnetic Effects of Current and Magnetism'),
    ('PHY12', 4, 'Electromagnetic Induction and Alternating Current'),
    ('PHY12', 5, 'Ray Optics and Optical Instruments'),
    ('PHY12', 6, 'Wave Optics'),
    ('PHY12', 7, 'Dual Nature of Radiation and Matter'),
    ('PHY12', 8, 'Atoms and Nuclei'),
    -- CHEMISTRY (CHE12)
    ('CHE12', 1, 'Solid State and Solutions'),
    ('CHE12', 2, 'Electrochemistry and Chemical Kinetics'),
    ('CHE12', 3, 'p-Block Elements'),
    ('CHE12', 4, 'd- and f-Block Elements & Coordination Compounds'),
    ('CHE12', 5, 'Haloalkanes & Haloarenes, Alcohols, Phenols & Ethers'),
    ('CHE12', 6, 'Aldehydes, Ketones, Carboxylic Acids & Amines'),
    ('CHE12', 7, 'Biomolecules, Polymers, & Chemistry in Everyday Life'),
    -- BIOLOGY (BIO12)
    ('BIO12', 1, 'Reproduction in Organisms, Plants, and Humans'),
    ('BIO12', 2, 'Genetics: Mendelian & Chromosomal Inheritance'),
    ('BIO12', 3, 'Molecular Basis of Inheritance & Evolution'),
    ('BIO12', 4, 'Biology and Human Welfare & Biotechnology'),
    ('BIO12', 5, 'Ecology and Environment & Conservation'),
    -- MATHEMATICS (MAT12)
    ('MAT12', 1, 'Relations, Functions, & Inverse Trigonometric Functions'),
    ('MAT12', 2, 'Matrices and Determinants'),
    ('MAT12', 3, 'Linear Programming'),
    ('MAT12', 4, 'Continuity, Differentiability, & Applications of Derivatives'),
    ('MAT12', 5, 'Integrals & Applications of Integrals'),
    ('MAT12', 6, 'Differential Equations'),
    ('MAT12', 7, 'Vectors and Three-Dimensional Geometry'),
    -- ENGLISH (ENG12)
    ('ENG12', 1, 'Prose: My Greatest Olympic Prize & On Examinations'),
    ('ENG12', 2, 'Prose: The Portrait of a Lady & The Magic of Teamwork'),
    ('ENG12', 3, 'Poetry: Daffodils & The Ballad of Father Gilligan'),
    ('ENG12', 4, 'Non-Detailed: The Doctor''s Word & The Nightingale and the Rose')
) as t(code, ord, title) on t.code = s.code
ON CONFLICT DO NOTHING;