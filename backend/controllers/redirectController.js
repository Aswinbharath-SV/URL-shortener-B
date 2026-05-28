import Url from '../models/Url.js';
import Click from '../models/Click.js';
import { parseUserAgent } from '../utils/uaParser.js';
import { getIO } from '../utils/socket.js';

// Realistic geo datasets for localhost demo testing
const mockGeos = [
  { country: 'United States', region: 'California', city: 'San Francisco' },
  { country: 'United Kingdom', region: 'England', city: 'London' },
  { country: 'India', region: 'Karnataka', city: 'Bengaluru' },
  { country: 'Germany', region: 'Berlin', city: 'Berlin' },
  { country: 'France', region: 'Île-de-France', city: 'Paris' },
  { country: 'Canada', region: 'Ontario', city: 'Toronto' },
  { country: 'Australia', region: 'New South Wales', city: 'Sydney' },
  { country: 'Japan', region: 'Tokyo', city: 'Tokyo' },
  { country: 'Singapore', region: 'Central Region', city: 'Singapore' },
  { country: 'Netherlands', region: 'North Holland', city: 'Amsterdam' }
];

const parseReferer = (refererHeader) => {
  if (!refererHeader) return 'Direct';
  
  try {
    const url = new URL(refererHeader);
    const host = url.hostname.toLowerCase();
    
    if (host.includes('google.')) return 'Google';
    if (host.includes('facebook.') || host.includes('fb.')) return 'Facebook';
    if (host.includes('twitter.') || host.includes('t.co')) return 'Twitter';
    if (host.includes('linkedin.')) return 'LinkedIn';
    if (host.includes('github.')) return 'GitHub';
    if (host.includes('instagram.')) return 'Instagram';
    if (host.includes('youtube.')) return 'YouTube';
    if (host.includes('reddit.')) return 'Reddit';
    
    return url.hostname.replace('www.', '');
  } catch (err) {
    return 'Other';
  }
};

const serveErrorPage = (res, title, description) => {
  return res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; }
        </style>
      </head>
      <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen p-4 selection:bg-rose-500 selection:text-white">
        <div class="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-8 text-center backdrop-blur-xl">
          <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl"></div>
          <div class="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl"></div>
          
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold mb-2">${title}</h1>
          <p class="text-slate-400 text-sm mb-6">${description}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="inline-block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            Go to Dashboard
          </a>
        </div>
      </body>
    </html>
  `);
};

const servePasswordPage = (res, linkTitle, shortCode, isWrongPassword) => {
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Password Protected Link</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; }
        </style>
      </head>
      <body class="bg-[#030712] text-white flex items-center justify-center min-h-screen p-4 selection:bg-indigo-500 selection:text-white">
        <div class="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#0b0f19]/40 p-8 backdrop-blur-xl shadow-2xl">
          <div class="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div class="absolute -left-16 -bottom-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div class="text-center mb-6">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 mb-4 border border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 class="text-xl font-bold font-outfit text-white">Password Required</h1>
            <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">"${linkTitle}" is protected. Enter password to access original destination.</p>
          </div>

          <form action="/r/${shortCode}" method="GET" class="space-y-4">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Enter Password
              </label>
              <input
                type="password"
                name="pwd"
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-[#070a13] border ${isWrongPassword ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500'} rounded-xl focus:outline-none text-sm text-white transition-all placeholder:text-slate-650"
                required
                autoFocus
              />
              ${isWrongPassword ? `
                <p class="text-[10px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1 animate-pulse">
                  ⚠️ Incorrect password. Please try again.
                </p>
              ` : ''}
            </div>

            <button
              type="submit"
              class="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-semibold text-xs transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              Access Link
            </button>
          </form>
        </div>
      </body>
    </html>
  `);
};

/**
 * @desc    Redirect short code to original URL and log analytics
 * @route   GET /r/:shortCode
 * @access  Public
 */
export const handleRedirect = async (req, res, next) => {
  const { shortCode } = req.params;

  try {
    // 1. Fetch URL matching the code or custom alias
    const url = await Url.findOne({
      $or: [
        { shortCode: shortCode },
        { customAlias: shortCode }
      ],
      isActive: true,
    });

    if (!url) {
      return serveErrorPage(res, 'Link Unavailable', 'The short link you are trying to access does not exist, is inactive, or has been deleted.');
    }

    // Expiration date check
    const isExpired = url.expiresAt && new Date() > new Date(url.expiresAt);
    // Click limit check
    const isLimitReached = url.clickLimit !== null && url.clickLimit !== undefined && url.clickLimit > 0 && url.clicksCount >= url.clickLimit;

    if (isExpired || isLimitReached) {
      if (url.fallbackUrl) {
        return res.redirect(302, url.fallbackUrl);
      }
      
      const title = isExpired ? 'Link Expired' : 'Link Limit Reached';
      const desc = isExpired 
        ? 'This short link has reached its scheduled expiration date and is no longer available.' 
        : 'This short link has reached its maximum allowed click limit and has been deactivated.';
      return serveErrorPage(res, title, desc);
    }

    // Password Protection check
    if (url.password) {
      const inputPwd = req.query.pwd;
      if (inputPwd !== url.password) {
        const isWrong = inputPwd !== undefined;
        return servePasswordPage(res, url.title || 'Secured Link', shortCode, isWrong);
      }
    }

    // 2. Auto UTM Tagging
    let targetUrl = url.originalUrl;
    try {
      const parsedTarget = new URL(targetUrl);
      if (url.utmSource && !parsedTarget.searchParams.has('utm_source')) {
        parsedTarget.searchParams.set('utm_source', url.utmSource);
      }
      if (url.utmMedium && !parsedTarget.searchParams.has('utm_medium')) {
        parsedTarget.searchParams.set('utm_medium', url.utmMedium);
      }
      if (url.utmCampaign && !parsedTarget.searchParams.has('utm_campaign')) {
        parsedTarget.searchParams.set('utm_campaign', url.utmCampaign);
      }
      targetUrl = parsedTarget.toString();
    } catch (err) {
      // fallback
    }

    // 3. Perform INSTANT redirection
    res.redirect(302, targetUrl);

    // 4. Process analytics in background
    processAnalytics(req, url);

  } catch (error) {
    next(error);
  }
};

const processAnalytics = async (req, url) => {
  try {
    // 3a. Extract Client IP
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    // Convert IPv6 loopback to IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    // 3b. User Agent classification
    const uaHeader = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(uaHeader);

    // Helper to extract UTM parameters from long url query string
    const parseUtmFromUrl = (urlString, paramName) => {
      try {
        const parsed = new URL(urlString);
        return parsed.searchParams.get(paramName);
      } catch (err) {
        return null;
      }
    };

    // Extract UTM from the redirection query params or original URL
    const utmSource = req.query.utm_source || parseUtmFromUrl(url.originalUrl, 'utm_source') || 'Direct';
    const utmMedium = req.query.utm_medium || parseUtmFromUrl(url.originalUrl, 'utm_medium') || 'None';
    const utmCampaign = req.query.utm_campaign || parseUtmFromUrl(url.originalUrl, 'utm_campaign') || 'None';
    const isQrScan = req.query.ref === 'qr' || req.query.utm_source === 'qr' || false;

    // 3c. Geolocation Mapping
    let country = 'Unknown';
    let region = 'Unknown';
    let city = 'Unknown';
    let timezone = 'Unknown';
    let isp = 'Unknown';

    if (ip === '127.0.0.1') {
      // Pick a random mock geo location to show beautiful dashboard charts during local testing
      const randomGeo = mockGeos[Math.floor(Math.random() * mockGeos.length)];
      country = randomGeo.country;
      region = randomGeo.region;
      city = randomGeo.city;

      const mockTimezones = ['America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo', 'Europe/Berlin'];
      const mockISPs = ['AT&T Internet', 'Comcast Cable', 'Reliance Jio', 'British Telecom', 'Deutsche Telekom'];
      timezone = mockTimezones[Math.floor(Math.random() * mockTimezones.length)];
      isp = mockISPs[Math.floor(Math.random() * mockISPs.length)];
    } else {
      try {
        // Fetch geo-location from standard open lookup
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,isp`);
        const geoData = await geoResponse.json();
        
        if (geoData && geoData.status === 'success') {
          country = geoData.country || 'Unknown';
          region = geoData.regionName || 'Unknown';
          city = geoData.city || 'Unknown';
          timezone = geoData.timezone || 'Unknown';
          isp = geoData.isp || 'Unknown';
        }
      } catch (err) {
        console.error('Geo IP mapping API request failed:', err.message);
      }
    }

    // 3d. Referer classification
    const refererHeader = req.headers['referer'] || req.headers['referrer'] || '';
    const referer = parseReferer(refererHeader);

    // 3e. Fraud & Bot Abuse Check
    const isBot = /bot|crawler|spider|google|baidu|bing|msn|teoma|yandex|headless/i.test(uaHeader);
    
    // Find count of clicks from same IP in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const recentClicksList = await Click.find({
      urlId: url._id,
      ip,
      timestamp: { $gte: tenSecondsAgo }
    });
    const isClickSpam = recentClicksList.length >= 5;
    
    const isSuspicious = isBot || isClickSpam;
    const threatType = isBot ? 'bot' : (isClickSpam ? 'ip_spam' : 'none');

    // 3f. Persist click to database
    const savedClick = await Click.create({
      urlId: url._id,
      ip,
      browser,
      device,
      os,
      country,
      region,
      city,
      timezone,
      isp,
      referer,
      utmSource,
      utmMedium,
      utmCampaign,
      isSuspicious,
      threatType,
      isQrScan,
    });

    // 3g. Increment URL click counts
    url.clicksCount += 1;
    if (isQrScan) {
      url.qrClicksCount = (url.qrClicksCount || 0) + 1;
    }
    await url.save();

    // 3h. Real-Time Socket Emission
    try {
      const io = getIO();
      if (io) {
        // Emit to user room
        io.to(String(url.userId)).emit('new-click', {
          urlId: url._id,
          click: savedClick,
          clicksCount: url.clicksCount,
          qrClicksCount: url.qrClicksCount,
        });
        // Emit to shortCode room (for public dashboard views)
        io.to(String(url.shortCode)).emit('new-click', {
          urlId: url._id,
          click: savedClick,
          clicksCount: url.clicksCount,
          qrClicksCount: url.qrClicksCount,
        });
        console.log(`📡 Emitted live click socket event for Url: ${url.shortCode}`);
      }
    } catch (socketErr) {
      console.error('Socket emission failed:', socketErr.message);
    }

  } catch (err) {
    console.error('Asynchronous redirection analytics processing error:', err.message);
  }
};
