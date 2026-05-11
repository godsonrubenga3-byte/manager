import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsConditions() {
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
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Terms and Conditions</h1>
            <p className="text-stone-500">Last updated: April 18, 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-stone-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Agreement to Terms</h2>
            <p>By accessing or using the Manager App, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
            <p>The App provides financial tracking, investment logging, and trading journal capabilities. These tools are provided for informational and management purposes only.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. Not Financial Advice</h2>
            <p className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold">
              IMPORTANT: The Manager App does NOT provide financial, investment, or legal advice. All data and metrics provided are based on user input and for tracking purposes only. Users are solely responsible for their own investment decisions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your "System Key" and for all activities that occur under your account. You agree to provide accurate and complete information.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Limitation of Liability</h2>
            <p>In no event shall Manager App be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the service, including but not limited to financial losses in trading or investments.</p>
          </section>

          <section className="space-y-3 border-t border-white/5 pt-6">
            <p>These terms shall be governed and construed in accordance with international digital service standards.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
