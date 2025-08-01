// app/page.tsx - MINIMAL TEST VERSION
export default function HomePage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🎯 Ace Your Role - UPDATED</h1>
      <p>Test deployment: {new Date().toISOString()}</p>
      <p>If you see this timestamp, deployment is working!</p>
    </div>
  );
}
