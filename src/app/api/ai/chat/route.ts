import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/factory';
import { searchRelevantSchemes } from '@/lib/ai/search';
import { parseAIError } from '@/lib/ai/errors';

function isPromptInjection(message: string): boolean {
  const injectionPatterns = [
    /ignore (all )?previous (instructions|prompts)/i,
    /system prompt/i,
    /act as (chatgpt|an expert in|another ai)/i,
    /pretend to be/i,
    /hidden instructions/i,
    /forget everything/i,
    /reveal your/i,
    /change your role/i
  ];
  return injectionPatterns.some(pattern => pattern.test(message));
}

function isDomainRelevant(message: string): boolean {
  const domainKeywords = [
    "grant", "grants", "scheme", "schemes", "stamp duty", "concession", "duty",
    "home guarantee", "help to buy", "fhss", "fhog", "fhbg", "deposit", 
    "mortgage", "home loan", "loan", "property purchase", "property value",
    "income limit", "eligibility", "eligible", "buying process", "first home",
    "nsw", "vic", "qld", "wa", "sa", "tas", "act", "nt",
    "house", "apartment", "real estate", "buy a home",
    "buy my first", "how much can i borrow", "lmi", "lender", "broker",
    "buy", "buying", "afford"
  ];
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.length < 15 && /^(hi|hello|hey|thanks|thank you|yes|no|ok|okay)$/i.test(lowerMsg.trim())) {
    return true;
  }
  
  return domainKeywords.some(keyword => lowerMsg.includes(keyword));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, eligibilityProfile } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (isPromptInjection(message) || !isDomainRelevant(message)) {
      console.log('Backend Guard Triggered. Skipping Gemini API.');
      const OFF_TOPIC_TEXT = "I'm FirstHomeBuyer AI, designed specifically to help with Australian first home buyer grants, schemes, eligibility, deposits, stamp duty concessions, and related government programs. Please ask a question related to buying your first home in Australia.\n\n__METADATA__\n" + JSON.stringify({ 
        referencedSchemes: [], 
        followUps: ["What grants are available?", "Am I eligible for the Home Guarantee Scheme?", "How much deposit do I need?"] 
      });

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(OFF_TOPIC_TEXT));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const relevantSchemes = await searchRelevantSchemes(message, eligibilityProfile);
    const provider = getAIProvider();

    const stream = await provider.generateChatStream(
      {
        message,
        history: history || [],
        eligibilityProfile,
      },
      relevantSchemes
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    const parsedError = parseAIError(error);
    
    // Log complete technical details only on the server
    console.error('AI Provider Error:', {
      timestamp: new Date().toISOString(),
      provider: getAIProvider().constructor.name,
      status: parsedError.status,
      errorType: parsedError.errorType,
      rawError: error?.message || error
    });

    // Return semantic HTTP status with friendly message
    return NextResponse.json({ 
      error: parsedError.errorType, 
      message: parsedError.friendlyMessage 
    }, { 
      status: parsedError.status 
    });
  }
}
