import { useEffect, useState } from react;
import { supabase } from ../lib/supabaseClient;

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from(leaderboard).select(student_id,
