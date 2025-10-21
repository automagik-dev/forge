#!/usr/bin/env node

// Test script to verify Sentry connection
// Usage: node test-sentry.js

const YOUR_DSN = 'https://fa5e961d24021da4e6df30e5beee03af@o4509714066571264.ingest.us.sentry.io/4509714113495040';
const UPSTREAM_DSN = 'https://1065a1d276a581316999a07d5dffee26@o4509603705192449.ingest.de.sentry.io/4509605576441937';

async function parseDSN(dsn) {
  const url = new URL(dsn);
  return {
    key: url.username,
    project: url.pathname.substring(1),
    host: url.host,
    protocol: url.protocol.replace(':', ''),
  };
}

async function testSentry(dsn, label) {
  console.log(`\n🔍 Testing ${label} Sentry configuration...\n`);

  const config = await parseDSN(dsn);
  console.log(`Key: ${config.key.substring(0, 15)}...`);
  console.log(`Project ID: ${config.project}`);
  console.log(`Host: ${config.host}`);
  console.log(`Protocol: ${config.protocol}\n`);

  // Create a test error event
  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: Math.floor(Date.now() / 1000),
    platform: 'javascript',
    sdk: {
      name: 'test-script',
      version: '1.0.0',
    },
    message: {
      formatted: `Test error from ${label}`,
    },
    level: 'error',
    tags: {
      test: 'true',
      source: 'test-script',
    },
    extra: {
      timestamp: new Date().toISOString(),
    },
  };

  const envelopeHeaders = JSON.stringify({
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
  });

  const itemHeaders = JSON.stringify({
    type: 'event',
    content_type: 'application/json',
  });

  const envelope = `${envelopeHeaders}\n${itemHeaders}\n${JSON.stringify(event)}\n`;

  try {
    console.log('📤 Sending test error...');
    const response = await fetch(
      `${config.protocol}://${config.host}/api/${config.project}/envelope/?sentry_key=${config.key}&sentry_version=7`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
        },
        body: envelope,
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok || response.status === 200) {
      console.log('\n✅ SUCCESS! Sentry is working correctly.');
      console.log(`Event ID: ${event.event_id}`);
      console.log(`\n📊 Check your Sentry dashboard at:`);
      console.log(`   https://${config.host.replace('ingest.', '')}/issues/`);
      return true;
    } else {
      const errorText = await response.text();
      console.log('\n❌ ERROR: Sentry request failed');
      console.log('Response:', errorText);
      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR: Failed to connect to Sentry');
    console.log('Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Sentry Configuration Test');
  console.log('============================');

  // Test your Namastex DSN
  const yourResult = await testSentry(YOUR_DSN, 'YOUR NAMASTEX');

  // Test upstream DSN
  const upstreamResult = await testSentry(UPSTREAM_DSN, 'UPSTREAM (BloopAI)');

  console.log('\n📋 Summary:');
  console.log('============');
  console.log(`Your Namastex Sentry: ${yourResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`Upstream BloopAI Sentry: ${upstreamResult ? '✅ Working' : '❌ Failed'}`);

  console.log('\n⚠️  IMPORTANT: The code currently uses UPSTREAM DSN (hardcoded)');
  console.log('   To use your Namastex Sentry, you need to update the DSN in:');
  console.log('   - upstream/crates/utils/src/sentry.rs (backend)');
  console.log('   - forge-overrides/frontend/src/main.tsx (frontend)');

  process.exit(yourResult && upstreamResult ? 0 : 1);
}

main();
