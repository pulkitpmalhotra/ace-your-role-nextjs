// Update your app/lib/api.ts to send the user email header
export function getSecureHeaders() {
  const userEmail = localStorage.getItem('userEmail');
  const authProvider = localStorage.getItem('authProvider');
  
  if (!userEmail || authProvider !== 'google') {
    throw new Error('Authentication required');
  }
  
  return {
    'Content-Type': 'application/json',
    'x-user-email': userEmail  // This will be used by RLS policies
  };
}

// Updated API functions with security headers
export async function fetchUserSessions(userEmail: string) {
  const url = `/api/sessions?user_email=${encodeURIComponent(userEmail)}`;
  const response = await fetch(url, {
    headers: getSecureHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  
  return response.json();
}

export async function createSession(scenarioId: string, userEmail: string) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: getSecureHeaders(),
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
    headers: getSecureHeaders(),
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

export async function fetchUserProgress(userEmail: string) {
  const url = `/api/progress?user_email=${encodeURIComponent(userEmail)}`;
  const response = await fetch(url, {
    headers: getSecureHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch progress: ${response.status}`);
  }
  
  return response.json();
}
