// app/lib/api.ts - Simple version
export async function fetchUserSessions(userEmail: string) {
  const url = `/api/sessions?user_email=${encodeURIComponent(userEmail)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  
  return response.json();
}

export async function createSession(scenarioId: string, userEmail: string) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario_id: scenarioId,
      user_email: userEmail
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }
  
  return response.json();
}

export async function updateSession(sessionId: string, updateData: any) {
  const response = await fetch('/api/sessions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      ...updateData
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update session: ${response.status}`);
  }
  
  return response.json();
}
