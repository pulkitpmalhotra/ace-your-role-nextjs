// app/api/users/route.ts - User Management
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    
    if (!email) {
      return Response.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('👤 Creating/updating user:', email);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { success: false, error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error fetching user:', fetchError);
      return Response.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (existingUser) {
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
        return Response.json(
          { success: false, error: 'Failed to update user' },
          { status: 500 }
        );
      }

      console.log('✅ User login updated:', email);
      return Response.json({
        success: true,
        data: {
          user: updatedUser,
          isNewUser: false
        }
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          name: name || email.split('@')[0],
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return Response.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }

      console.log('✅ New user created:', email);
      return Response.json({
        success: true,
        data: {
          user: newUser,
          isNewUser: true
        }
      });
    }

  } catch (error) {
    console.error('💥 Users API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
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
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
