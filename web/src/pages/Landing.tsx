import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <section className="text-center py-16 rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-green-400 text-white">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Learn. Level Up. Keep Your Streak.</h1>
        <p className="text-white/90 max-w-2xl mx-auto">CHSE Grade 11 & 12 syllabus for Physics, Chemistry, Biology, Maths, and English. Gamified like Duolingo.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth" className="bg-white text-orange-600 font-semibold rounded-full px-6 py-3">Get Started</Link>
        </div>
      </section>
    </main>
  );
}


