// app/api/users/route.ts - Enhanced User Management with Better Error Handling
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('🚀 Users API POST request received');
    
    const body = await request.json();
    const { email, name } = body;
    
    console.log('📝 Request data:', { email: email || 'missing', name: name || 'missing' });
    
    if (!email) {
      console.error('❌ Email is required but not provided');
      return Response.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email);
      return Response.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('👤 Creating/updating user:', email);

    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🔧 Environment check:', {
      supabaseUrl: supabaseUrl ? '✓ Set' : '❌ Missing',
      supabaseKey: supabaseKey ? '✓ Set' : '❌ Missing'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return Response.json(
        { success: false, error: 'Database configuration missing. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Initialize Supabase client
    console.log('🗄️ Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connection with a simple query
    try {
      console.log('🔍 Testing database connection...');
      const { data: testData, error: testError } = await supabase
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
        
        // Check if it's a table not found error
        if (testError.code === '42P01') {
          return Response.json(
            { success: false, error: 'Database tables not found. Please run the database setup script.' },
            { status: 500 }
          );
        }
        
        return Response.json(
          { success: false, error: `Database error: ${testError.message}` },
          { status: 500 }
        );
      }
      
      console.log('✅ Database connection successful');
    } catch (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return Response.json(
        { success: false, error: 'Cannot connect to database' },
        { status: 500 }
      );
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
      console.error('Fetch error details:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details
      });
      
      return Response.json(
        { success: false, error: `Database query error: ${fetchError.message}` },
        { status: 500 }
      );
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
        console.error('Update error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details
        });
        
        return Response.json(
          { success: false, error: `Failed to update user: ${updateError.message}` },
          { status: 500 }
        );
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
        console.error('Create error details:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        });
        
        // Handle specific error cases
        if (createError.code === '23505') { // Unique constraint violation
          return Response.json(
            { success: false, error: 'User with this email already exists' },
            { status: 409 }
          );
        }
        
        return Response.json(
          { success: false, error: `Failed to create user: ${createError.message}` },
          { status: 500 }
        );
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
    
    return Response.json(
      { success: false, error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
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

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
    
    return Response.json(
      { success: false, error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
