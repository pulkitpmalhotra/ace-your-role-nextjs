// app/terms/page.tsx
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🤝 Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing and using Ace Your Role ("the Service"), you accept and agree to be bound by 
              the terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📝 Description of Service</h2>
            <div className="bg-blue-50 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">What We Provide</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>AI Conversation Training:</strong> Interactive roleplay scenarios with AI characters</li>
                <li><strong>Personalized Feedback:</strong> AI-powered analysis of your communication skills</li>
                <li><strong>Progress Tracking:</strong> Analytics and insights into your skill development</li>
                <li><strong>Professional Scenarios:</strong> Realistic business conversation practice</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">👤 User Accounts</h2>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Account Requirements</h3>
                <ul className="list-disc pl-6 space-y-2 text-green-800">
                  <li>You must be at least 18 years old to use our service</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>One account per person - no sharing or multiple accounts</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Account Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                  <li>Keep your login credentials secure and confidential</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>You are liable for all activities under your account</li>
                  <li>Do not share your account with others</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">✅ Acceptable Use</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">✅ Permitted Uses</h3>
                <ul className="list-disc pl-6 space-y-2 text-green-800 text-sm">
                  <li>Professional skill development and training</li>
                  <li>Educational and learning purposes</li>
                  <li>Personal communication improvement</li>
                  <li>Career advancement preparation</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-3">❌ Prohibited Uses</h3>
                <ul className="list-disc pl-6 space-y-2 text-red-800 text-sm">
                  <li>Harmful, abusive, or offensive content</li>
                  <li>Attempting to reverse engineer our AI</li>
                  <li>Automated use or bot access</li>
                  <li>Sharing inappropriate or illegal content</li>
                  <li>Disrupting service for other users</li>
                  <li>Commercial use without permission</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🤖 AI Service Limitations</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">Important Disclaimers</h3>
              <ul className="list-disc pl-6 space-y-2 text-orange-800">
                <li><strong>AI Accuracy:</strong> Our AI provides feedback for training purposes and may not always be perfect</li>
                <li><strong>Not Professional Advice:</strong> Our service is for practice and training, not professional consultation</li>
                <li><strong>Continuous Improvement:</strong> AI responses and accuracy improve over time but are not guaranteed</li>
                <li><strong>Educational Purpose:</strong> Use our feedback as one input among many in your professional development</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔒 Privacy and Data</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Our data practices are governed by our 
              <a href="/privacy" className="text-blue-600 hover:underline font-medium"> Privacy Policy</a>, 
              which is incorporated into these terms by reference.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Privacy Points</h3>
              <ul className="list-disc pl-6 space-y-2 text-blue-800">
                <li>Practice sessions are automatically deleted after 90 days</li>
                <li>We use Google OAuth for secure authentication</li>
                <li>Your data is encrypted and securely stored</li>
                <li>You can export or delete your data at any time</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">💰 Pricing and Payment</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Current Service Model</h3>
              <p className="text-green-800 mb-4">
                <strong>Free Service:</strong> Our platform is currently free to use during our beta period.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-green-800">
                <li>No credit card required for basic features</li>
                <li>Full access to AI conversation training</li>
                <li>Complete progress tracking and analytics</li>
                <li>We will provide 30 days notice before any paid plans</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔧 Service Availability</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Level</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>We strive for 99.9% uptime but cannot guarantee continuous availability</li>
                  <li>Scheduled maintenance will be announced in advance when possible</li>
                  <li>We reserve the right to modify or discontinue features with notice</li>
                  <li>Service may be temporarily unavailable due to technical issues</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📚 Intellectual Property</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Our Rights</h3>
                <ul className="list-disc pl-6 space-y-2 text-purple-800 text-sm">
                  <li>Platform design and functionality</li>
                  <li>AI models and training algorithms</li>
                  <li>Scenario content and characters</li>
                  <li>Trademarks and branding</li>
                </ul>
              </div>
              
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">Your Rights</h3>
                <ul className="list-disc pl-6 space-y-2 text-indigo-800 text-sm">
                  <li>Your original conversation content</li>
                  <li>Personal data and information</li>
                  <li>Right to export your data</li>
                  <li>Right to delete your account</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">⚖️ Limitation of Liability</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Important Legal Information</h3>
              <p className="text-red-800 mb-4">
                <strong>Disclaimer:</strong> Our service is provided "as is" without warranties of any kind.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-red-800">
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid us in the last 12 months</li>
                <li>We do not guarantee specific outcomes from using our training platform</li>
                <li>You use our service at your own risk and discretion</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🚫 Termination</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Your Right to Terminate</h3>
                <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                  <li>You may delete your account at any time</li>
                  <li>All your data will be permanently removed</li>
                  <li>No penalties or fees for account deletion</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-3">Our Right to Terminate</h3>
                <ul className="list-disc pl-6 space-y-2 text-red-800">
                  <li>We may suspend or terminate accounts for terms violations</li>
                  <li>We will provide notice when possible before termination</li>
                  <li>Terminated users may not create new accounts</li>
                  <li>We reserve the right to refuse service to anyone</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📝 Changes to Terms</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">How We Update These Terms</h3>
              <ul className="list-disc pl-6 space-y-2 text-blue-800">
                <li>We will notify you of material changes via email or platform notification</li>
                <li>Changes become effective 30 days after notification</li>
                <li>Continued use after changes constitutes acceptance</li>
                <li>You may delete your account if you disagree with changes</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🌍 Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These terms are governed by the laws of the United States and the State of California, 
              without regard to conflict of law principles. Any disputes will be resolved in the 
              courts of California.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📞 Contact Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Questions About These Terms?</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> <a href="mailto:legal@aceyourrole.com" className="text-blue-600 hover:underline">legal@aceyourrole.com</a></p>
                <p><strong>Subject Line:</strong> "Terms of Service Inquiry"</p>
                <p><strong>Response Time:</strong> We will respond within 7 business days</p>
              </div>
              
              <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>For technical support or account issues:</strong> Use the support features within 
                  your account dashboard or contact us through the platform.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔗 Additional Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/privacy" className="block bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                <h3 className="font-semibold text-blue-900 mb-2">🔒 Privacy Policy</h3>
                <p className="text-blue-800 text-sm">Learn how we protect and use your personal information</p>
              </a>
              
              <a href="/dashboard" className="block bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
                <h3 className="font-semibold text-green-900 mb-2">🎯 Start Training</h3>
                <p className="text-green-800 text-sm">Begin your AI-powered conversation practice</p>
              </a>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              These terms of service are effective as of {new Date().toLocaleDateString()} and were last updated on {new Date().toLocaleDateString()}.
              <br />
              <strong>Ace Your Role</strong> - AI-Powered Professional Training Platform
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/dashboard" 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
