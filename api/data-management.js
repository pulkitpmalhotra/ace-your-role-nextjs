// api/data-management.js - Fixed GDPR compliance and data management
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
// api/data-management.js - Add granular controls
const dataHandlers = {
  'export-category': async (req, res) => {
    const { category, userEmail } = req.body;
    const data = await exportUserDataByCategory(userEmail, category);
    res.json({ success: true, data, downloadUrl: generateSecureDownloadLink(data) });
  },
  
  'delete-category': async (req, res) => {
    const { category, userEmail, confirmation } = req.body;
    await deleteUserDataByCategory(userEmail, category, confirmation);
    await logGDPRAction('category-deletion', userEmail, { category });
    res.json({ success: true, message: `${category} data deleted` });
  },
  
  'data-summary': async (req, res) => {
    const summary = await generateDataSummary(req.user.email);
    res.json({ success: true, data: summary });
  }
};
async function handler(req, res) {
  console.log('🛡️ Data Management API called');
  console.log('Method:', req.method);
  console.log('Action:', req.query.action || req.body?.action);

  if (req.method === 'GET') {
    // Handle data export requests
    const action = req.query.action;
    
    if (action === 'export') {
      await handleDataExport(req, res);
    } else if (action === 'summary') {
      await handleDataSummary(req, res);
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Use "export" or "summary"'
      });
    }

  } else if (req.method === 'POST') {
    // Handle data management actions
    const { action } = req.body;
    
    switch (action) {
      case 'delete-account':
        await handleAccountDeletion(req, res);
        break;
      case 'delete-conversations':
        await handleConversationDeletion(req, res);
        break;
      case 'update-preferences':
        await handlePreferencesUpdate(req, res);
        break;
      case 'request-deletion':
        await handleDeletionRequest(req, res);
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

  } else if (req.method === 'DELETE') {
    // Handle immediate deletions
    await handleImmediateDeletion(req, res);

  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}

async function handleDataExport(req, res) {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email required'
      });
    }

    console.log('📤 Exporting data for user:', userEmail);

    // Get all user data
    const userData = await collectUserData(userEmail);
    
    // Create export package
    const exportPackage = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userEmail: userEmail,
        dataTypes: Object.keys(userData),
        totalRecords: Object.values(userData).reduce((sum, data) => sum + (Array.isArray(data) ? data.length : 1), 0)
      },
      userData: userData,
      metadata: {
        format: 'JSON',
        version: '1.0',
        description: 'Complete export of your Ace Your Role data'
      }
    };

    // Log the export request
    await logDataAction('export', userEmail, { recordCount: exportPackage.exportInfo.totalRecords });

    res.status(200).json({
      success: true,
      data: exportPackage
    });

  } catch (error) {
    console.error('❌ Data export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
}

async function handleDataSummary(req, res) {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email required'
      });
    }

    console.log('📊 Getting data summary for user:', userEmail);

    const summary = await getDataSummary(userEmail);

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Data summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data summary'
    });
  }
}

async function handleAccountDeletion(req, res) {
  try {
    const userEmail = req.user?.email;
    const { confirmEmail, reason } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email required'
      });
    }

    if (confirmEmail !== userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email confirmation does not match'
      });
    }

    console.log('🗑️ Deleting account for user:', userEmail);

    // Delete all user data
    await deleteAllUserData(userEmail, reason);

    // Log the deletion
    await logDataAction('account-deletion', userEmail, { reason });

    res.status(200).json({
      success: true,
      message: 'Account and all associated data have been permanently deleted'
    });

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
}

async function handleConversationDeletion(req, res) {
  try {
    const userEmail = req.user?.email;
    const { olderThan } = req.body; // Delete conversations older than X days

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email required'
      });
    }

    console.log('🗑️ Deleting conversations for user:', userEmail);

    const deletedCount = await deleteOldConversations(userEmail, olderThan || 90);

    await logDataAction('conversation-deletion', userEmail, { deletedCount, olderThan });

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount} old conversations`,
      deletedCount
    });

  } catch (error) {
    console.error('❌ Conversation deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversations'
    });
  }
}

async function handlePreferencesUpdate(req, res) {
  try {
    const userEmail = req.user?.email;
    const { preferences } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email required'
      });
    }

    console.log('⚙️ Updating preferences for user:', userEmail);

    // Update user preferences in database - removed updated_at as it's handled by trigger
    const { error } = await supabase
      .from('users')
      .update({ 
        preferences: preferences
        // updated_at is handled automatically by database trigger
      })
      .eq('email', userEmail);

    if (error) {
      throw error;
    }

    await logDataAction('preferences-update', userEmail, { preferences });

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('❌ Preferences update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
}

async function collectUserData(userEmail) {
  console.log('📦 Collecting all data for user:', userEmail);

  try {
    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    // Get sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_email', userEmail)
      .order('start_time', { ascending: false });

    // Get feedback
    const sessionIds = sessions?.map(s => s.id) || [];
    let feedback = [];
    
    if (sessionIds.length > 0) {
      const { data: feedbackData } = await supabase
        .from('session_feedback')
        .select('*')
        .in('session_id', sessionIds);
      
      feedback = feedbackData || [];
    }

    return {
      profile: user ? {
        email: user.email,
        fullName: user.full_name,
        company: user.company,
        role: user.role,
        createdAt: user.created_at,
        preferences: user.preferences
      } : null,
      sessions: sessions?.map(session => ({
        id: session.id,
        scenarioId: session.scenario_id,
        startTime: session.start_time,
        endTime: session.end_time,
        duration: session.duration_minutes,
        overallScore: session.overall_score,
        // Note: conversation data excluded for privacy unless specifically requested
        conversationLength: session.conversation?.length || 0
      })) || [],
      feedback: feedback || [],
      summary: {
        totalSessions: sessions?.length || 0,
        totalFeedback: feedback?.length || 0,
        accountAge: user ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    };

  } catch (error) {
    console.error('❌ Error collecting user data:', error);
    throw error;
  }
}

async function getDataSummary(userEmail) {
  try {
    const userData = await collectUserData(userEmail);
    
    return {
      profile: {
        hasData: !!userData.profile,
        createdAt: userData.profile?.createdAt,
        lastUpdated: userData.profile?.updatedAt
      },
      sessions: {
        count: userData.sessions.length,
        oldestSession: userData.sessions.length > 0 ? userData.sessions[userData.sessions.length - 1].startTime : null,
        newestSession: userData.sessions.length > 0 ? userData.sessions[0].startTime : null
      },
      feedback: {
        count: userData.feedback.length
      },
      dataRetention: {
        conversationsRetainedFor: '90 days',
        feedbackRetainedFor: '2 years',
        profileRetainedUntil: 'Account deletion'
      },
      rights: {
        canExport: true,
        canDelete: true,
        canCorrect: true,
        canOptOut: true
      }
    };

  } catch (error) {
    console.error('❌ Error getting data summary:', error);
    throw error;
  }
}

async function deleteAllUserData(userEmail, reason) {
  console.log('🗑️ Starting complete data deletion for:', userEmail);

  try {
    // Get all session IDs first
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_email', userEmail);

    const sessionIds = sessions?.map(s => s.id) || [];

    // Delete feedback records
    if (sessionIds.length > 0) {
      await supabase
        .from('session_feedback')
        .delete()
        .in('session_id', sessionIds);
    }

    // Delete sessions
    await supabase
      .from('sessions')
      .delete()
      .eq('user_email', userEmail);

    // Delete user profile
    await supabase
      .from('users')
      .delete()
      .eq('email', userEmail);

    console.log('✅ Successfully deleted all data for user:', userEmail);

  } catch (error) {
    console.error('❌ Error deleting user data:', error);
    throw error;
  }
}

async function deleteOldConversations(userEmail, olderThanDays) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Update sessions to remove conversation data
    const { data, error } = await supabase
      .from('sessions')
      .update({ conversation: [] })
      .eq('user_email', userEmail)
      .lt('start_time', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;

    return data?.length || 0;

  } catch (error) {
    console.error('❌ Error deleting old conversations:', error);
    throw error;
  }
}

async function logDataAction(action, userEmail, metadata) {
  try {
    // Log data management actions for compliance
    console.log('📝 Logging data action:', { action, userEmail, metadata });
    
    // In a production system, you'd want to store these logs
    // in a secure, append-only table for compliance purposes
    
  } catch (error) {
    console.error('❌ Error logging data action:', error);
    // Don't throw - logging shouldn't break the operation
  }
}

// Automated data retention cleanup (run this periodically)
export async function runDataRetentionCleanup() {
  console.log('🧹 Running automated data retention cleanup...');

  try {
    // Delete conversations older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { data, error } = await supabase
      .from('sessions')
      .update({ conversation: [] })
      .lt('start_time', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;

    console.log(`✅ Cleaned up ${data?.length || 0} old conversations`);

    return {
      success: true,
      cleanedRecords: data?.length || 0
    };

  } catch (error) {
    console.error('❌ Data retention cleanup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default withAuth(handler);
