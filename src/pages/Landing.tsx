import { Brain, TrendingUp, BarChart3, Globe, ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <nav className="border-b border-gray-200 dark:border-[#1a1a1a] bg-white/80 dark:bg-[#111111]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">CityMind AI</span>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <a href="#features" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                Features
              </a>
              <a href="#how-it-works" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                How it Works
              </a>
              <a href="/auth" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition">
                Sign In
              </a>
              <a href="/auth" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                Get Started
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a href="#features" className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition">
                Features
              </a>
              <a href="#how-it-works" className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition">
                How it Works
              </a>
              <a href="/auth" className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition">
                Sign In
              </a>
              <a href="/auth" className="block text-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                Get Started
              </a>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="text-center py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            AI-Powered Platform for<br />Smart City Solutions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Transfer urban tech solutions with 92% success rate using neural matching and predictive AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth" className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#demo" className="px-8 py-3 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1a1a1a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition font-medium">
              Watch Demo
            </a>
          </div>
        </section>

        <section id="features" className="py-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-[#111111] rounded-xl p-8 border border-gray-200 dark:border-[#1a1a1a]">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">CityMatch AI</h3>
            <p className="text-gray-600 dark:text-gray-400">Neural matching with 50+ parameters to find perfect solutions for your city</p>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-8 border border-gray-200 dark:border-[#1a1a1a]">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Success Predictor</h3>
            <p className="text-gray-600 dark:text-gray-400">AI predictions on implementation success rates and timeline confidence</p>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-8 border border-gray-200 dark:border-[#1a1a1a]">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Auto Localizer</h3>
            <p className="text-gray-600 dark:text-gray-400">Automatic adaptation of solutions to local regulations and conditions</p>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join 127+ Cities Using CityMind AI</h2>
          <p className="text-xl text-emerald-100 mb-8">Start finding the perfect smart city solutions today</p>
          <a href="/auth" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-emerald-600 rounded-lg hover:bg-gray-100 transition font-medium">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-[#1a1a1a] mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 CityMind AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
