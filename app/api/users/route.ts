// app/api/users/route.ts - Enhanced User Management with Better Environment Variable Handling
import { createClient } from '@supabase/supabase-js';

// Environment variable checker
function checkEnvironmentVariables() {
  console.log('🔧 Checking environment variables...');
  
  const requiredVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  };

  console.log('🔍 Environment variable status:');
  Object.entries(requiredVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✓ Set' : '❌ Missing'}`);
  });

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const availableEnvVars = Object.keys(process.env)
      .filter(key => key.includes('SUPABASE') || key.includes('NEXT_PUBLIC'))
      .sort();
    
    console.error('❌ Missing required variables:', missing);
    console.log('📋 Available Supabase-related env vars:', availableEnvVars);
    
    return {
      isValid: false,
      missing,
      available: availableEnvVars,
      error: `Missing environment variables: ${missing.join(', ')}`
    };
  }

  return {
    isValid: true,
    missing: [],
    available: Object.keys(requiredVars),
    error: null
  };
}

export async function POST(request: Request) {
  try {
    console.log('🚀 Users API POST request received');
    
    // Check environment variables first
    const envCheck = checkEnvironmentVariables();
    if (!envCheck.isValid) {
      return Response.json({
        success: false,
        error: 'Database configuration missing. Please check environment variables.',
        details: {
          missing: envCheck.missing,
          available: envCheck.available,
          help: 'Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in your Vercel environment variables'
        }
      }, { status: 500 });
    }

    const body = await request.json();
    const { email, name } = body;
    
    console.log('📝 Request data:', { email: email || 'missing', name: name || 'missing' });
    
    if (!email) {
      console.error('❌ Email is required but not provided');
      return Response.json(
        { 
          success: false, 
          error: 'Email is required',
          received: { email, name }
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email);
      return Response.json(
        { 
          success: false, 
          error: 'Invalid email format',
          received: email
        },
        { status: 400 }
      );
    }

    console.log('👤 Creating/updating user:', email);

    // Initialize Supabase client with verified environment variables
    console.log('🗄️ Initializing Supabase client...');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    // Test database connection
    try {
      console.log('🔍 Testing database connection...');
      const { error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection test failed:', testError);
        console.error('Error details:', {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        });
        
        if (testError.code === '42P01') {
          return Response.json({
            success: false,
            error: 'Database tables not found. Please run the database setup script.',
            details: testError
          }, { status: 500 });
        }
        
        return Response.json({
          success: false,
          error: `Database connection failed: ${testError.message}`,
          details: testError
        }, { status: 500 });
      }
      
      console.log('✅ Database connection successful');
    } catch (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return Response.json({
        success: false,
        error: 'Cannot connect to database',
        details: connectionError instanceof Error ? connectionError.message : 'Unknown connection error'
      }, { status: 500 });
    }
    
    // Check if user exists
    console.log('🔍 Checking if user exists:', email);
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching user:', fetchError);
      return Response.json({
        success: false,
        error: `Database query error: ${fetchError.message}`,
        details: fetchError
      }, { status: 500 });
    }

    if (existingUser) {
      console.log('✅ User exists, updating login time:', email);
      
      // Update last login
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          name: name || existingUser.name
        })
        .eq('email', email)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return Response.json({
          success: false,
          error: `Failed to update user: ${updateError.message}`,
          details: updateError
        }, { status: 500 });
      }

      console.log('✅ User login updated successfully:', email);
      return Response.json({
        success: true,
        data: {
          user: updatedUser,
          isNewUser: false
        }
      });
    } else {
      console.log('🆕 Creating new user:', email);
      
      // Create new user
      const userData = {
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        last_login: new Date().toISOString(),
        total_sessions: 0,
        total_minutes: 0
      };
      
      console.log('📝 User data to insert:', userData);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        
        if (createError.code === '23505') { // Unique constraint violation
          return Response.json({
            success: false,
            error: 'User with this email already exists'
          }, { status: 409 });
        }
        
        return Response.json({
          success: false,
          error: `Failed to create user: ${createError.message}`,
          details: createError
        }, { status: 500 });
      }

      console.log('✅ New user created successfully:', email);
      return Response.json({
        success: true,
        data: {
          user: newUser,
          isNewUser: true
        }
      });
    }

  } catch (error) {
    console.error('💥 Users API unexpected error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return Response.json({
      success: false,
      error: `Internal server error: ${errorMessage}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return Response.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    // Check environment variables
    const envCheck = checkEnvironmentVariables();
    if (!envCheck.isValid) {
      return Response.json({
        success: false,
        error: 'Database configuration missing',
        details: envCheck
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    // Get user with progress stats
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        sessions:sessions(count),
        user_progress:user_progress(*)
      `)
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ Error fetching user details:', error);
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('💥 User GET API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return Response.json({
      success: false,
      error: `Internal server error: ${errorMessage}`
    }, { status: 500 });
  }
}
