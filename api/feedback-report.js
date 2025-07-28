// Create this file: api/feedback-report.js

import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('📄 PDF Report API called');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId, userEmail } = req.body;

    if (!sessionId || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId or userEmail'
      });
    }

    // Get session data with feedback
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        scenarios (
          title,
          character_name,
          character_role,
          difficulty
        )
      `)
      .eq('id', sessionId)
      .eq('user_email', userEmail) // Security: only user's own sessions
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      });
    }

    // Get detailed category feedback
    const { data: categoryFeedback } = await supabase
      .from('session_feedback')
      .select('*')
      .eq('session_id', sessionId);

    // Log the download attempt
    await logDownload(sessionId, userEmail, req);

    // Generate PDF
    const pdfBuffer = await generateFeedbackPDF(session, categoryFeedback);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sales-feedback-${sessionId.substring(0, 8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report'
    });
  }
}

async function logDownload(sessionId, userEmail, req) {
  try {
    const downloadLog = {
      session_id: sessionId,
      user_email: userEmail,
      download_type: 'pdf',
      user_agent: req.headers['user-agent'] || 'Unknown',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'
    };

    await supabase
      .from('feedback_downloads')
      .insert(downloadLog);

    console.log('✅ Download logged successfully');
  } catch (error) {
    console.error('⚠️ Failed to log download:', error);
    // Don't fail the request if logging fails
  }
}

async function generateFeedbackPDF(session, categoryFeedback) {
  const doc = new jsPDF();
  
  // Parse detailed feedback
  let detailedFeedback = null;
  try {
    detailedFeedback = session.detailed_feedback ? JSON.parse(session.detailed_feedback) : null;
  } catch (e) {
    console.error('Error parsing detailed feedback:', e);
  }

  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to add text with word wrap
  function addText(text, x, y, options = {}) {
    const fontSize = options.fontSize || 12;
    const fontStyle = options.fontStyle || 'normal';
    const maxWidth = options.maxWidth || contentWidth;
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    
    return y + (lines.length * fontSize * 0.4);
  }

  // Header
  doc.setFillColor(103, 126, 234); // Blue background
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255); // White text
  yPosition = addText('🎯 AI Sales Roleplay - Feedback Report', margin, 20, {
    fontSize: 20,
    fontStyle: 'bold'
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // Session Information
  yPosition = addText('Session Information', margin, yPosition, {
    fontSize: 16,
    fontStyle: 'bold'
  });
  yPosition += 5;

  const sessionDate = new Date(session.start_time).toLocaleDateString();
  const sessionTime = new Date(session.start_time).toLocaleTimeString();
  
  yPosition = addText(`Scenario: ${session.scenarios?.title || 'Practice Session'}`, margin, yPosition);
  yPosition = addText(`Character: ${session.scenarios?.character_name || 'N/A'} (${session.scenarios?.character_role || 'N/A'})`, margin, yPosition);
  yPosition = addText(`Difficulty: ${session.scenarios?.difficulty || 'N/A'}`, margin, yPosition);
  yPosition = addText(`Date: ${sessionDate} at ${sessionTime}`, margin, yPosition);
  yPosition = addText(`Duration: ${session.duration_minutes || 0} minutes`, margin, yPosition);
  yPosition += 10;

  // Overall Score
  if (session.overall_score) {
    yPosition = addText('Overall Performance', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold'
    });
    yPosition += 5;

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
    yPosition += 5;

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
      yPosition = addText(`Feedback: ${data.feedback}`, margin + 5, yPosition, {
        maxWidth: contentWidth - 10
      });

      if (data.suggestions && data.suggestions.length > 0) {
        yPosition = addText('Improvement Suggestions:', margin + 5, yPosition, {
          fontStyle: 'bold'
        });
        data.suggestions.forEach(suggestion => {
          yPosition = addText(`• ${suggestion}`, margin + 10, yPosition, {
            maxWidth: contentWidth - 15
          });
        });
      }
      yPosition += 8;
    });
  }

  // Overall Insights
  if (detailedFeedback && detailedFeedback.overall) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition = addText('Key Insights', margin, yPosition, {
      fontSize: 16,
      fontStyle: 'bold'
    });
    yPosition += 5;

    if (detailedFeedback.overall.strengths.length > 0) {
      yPosition = addText('Your Strengths:', margin, yPosition, {
        fontSize: 12,
        fontStyle: 'bold'
      });
      detailedFeedback.overall.strengths.forEach(strength => {
        yPosition = addText(`✓ ${strength}`, margin + 5, yPosition);
      });
      yPosition += 5;
    }

    if (detailedFeedback.overall.improvements.length > 0) {
      yPosition = addText('Areas for Improvement:', margin, yPosition, {
        fontSize: 12,
        fontStyle: 'bold'
      });
      detailedFeedback.overall.improvements.forEach(improvement => {
        yPosition = addText(`→ ${improvement}`, margin + 5, yPosition);
      });
      yPosition += 5;
    }

    if (detailedFeedback.overall.nextFocus) {
      yPosition = addText('Next Session Focus:', margin, yPosition, {
        fontSize: 12,
        fontStyle: 'bold'
      });
      yPosition = addText(detailedFeedback.overall.nextFocus, margin + 5, yPosition, {
        maxWidth: contentWidth - 10
      });
    }
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, margin, 285);
    doc.text('AI Sales Roleplay Platform - Confidential', pageWidth - margin - 50, 285);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
