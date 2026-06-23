const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

interface WhatsAppMessage {
  to: string;
  message: string;
  messageType?: 'homework_missed' | 'mission_missed' | 'weekly_progress' | 'big_improvement' | 'risk_warning' | 'custom';
}

export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    console.error('WhatsApp credentials not configured');
    return { success: false, error: 'Not configured' };
  }

  // Format phone number (remove spaces, ensure +60 prefix for Malaysia)
  const formattedPhone = to.replace(/\s+/g, '').replace(/^0/, '60');

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: { body: message, preview_url: false },
  };

  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error?.message };
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function buildWhatsAppMessage(type: string, params: Record<string, string>): string {
  const messages: Record<string, string> = {
    homework_missed: `Hi ${params.parentName}! 👋\n\nYour child *${params.studentName}* has not submitted their ${params.subject} homework yet.\n\nDue date: ${params.dueDate}\n\nPlease encourage them to complete it today. Every lesson matters! 📚\n\n— LearnMate AI`,
    mission_missed: `Hi ${params.parentName}! 📱\n\n*${params.studentName}* missed today's learning mission.\n\nToday's plan was:\n${params.missionDetails}\n\nPlease encourage them to study before bedtime. Just 30 minutes makes a big difference! ✨\n\n— LearnMate AI`,
    weekly_progress: `Hi ${params.parentName}! 📊\n\n*Weekly Report — ${params.studentName}*\n\n✅ Missions completed: ${params.missionsCompleted}\n📝 Homework submitted: ${params.homeworkSubmitted}\n🔥 Study streak: ${params.streak} days\n📈 Exam readiness: ${params.examReadiness}%\n\nSubjects progress:\n${params.subjectProgress}\n\nKeep it up! 💪\n\n— LearnMate AI`,
    big_improvement: `Hi ${params.parentName}! 🎉\n\nExciting news! *${params.studentName}* has made a BIG improvement!\n\n${params.improvementDetails}\n\nWe're so proud of their hard work! Please celebrate this achievement with them. 🌟\n\n— LearnMate AI`,
    risk_warning: `Hi ${params.parentName}! ⚠️\n\nWe noticed *${params.studentName}* needs extra support right now.\n\n${params.warningDetails}\n\nWe recommend:\n• Encourage daily 30-minute study sessions\n• Check homework completion\n• Ask how we can help\n\nLearnMate AI is here to help them catch up! 💙\n\n— LearnMate AI`,
  };

  return messages[type] || params.customMessage || '';
}
