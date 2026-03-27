import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();
    if (!record) return new Response('No record', { status: 400 });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch conversation to determine who the sender/recipient is
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', record.conversation_id)
      .single();

    if (!conversation) return new Response('Conversation not found', { status: 404 });

    const isBuyerSender = record.sender_id === conversation.buyer_id;

    // Update the conversation's last message, last_message_at, and increment unread count for recipient
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message: record.content.substring(0, 100),
        last_message_at: record.created_at,
        buyer_unread_count: isBuyerSender ? conversation.buyer_unread_count : conversation.buyer_unread_count + 1,
        seller_unread_count: !isBuyerSender ? conversation.seller_unread_count : conversation.seller_unread_count + 1,
      })
      .eq('id', record.conversation_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
