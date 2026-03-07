import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  // Quick stats
  const [usersRes, matchesRes, tournsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).not('username', 'is', null),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('tournaments').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Players', value: usersRes.count ?? 0 },
    { label: 'Matches Played', value: matchesRes.count ?? 0 },
    { label: 'Tournaments', value: tournsRes.count ?? 0 },
  ];

  const features = [
    {
      icon: '🏆',
      title: 'Tournaments',
      desc: 'Create and join single-elimination brackets for 2-32 players. 1v1, 2v2, or Pro Clubs.',
    },
    {
      icon: '⚔️',
      title: '1v1 Challenges',
      desc: 'Challenge any player to a standalone match. Report scores, upload evidence, settle disputes.',
    },
    {
      icon: '📊',
      title: 'Leaderboards',
      desc: 'Climb the seasonal rankings. Earn points from wins, tournament placements, and streaks.',
    },
    {
      icon: '💬',
      title: 'Messaging',
      desc: 'Direct message opponents. Coordinate match times and talk strategy in real time.',
    },
    {
      icon: '🛡️',
      title: 'Fair Play',
      desc: 'Evidence-based score disputes. Admin moderation. Report cheaters and toxic players.',
    },
    {
      icon: '🇰🇪',
      title: 'Built for Kenya',
      desc: 'East Africa timezone, local community focus. Designed for the Kenyan FC26 PlayStation scene.',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand/5 via-white to-surface-50 py-24 sm:py-32">
        <div className="container-app text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-brand">Clutch</span>
              <span className="text-ink">Nation</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
              The home of competitive FC26 on PlayStation in Kenya. Host tournaments,
              challenge rivals, climb the leaderboard, and prove you&apos;re the best.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="w-full rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-600 transition-all hover:shadow-xl sm:w-auto"
              >
                Start Competing
              </Link>
              <Link
                href="/tournaments"
                className="w-full rounded-xl border border-surface-300 bg-white px-8 py-3.5 text-base font-semibold text-ink shadow-sm hover:bg-surface-50 transition-all sm:w-auto"
              >
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <section className="border-y border-surface-200 bg-white py-10">
        <div className="container-app">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-brand sm:text-4xl">{s.value.toLocaleString()}</p>
                <p className="mt-1 text-sm font-medium text-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container-app">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              Everything you need to compete
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-muted">
              From casual 1v1s to organized tournaments, ClutchNation has the tools for every level of play.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-surface-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 font-heading text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand py-16">
        <div className="container-app text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Ready to prove yourself?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-100">
            Join the growing community of FC26 competitors in Kenya. Sign up free and start playing today.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand shadow-lg hover:bg-surface-50 transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/leaderboards"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              View Leaderboards
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
