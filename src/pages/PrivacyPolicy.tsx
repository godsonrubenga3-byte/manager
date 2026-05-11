import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-dark text-stone-100 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4 border-b border-white/5 pb-8">
          <div className="p-3 bg-primary/20 rounded-2xl text-primary">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-stone-500">Last updated: April 18, 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-stone-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Introduction</h2>
            <p>Welcome to the Manager App. Your privacy is critically important to us. This Privacy Policy describes how we handle your information when you use our financial and trading management services.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Data Collection</h2>
            <p>We collect information that you voluntarily provide to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Transactional data (amounts, categories, descriptions)</li>
              <li>Trading information (assets, prices, strategies, performance metrics)</li>
              <li>Operational data (tasks, reminders, calendar events)</li>
              <li>Images uploaded for trade assessments (stored via third-party secure cloud)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. Data Storage and Synchronization</h2>
            <p>Your data is primarily stored locally on your device using Capacitor Preferences. For users who choose to synchronize their data, we use secure Turso database instances. Image assets are processed via ImgBB secure cloud storage.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Data Security</h2>
            <p>We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your data at any time. You can use the "Purge Local Storage" feature in settings to remove all data from your current device.</p>
          </section>

          <section className="space-y-3 border-t border-white/5 pt-6">
            <p>By using this application, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our App.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
