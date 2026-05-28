import mongoose from 'mongoose';
import Url from '../models/Url.js';
import Click from '../models/Click.js';

// Helper to fill missing dates in click trends
const fillMissingDates = (stats, daysLimit = 30) => {
  const trendsMap = new Map();
  stats.forEach(item => trendsMap.set(item._id, item.clicks));

  const filledTrends = [];
  for (let i = daysLimit - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    filledTrends.push({
      date: dateStr,
      clicks: trendsMap.get(dateStr) || 0
    });
  }
  return filledTrends;
};

// Common aggregation compiler helper
const compileAnalyticsData = async (matchQuery) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (process.env.USE_MOCK_DB === 'true') {
    // JavaScript-based aggregation logic fallback for local JSON storage mode
    const allClicks = await Click.find(matchQuery);
    
    const dailyMap = new Map();
    const browsers = {};
    const devices = {};
    const oses = {};
    const countries = {};
    const referers = {};
    const timezones = {};
    const isps = {};
    const utmSources = {};
    const utmCampaigns = {};
    let suspiciousClicks = 0;
    let botClicks = 0;
    let spamClicks = 0;

    allClicks.forEach(c => {
      const dateStr = new Date(c.timestamp).toISOString().split('T')[0];
      if (new Date(c.timestamp) >= thirtyDaysAgo) {
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
      }
      browsers[c.browser] = (browsers[c.browser] || 0) + 1;
      devices[c.device] = (devices[c.device] || 0) + 1;
      oses[c.os] = (oses[c.os] || 0) + 1;
      countries[c.country] = (countries[c.country] || 0) + 1;
      referers[c.referer] = (referers[c.referer] || 0) + 1;
      timezones[c.timezone || 'Unknown'] = (timezones[c.timezone || 'Unknown'] || 0) + 1;
      isps[c.isp || 'Unknown'] = (isps[c.isp || 'Unknown'] || 0) + 1;
      utmSources[c.utmSource || 'Direct'] = (utmSources[c.utmSource || 'Direct'] || 0) + 1;
      utmCampaigns[c.utmCampaign || 'None'] = (utmCampaigns[c.utmCampaign || 'None'] || 0) + 1;
      if (c.isSuspicious) suspiciousClicks++;
      if (c.threatType === 'bot') botClicks++;
      if (c.threatType === 'ip_spam') spamClicks++;
    });

    const filledDailyTrends = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      filledDailyTrends.push({ date: dateStr, clicks: dailyMap.get(dateStr) || 0 });
    }

    const toBreakdown = (obj) => Object.entries(obj).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      dailyTrends: filledDailyTrends,
      browserBreakdown: toBreakdown(browsers),
      deviceBreakdown: toBreakdown(devices),
      osBreakdown: toBreakdown(oses),
      countryBreakdown: toBreakdown(countries).slice(0, 10),
      refererBreakdown: toBreakdown(referers).slice(0, 10),
      timezoneBreakdown: toBreakdown(timezones).slice(0, 10),
      ispBreakdown: toBreakdown(isps).slice(0, 10),
      utmSourceBreakdown: toBreakdown(utmSources),
      utmCampaignBreakdown: toBreakdown(utmCampaigns),
      fraudSummary: {
        totalClicks: allClicks.length,
        suspiciousClicks,
        botClicks,
        spamClicks
      }
    };
  }

  // 1. Daily trends aggregation
  const dailyStats = await Click.aggregate([
    { $match: { ...matchQuery, timestamp: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        clicks: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const filledDailyTrends = fillMissingDates(dailyStats, 30);

  // 2. Breakdowns
  const browserBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$browser', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const deviceBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$device', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const osBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$os', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const countryBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const refererBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$referer', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const timezoneBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$timezone', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const ispBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$isp', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const utmSourceBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$utmSource', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const utmCampaignBreakdown = await Click.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$utmCampaign', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const fraudStats = await Click.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        suspiciousClicks: { $sum: { $cond: [{ $eq: ['$isSuspicious', true] }, 1, 0] } },
        botClicks: { $sum: { $cond: [{ $eq: ['$threatType', 'bot'] }, 1, 0] } },
        spamClicks: { $sum: { $cond: [{ $eq: ['$threatType', 'ip_spam'] }, 1, 0] } }
      }
    }
  ]);

  const fraudSummary = fraudStats.length > 0 ? {
    totalClicks: fraudStats[0].totalClicks || 0,
    suspiciousClicks: fraudStats[0].suspiciousClicks || 0,
    botClicks: fraudStats[0].botClicks || 0,
    spamClicks: fraudStats[0].spamClicks || 0
  } : {
    totalClicks: 0,
    suspiciousClicks: 0,
    botClicks: 0,
    spamClicks: 0
  };

  const mapper = i => ({ name: i._id || 'Unknown', value: i.count });

  return {
    dailyTrends: filledDailyTrends,
    browserBreakdown: browserBreakdown.map(mapper),
    deviceBreakdown: deviceBreakdown.map(mapper),
    osBreakdown: osBreakdown.map(mapper),
    countryBreakdown: countryBreakdown.map(mapper),
    refererBreakdown: refererBreakdown.map(mapper),
    timezoneBreakdown: timezoneBreakdown.map(mapper),
    ispBreakdown: ispBreakdown.map(mapper),
    utmSourceBreakdown: utmSourceBreakdown.map(mapper),
    utmCampaignBreakdown: utmCampaignBreakdown.map(mapper),
    fraudSummary
  };
};

/**
 * @desc    Get dashboard analytics for all URLs of logged in user
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
export const getDashboardAnalytics = async (req, res, next) => {
  const userId = req.user._id;

  try {
    // 1. Get all URL IDs for this user or workspace
    const scopeQuery = {};
    if (req.user.currentWorkspaceId) {
      scopeQuery.workspaceId = req.user.currentWorkspaceId;
    } else {
      scopeQuery.userId = userId;
      scopeQuery.workspaceId = null;
    }

    const urls = await Url.find(scopeQuery);
    const totalUrls = urls.length;
    const activeUrls = urls.filter(u => u.isActive).length;
    
    // Sum total clicks
    const totalClicks = urls.reduce((sum, u) => sum + u.clicksCount, 0);

    if (urls.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalUrls: 0,
          activeUrls: 0,
          totalClicks: 0,
          topReferer: 'N/A',
          mostClickedUrl: null
        },
        analytics: {
          dailyTrends: fillMissingDates([], 30),
          browserBreakdown: [],
          deviceBreakdown: [],
          osBreakdown: [],
          countryBreakdown: [],
          refererBreakdown: [],
          timezoneBreakdown: [],
          ispBreakdown: [],
          utmSourceBreakdown: [],
          utmCampaignBreakdown: [],
          fraudSummary: { totalClicks: 0, suspiciousClicks: 0, botClicks: 0, spamClicks: 0 }
        },
        mostClicked: []
      });
    }

    const urlIds = urls.map(u => u._id);

    // 2. Fetch Aggregated Breakdown
    const analytics = await compileAnalyticsData({ urlId: { $in: urlIds } });

    // 3. Most clicked links (Top 5)
    const mostClicked = await Url.find(scopeQuery)
      .sort({ clicksCount: -1 })
      .limit(5);

    // Determine top referer
    const topRefererName = analytics.refererBreakdown.length > 0 
      ? analytics.refererBreakdown[0].name 
      : 'Direct';

    res.json({
      success: true,
      summary: {
        totalUrls,
        activeUrls,
        totalClicks,
        topReferer: topRefererName,
        mostClickedUrl: mostClicked.length > 0 ? mostClicked[0] : null
      },
      analytics,
      mostClicked
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get analytics detail for a single URL
 * @route   GET /api/analytics/url/:id
 * @access  Private
 */
export const getUrlAnalytics = async (req, res, next) => {
  const userId = req.user._id;
  const urlId = req.params.id;

  try {
    // Find URL and check owner
    const query = { _id: urlId };
    if (req.user.currentWorkspaceId) {
      query.$or = [{ userId }, { workspaceId: req.user.currentWorkspaceId }];
    } else {
      query.userId = userId;
    }

    const url = await Url.findOne(query);
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or unauthorized access',
      });
    }

    // Compile analytics matching this URL only
    const analytics = await compileAnalyticsData({ urlId: new mongoose.Types.ObjectId(urlId) });

    // Fetch the 50 most recent click records
    const recentClicks = await Click.find({ urlId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      url,
      analytics,
      recentClicks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public analytics detail for a single URL by its shortCode
 * @route   GET /api/analytics/public/:shortCode
 * @access  Public
 */
export const getPublicUrlAnalytics = async (req, res, next) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({
      $or: [{ shortCode: shortCode }, { customAlias: shortCode }],
      isActive: true
    }).select('-userId'); // Hide owner's object ID

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Active URL not found or statistics are private',
      });
    }

    // Compile analytics matching this URL only
    const analytics = await compileAnalyticsData({ urlId: url._id });

    res.json({
      success: true,
      url,
      analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export URL clicks logs to CSV
 * @route   GET /api/analytics/export/:id
 * @access  Private
 */
export const exportUrlAnalyticsCSV = async (req, res, next) => {
  const userId = req.user._id;
  const urlId = req.params.id;

  try {
    // Check ownership
    const query = { _id: urlId };
    if (req.user.currentWorkspaceId) {
      query.$or = [{ userId }, { workspaceId: req.user.currentWorkspaceId }];
    } else {
      query.userId = userId;
    }

    const url = await Url.findOne(query);
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or unauthorized access',
      });
    }

    // Fetch all clicks for the file
    const clicks = await Click.find({ urlId }).sort({ timestamp: -1 });

    // Construct raw CSV string
    let csvContent = 'Timestamp,IP Address,Browser,Device,OS,Country,Region,City,Timezone,ISP,Referer,UTMSource,UTMMedium,UTMCampaign,IsSuspicious\n';
    
    clicks.forEach(click => {
      const ts = click.timestamp ? new Date(click.timestamp).toISOString() : 'N/A';
      const ip = click.ip || 'Unknown';
      const br = click.browser || 'Unknown';
      const dev = click.device || 'Desktop';
      const os = click.os || 'Unknown';
      const country = click.country || 'Unknown';
      const region = click.region || 'Unknown';
      const city = click.city || 'Unknown';
      const timezone = click.timezone || 'Unknown';
      const isp = click.isp || 'Unknown';
      const ref = click.referer || 'Direct';
      const utmSrc = click.utmSource || 'Direct';
      const utmMed = click.utmMedium || 'None';
      const utmCam = click.utmCampaign || 'None';
      const susp = click.isSuspicious ? 'Yes' : 'No';

      csvContent += `"${ts}","${ip}","${br}","${dev}","${os}","${country}","${region}","${city}","${timezone}","${isp}","${ref}","${utmSrc}","${utmMed}","${utmCam}","${susp}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${url.shortCode}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI predictive analytics (future projections, best posting time)
 * @route   GET /api/analytics/predict/:id
 * @access  Private
 */
export const getPredictiveAnalytics = async (req, res, next) => {
  const userId = req.user._id;
  const urlId = req.params.id;

  try {
    const query = { _id: urlId };
    if (req.user.currentWorkspaceId) {
      query.$or = [{ userId }, { workspaceId: req.user.currentWorkspaceId }];
    } else {
      query.userId = userId;
    }

    const url = await Url.findOne(query);
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or unauthorized' });
    }

    const analytics = await compileAnalyticsData({ urlId: url._id });
    const dailyTrends = analytics.dailyTrends || [];

    // Exponential Smoothing Projection (alpha = 0.35)
    const alpha = 0.35;
    let forecast = dailyTrends.length > 0 ? dailyTrends[0].clicks : 0;
    
    dailyTrends.forEach(day => {
      forecast = alpha * day.clicks + (1 - alpha) * forecast;
    });

    const averageClicks = dailyTrends.reduce((sum, d) => sum + d.clicks, 0) / (dailyTrends.length || 1);
    const predictions = [];
    let currentForecast = forecast;
    
    for (let i = 1; i <= 7; i++) {
      const futDate = new Date();
      futDate.setDate(futDate.getDate() + i);
      const dateStr = futDate.toISOString().split('T')[0];
      
      predictions.push({
        date: dateStr,
        clicks: Math.max(0, Math.round(currentForecast))
      });
      
      currentForecast = alpha * averageClicks + (1 - alpha) * currentForecast;
    }

    // Best posting time calculation based on historical clicks hour of day and day of week
    const clicks = await Click.find({ urlId: url._id });

    const hoursCount = Array(24).fill(0);
    const dayCounts = Array(7).fill(0);

    clicks.forEach(c => {
      const d = new Date(c.timestamp);
      hoursCount[d.getHours()]++;
      dayCounts[d.getDay()]++;
    });

    let bestHour = 15; // default 3 PM
    let maxClicks = -1;
    hoursCount.forEach((count, hr) => {
      if (count > maxClicks) {
        maxClicks = count;
        bestHour = hr;
      }
    });

    let bestDayIdx = 2; // default Tuesday
    let maxDayClicks = -1;
    dayCounts.forEach((count, idx) => {
      if (count > maxDayClicks) {
        maxDayClicks = count;
        bestDayIdx = idx;
      }
    });

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestTime = `${bestHour === 0 ? 12 : (bestHour > 12 ? bestHour - 12 : bestHour)}:00 ${bestHour >= 12 ? 'PM' : 'AM'}`;

    res.json({
      success: true,
      predictions,
      bestPostingTime: {
        day: daysOfWeek[bestDayIdx],
        time: bestTime,
        hour: bestHour
      }
    });
  } catch (error) {
    next(error);
  }
};
