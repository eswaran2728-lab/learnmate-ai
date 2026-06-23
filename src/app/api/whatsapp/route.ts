import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage, buildWhatsAppMessage } from '@/lib/whatsapp/client';

// Webhook verification
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// Send WhatsApp notification
export async function POST(req: NextRequest) {
  try {
    const { type, studentId, parentId, customMessage } = await req.json();
    const supabase = await createClient();

    const { data: parent } = await supabase.from('parents').select('*').eq('id', parentId).single();
    const { data: student } = await supabase.from('students').select('*').eq('id', studentId).single();

    if (!parent?.whatsapp_number || !parent.whatsapp_opted_in) {
      return NextResponse.json({ error: 'Parent not opted in to WhatsApp' }, { status: 400 });
    }

    const message = buildWhatsAppMessage(type, {
      parentName: parent.full_name,
      studentName: student?.full_name || 'your child',
      customMessage,
    });

    const result = await sendWhatsAppMessage({
      to: parent.whatsapp_number,
      message,
      messageType: type,
    });

    // Log the message
    await supabase.from('whatsapp_logs').insert({
      parent_id: parentId,
      student_id: studentId,
      phone_number: parent.whatsapp_number,
      message_type: type,
      message_content: message,
      status: result.success ? 'sent' : 'failed',
      whatsapp_message_id: result.messageId,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error('WhatsApp error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
