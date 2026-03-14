import React from 'react';
import { Wallet, PieChart, TrendingUp, Target, Shield, Brain, ArrowRight, Users } from 'lucide-react';

const features = [
  {
    icon: PieChart,
    title: 'Smart Spending Tracking',
    description: 'Visualize your expenses in 3D and identify spending patterns instantly.',
  },
  {
    icon: TrendingUp,
    title: 'Investment Opportunities',
    description: 'Discover Tanzania-specific investments like Treasury Bonds and DSE stocks.',
  },
  {
    icon: Target,
    title: 'Budget & Goals Manager',
    description: 'Set budgets per category and track your savings goals with progress visualization.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized financial advice powered by Google Gemini AI.',
  },
];

const testimonials = [
  {
    quote: "Transformed how I manage my money. The AI insights are spot on!",
    author: "Amina K., Dar es Salaam",
  },
  {
    quote: "Easy to use and perfect for tracking investments in Tanzania.",
    author: "Juma M., Arusha",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-dark via-bg-dark to-bg-dark">
      {/* Hero */}
      <section className="pt-20 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="lg:pr-12">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-6 leading-tight">
                Master Your Money
                <span className="block text-4xl md:text-5xl bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mt-4">
                  with AI Intelligence
                </span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-lg leading-relaxed">
                Track expenses, manage budgets, discover investments, and get AI-powered insights tailored for Tanzania.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/login"
                  className="group bg-primary hover:bg-secondary text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300 flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="/dashboard" className="border-2 border-slate-700/50 hover:border-white/50 text-slate-300 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/5 transition-all duration-300">
                  View Dashboard
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="glass p-8 rounded-3xl shadow-2xl backdrop-blur-xl max-w-md mx-auto lg:ml-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">+ 2,450 TZS</p>
                    <p className="text-sm text-slate-400">Monthly Balance</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Income</span>
                    <span className="font-mono text-emerald-500">5,000 TZS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Expenses</span>
                    <span className="font-mono text-red-500">-2,550 TZS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-6">
              Everything You Need to Thrive Financially
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Built for modern Tanzanians. Secure, intelligent, and beautifully designed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group hover:scale-[1.02] transition-all duration-300">
                <div className="glass p-8 rounded-3xl h-full shadow-xl group-hover:shadow-2xl group-hover:shadow-primary/25">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/30">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Loved by Thousands</h2>
            <p className="text-xl text-slate-400">Join Tanzanians taking control of their finances.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="glass p-10 rounded-3xl text-center">
                <p className="text-xl text-white italic mb-8">“{testimonial.quote}”</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <div className="w-20 h-1 bg-gradient-to-r from-primary to-transparent rounded-full mt-2 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass p-12 lg:p-20 rounded-3xl shadow-2xl">
            <Shield className="w-20 h-20 text-primary mx-auto mb-8 opacity-75" />
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Ready to Start?</h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Sign up today and get complete access to AI-powered financial management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/register" className="bg-primary hover:bg-secondary text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300">
                Create Free Account
              </a>
              <a href="/login" className="border-2 border-slate-700/50 hover:border-white/50 text-slate-300 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/5 transition-all duration-300">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Manager</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">AI-powered financial management for Tanzania.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Insights</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © 2024 Manager. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

