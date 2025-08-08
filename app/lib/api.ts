// Add this helper function to your utils or create app/lib/api.ts
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

// Update your history page loadHistoryData function:
const loadHistoryData = async (email: string) => {
  try {
    console.log('📊 Fetching sessions from API for:', email);
    
    // Get auth headers
    const headers = getAuthHeaders();
    
    // Load user sessions with authentication
    const sessionsUrl = `/api/sessions?user_email=${encodeURIComponent(email)}`;
    console.log('📊 Sessions API URL:', sessionsUrl);
    
    const sessionsResponse = await fetch(sessionsUrl, { headers });
    console.log('📊 Sessions API response status:', sessionsResponse.status);
    
    if (sessionsResponse.status === 401) {
      console.error('❌ Authentication failed, redirecting to login');
      localStorage.clear();
      router.push('/');
      return;
    }
    
    if (!sessionsResponse.ok) {
      const errorText = await sessionsResponse.text();
      console.error('❌ Sessions API failed:', sessionsResponse.status, errorText);
      throw new Error(`Failed to load session history: ${sessionsResponse.status}`);
    }

    const sessionsData = await sessionsResponse.json();
    console.log('📊 Sessions API response success:', sessionsData.success);
    
    if (!sessionsData.success) {
      console.error('❌ Sessions API returned error:', sessionsData.error);
      throw new Error(sessionsData.error || 'Failed to load sessions');
    }

    let sessions = sessionsData.data || [];
    console.log('📊 Sessions loaded:', sessions.length);

    // Rest of your processing code...
    
  } catch (error) {
    console.error('❌ Error loading history data:', error);
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      localStorage.clear();
      router.push('/');
      return;
    }
    
    setError(`Failed to load session history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update session creation in dashboard:
const startChat = async (scenario: Scenario) => {
  try {
    const headers = getAuthHeaders();
    const userEmail = localStorage.getItem('userEmail');
    
    console.log('🎯 Starting session with scenario:', scenario.title);
    
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        scenario_id: scenario.id,
        user_email: userEmail
      })
    });

    if (response.status === 401) {
      alert('Please sign in again to start practicing.');
      localStorage.clear();
      router.push('/');
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const sessionData = await response.json();
    if (sessionData.success) {
      localStorage.setItem('currentScenario', JSON.stringify(scenario));
      router.push(`/session/${scenario.id}`);
    }
  } catch (error) {
    console.error('❌ Error starting session:', error);
    alert('Failed to start session. Please try again.');
  }
};

// Update session updates in the session page:
const saveConversation = async (updatedConversation: ConversationMessage[]) => {
  if (!sessionId) {
    console.warn('⚠️ No session ID for saving conversation');
    return;
  }
  
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch('/api/sessions', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        session_id: sessionId,
        conversation: updatedConversation
      })
    });
    
    if (response.status === 401) {
      console.error('❌ Authentication expired during session');
      // Don't redirect immediately during active session
      return;
    }
    
    if (!response.ok) {
      console.error('Failed to save conversation:', response.status);
    } else {
      console.log('💾 Conversation saved successfully');
    }
  } catch (err) {
    console.error('❌ Error saving conversation:', err);
  }
};
