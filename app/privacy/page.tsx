// app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account Information:</strong> Email, name, and profile picture from Google OAuth</li>
          <li><strong>Practice Sessions:</strong> Conversation transcripts and performance data</li>
          <li><strong>Usage Analytics:</strong> How you interact with our platform (with your consent)</li>
          <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide and improve our AI training service</li>
          <li>Generate personalized feedback and analytics</li>
          <li>Ensure platform security and prevent abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Rectification:</strong> Correct inaccurate information</li>
          <li><strong>Erasure:</strong> Delete your account and associated data</li>
          <li><strong>Portability:</strong> Export your data in a structured format</li>
          <li><strong>Restriction:</strong> Limit how we process your data</li>
          <li><strong>Objection:</strong> Opt out of certain data processing</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
        <p className="mb-4">
          We automatically delete practice session data after 90 days for privacy protection. 
          Account information is retained until you delete your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p>
          For privacy-related questions or to exercise your rights, contact us at: 
          <a href="mailto:privacy@aceyourrole.com" className="text-blue-600 hover:underline">
            privacy@aceyourrole.com
          </a>
        </p>
      </section>
    </div>
  );
}
