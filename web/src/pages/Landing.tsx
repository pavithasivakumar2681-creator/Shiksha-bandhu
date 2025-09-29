import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Replaced aggressive gradient with soft pastel shades and adjusted text color */}
      <section className="text-center py-16 rounded-3xl bg-gradient-to-br from-orange-200 via-orange-100 to-green-100 text-gray-800">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Learn. Level Up. Keep Your Streak.</h1>
        <p className="text-gray-700 max-w-2xl mx-auto">CHSE Grade 11 & 12 syllabus for Physics, Chemistry, Biology, Maths, and English. Gamified like Duolingo.</p>
        <div className="mt-8 flex justify-center gap-3">
          {/* Softened CTA button: using a soft orange border for definition */}
          <Link to="/auth" className="bg-white text-orange-500 font-semibold rounded-full px-6 py-3 border border-orange-400 hover:bg-orange-50">Get Started</Link>
        </div>
      </section>
    </main>
  );
}