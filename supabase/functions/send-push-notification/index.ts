import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PushNotificationRequest {
  announcementId: string;
  title: string;
  body: string;
  imageUrl?: string;
  targetType: 'single' | 'multiple' | 'class_section' | 'whole_school';
  targetIds?: string[];
  targetClass?: string;
  targetSection?: string;
}

interface FCMMessage {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
      image?: string;
    };
    data?: {
      announcementId: string;
      type: string;
    };
  };
}

async function getAccessToken(): Promise<string> {
  try {
    const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found');
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Create JWT for Firebase Admin SDK
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // 1 hour
    };

    // Import crypto for JWT signing
    const encoder = new TextEncoder();
    const keyData = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    // For simplicity, we'll use a basic JWT implementation
    // In production, consider using a proper JWT library
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payloadStr = btoa(JSON.stringify(payload));
    
    // Import the private key
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(keyData),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      encoder.encode(`${header}.${payloadStr}`)
    );

    const jwt = `${header}.${payloadStr}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

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
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

async function sendFCMMessage(accessToken: string, projectId: string, message: FCMMessage): Promise<boolean> {
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`FCM send failed for token ${message.message.token}:`, errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error sending FCM message to ${message.message.token}:`, error);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: PushNotificationRequest = await req.json();
    const { 
      announcementId, 
      title, 
      body, 
      imageUrl, 
      targetType, 
      targetIds, 
      targetClass, 
      targetSection 
    } = requestData;

    // Build query to get FCM tokens based on target type
    let tokensQuery = supabase.from('student_tokens').select('fcm_token, student_id');

    switch (targetType) {
      case 'single':
        if (!targetIds || targetIds.length === 0) {
          throw new Error('Student ID required for single targeting');
        }
        tokensQuery = tokensQuery.eq('student_id', targetIds[0]);
        break;
        
      case 'multiple':
        if (!targetIds || targetIds.length === 0) {
          throw new Error('Student IDs required for multiple targeting');
        }
        tokensQuery = tokensQuery.in('student_id', targetIds);
        break;
        
      case 'class_section':
        if (!targetClass) {
          throw new Error('Class required for class/section targeting');
        }
        tokensQuery = tokensQuery.eq('class', targetClass);
        if (targetSection) {
          tokensQuery = tokensQuery.eq('section', targetSection);
        }
        break;
        
      case 'whole_school':
        // No additional filters needed
        break;
        
      default:
        throw new Error('Invalid target type');
    }

    const { data: tokens, error: tokensError } = await tokensQuery;
    
    if (tokensError) {
      throw new Error(`Failed to fetch FCM tokens: ${tokensError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No FCM tokens found for the specified targets',
          sentCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Firebase access token
    const accessToken = await getAccessToken();
    const projectId = 'studentapp-4b375';

    // Send push notifications to all tokens
    const sendPromises = tokens.map(async (tokenData) => {
      const message: FCMMessage = {
        message: {
          token: tokenData.fcm_token,
          notification: {
            title,
            body,
            ...(imageUrl && { image: imageUrl }),
          },
          data: {
            announcementId,
            type: 'announcement',
          },
        },
      };

      return await sendFCMMessage(accessToken, projectId, message);
    });

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failureCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Push notifications sent successfully`,
        sentCount: successCount,
        failedCount: failureCount,
        totalTokens: tokens.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        sentCount: 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});