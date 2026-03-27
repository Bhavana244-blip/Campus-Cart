import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SRM_REGEX = /^[a-zA-Z0-9._%+-]+@srmist\.edu\.in$/;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const email = payload?.record?.email ?? '';

    if (!SRM_REGEX.test(email)) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await supabaseAdmin.auth.admin.deleteUser(payload.record.id);
      return new Response(JSON.stringify({ blocked: true, reason: 'Invalid email domain' }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ allowed: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
