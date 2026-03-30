import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Zap, Users, Trophy, Clock, Star, ArrowRight, Play } from 'lucide-react'
import Button from '../components/Button'
import { pageVariants, staggerContainer, staggerItem } from '../animations/variants'

const features = [
  { icon: Zap, title: 'Real-Time Gameplay', desc: 'Questions broadcast instantly to all players. Zero lag, pure real-time.' },
  { icon: Users, title: 'Unlimited Players', desc: 'Host games with any number of players. No limits, no costs.' },
  { icon: Trophy, title: 'Speed Scoring', desc: 'Faster correct answers earn more points. Up to 1000 points per question.' },
  { icon: Clock, title: 'Timed Questions', desc: 'Custom timers per question keep the energy high.' },
]

const testimonials = [
  { name: 'Sarah K.', role: 'High School Teacher', text: 'My students are obsessed! The real-time leaderboard makes every quiz feel like a game show.' },
  { name: 'Marcus T.', role: 'Team Lead at Spotify', text: 'We use QuizRush for team trivia every Friday. Way better than Kahoot and completely free.' },
  { name: 'Priya S.', role: 'Event Organizer', text: 'Used it for a conference with 200 attendees. Worked flawlessly and looked incredible.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>QuizRush — Free Real-Time Multiplayer Quiz Platform</title>
        <meta name="description" content="The best free Kahoot alternative. Create and host real-time multiplayer quizzes for classrooms, teams, and events. Beautiful, fast, and completely free." />
        <meta property="og:title" content="QuizRush — Real-Time Quiz Platform" />
        <meta property="og:description" content="Host multiplayer quiz games in real-time. Free forever." />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://quizrush.app" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "QuizRush",
          "description": "Real-time multiplayer quiz platform",
          "url": "https://quizrush.app",
          "applicationCategory": "EducationApplication",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-[#0F172A]">QuizRush</span>
            </motion.div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
              <Button size="sm" onClick={() => navigate('/register')}>Get Started Free</Button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <motion.section
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-blue-50/50 to-white"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] px-4 py-2 rounded-full text-sm font-semibold mb-8"
            >
              <Star size={14} />
              Free Kahoot Alternative
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-7xl font-extrabold text-[#0F172A] leading-tight mb-6"
            >
              The Quiz Platform
              <span className="text-[#2563EB]"> Your Team </span>
              Will Love
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Real-time multiplayer quizzes for classrooms, teams, and events.
              More beautiful than Kahoot. Completely free. Forever.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" onClick={() => navigate('/register')} className="pulse-glow">
                <Play size={20} />
                Host a Game Free
              </Button>
              <Button size="xl" variant="outline" onClick={() => navigate('/join')}>
                Join a Game
                <ArrowRight size={20} />
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Features */}
        <section className="py-20 px-6 bg-[#F7F8FC]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-[#0F172A] mb-4">Everything you need to run great quizzes</h2>
              <p className="text-gray-500 text-lg">Built for speed, designed for delight</p>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {features.map((f) => (
                <motion.div key={f.title} variants={staggerItem} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <f.icon size={24} className="text-[#2563EB]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-[#0F172A] mb-4">Loved by teachers and teams</h2>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {testimonials.map((t) => (
                <motion.div key={t.name} variants={staggerItem} className="bg-[#F7F8FC] rounded-2xl p-6 border border-gray-100">
                  <p className="text-[#0F172A] font-medium mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="font-bold text-[#0F172A]">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-[#2563EB]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to run your first quiz?</h2>
            <p className="text-blue-200 mb-8 text-lg">Free forever. No credit card required.</p>
            <Button size="xl" variant="secondary" onClick={() => navigate('/register')}>
              Create Your Account
              <ArrowRight size={20} />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 bg-[#0F172A] text-center">
          <p className="text-gray-500 text-sm">© 2024 QuizRush. Free forever. Built with ❤️</p>
        </footer>
      </div>
    </>
  )
}
