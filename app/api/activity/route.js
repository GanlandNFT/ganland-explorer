// API route for fetching activity from Supabase
const SUPABASE_URL = 'https://qeubpfvvmfgdvjxlvmwh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldWJwZnZ2bWZnZHZqeGx2bXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMDAzODEsImV4cCI6MjA4NTU3NjM4MX0.VRibtPt7gEjSBfYwXkPLBNvjKlxjWqJpLa2UJNlzUYI';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'recent';
  const limit = parseInt(searchParams.get('limit') || '10');
  const walletAddress = searchParams.get('wallet');

  try {
    let data = [];

    if (type === 'recent') {
      // Get recent activity across all types
      const [activityRes, collectionsRes, statsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/activity?order=created_at.desc&limit=${limit}`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/collections?is_official=eq.true&order=created_at.desc&limit=5`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/gan_token_stats?order=updated_at.desc&limit=1`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        })
      ]);

      const activity = await activityRes.json();
      const collections = await collectionsRes.json();
      const stats = await statsRes.json();

      data = {
        activity: activity || [],
        collections: collections || [],
        tokenStats: stats?.[0] || null
      };
    }

    if (type === 'wallet' && walletAddress) {
      // Get activity for a specific wallet
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/activity?wallet_address=eq.${walletAddress}&order=created_at.desc&limit=${limit}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      data = await res.json();
    }

    if (type === 'collections') {
      // Get all official collections
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/collections?is_official=eq.true&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      data = await res.json();
    }

    if (type === 'transactions' && walletAddress) {
      // Get transactions for a wallet
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/transactions?or=(from_address.eq.${walletAddress},to_address.eq.${walletAddress})&order=created_at.desc&limit=${limit}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      data = await res.json();
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Activity API error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST to log new activity
export async function POST(request) {
  try {
    const body = await request.json();
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/activity`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        activity_type: body.type,
        wallet_address: body.walletAddress,
        tx_hash: body.txHash,
        chain: body.chain || 'base',
        metadata: body.metadata || {}
      })
    });

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Activity POST error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
