import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { targetType, targetIds, targetClass, targetSection, title, description, imageUrl } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get Firebase service account key from secrets
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('Firebase service account key not found')
    }

    const serviceAccount = JSON.parse(serviceAccountKey)

    // Get FCM tokens based on target type
    let tokensQuery = supabaseClient
      .from('student_tokens')
      .select('fcm_token')

    if (targetType === 'single' && targetIds?.length > 0) {
      tokensQuery = tokensQuery.eq('student_id', targetIds[0])
    } else if (targetType === 'multiple' && targetIds?.length > 0) {
      tokensQuery = tokensQuery.in('student_id', targetIds)
    } else if (targetType === 'class_section') {
      if (targetClass) tokensQuery = tokensQuery.eq('class', targetClass)
      if (targetSection) tokensQuery = tokensQuery.eq('section', targetSection)
    }
    // For 'whole_school', no additional filters needed

    const { data: tokenData, error: tokenError } = await tokensQuery

    if (tokenError) {
      console.error('Error fetching tokens:', tokenError)
      throw tokenError
    }

    const fcmTokens = tokenData?.map(row => row.fcm_token).filter(Boolean) || []

    if (fcmTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No FCM tokens found for the specified targets' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Get OAuth 2.0 token for FCM
    const authUrl = 'https://oauth2.googleapis.com/token'
    const scope = 'https://www.googleapis.com/auth/firebase.messaging'
    
    // Create JWT for service account authentication
    const now = Math.floor(Date.now() / 1000)
    const iat = now
    const exp = now + 3600 // 1 hour

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    }

    const payload = {
      iss: serviceAccount.client_email,
      scope: scope,
      aud: authUrl,
      iat: iat,
      exp: exp
    }

    // Create JWT token (simplified - in production, use proper JWT library)
    const jwtToken = await createJWT(header, payload, serviceAccount.private_key)

    // Get access token
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    })

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    if (!accessToken) {
      throw new Error('Failed to get access token')
    }

    // Send FCM notifications
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`
    const results = []

    for (const token of fcmTokens) {
      const message = {
        message: {
          token: token,
          notification: {
            title: title,
            body: description,
            ...(imageUrl && imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && { image: imageUrl })
          },
          data: {
            title: title,
            body: description,
            type: 'announcement',
            ...(imageUrl && { imageUrl: imageUrl })
          }
        }
      }

      try {
        const response = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        })

        const result = await response.json()
        results.push({ token, success: response.ok, result })
      } catch (error) {
        results.push({ token, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount}/${totalCount} devices`,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Simplified JWT creation function
async function createJWT(header: any, payload: any, privateKey: string): Promise<string> {
  const encoder = new TextEncoder()
  
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  
  const data = `${headerB64}.${payloadB64}`
  
  // Import private key
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )
  
  // Sign the data
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(data)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return `${data}.${signatureB64}`
}