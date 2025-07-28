// src/services/api.js - COMPLETE FIXED VERSION

class APIService {
  constructor() {
    this.baseUrl = 'https://ai-roleplay-free.vercel.app';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🚀 Making API request to:', url);
    console.log('📋 Request options:', options);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Get response text first to see what we're dealing with
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);

      if (!response.ok) {
        // Try to parse error details
        let errorDetails = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails = errorJson.error || errorJson.message || responseText;
        } catch (e) {
          // If it's not JSON, use the raw text
        }
        
        throw new Error(`HTTP ${response.status}: ${errorDetails}`);
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('💥 API Request failed:', error);
      console.error('🔗 URL was:', url);
      throw error;
    }
  }

  // Scenarios
  async getScenarios() {
    console.log('📚 Fetching scenarios...');
    return await this.makeRequest('/api/scenarios');
  }

  // Sessions
  async createSession(scenarioId, userEmail) {
    console.log('🎬 Creating session...');
    console.log('📋 Scenario ID:', scenarioId);
    console.log('📧 User email:', userEmail);
    
    const data = await this.makeRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        scenarioId,
        userEmail
      })
    });
    return data.sessionId;
  }

  async updateSessionConversation(sessionId, conversation) {
    console.log('💬 Updating conversation...');
    console.log('🆔 Session ID:', sessionId);
    console.log('📝 Conversation length:', conversation.length);
    console.log('📄 Conversation data:', conversation);
    
    // Validate the conversation data
    if (!Array.isArray(conversation)) {
      throw new Error('Conversation must be an array');
    }
    
    // Validate each message
    for (let i = 0; i < conversation.length; i++) {
      const msg = conversation[i];
      if (!msg.speaker || !msg.message || !msg.timestamp) {
        console.error(`❌ Invalid message at index ${i}:`, msg);
        throw new Error(`Invalid message format at index ${i}`);
      }
      if (!['user', 'ai'].includes(msg.speaker)) {
        console.error(`❌ Invalid speaker at index ${i}:`, msg.speaker);
        throw new Error(`Invalid speaker "${msg.speaker}" at index ${i}`);
      }
    }
    
    await this.makeRequest('/api/sessions', {
      method: 'PUT',
      body: JSON.stringify({
        sessionId,
        conversation
      })
    });
  }

  async endSession(sessionId, feedback, durationMinutes) {
    console.log('🏁 Ending session...');
    await this.makeRequest('/api/sessions', {
      method: 'PUT',
      body: JSON.stringify({
        sessionId,
        feedback,
        durationMinutes,
        endSession: true
      })
    });
  }

  async getUserSessions(userEmail) {
    console.log('📋 Fetching user sessions...');
    return await this.makeRequest(`/api/sessions?userEmail=${encodeURIComponent(userEmail)}`);
  }

  // AI Chat
  async generateAIResponse(scenarioId, userMessage, conversationHistory) {
    console.log('🤖 Generating AI response...');
    console.log('🆔 Scenario ID:', scenarioId);
    console.log('💬 User message:', userMessage);
    console.log('📚 History length:', conversationHistory.length);
    
    // Validate inputs
    if (!scenarioId) {
      throw new Error('Scenario ID is required');
    }
    if (!userMessage || typeof userMessage !== 'string') {
      throw new Error('User message is required and must be a string');
    }
    if (!Array.isArray(conversationHistory)) {
      throw new Error('Conversation history must be an array');
    }
    
    return await this.makeRequest('/api/ai-chat', {
      method: 'POST',
      body: JSON.stringify({
        scenarioId,
        userMessage,
        conversationHistory
      })
    });
  }

  // NEW METHODS FOR ENHANCED FEEDBACK
  async getUserSessionsWithFeedback(userEmail) {
    console.log('📊 Fetching user sessions with feedback...');
    return await this.makeRequest(`/api/sessions/feedback?userEmail=${encodeURIComponent(userEmail)}`);
  }

  async triggerFeedbackAnalysis(sessionId, conversation, scenario) {
  console.log('🔬 Triggering feedback analysis...');
  console.log('📋 Data:', { sessionId, conversationLength: conversation?.length, scenario: scenario?.title });
  
  return await this.makeRequest('/api/feedback-analysis', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      conversation: conversation || [],
      scenario: scenario || {}
    })
  });
}
async downloadFeedbackReport(sessionId, userEmail) {
  console.log('📄 Generating PDF report client-side...');
  
  try {
    // Get session data
    const sessions = await this.getUserSessions(userEmail);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Parse detailed feedback if available
    let detailedFeedback = null;
    try {
      detailedFeedback = session.detailed_feedback ? JSON.parse(session.detailed_feedback) : null;
    } catch (e) {
      console.log('No detailed feedback available');
    }

    // Generate PDF using client-side library
    await this.generateClientSidePDF(session, detailedFeedback);
    
    // Log the download (optional - simple version)
    console.log('✅ PDF generated successfully');
    return true;

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
}

async generateClientSidePDF(session, detailedFeedback) {
  // Import jsPDF dynamically to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // Helper function to add text
  const addText = (text, x, y, options = {}) => {
    const fontSize = options.fontSize || 12;
    const fontStyle = options.fontStyle || 'normal';
    const maxWidth = options.maxWidth || (pageWidth - margin * 2);
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    
    return y + (lines.length * fontSize * 0.4) + 5;
  };

  // Header with blue background
  doc.setFillColor(103, 126, 234);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('🎯 AI Sales Roleplay - Feedback Report', margin, 25);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  // Session Information
  yPosition = addText('Session Information', margin, yPosition, {
    fontSize: 16,
    fontStyle: 'bold'
  });

  const sessionDate = new Date(session.start_time).toLocaleDateString();
  const sessionTime = new Date(session.start_time).toLocaleTimeString();
  
  yPosition = addText(`Scenario: ${session.scenarios?.title || 'Practice Session'}`, margin, yPosition);
  yPosition = addText(`Character: ${session.scenarios?.character_name || 'N/A'}`, margin, yPosition);
  yPosition = addText(`Date: ${sessionDate} at ${sessionTime}`, margin, yPosition);
  yPosition = addText(`Duration: ${session.duration_minutes || 0} minutes`, margin, yPosition);
  yPosition += 10;

  // Overall Score
  if (session.overall_score) {
    yPosition = addText('Overall Performance', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold'
    });

    const scoreText = `Overall Score: ${session.overall_score}/5.0`;
    const scoreLevel = session.overall_score >= 4 ? 'Excellent' :
                     session.overall_score >= 3 ? 'Good' :
                     session.overall_score >= 2 ? 'Needs Improvement' : 'Poor';
    
    yPosition = addText(`${scoreText} (${scoreLevel})`, margin, yPosition, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    yPosition += 10;
  }

  // Category Breakdown
  if (detailedFeedback && detailedFeedback.categories) {
    yPosition = addText('Skills Assessment', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold'
    });

    const categoryNames = {
      opening: 'Opening & Rapport Building',
      discovery: 'Discovery & Needs Assessment', 
      presentation: 'Solution Presentation',
      objection: 'Objection Handling',
      closing: 'Closing & Next Steps'
    };

    Object.entries(detailedFeedback.categories).forEach(([category, data]) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      yPosition = addText(`${categoryNames[category] || category}`, margin, yPosition, {
        fontSize: 14,
        fontStyle: 'bold'
      });

      yPosition = addText(`Score: ${data.score}/5`, margin + 5, yPosition);
      yPosition = addText(`Feedback: ${data.feedback}`, margin + 5, yPosition);

      if (data.suggestions && data.suggestions.length > 0) {
        yPosition = addText('Improvement Tips:', margin + 5, yPosition, {
          fontStyle: 'bold'
        });
        data.suggestions.forEach(suggestion => {
          yPosition = addText(`• ${suggestion}`, margin + 10, yPosition);
        });
      }
      yPosition += 8;
    });
  }

  // Overall Insights
  if (detailedFeedback && detailedFeedback.overall) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition = addText('Key Insights', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold'
    });

    if (detailedFeedback.overall.strengths.length > 0) {
      yPosition = addText('Your Strengths:', margin, yPosition, {
        fontStyle: 'bold'
      });
      detailedFeedback.overall.strengths.forEach(strength => {
        yPosition = addText(`✓ ${strength}`, margin + 5, yPosition);
      });
      yPosition += 5;
    }

    if (detailedFeedback.overall.improvements.length > 0) {
      yPosition = addText('Areas for Improvement:', margin, yPosition, {
        fontStyle: 'bold'
      });
      detailedFeedback.overall.improvements.forEach(improvement => {
        yPosition = addText(`→ ${improvement}`, margin + 5, yPosition);
      });
      yPosition += 5;
    }

    if (detailedFeedback.overall.nextFocus) {
      yPosition = addText('Next Session Focus:', margin, yPosition, {
        fontStyle: 'bold'
      });
      yPosition = addText(detailedFeedback.overall.nextFocus, margin + 5, yPosition);
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, margin, 285);
    doc.text('AI Sales Roleplay Platform', pageWidth - margin - 40, 285);
  }

  // Download the PDF
  const fileName = `sales-feedback-${session.id.substring(0, 8)}.pdf`;
  doc.save(fileName);
}
}
}

export const apiService = new APIService();
