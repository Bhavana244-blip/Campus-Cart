import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();
    
    if (!record) return new Response('No record', { status: 400 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: user } = await supabase
      .from('users')
      .select('expo_push_token')
      .eq('id', record.user_id)
      .single();

    if (!user?.expo_push_token) {
      return new Response('No push token for user', { status: 200 });
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.expo_push_token,
        title: record.title,
        body: record.body,
        data: record.data,
        sound: 'default',
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
