// app/page.tsx - Simple test
export default function TestPage() {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center', 
      backgroundColor: 'red', 
      color: 'white',
      fontSize: '24px'
    }}>
      <h1>🚨 DEPLOYMENT TEST</h1>
      <p>Updated: {new Date().toISOString()}</p>
      <p>If you see this RED page, deployment works!</p>
    </div>
  );
}
