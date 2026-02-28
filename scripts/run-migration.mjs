#!/usr/bin/env node
/**
 * Run SQL migrations via Supabase
 * Usage: node scripts/run-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qeubpfvvmfgdvjxlvmwh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  // Try to load from secrets file
  try {
    const creds = JSON.parse(fs.readFileSync(
      path.join(process.env.HOME, '.local/secrets/supabase-credentials.json'),
      'utf-8'
    ));
    process.env.SUPABASE_SERVICE_ROLE_KEY = creds.serviceRoleKey;
  } catch {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }
}

const supabase = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'public' } }
);

async function runMigration() {
  console.log('🚀 Running launch_drafts migration...\n');

  // Since we can't run raw SQL via REST API, we'll verify tables exist
  // and provide manual instructions if needed

  // Check if launch_drafts table exists
  const { data: drafts, error: draftsErr } = await supabase
    .from('launch_drafts')
    .select('id')
    .limit(1);

  if (draftsErr?.code === '42P01' || draftsErr?.message?.includes('Could not find the table')) {
    console.log('❌ Table launch_drafts does not exist');
    console.log('\n📋 Please run this SQL in Supabase Dashboard > SQL Editor:\n');
    console.log('─'.repeat(60));
    const sql = fs.readFileSync(path.join(__dirname, '../sql/launch-drafts.sql'), 'utf-8');
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n🔗 https://supabase.com/dashboard/project/qeubpfvvmfgdvjxlvmwh/sql/new');
    return;
  }

  if (draftsErr) {
    console.log('⚠️  Error checking table:', draftsErr.message);
    return;
  }

  console.log('✅ launch_drafts table exists');

  // Check draft_file_chunks
  const { error: chunksErr } = await supabase
    .from('draft_file_chunks')
    .select('id')
    .limit(1);

  if (chunksErr?.code === '42P01') {
    console.log('❌ Table draft_file_chunks does not exist');
  } else if (!chunksErr) {
    console.log('✅ draft_file_chunks table exists');
  }

  // Check user_ipfs_pins
  const { error: pinsErr } = await supabase
    .from('user_ipfs_pins')
    .select('id')
    .limit(1);

  if (pinsErr?.code === '42P01') {
    console.log('❌ Table user_ipfs_pins does not exist');
  } else if (!pinsErr) {
    console.log('✅ user_ipfs_pins table exists');
  }

  console.log('\n✨ Migration check complete!');
}

runMigration().catch(console.error);
