# PostHog Analytics Debugging Guide

## 🔍 Step-by-Step Debugging

### **Step 1: Check if PostHog is Initialized**

Open your browser console (F12) when running the app and look for:

```
[Analytics] Analytics enabled and user identified
```

**If you DON'T see this:**
- PostHog didn't initialize
- Check console for: `PostHog API key or endpoint not set`

### **Step 2: Check User Opt-In Status**

1. Open the app - you should see a **"Feedback"** dialog on first run
2. Click **"Yes, help improve Automagik Forge"** (opt-in)
3. Console should show: `[Analytics] Analytics enabled and user identified`

**If you see:**
```
[Analytics] Analytics disabled by user preference
```
- User opted out or `analytics_enabled = false` in config
- Go to Settings → General → Enable "Share anonymous usage data"

### **Step 3: Check if Events Are Being Sent**

Open browser console and look for PostHog events:

**Look for these logs:**
```
[Analytics] session_started {is_returning_user: false, ...}
[Analytics] page_visited {page: 'projects', ...}
[Analytics] $heartbeat {active: true}
```

**If you see these logs but no data in PostHog:**
- Events ARE being captured
- PostHog may be batching (default: sends every 10s or 10 events)
- Check Network tab for POST requests to `https://us.i.posthog.com/capture/`

### **Step 4: Check Network Requests**

1. Open DevTools → Network tab
2. Filter: `capture`
3. Look for POST requests to `us.i.posthog.com/capture/`

**Expected request:**
- Status: 200 OK
- Response: `{"status":"ok"}`

**If no network requests:**
- PostHog SDK is not sending (check initialization)
- User opted out
- PostHog key is missing

**If requests fail (4xx/5xx):**
- Check the request payload
- Invalid API key
- CORS issue (shouldn't happen with PostHog)

### **Step 5: Force Event Capture (Manual Test)**

Open browser console and run:

```javascript
// Check if PostHog is loaded
console.log('PostHog loaded:', !!window.posthog);

// Check opt-in status
console.log('PostHog opted in:', window.posthog?.has_opted_in_capturing());

// Force capture a test event
window.posthog?.capture('test_event', {
  test: true,
  timestamp: new Date().toISOString()
});

console.log('Test event sent! Check Network tab for POST to /capture/');
```

**Expected output:**
```
PostHog loaded: true
PostHog opted in: true
Test event sent! Check Network tab for POST to /capture/
```

### **Step 6: Check PostHog Live Events**

1. Go to PostHog: https://us.i.posthog.com
2. Login with your account
3. Navigate to: **Activity → Live Events**
4. Should see events appearing in real-time (within 1-2 seconds)

**If Live Events is empty:**
- Events might be going to wrong project
- Check the API key in console: `window.posthog?.config.api_key`
- Should be: `phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd`

### **Step 7: Check PostHog Project**

Verify you're looking at the right project:

1. In PostHog, click the project dropdown (top-left)
2. Current project should match the API key
3. Check **Project Settings → Project API Key**
4. Should match: `phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd`

---

## 🐛 Common Issues & Solutions

### **Issue 1: "PostHog API key or endpoint not set" in Console**

**Cause:** Frontend credentials not loaded

**Solution:**
```bash
# Check if VITE env vars are set
echo $VITE_POSTHOG_API_KEY

# If empty, the fallback should work
# Check frontend/src/main.tsx line 93-94
# Should have: 'phc_' + 'KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd'
```

**Quick fix:**
```bash
# Add to .env file
echo "VITE_POSTHOG_API_KEY=phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd" >> .env
echo "VITE_POSTHOG_API_ENDPOINT=https://us.i.posthog.com" >> .env

# Restart dev server
pnpm run dev
```

### **Issue 2: User Opted Out (Analytics Disabled)**

**Cause:** User clicked "No thanks" in privacy dialog or disabled in settings

**Solution:**
```bash
# Find config file location
# macOS: ~/Library/Application Support/automagik-forge/config.json
# Linux: ~/.config/automagik-forge/config.json
# Windows: %APPDATA%/automagik-forge/config.json

# Edit config.json and set:
{
  "analytics_enabled": true,
  "telemetry_acknowledged": true
}

# OR via UI: Settings → General → Enable "Share anonymous usage data"
```

### **Issue 3: Events Not Appearing in PostHog (Batching Delay)**

**Cause:** PostHog batches events for performance (default: 10s or 10 events)

**Solution:**
```javascript
// Force flush in console
window.posthog?.capture('flush_test');
window.posthog?.flush(); // Force send all batched events

// Or wait 10 seconds for auto-flush
```

### **Issue 4: Wrong PostHog Project**

**Cause:** Multiple PostHog projects, looking at wrong one

**Solution:**
1. Check API key in console: `window.posthog?.config.api_key`
2. Go to PostHog → Project Settings → Project API Key
3. Verify they match
4. If mismatch, you're in wrong project - switch to correct one

### **Issue 5: Hardcoded Credentials Not Working**

**Cause:** Code not updated or build cache issue

**Solution:**
```bash
# Clear build cache and restart
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist

# Rebuild
cd frontend
pnpm install
pnpm run dev
```

---

## 🧪 Complete Test Sequence

Run this in browser console after app loads:

```javascript
// 1. Check PostHog status
console.log('=== PostHog Debug Info ===');
console.log('PostHog loaded:', !!window.posthog);
console.log('API Key:', window.posthog?.config.api_key);
console.log('API Host:', window.posthog?.config.api_host);
console.log('Opted in:', window.posthog?.has_opted_in_capturing());
console.log('User ID:', window.posthog?.get_distinct_id());

// 2. Send test events
console.log('\n=== Sending Test Events ===');
window.posthog?.capture('debug_test_1', { test: 'session' });
window.posthog?.capture('debug_test_2', { test: 'page' });
window.posthog?.capture('debug_test_3', { test: 'feature' });

// 3. Force flush
console.log('\n=== Forcing Flush ===');
window.posthog?.flush();

console.log('\n✅ Check Network tab for POST to /capture/');
console.log('✅ Check PostHog Live Events (1-2 seconds delay)');
```

**Expected Network Request:**

```http
POST https://us.i.posthog.com/capture/
Content-Type: application/json

{
  "api_key": "phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd",
  "event": "debug_test_1",
  "properties": {
    "distinct_id": "npm_user_abc123...",
    "test": "session",
    "$lib": "web",
    "$lib_version": "1.285.1"
  }
}
```

**Expected Response:**
```json
{"status":"ok"}
```

---

## 📊 Verify in PostHog Dashboard

### **Quick Check:**

1. **Live Events:** https://us.i.posthog.com/events
   - Should show events appearing within 1-2 seconds
   - Look for: `debug_test_1`, `debug_test_2`, `debug_test_3`

2. **Persons:** https://us.i.posthog.com/persons
   - Should show your user ID (starts with `npm_user_`)
   - Click to see all their events

3. **Event Definitions:** https://us.i.posthog.com/data-management/events
   - Should show: `session_started`, `page_visited`, `$heartbeat`, etc.

---

## 🚨 Still Not Working?

### **Last Resort Debugging:**

1. **Check PostHog SDK version:**
```javascript
console.log(window.posthog?._info);
```

2. **Enable PostHog debug mode:**
```javascript
window.posthog?.debug();
// Now all PostHog operations will log to console
```

3. **Check localStorage:**
```javascript
// PostHog stores opt-in state in localStorage
console.log('PostHog localStorage:',
  Object.keys(localStorage).filter(k => k.includes('posthog'))
);

// Check opt-out flag
console.log('Opted out:', localStorage.getItem('ph_optout'));
```

4. **Nuclear option - Clear everything:**
```javascript
// Clear PostHog state
localStorage.removeItem('ph_optout');
Object.keys(localStorage)
  .filter(k => k.includes('posthog'))
  .forEach(k => localStorage.removeItem(k));

// Reload page
location.reload();
```

---

## 📝 Expected Console Output (Working State)

When everything is working, you should see:

```
[PostHog] Initializing...
[Analytics] Analytics enabled and user identified
[Analytics] session_started {is_returning_user: false, days_since_last_session: null, total_sessions: 1}
[Analytics] page_visited {page: 'projects', time_on_previous_page_seconds: null, navigation_method: 'direct_url'}
[Analytics] $heartbeat {active: true}
[Analytics] $heartbeat {active: true}
...
```

**And in Network tab:**
- Multiple POST requests to `https://us.i.posthog.com/capture/`
- All with Status 200
- Response: `{"status":"ok"}`

---

## 🎯 Quick Checklist

- [ ] PostHog initialized (check console for init message)
- [ ] User opted in (check Settings → General)
- [ ] Events logged to console (`[Analytics] session_started`, etc.)
- [ ] Network requests to `/capture/` with 200 status
- [ ] PostHog Live Events showing data (1-2 second delay)
- [ ] Correct API key: `phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd`
- [ ] Correct endpoint: `https://us.i.posthog.com`

If all checkboxes pass but still no data → Check you're looking at the right PostHog project!
