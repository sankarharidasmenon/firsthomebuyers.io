import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Since this is an unauthenticated client endpoint usually, we'll use a service role key if available,
// or just the anon key (assuming RLS allows inserts for anon).
// Our migration created an RLS policy: "Anyone can insert ai feedback" ON public.ai_feedback FOR INSERT WITH CHECK (true);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, aiAnswer, feedbackScore, referencedSchemes, metadata } = body;

    if (!question || !aiAnswer || (feedbackScore !== 1 && feedbackScore !== -1)) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ai_feedback')
      .insert([
        {
          question,
          ai_answer: aiAnswer,
          feedback_score: feedbackScore,
          referenced_schemes: referencedSchemes || [],
          metadata: metadata || {}
        }
      ]);

    if (error) {
      console.error('Supabase feedback insert error:', error);
      return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Feedback API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
