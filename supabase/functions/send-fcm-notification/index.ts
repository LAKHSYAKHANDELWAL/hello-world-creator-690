import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FCMMessage {
  message: {
    token?: string
    tokens?: string[]
    notification: {
      title: string
      body: string
      image?: string
    }
    data?: {
      [key: string]: string
    }
  }
}

async function getAccessToken(): Promise<string> {
  const serviceAccountKey = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY') || '{}')
  
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  // Create JWT manually or use a library
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const unsignedToken = `${headerB64}.${payloadB64}`
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    encoder.encode(serviceAccountKey.private_key.replace(/\\n/g, '\n')),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedToken)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const jwt = `${unsignedToken}.${signatureB64}`
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  
  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function sendFCMNotification(tokens: string[], title: string, body: string, imageUrl?: string) {
  const accessToken = await getAccessToken()
  const serviceAccountKey = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY') || '{}')
  
  const results = []
  
  for (const token of tokens) {
    const message: FCMMessage = {
      message: {
        token,
        notification: {
          title,
          body,
          ...(imageUrl && { image: imageUrl }),
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          timestamp: Date.now().toString(),
        },
      },
    }
    
    try {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccountKey.project_id}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        }
      )
      
      const result = await response.json()
      results.push({ token, success: response.ok, result })
    } catch (error) {
      results.push({ token, success: false, error: error.message })
    }
  }
  
  return results
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { targetType, targetIds, targetClass, targetSection, title, description, imageUrl } = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Build query based on target type
    let query = supabase.from('student_tokens').select('fcm_token')
    
    switch (targetType) {
      case 'single':
        if (targetIds && targetIds.length > 0) {
          query = query.eq('student_id', targetIds[0])
        }
        break
      case 'multiple':
        if (targetIds && targetIds.length > 0) {
          query = query.in('student_id', targetIds)
        }
        break
      case 'class_section':
        if (targetClass) {
          query = query.eq('class', targetClass)
        }
        if (targetSection) {
          query = query.eq('section', targetSection)
        }
        break
      case 'whole_school':
        // No additional filters needed
        break
      default:
        throw new Error('Invalid target type')
    }
    
    const { data: tokenData, error: tokenError } = await query
    
    if (tokenError) {
      throw tokenError
    }
    
    const tokens = tokenData?.map(row => row.fcm_token).filter(Boolean) || []
    
    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens found for target', sentCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Send notifications
    const results = await sendFCMNotification(tokens, title, description, imageUrl)
    const successCount = results.filter(r => r.success).length
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount}/${tokens.length} devices`,
        sentCount: successCount,
        totalTokens: tokens.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})