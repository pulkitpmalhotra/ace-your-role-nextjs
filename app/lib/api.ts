// app/lib/api.ts - Fixed utility functions
export function getAuthHeaders() {
  const sessionToken = localStorage.getItem('sessionToken');
  const authProvider = localStorage.getItem('authProvider');
  
  if (!sessionToken || authProvider !== 'google') {
    throw new Error('Authentication required');
  }
  
  return {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  };
}

// Alternative simple auth headers (if not using JWT)
export function getSimpleAuthHeaders() {
  const userEmail = localStorage.getItem('userEmail');
  const authProvider = localStorage.getItem('authProvider');
  
  if (!userEmail || authProvider !== 'google') {
    throw new Error('Authentication required');
  }
  
  return {
    'Content-Type': 'application/json',
    'x-user-email': userEmail
  };
}

// API wrapper for authenticated requests
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  try {
    const headers = getSimpleAuthHeaders(); // Use simple headers for now
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Clear auth and throw error - let calling component handle redirect
      localStorage.clear();
      throw new Error('AUTHENTICATION_EXPIRED');
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication required')) {
      localStorage.clear();
      throw new Error('AUTHENTICATION_REQUIRED');
    }
    throw error;
  }
}

// Specific API functions
export async function fetchUserSessions(userEmail: string) {
  const url = `/api/sessions?user_email=${encodeURIComponent(userEmail)}`;
  const response = await authenticatedFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  
  return response.json();
}

export async function createSession(scenarioId: string, userEmail: string) {
  const response = await authenticatedFetch('/api/sessions', {
    method: 'POST',
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
  const response = await authenticatedFetch('/api/sessions', {
    method: 'PUT',
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
