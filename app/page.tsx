// FILE 2: app/page.tsx (TypeScript only)
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🎯 Ace Your Role
        </h1>
        <p className="text-xl text-center text-gray-600 mb-8">
          AI-Powered Roleplay Training Platform
        </p>
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            ✅ Next.js App is Working!
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
            🚀 Ready for Phase 1 Implementation
          </div>
          <a 
            href="/api/scenarios"
            className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
          >
            🧪 Test API Endpoint
          </a>
        </div>
      </div>
    </main>
  )
}
