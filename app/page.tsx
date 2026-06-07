export default function Home() {
  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-zinc-950 font-sans">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">Better Every Day</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Pricing</a>
          </nav>
          <a
            href="#get-started"
            className="rounded-full bg-zinc-900 dark:bg-zinc-50 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Get started free
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-36 pb-24 px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950 px-4 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              Now in public beta — join 10,000+ users
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none mb-6">
              Small habits.{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Massive results.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10">
              Track your daily habits, visualize your progress, and build the life you want — one day at a time. Simple, focused, and actually enjoyable to use.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                id="get-started"
                href="#"
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all duration-200"
              >
                Start for free
              </a>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-8 py-3.5 text-base font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                See how it works
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 shadow-2xl shadow-zinc-900/10 dark:shadow-zinc-950/50">
              <div className="absolute -inset-px rounded-2xl ring-1 ring-violet-500/20" />
              {/* Mock dashboard */}
              <div className="rounded-xl bg-white dark:bg-zinc-950 p-6 min-h-[340px]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Today&apos;s Habits</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Saturday, June 7</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-violet-600">4/6</div>
                    <div className="text-xs text-zinc-500">completed</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-8">
                  <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 w-2/3 transition-all" />
                </div>

                {/* Habit items */}
                <div className="space-y-3">
                  {[
                    { name: "Morning meditation", done: true, streak: 12, emoji: "🧘" },
                    { name: "30 min exercise", done: true, streak: 8, emoji: "🏃" },
                    { name: "Read for 20 minutes", done: true, streak: 21, emoji: "📚" },
                    { name: "Journal entry", done: true, streak: 5, emoji: "✍️" },
                    { name: "No social media before 10am", done: false, streak: 3, emoji: "📵" },
                    { name: "8 glasses of water", done: false, streak: 6, emoji: "💧" },
                  ].map((habit) => (
                    <div key={habit.name} className="flex items-center gap-3 rounded-lg p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        habit.done
                          ? "border-violet-500 bg-violet-500"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}>
                        {habit.done && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm mr-1">{habit.emoji}</span>
                      <span className={`flex-1 text-sm ${habit.done ? "line-through text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {habit.name}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                        {habit.streak}d
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 border-y border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-5xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "Active users" },
              { value: "2.4M", label: "Habits tracked" },
              { value: "94%", label: "Streak retention" },
              { value: "4.9★", label: "User rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stat.value}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                Everything you need to build better habits
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                Designed to be the last habit tracker you&apos;ll ever need. Powerful enough to be meaningful, simple enough to stick with.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
                  ),
                  title: "Streak tracking",
                  desc: "Never break the chain. Visual streaks motivate you to stay consistent, day after day.",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                    </svg>
                  ),
                  title: "Smart scheduling",
                  desc: "Set daily, weekly, or custom frequencies. Your habits, your schedule.",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                    </svg>
                  ),
                  title: "Progress insights",
                  desc: "Beautiful charts and heatmaps that show exactly how far you&apos;ve come.",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                  ),
                  title: "Smart reminders",
                  desc: "Gentle nudges at the right time. Never forget a habit again.",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  ),
                  title: "Accountability partners",
                  desc: "Share your journey with friends. Better together, every day.",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                  ),
                  title: "AI habit coach",
                  desc: "Personalized recommendations based on your patterns and goals.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:border-violet-200 dark:hover:border-violet-900 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                Up and running in minutes
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400">
                No complex setup. Just start building better habits today.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Choose your habits",
                  desc: "Pick from 100+ pre-built habit templates or create your own. Morning routines, fitness goals, mindfulness — we have it all.",
                },
                {
                  step: "02",
                  title: "Check in daily",
                  desc: "A simple tap is all it takes. Open the app, mark your habits complete, and feel that satisfying sense of progress.",
                },
                {
                  step: "03",
                  title: "Watch yourself grow",
                  desc: "Your streaks, stats, and insights paint a picture of who you&apos;re becoming. Celebrate every milestone along the way.",
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-6xl font-bold text-zinc-100 dark:text-zinc-800 mb-4 leading-none">{item.step}</div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                Simple, honest pricing
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400">
                Start free. Upgrade when you&apos;re ready.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Free */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1">Free</h3>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">$0<span className="text-base font-normal text-zinc-400">/month</span></div>
                <ul className="space-y-3 mb-8">
                  {["Up to 5 habits", "Basic streak tracking", "7-day history", "Mobile app"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#" className="block w-full text-center rounded-full border border-zinc-300 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                  Get started
                </a>
              </div>

              {/* Pro */}
              <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white shadow-xl shadow-violet-500/25">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-900">
                  Most popular
                </div>
                <h3 className="font-semibold mb-1">Pro</h3>
                <div className="text-3xl font-bold mb-6">$9<span className="text-base font-normal text-violet-200">/month</span></div>
                <ul className="space-y-3 mb-8">
                  {["Unlimited habits", "Advanced analytics", "Full history", "AI habit coach", "Accountability partners", "Priority support"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-violet-100">
                      <svg className="w-4 h-4 text-violet-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="#" className="block w-full text-center rounded-full bg-white py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
                  Start free trial
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
              Your future self will thank you
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8">
              Join thousands of people who are becoming better every day. Start your journey for free — no credit card required.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all duration-200"
            >
              Get started — it&apos;s free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Better Every Day</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            © {new Date().getFullYear()} Better Every Day. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-zinc-400 dark:text-zinc-600">
            <a href="#" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
