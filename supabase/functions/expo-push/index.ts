import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: user, error } = await supabase
      .from('users')
      .select('expo_push_token')
      .eq('id', record.user_id)
      .single()

    if (error || !user?.expo_push_token) {
      console.log('Token não encontrado para:', record.user_id)
      return new Response(JSON.stringify({ error: 'Token não encontrado' }), { status: 400 })
    }

    const expoMessage = {
      to: user.expo_push_token,
      sound: 'default',
      title: record.title,
      body: record.body,
      data: record.data, 
    }

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoMessage),
    })

    const expoData = await expoRes.json()
    return new Response(JSON.stringify(expoData), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return new Response(errorMsg, { status: 500 })
  }
})