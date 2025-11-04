# PostHog Analytics Debugging Guide

## 🔍 Root Cause Analysis

### Issue: "I can't see nothing on PostHog"

**Root Cause:** Backend server not responding properly → Frontend can't get `analyticsUserId` → PostHog never gets `opt_in_capturing()` called → No events tracked

**The Flow:**
1. Frontend calls `/api/info` to get user config and `analyticsUserId`
2. If `/api/info` fails (500 error), `analyticsUserId` is null
3. App.tsx line 58: `if (!posthog || !analyticsUserId) return;` → Early exit!
4. PostHog never calls `opt_in_capturing()` or `identify()`
5. Events are logged to console but NOT sent to PostHog

**Solution:** Ensure backend is running and responding to `/api/info`

---

## ✅ Quick Health Check

**1. Check Backend Status:**
```bash
curl http://localhost:YOUR_PORT/health
# Should return: {"status":"ok"}
```

**2. Check Analytics User ID:**
```bash
curl http://localhost:YOUR_PORT/api/info
# Should return JSON with analytics_user_id field
```

**3. Check Browser Console:**
Look for this message:
```
[Analytics] Analytics enabled and user identified
```

**4. Check Network Tab (Filter: posthog.com):**
Look for POST requests to:
```
https://us.i.posthog.com/e/?ip=0
```
Status should be **200 OK**

---

## 🔍 Step-by-Step Debugging

### **Step 1: Verify PostHog Loaded**

Open browser console (F12) and check:

```javascript
console.log('PostHog loaded:', !!window.posthog);
```

**Expected:** `true`
**If false:** PostHog script failed to load (check network tab for errors)

---

### **Step 2: Check Backend Health**

The analytics system REQUIRES the backend to be running:

```bash
# Check if backend is responding
curl http://localhost:8887/health

# Check if analytics user ID is available
curl http://localhost:8887/api/info
```

**Expected `/api/info` response:**
```json
{
  "analytics_user_id": "npm_user_abc123...",
  "analytics_enabled": true,
  ...
}
```

**If 500 error:**
- Backend not running or crashed
- Database connection issue
- Check backend logs for errors

---

### **Step 3: Check User Opt-In Status**

In browser console:

```javascript
console.log('Opted in:', window.posthog?.has_opted_in_capturing());
console.log('Opted out:', window.posthog?.has_opted_out_capturing());
```

**Expected:**
- `Opted in: true`
- `Opted out: false`

**If opted out:**
1. Go to Settings → General
2. Enable "Share anonymous usage data"
3. Reload the page

---

### **Step 4: Check Console for Analytics Events**

Look for these logs in browser console:

```
[Analytics] Analytics enabled and user identified
[Analytics] session_started {is_returning_user: false, ...}
[Analytics] page_visited {page: 'projects', ...}
[Analytics] $heartbeat {active: true}
```

**If you see logs but no network requests:**
- PostHog is batching events (default: 10s or 10 events)
- Wait 10 seconds or trigger 10 events
- Or force flush: `window.posthog?.flush()`

---

### **Step 5: Check Network Requests**

1. Open DevTools → Network tab
2. Filter: `posthog.com` or `capture`
3. Look for POST requests to `us.i.posthog.com/e/`

**Expected request:**
- Method: POST
- Status: 200 OK
- URL: `https://us.i.posthog.com/e/?ip=0&_=...&ver=1.279.0&compression=gzip-js`

**If no network requests:**
- User opted out (check Step 3)
- Backend not providing `analyticsUserId` (check Step 2)
- PostHog not initialized (check Step 1)

**If requests fail (4xx/5xx):**
- Invalid API key (check main.tsx line 93-94)
- Network/firewall blocking PostHog
- Check request payload for errors

---

### **Step 6: Verify PostHog Dashboard**

1. Go to PostHog: https://us.i.posthog.com
2. Navigate to: **Activity → Live Events**
3. Should see events appearing within 1-2 seconds

**Expected events:**
- `session_started`
- `page_visited`
- `$heartbeat` (every 30 seconds)

**If Live Events is empty:**
- Check you're in the correct PostHog project
- Verify API key matches: `phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd`
- Events might be going to wrong project

---

### **Step 7: Force Test Event**

In browser console:

```javascript
// Send test event
window.posthog?.capture('debug_test', {
  test: true,
  timestamp: new Date().toISOString()
});

// Force immediate send
window.posthog?.flush();

console.log('Test event sent! Check Network tab for POST to /e/');
```

**Expected:**
1. POST request appears in Network tab within 1 second
2. Status: 200 OK
3. Event appears in PostHog Live Events within 2 seconds

---

## 🐛 Common Issues & Solutions

### **Issue 1: Backend Not Running**

**Symptoms:**
- `/api/info` returns 500 error
- Console shows: `Error loading user system: ApiError: Internal Server Error`
- NO `[Analytics] Analytics enabled` message

**Solution:**
```bash
# Start the backend server
cargo run --bin server

# Or use the convenience script
pnpm run dev
```

**Verification:**
```bash
curl http://localhost:8887/health
# Should return: {"status":"ok"}
```

---

### **Issue 2: User Opted Out**

**Symptoms:**
- Console shows: `[Analytics] Analytics disabled by user preference`
- `window.posthog?.has_opted_out_capturing()` returns `true`

**Solution:**
1. Open app Settings → General
2. Enable "Share anonymous usage data"
3. Reload the page

**Or manually reset:**
```javascript
// Clear opt-out flag
localStorage.removeItem('ph_optout');
location.reload();
```

---

### **Issue 3: Events Batched (Delayed)**

**Symptoms:**
- Console shows `[Analytics] session_started` logs
- But no network requests to PostHog
- Events appear after 10+ seconds

**Cause:** PostHog batches events for performance (default: 10s or 10 events)

**Solution:**
```javascript
// Force immediate send
window.posthog?.flush();
```

**Or wait:**
- 10 seconds for automatic flush
- Or trigger 10 different events

---

### **Issue 4: Wrong PostHog Project**

**Symptoms:**
- Network requests succeed (200 OK)
- But events don't appear in PostHog dashboard

**Solution:**
1. In browser console:
   ```javascript
   console.log('API Key:', window.posthog?.config?.api_key);
   // Should be: phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd
   ```
2. Go to PostHog → Project Settings → Project API Key
3. Verify they match
4. If mismatch, you're in the wrong project

---

### **Issue 5: PostHog Not Initialized**

**Symptoms:**
- `window.posthog` is undefined
- No PostHog network requests at all
- Console warning: `PostHog API key or endpoint not set`

**Cause:** PostHog initialization failed in main.tsx

**Check:**
```javascript
// In browser console
console.log('VITE_POSTHOG_API_KEY:', import.meta.env.VITE_POSTHOG_API_KEY);
```

**Solution:**
- Should fall back to hardcoded key: `phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd`
- Check main.tsx lines 93-96
- Restart dev server if needed

---

## 🧪 Complete Test Sequence

Run this in browser console after app loads:

```javascript
// 1. Check PostHog status
console.log('=== PostHog Debug Info ===');
console.log('PostHog loaded:', !!window.posthog);
console.log('API Key:', window.posthog?.config?.api_key);
console.log('API Host:', window.posthog?.config?.api_host);
console.log('Opted in:', window.posthog?.has_opted_in_capturing());
console.log('Opted out:', window.posthog?.has_opted_out_capturing());
console.log('User ID:', window.posthog?.get_distinct_id());

// 2. Send test events
console.log('\n=== Sending Test Events ===');
window.posthog?.capture('debug_test_1', { test: 'session' });
window.posthog?.capture('debug_test_2', { test: 'page' });
window.posthog?.capture('debug_test_3', { test: 'feature' });

// 3. Force flush
console.log('\n=== Forcing Flush ===');
window.posthog?.flush();

console.log('\n✅ Check Network tab for POST to /e/');
console.log('✅ Check PostHog Live Events (1-2 seconds delay)');
```

**Expected Output:**
```
=== PostHog Debug Info ===
PostHog loaded: true
API Key: phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd
API Host: https://us.i.posthog.com
Opted in: true
Opted out: false
User ID: npm_user_abc123...

=== Sending Test Events ===
[Analytics] debug_test_1 {test: 'session'}
[Analytics] debug_test_2 {test: 'page'}
[Analytics] debug_test_3 {test: 'feature'}

=== Forcing Flush ===
✅ Check Network tab for POST to /e/
✅ Check PostHog Live Events (1-2 seconds delay)
```

**Expected Network Request:**
```http
POST https://us.i.posthog.com/e/?ip=0&_=1762281921735&ver=1.279.0&compression=gzip-js
Status: 200 OK
Response: (binary gzip data)
```

---

## 📊 Verify in PostHog Dashboard

### **Quick Check:**

1. **Live Events:** https://us.i.posthog.com/events
   - Should show events within 1-2 seconds
   - Look for: `debug_test_1`, `debug_test_2`, `debug_test_3`

2. **Persons:** https://us.i.posthog.com/persons
   - Should show your user ID (starts with `npm_user_`)
   - Click to see all their events

3. **Event Definitions:** https://us.i.posthog.com/data-management/events
   - Should show: `session_started`, `page_visited`, `$heartbeat`, etc.

---

## 🚨 Still Not Working?

### **Last Resort Debugging:**

1. **Enable PostHog debug mode:**
```javascript
window.posthog?.debug();
// Now all PostHog operations will log to console
```

2. **Check localStorage:**
```javascript
// PostHog stores opt-in state in localStorage
console.log('PostHog localStorage:',
  Object.keys(localStorage).filter(k => k.includes('posthog'))
);

// Check opt-out flag
console.log('Opted out:', localStorage.getItem('ph_optout'));
```

3. **Nuclear option - Clear everything:**
```javascript
// Clear PostHog state
localStorage.removeItem('ph_optout');
Object.keys(localStorage)
  .filter(k => k.includes('posthog'))
  .forEach(k => localStorage.removeItem(k));

// Reload page
location.reload();
```

4. **Check backend logs:**
```bash
# Backend should log analytics events
cargo run --bin server
# Look for: "Event '...' sent successfully"
```

---

## 📝 Expected Console Output (Working State)

When everything is working, you should see:

```
[Analytics] Analytics enabled and user identified
[Analytics] session_started {is_returning_user: false, days_since_last_session: null, total_sessions: 1}
[Analytics] page_visited {page: 'projects', time_on_previous_page_seconds: null, navigation_method: 'direct_url'}
[Analytics] $heartbeat {active: true}
[Analytics] $heartbeat {active: true}
...
```

**And in Network tab:**
- Multiple POST requests to `https://us.i.posthog.com/e/`
- All with Status 200
- Appearing every ~10 seconds or after 10 events

---

## 🎯 Quick Checklist

- [ ] Backend running and responding to `/health` and `/api/info`
- [ ] PostHog initialized (check `window.posthog` in console)
- [ ] User opted in (check Settings → General)
- [ ] Console logs show `[Analytics] Analytics enabled and user identified`
- [ ] Console logs show events (`session_started`, `page_visited`, etc.)
- [ ] Network requests to `/e/` with 200 status
- [ ] PostHog Live Events showing data (1-2 second delay)
- [ ] Correct API key: `phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd`
- [ ] Correct endpoint: `https://us.i.posthog.com`

**If all checkboxes pass but still no data → Check you're looking at the right PostHog project!**
