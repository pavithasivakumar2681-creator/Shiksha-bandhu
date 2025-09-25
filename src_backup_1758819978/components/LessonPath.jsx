import { useEffect, useState } from react;
import { motion } from framer-motion;
import { supabase } from ../lib/supabaseClient;

export default function LessonPath({ subjects }) {
  const [lessonsBySubject, setLessonsBySubject] = useState({});

  useEffect(() => {
    const load = async () => {
      const map = {};
      for (const sub of subjects) {
        const { data: lessons } = await supabase
          .from(lessons)
          .select(id,
