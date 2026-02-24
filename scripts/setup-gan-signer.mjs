#!/usr/bin/env node
/**
 * Setup GAN Agent as an authorization key signer in Privy
 * Run: node scripts/setup-gan-signer.mjs
 */

import { PrivyClient } from '@privy-io/server-auth';
import crypto from 'crypto';
import fs from 'fs';

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmi4n75fu01fhl20dy2gwwr1g';
const APP_SECRET = process.env.PRIVY_APP_SECRET;

if (!APP_SECRET) {
  console.error('❌ PRIVY_APP_SECRET environment variable required');
  console.log('   Set it with: export PRIVY_APP_SECRET="your-secret"');
  process.exit(1);
}

const privy = new PrivyClient(APP_ID, APP_SECRET);

async function main() {
  console.log('🔧 Setting up GAN Agent Signer...\n');
  
  // Step 1: Generate a P256 key pair for the authorization key
  console.log('1️⃣ Generating P256 key pair...');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // P-256
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  
  console.log('   ✅ Key pair generated');
  
  // Export public key in the format Privy expects (base64 DER)
  const publicKeyDer = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
  const publicKeyBase64 = publicKeyDer.toString('base64');
  
  console.log('\n2️⃣ Public Key (base64 DER):');
  console.log(`   ${publicKeyBase64.substring(0, 60)}...`);
  
  // Step 2: Register the authorization key with Privy via API
  console.log('\n3️⃣ Registering authorization key with Privy...');
  
  const authHeader = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64');
  
  // Try to create an authorization key via the API
  const response = await fetch('https://api.privy.io/v1/authorization_keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'privy-app-id': APP_ID,
      'Authorization': `Basic ${authHeader}`,
    },
    body: JSON.stringify({
      name: 'GAN Agent Signer',
      public_key: publicKeyBase64,
    }),
  });
  
  const result = await response.text();
  console.log(`   Response (${response.status}):`, result);
  
  if (response.ok) {
    const data = JSON.parse(result);
    console.log('\n✅ Authorization key created!');
    console.log(`   Key ID: ${data.id}`);
    
    // Save the key info
    const keyInfo = {
      id: data.id,
      name: 'GAN Agent Signer',
      publicKey: publicKeyBase64,
      privateKey: privateKey,
      createdAt: new Date().toISOString(),
    };
    
    const keyPath = '/root/.local/secrets/gan-privy-auth-key.json';
    fs.writeFileSync(keyPath, JSON.stringify(keyInfo, null, 2));
    console.log(`   Saved to: ${keyPath}`);
    
    // Update the route.js with the new key ID
    console.log('\n4️⃣ Update gan-signer/route.js with:');
    console.log(`   const GAN_AUTHORIZATION_KEY_ID = '${data.id}';`);
  } else {
    console.log('\n❌ Failed to create authorization key');
    console.log('   You may need to create it in the Privy Dashboard:');
    console.log('   Dashboard → Settings → Authorization Keys → Create');
  }
}

main().catch(console.error);
