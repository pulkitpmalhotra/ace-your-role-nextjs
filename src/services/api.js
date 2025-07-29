// src/services/api.js - COMPLETE FIXED VERSION with authentication headers

class APIService {
  constructor() {
    this.baseUrl = 'https://ai-roleplay-free.vercel.app';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get user email from sessionStorage for authentication
    const userEmail = sessionStorage.getItem('userEmail');
    
    console.log('🚀 API Request:', {
      url,
      method: options.method || 'GET',
      userEmail: userEmail || 'Not found in sessionStorage',
      endpoint
    });
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // Always send user email header for legacy auth
          ...(userEmail && { 'X-User-Email': userEmail }),
          ...options.headers
        },
        ...options
      });

      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ API Error Response:', responseText);
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.error('🔐 Authentication failed - check user email in sessionStorage');
          throw new Error('Authentication failed. Please log in again.');
        }
        
        let errorDetails = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails = errorJson.error || errorJson.message || responseText;
        } catch (e) {
          // Use raw text if not JSON
        }
        
        throw new Error(`HTTP ${response.status}: ${errorDetails}`);
      }

      const responseText = await response.text();
      console.log('📄 Raw response:', responseText.substring(0, 200) + '...');

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      // Return the full response (including metadata) for scenarios
      return endpoint.includes('/api/scenarios') ? data : data.data;
    } catch (error) {
      console.error('💥 API Request failed:', error);
      console.error('🔗 URL was:', url);
      throw error;
    }
  }

  // Scenarios API methods
  async getScenariosWithFilters(filters = {}) {
    console.log('📚 Fetching scenarios with filters:', filters);
    
    // Build query parameters
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const endpoint = `/api/scenarios${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔗 Requesting:', endpoint);
    
    const response = await this.makeRequest(endpoint);
    return response; // Return full response with metadata
  }

  async getScenarios() {
    console.log('📚 Fetching all scenarios...');
    return await this.getScenariosWithFilters({});
  }

  // Sessions API methods
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
      if (!msg || typeof msg !== 'object') {
        console.error(`❌ Invalid message at index ${i}:`, msg);
        throw new Error(`Invalid message format at index ${i}`);
      }
      
      if (!msg.speaker || !msg.message || !msg.timestamp) {
        console.error(`❌ Missing required fields in message ${i}:`, msg);
        throw new Error(`Missing required fields in message ${i}`);
      }

      if (!['user', 'ai'].includes(msg.speaker)) {
        console.error(`❌ Invalid speaker in message ${i}:`, msg.speaker);
        throw new Error(`Invalid speaker "${msg.speaker}" in message ${i}`);
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
    console.log('📋 Fetching user sessions for:', userEmail);
    
    // Double-check sessionStorage has the email
    const storedEmail = sessionStorage.getItem('userEmail');
    console.log('📧 SessionStorage email:', storedEmail);
    
    if (!storedEmail) {
      console.warn('⚠️ No email in sessionStorage - this may cause auth issues');
    }
    
    return await this.makeRequest(`/api/sessions?userEmail=${encodeURIComponent(userEmail)}`);
  }

  // AI Chat API methods
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

  // Enhanced Feedback API methods
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

  // User management methods
  async createOrVerifyUser(email) {
    console.log('👤 Creating/verifying user in Supabase:', email);
    
    try {
      // Try to create user via our API
      const response = await this.makeRequest('/api/user-management', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'create-or-verify',
          email: email 
        })
      });
      
      console.log('✅ User created/verified:', response);
      return response;
    } catch (error) {
      console.error('❌ User creation failed:', error);
      throw error;
    }
  }

  // Authentication API methods (for future use)
  async authenticateUser(email, password) {
    console.log('🔐 Authenticating user...');
    return await this.makeRequest('/api/auth?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async registerUser(email, password, userData = {}) {
    console.log('📝 Registering new user...');
    return await this.makeRequest('/api/auth?action=register', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData })
    });
  }

  // PDF Download - Client-Side Generation
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
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Consistent font settings
    const fonts = {
      title: { size: 20, style: 'bold' },
      heading: { size: 16, style: 'bold' },
      subheading: { size: 14, style: 'bold' },
      body: { size: 11, style: 'normal' },
      small: { size: 9, style: 'normal' }
    };

    // Helper function to add text with consistent styling
    const addText = (text, x, y, fontType = 'body', options = {}) => {
      const font = fonts[fontType];
      const maxWidth = options.maxWidth || contentWidth;
      const color = options.color || [0, 0, 0];
      const lineHeight = options.lineHeight || 1.2;
      
      doc.setFont('helvetica', font.style);
      doc.setFontSize(font.size);
      doc.setTextColor(color[0], color[1], color[2]);
      
      // Handle text wrapping
      const lines = doc.splitTextToSize(text, maxWidth);
      
      // Check if we need a new page
      const textHeight = lines.length * font.size * lineHeight * 0.352778; // Convert to mm
      if (y + textHeight > pageHeight - 30) {
        doc.addPage();
        y = 30;
      }
      
      doc.text(lines, x, y);
      
      return y + textHeight + 5; // Add some spacing
    };

    // Header with logo area
    doc.setFillColor(103, 126, 234);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('🎯 Ace Your Role', margin, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('Professional Skills Development Report', margin, 35);
    
    // Reset position
    yPosition = 55;

    // User Information
    yPosition = addText('REPORT DETAILS', margin, yPosition, 'heading', { color: [59, 130, 246] });
    yPosition += 5;

    const sessionDate = new Date(session.start_time).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const sessionTime = new Date(session.start_time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create a clean info box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition, contentWidth, 45, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, yPosition, contentWidth, 45, 'S');

    yPosition += 8;
    yPosition = addText(`User: ${session.user_email || 'Not specified'}`, margin + 10, yPosition, 'body');
    yPosition = addText(`Scenario: ${session.scenarios?.title || 'Practice Session'}`, margin + 10, yPosition, 'body');
    yPosition = addText(`Character: ${session.scenarios?.character_name || 'N/A'} (${session.scenarios?.character_role || 'N/A'})`, margin + 10, yPosition, 'body');
    yPosition = addText(`Date: ${sessionDate} at ${sessionTime}`, margin + 10, yPosition, 'body');
    yPosition = addText(`Duration: ${session.duration_minutes || 0} minutes`, margin + 10, yPosition, 'body');
    
    yPosition += 15;

    // Overall Performance Section
    if (session.overall_score) {
      yPosition = addText('OVERALL PERFORMANCE', margin, yPosition, 'heading', { color: [59, 130, 246] });
      yPosition += 5;

      const scoreLevel = session.overall_score >= 4 ? 'Excellent' :
                       session.overall_score >= 3 ? 'Good' :
                       session.overall_score >= 2 ? 'Needs Improvement' : 'Poor';
      
      const scoreColor = session.overall_score >= 4 ? [34, 197, 94] :
                        session.overall_score >= 3 ? [245, 158, 11] :
                        session.overall_score >= 2 ? [249, 115, 22] : [239, 68, 68];

      // Score display box
      doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.rect(margin, yPosition, 60, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`${session.overall_score.toFixed(1)}/5.0`, margin + 5, yPosition + 13);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Performance Level: ${scoreLevel}`, margin + 70, yPosition + 13);
      
      yPosition += 35;
    }

    // Skills Assessment Section
    if (detailedFeedback && detailedFeedback.categories) {
      yPosition = addText('SKILLS ASSESSMENT', margin, yPosition, 'heading', { color: [59, 130, 246] });
      yPosition += 10;

      const categoryNames = {
        opening: 'Opening & Rapport Building',
        discovery: 'Discovery & Needs Assessment',
        presentation: 'Solution Presentation',
        objection: 'Objection Handling',
        closing: 'Closing & Next Steps'
      };

      Object.entries(detailedFeedback.categories).forEach(([category, data]) => {
        // Check for page break
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 30;
        }

        // Category header with score
        const categoryTitle = categoryNames[category] || category;
        yPosition = addText(categoryTitle, margin, yPosition, 'subheading');
        
        // Score badge
        const scoreColor = data.score >= 4 ? [34, 197, 94] :
                          data.score >= 3 ? [245, 158, 11] :
                          data.score >= 2 ? [249, 115, 22] : [239, 68, 68];
        
        doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.rect(margin + 120, yPosition - 12, 25, 12, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${data.score}/5`, margin + 125, yPosition - 4);

        yPosition += 3;

        // Feedback text
        yPosition = addText(`Assessment: ${data.feedback}`, margin + 5, yPosition, 'body', {
          maxWidth: contentWidth - 10
        });

        // Improvement suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          yPosition = addText('Improvement Recommendations:', margin + 5, yPosition, 'body', {
            color: [59, 130, 246]
          });
          
          data.suggestions.forEach((suggestion) => {
            yPosition = addText(`• ${suggestion}`, margin + 10, yPosition, 'body', {
              maxWidth: contentWidth - 15
            });
          });
        }
        
        yPosition += 8;
      });
    }

    // Key Insights Section
    if (detailedFeedback && detailedFeedback.overall) {
      // Check for page break
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 30;
      }

      yPosition = addText('KEY INSIGHTS', margin, yPosition, 'heading', { color: [59, 130, 246] });
      yPosition += 10;

      if (detailedFeedback.overall.strengths.length > 0) {
        yPosition = addText('Your Strengths:', margin, yPosition, 'subheading', { color: [34, 197, 94] });
        detailedFeedback.overall.strengths.forEach(strength => {
          yPosition = addText(`✓ ${strength}`, margin + 5, yPosition, 'body');
        });
        yPosition += 5;
      }

      if (detailedFeedback.overall.improvements.length > 0) {
        yPosition = addText('Areas for Improvement:', margin, yPosition, 'subheading', { color: [249, 115, 22] });
        detailedFeedback.overall.improvements.forEach(improvement => {
          yPosition = addText(`→ ${improvement}`, margin + 5, yPosition, 'body');
        });
        yPosition += 5;
      }

      if (detailedFeedback.overall.nextFocus) {
        yPosition = addText('Next Session Focus:', margin, yPosition, 'subheading', { color: [139, 92, 246] });
        yPosition = addText(detailedFeedback.overall.nextFocus, margin + 5, yPosition, 'body', {
          maxWidth: contentWidth - 10
        });
      }
    }

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      // Footer text
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 15);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 15);
      doc.text('AI Sales Roleplay Platform - Confidential', margin, pageHeight - 8);
    }

    // Download the PDF
    const fileName = `sales-feedback-${session.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Performance monitoring methods
  async logPerformance(type, data, userEmail) {
    try {
      await this.makeRequest('/api/performance', {
        method: 'POST',
        body: JSON.stringify({
          type,
          data,
          userEmail: userEmail || 'anonymous'
        })
      });
    } catch (error) {
      console.warn('Failed to log performance data:', error);
      // Don't throw - performance logging shouldn't break the app
    }
  }

  async getPerformanceMetrics() {
    try {
      return await this.makeRequest('/api/performance');
    } catch (error) {
      console.warn('Failed to get performance metrics:', error);
      return null;
    }
  }

  // Data management methods
  async exportUserData(userEmail) {
    console.log('📤 Exporting user data...');
    return await this.makeRequest(`/api/data-management?action=export&userEmail=${encodeURIComponent(userEmail)}`);
  }

  async getDataSummary(userEmail) {
    console.log('📊 Getting data summary...');
    return await this.makeRequest(`/api/data-management?action=summary&userEmail=${encodeURIComponent(userEmail)}`);
  }

  async deleteAccount(userEmail, confirmEmail, reason = '') {
    console.log('🗑️ Deleting account...');
    return await this.makeRequest('/api/data-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete-account',
        confirmEmail,
        reason
      })
    });
  }

  async deleteOldConversations(userEmail, olderThanDays = 90) {
    console.log('🗑️ Deleting old conversations...');
    return await this.makeRequest('/api/data-management', {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete-conversations',
        olderThan: olderThanDays
      })
    });
  }

  // Debug helper method
  debugSessionStorage() {
    console.log('🔍 SessionStorage Debug:');
    console.log('  - userEmail:', sessionStorage.getItem('userEmail'));
    console.log('  - currentState:', sessionStorage.getItem('currentState'));
    console.log('  - all keys:', Object.keys(sessionStorage));
  }
}

export const apiService = new APIService();
