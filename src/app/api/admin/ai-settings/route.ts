import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Helper: verify admin session
async function verifyAdmin(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await serviceClient
    .from('member_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return serviceClient;
}

// GET: List all AI provider keys
export async function GET(request: NextRequest) {
  const serviceClient = await verifyAdmin(request);
  if (!serviceClient) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await serviceClient
    .from('ai_provider_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask API keys for security (show only last 6 chars)
  const masked = (data || []).map((row: any) => ({
    ...row,
    api_key: row.api_key ? '•••••••••' + row.api_key.slice(-6) : '',
  }));

  return NextResponse.json({ providers: masked });
}

// POST: Add or update a provider key
export async function POST(request: NextRequest) {
  const serviceClient = await verifyAdmin(request);
  if (!serviceClient) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, provider, api_key, model_default, model_deep, label, is_active } = body;

  if (!provider || !label) {
    return NextResponse.json({ error: 'provider and label are required' }, { status: 400 });
  }

  // If setting this as active, deactivate all others first
  if (is_active) {
    await serviceClient
      .from('ai_provider_keys')
      .update({ is_active: false })
      .neq('id', id || '00000000-0000-0000-0000-000000000000');
  }

  if (id) {
    // Update existing
    const updateData: any = { provider, model_default, model_deep, label, is_active };
    // Only update api_key if a new one is provided (not the masked one)
    if (api_key && !api_key.startsWith('•')) {
      updateData.api_key = api_key;
    }
    const { data, error } = await serviceClient
      .from('ai_provider_keys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ provider: { ...data, api_key: '•••••••••' + data.api_key.slice(-6) } });
  } else {
    // Insert new
    if (!api_key || api_key.startsWith('•')) {
      return NextResponse.json({ error: 'API key is required for new providers' }, { status: 400 });
    }
    const { data, error } = await serviceClient
      .from('ai_provider_keys')
      .insert({ provider, api_key, model_default, model_deep, label, is_active: is_active ?? false })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ provider: { ...data, api_key: '•••••••••' + data.api_key.slice(-6) } });
  }
}

// DELETE: Remove a provider key
export async function DELETE(request: NextRequest) {
  const serviceClient = await verifyAdmin(request);
  if (!serviceClient) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await serviceClient
    .from('ai_provider_keys')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PUT: Test a provider key
export async function PUT(request: NextRequest) {
  const serviceClient = await verifyAdmin(request);
  if (!serviceClient) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { provider, api_key, model_default } = body;

  try {
    if (provider === 'gemini') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(api_key);
      const model = genAI.getGenerativeModel({ model: model_default || 'gemini-2.5-flash' });
      const result = await model.generateContent('قل: مرحبا، المفتاح يعمل!');
      const text = result.response.text();
      return NextResponse.json({ success: true, message: text });
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api_key}` },
        body: JSON.stringify({
          model: model_default || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'قل: مرحبا، المفتاح يعمل!' }],
          max_tokens: 50,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return NextResponse.json({ success: true, message: data.choices[0].message.content });
    } else if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': api_key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model_default || 'claude-sonnet-4-6-20250514',
          max_tokens: 50,
          messages: [{ role: 'user', content: 'قل: مرحبا، المفتاح يعمل!' }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return NextResponse.json({ success: true, message: data.content[0].text });
    } else if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api_key}` },
        body: JSON.stringify({
          model: model_default || 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: 'قل: مرحبا، المفتاح يعمل!' }],
          max_tokens: 50,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return NextResponse.json({ success: true, message: data.choices[0].message.content });
    } else {
      return NextResponse.json({ error: 'مزود غير مدعوم' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
