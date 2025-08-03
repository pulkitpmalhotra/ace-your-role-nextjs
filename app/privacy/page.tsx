// app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔒 Your Privacy Matters</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At Ace Your Role, we are committed to protecting your privacy and ensuring transparency 
              about how we collect, use, and protect your personal information. This policy explains 
              our data practices in clear, understandable terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📊 Information We Collect</h2>
            <div className="bg-blue-50 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Google OAuth Data:</strong> Email address, name, and profile picture</li>
                <li><strong>Account Settings:</strong> Preferences and configuration choices</li>
                <li><strong>Login Records:</strong> Authentication timestamps and session data</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Practice Session Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Conversation Transcripts:</strong> Your practice conversations with AI characters</li>
                <li><strong>Performance Metrics:</strong> Scores, feedback, and progress tracking</li>
                <li><strong>Session Metadata:</strong> Duration, difficulty level, and scenario information</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Technical Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Device Data:</strong> Browser type, operating system, device characteristics</li>
                <li><strong>Usage Analytics:</strong> How you interact with our platform (with your consent)</li>
                <li><strong>Network Information:</strong> IP address, connection details for security</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🎯 How We Use Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Service Delivery</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                  <li>Provide AI-powered conversation training</li>
                  <li>Generate personalized feedback and coaching</li>
                  <li>Track your progress and skill development</li>
                  <li>Customize scenarios to your needs</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔧 Platform Improvement</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                  <li>Enhance AI conversation quality</li>
                  <li>Develop new features and scenarios</li>
                  <li>Improve user experience and interface</li>
                  <li>Optimize platform performance</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🛡️ Security & Safety</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                  <li>Prevent fraud and abuse</li>
                  <li>Ensure platform security</li>
                  <li>Maintain service reliability</li>
                  <li>Comply with legal requirements</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📞 Communication</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                  <li>Send important service updates</li>
                  <li>Respond to support requests</li>
                  <li>Notify about policy changes</li>
                  <li>Share relevant tips and insights</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🗃️ Data Storage & Retention</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">🔄 Automatic Data Cleanup</h3>
              <p className="text-yellow-800 mb-4">
                <strong>Your privacy is protected by automatic data deletion:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-yellow-800">
                <li><strong>Practice Sessions:</strong> Automatically deleted after 90 days</li>
                <li><strong>Conversation Transcripts:</strong> Permanently removed after 90 days</li>
                <li><strong>Temporary Data:</strong> Cleared immediately after each session</li>
                <li><strong>Account Data:</strong> Retained until you delete your account</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">🏢 Data Location</h3>
              <p className="text-blue-800">
                Your data is stored securely in the United States using enterprise-grade cloud infrastructure 
                with encryption at rest and in transit. We use Supabase (built on PostgreSQL) for reliable, 
                secure data management.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">👤 Your Privacy Rights</h2>
            <p className="text-gray-700 mb-4">
              You have full control over your personal data. Under privacy laws like GDPR and CCPA, you have these rights:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📥 Access</h3>
                <p className="text-sm text-gray-700">Request a copy of all personal data we have about you</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✏️ Rectification</h3>
                <p className="text-sm text-gray-700">Correct any inaccurate or incomplete information</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🗑️ Erasure</h3>
                <p className="text-sm text-gray-700">Delete your account and all associated data permanently</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📦 Portability</h3>
                <p className="text-sm text-gray-700">Export your data in a structured, machine-readable format</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">⏸️ Restriction</h3>
                <p className="text-sm text-gray-700">Limit how we process your personal information</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🚫 Objection</h3>
                <p className="text-sm text-gray-700">Opt out of certain types of data processing</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🍪 Cookies & Tracking</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">Cookie Usage</h3>
              <p className="text-orange-800 mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-orange-800">
                <li><strong>Essential Cookies:</strong> Required for login and basic functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform (with consent)</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and choices</li>
              </ul>
              <p className="text-orange-800 mt-4">
                You can manage your cookie preferences through your browser settings or our cookie consent tool.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔐 Security Measures</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">How We Protect Your Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-red-800">
                <li><strong>Encryption:</strong> All data encrypted in transit and at rest</li>
                <li><strong>Authentication:</strong> Secure Google OAuth integration</li>
                <li><strong>Access Controls:</strong> Strict employee access limitations</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring and alerts</li>
                <li><strong>Regular Audits:</strong> Periodic security assessments and updates</li>
                <li><strong>Data Minimization:</strong> We only collect what's necessary</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🚨 Data Breaches</h2>
            <p className="text-gray-700 mb-4">
              In the unlikely event of a data breach that affects your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>We will notify you within 72 hours</li>
              <li>We will explain what happened and what data was involved</li>
              <li>We will outline steps we're taking to resolve the issue</li>
              <li>We will provide guidance on protecting yourself</li>
              <li>We will report to relevant authorities as required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">👶 Children's Privacy</h2>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
              <p className="text-pink-800">
                <strong>Our service is intended for users 18 years and older.</strong> We do not knowingly 
                collect personal information from children under 18. If we become aware that we have 
                collected personal information from a child under 18, we will delete it immediately.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🌍 International Users</h2>
            <p className="text-gray-700 mb-4">
              If you're using our service from outside the United States, please note that your 
              information may be transferred to and processed in the United States. By using our 
              service, you consent to this transfer and processing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📝 Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. When we do:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>We will notify you via email or through our platform</li>
              <li>We will update the "Last updated" date at the top</li>
              <li>We will highlight significant changes</li>
              <li>You will have the opportunity to review and accept changes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">📞 Contact Us</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy Questions or Requests</h3>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or want to exercise your privacy rights:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> <a href="mailto:privacy@aceyourrole.com" className="text-blue-600 hover:underline">privacy@aceyourrole.com</a></p>
                <p><strong>Subject Line:</strong> "Privacy Request - [Your Request Type]"</p>
                <p><strong>Response Time:</strong> We will respond within 30 days</p>
              </div>
              
              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🔒 Privacy Dashboard</h4>
                <p className="text-blue-800 text-sm">
                  You can also manage your privacy settings, export your data, or delete your account 
                  directly through your account settings in our platform.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              This privacy policy is effective as of {new Date().toLocaleDateString()} and was last updated on {new Date().toLocaleDateString()}.
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
