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

    console.log('Received FCM request:', { targetType, targetIds, targetClass, targetSection, title })

    // Validate required fields
    if (!title || !description) {
      throw new Error('Title and description are required')
    }

    if (!targetType || !['single', 'multiple', 'class_section', 'whole_school'].includes(targetType)) {
      throw new Error('Invalid target type')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get Firebase service account key from secrets
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('Firebase service account key not found. Please add FIREBASE_SERVICE_ACCOUNT_KEY secret in Supabase.')
    }

    let serviceAccount
    try {
      serviceAccount = JSON.parse(serviceAccountKey)
    } catch (parseError) {
      console.error('Failed to parse service account key:', parseError)
      throw new Error('Invalid Firebase service account key format')
    }

    // Validate serviceAccount has required fields
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Invalid service account key: missing required fields')
    }

    // Get FCM tokens based on target type
    let tokensQuery = supabaseClient
      .from('student_tokens')
      .select('fcm_token, student_id, class, section')

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
      if (tokenError.code === '42P01') {
        throw new Error('student_tokens table does not exist. Please create it first.')
      }
      throw new Error(`Database error: ${tokenError.message}`)
    }

    const fcmTokens = tokenData?.map(row => row.fcm_token).filter(Boolean) || []
    console.log(`Found ${fcmTokens.length} FCM tokens for target type: ${targetType}`)

    if (fcmTokens.length === 0) {
      let message = 'No FCM tokens found for the specified targets'
      if (targetType === 'single') {
        message = 'No FCM token found for the specified student'
      } else if (targetType === 'multiple') {
        message = 'No FCM tokens found for the specified students'
      } else if (targetType === 'class_section') {
        message = `No FCM tokens found for class ${targetClass}${targetSection ? ` section ${targetSection}` : ''}`
      }
      
      return new Response(
        JSON.stringify({ success: true, message, tokensFound: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Get OAuth 2.0 access token for FCM using Google's official method
    const accessToken = await getAccessToken(serviceAccount)
    
    if (!accessToken) {
      throw new Error('Failed to get Firebase access token')
    }

    // Send FCM notifications (process all tokens, not just 10)
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`
    const results = []
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 50
    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (token) => {
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
          console.log(`FCM response for token ${token.substring(0, 10)}...`, response.status, result)
          return { token: token.substring(0, 10) + '...', success: response.ok, result, status: response.status }
        } catch (error) {
          console.error(`FCM error for token ${token.substring(0, 10)}...`, error)
          return { token: token.substring(0, 10) + '...', success: false, error: error.message }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    console.log(`Notifications sent: ${successCount}/${totalCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Push notifications sent to ${successCount}/${totalCount} devices`,
        tokensFound: totalCount,
        successCount,
        results: results.slice(0, 5) // Only return first 5 results to avoid large responses
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('FCM Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message, timestamp: new Date().toISOString() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Simplified access token function using Google's JWT
async function getAccessToken(serviceAccount: any): Promise<string | null> {
  try {
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
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: iat,
      exp: exp
    }

    // Create JWT token
    const jwtToken = await createJWT(header, payload, serviceAccount.private_key)

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token exchange failed:', response.status, errorText)
      return null
    }

    const data = await response.json()
    console.log('Successfully obtained access token')
    return data.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

// Create JWT using Web Crypto API
async function createJWT(header: any, payload: any, privateKey: string): Promise<string> {
  const encoder = new TextEncoder()
  
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  
  const data = `${headerB64}.${payloadB64}`
  
  // Clean the private key
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  const pemContents = privateKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')
  
  // Convert to binary
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  // Import the key
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
  
  // Convert signature to base64url
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return `${data}.${signatureB64}`
}