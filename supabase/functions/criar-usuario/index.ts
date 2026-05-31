import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autenticado.' }, 401)
    }

    // SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são injetados
    // automaticamente pelo Supabase em toda edge function — sem necessidade de secrets manuais
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verifica quem está chamando usando a sessão do usuário atual
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) return json({ error: 'Não autenticado.' }, 401)

    const { data: authorized } = await callerClient
      .from('authorized_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!authorized) return json({ error: 'Sem permissão.' }, 403)

    const { email, password } = await req.json()
    if (!email || !password) return json({ error: 'E-mail e senha são obrigatórios.' }, 400)

    // Admin client usa a service_role injetada pelo Supabase — nunca exposta no código
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !newUser.user) {
      return json({ error: createError?.message ?? 'Erro ao criar usuário.' }, 400)
    }

    const { error: insertError } = await adminClient
      .from('authorized_users')
      .insert({ user_id: newUser.user.id, email: email })

    if (insertError) {
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return json({ error: 'Erro ao autorizar o usuário. Tente novamente.' }, 500)
    }

    return json({ success: true }, 200)
  } catch {
    return json({ error: 'Erro interno.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
