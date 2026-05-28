import Url from '../models/Url.js';
import Click from '../models/Click.js';
import { generateQRCode } from '../utils/qrGenerator.js';
import os from 'os';

// Helper to determine computer's local Wi-Fi/Ethernet IP address
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Helper to generate a unique short code
const createUniqueCode = async () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await Url.findOne({ shortCode: code });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  return code;
};

/**
 * @desc    Create a new shortened URL
 * @route   POST /api/urls
 * @access  Private
 */
export const createShortUrl = async (req, res, next) => {
  const { originalUrl, customAlias, title, description, password, expiresAt, clickLimit, fallbackUrl, utmSource, utmMedium, utmCampaign } = req.body;
  const userId = req.user._id;

  try {
    let code;

    // Handle Custom Alias
    if (customAlias) {
      const alias = customAlias.trim().toLowerCase();
      // Check if alias is already taken
      const existing = await Url.findOne({
        $or: [{ shortCode: alias }, { customAlias: alias }],
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Custom alias is already in use by another link',
        });
      }
      code = alias;
    } else {
      code = await createUniqueCode();
    }

    // Generate full redirection link to put in the QR Code
    let baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      const localIp = getLocalIpAddress();
      baseUrl = baseUrl.replace('localhost', localIp).replace('127.0.0.1', localIp);
    }
    const redirectUrl = `${baseUrl}/r/${code}`;

    // Generate base64 QR Code
    const qrCodeDataUrl = await generateQRCode(redirectUrl);

    // Dynamic Title fallback
    let finalTitle = title;
    if (!finalTitle) {
      try {
        const urlObj = new URL(originalUrl);
        finalTitle = urlObj.hostname.replace('www.', '');
      } catch (err) {
        finalTitle = 'Shortened Link';
      }
    }

    const newUrl = await Url.create({
      originalUrl,
      shortCode: code,
      customAlias: customAlias ? customAlias.trim().toLowerCase() : undefined,
      qrCodeDataUrl,
      title: finalTitle,
      description,
      userId,
      workspaceId: req.user.currentWorkspaceId || null,
      password: password || '',
      expiresAt: expiresAt || null,
      clickLimit: clickLimit !== undefined && clickLimit !== '' ? Number(clickLimit) : null,
      fallbackUrl: fallbackUrl || '',
      utmSource: utmSource || '',
      utmMedium: utmMedium || '',
      utmCampaign: utmCampaign || '',
    });

    res.status(201).json({
      success: true,
      message: 'URL shortened successfully',
      url: newUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's URLs with search, filter, and pagination
 * @route   GET /api/urls
 * @access  Private
 */
export const getMyUrls = async (req, res, next) => {
  const userId = req.user._id;
  const { search, sortBy, isActive, limit = 100, page = 1 } = req.query;

  try {
    const query = {};
    if (req.user.currentWorkspaceId) {
      query.workspaceId = req.user.currentWorkspaceId;
    } else {
      query.userId = userId;
      query.workspaceId = null;
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
      ];
    }

    // Active status filter
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Sorting definition
    let sortOptions = { createdAt: -1 }; // default: newest
    if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'clicks') {
      sortOptions = { clicksCount: -1 };
    } else if (sortBy === 'title') {
      sortOptions = { title: 1 };
    }

    const skip = (page - 1) * limit;

    const urls = await Url.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Url.countDocuments(query);

    res.json({
      success: true,
      count: urls.length,
      total,
      pages: Math.ceil(total / limit),
      urls,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a URL (original URL, title, description, active status)
 * @route   PUT /api/urls/:id
 * @access  Private
 */
export const updateUrl = async (req, res, next) => {
  const { originalUrl, title, description, isActive, qrColor, qrBrandLogo, qrCodeDataUrl, password, expiresAt, clickLimit, fallbackUrl, utmSource, utmMedium, utmCampaign } = req.body;
  const userId = req.user._id;

  try {
    const query = { _id: req.params.id };
    if (req.user.currentWorkspaceId) {
      query.$or = [
        { userId },
        { workspaceId: req.user.currentWorkspaceId }
      ];
    } else {
      query.userId = userId;
    }

    let url = await Url.findOne(query);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or unauthorized access',
      });
    }

    // Update fields
    if (originalUrl) url.originalUrl = originalUrl;
    if (title !== undefined) url.title = title;
    if (description !== undefined) url.description = description;
    if (isActive !== undefined) url.isActive = isActive;
    if (qrColor !== undefined) url.qrColor = qrColor;
    if (qrBrandLogo !== undefined) url.qrBrandLogo = qrBrandLogo;
    if (qrCodeDataUrl !== undefined) url.qrCodeDataUrl = qrCodeDataUrl;
    if (password !== undefined) url.password = password;
    if (expiresAt !== undefined) url.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (clickLimit !== undefined) url.clickLimit = (clickLimit !== '' && clickLimit !== null) ? Number(clickLimit) : null;
    if (fallbackUrl !== undefined) url.fallbackUrl = fallbackUrl;
    if (utmSource !== undefined) url.utmSource = utmSource;
    if (utmMedium !== undefined) url.utmMedium = utmMedium;
    if (utmCampaign !== undefined) url.utmCampaign = utmCampaign;

    const updatedUrl = await url.save();

    res.json({
      success: true,
      message: 'URL updated successfully',
      url: updatedUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a URL and all its associated clicks
 * @route   DELETE /api/urls/:id
 * @access  Private
 */
export const deleteUrl = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const query = { _id: req.params.id };
    if (req.user.currentWorkspaceId) {
      query.$or = [
        { userId },
        { workspaceId: req.user.currentWorkspaceId }
      ];
    } else {
      query.userId = userId;
    }

    const url = await Url.findOneAndDelete(query);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or unauthorized access',
      });
    }

    // Cascade delete click analytics log
    await Click.deleteMany({ urlId: url._id });

    res.json({
      success: true,
      message: 'URL and associated analytics deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk upload URLs
 * @route   POST /api/urls/bulk
 * @access  Private
 */
export const bulkUploadUrls = async (req, res, next) => {
  const { urls } = req.body; // Expecting array of objects
  const userId = req.user._id;
  let baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    const localIp = getLocalIpAddress();
    baseUrl = baseUrl.replace('localhost', localIp).replace('127.0.0.1', localIp);
  }

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of URLs to shorten',
    });
  }

  try {
    const results = [];
    const errors = [];

    for (let index = 0; index < urls.length; index++) {
      const item = urls[index];
      const { originalUrl, title, description, customAlias } = item;

      // Basic originalUrl check
      if (!originalUrl || !originalUrl.startsWith('http')) {
        errors.push({ index, message: 'Invalid URL. Must start with http:// or https://' });
        continue;
      }

      try {
        let code;

        // Custom Alias check
        if (customAlias) {
          const alias = customAlias.trim().toLowerCase();
          const existing = await Url.findOne({
            $or: [{ shortCode: alias }, { customAlias: alias }],
          });
          if (existing) {
            errors.push({ index, message: `Alias '${alias}' is already in use` });
            continue;
          }
          code = alias;
        } else {
          code = await createUniqueCode();
        }

        const redirectUrl = `${baseUrl}/r/${code}`;
        const qrCodeDataUrl = await generateQRCode(redirectUrl);

        let finalTitle = title;
        if (!finalTitle) {
          try {
            const urlObj = new URL(originalUrl);
            finalTitle = urlObj.hostname.replace('www.', '');
          } catch {
            finalTitle = 'Bulk Shortened Link';
          }
        }

        const createdUrl = await Url.create({
          originalUrl,
          shortCode: code,
          customAlias: customAlias ? customAlias.trim().toLowerCase() : undefined,
          qrCodeDataUrl,
          title: finalTitle,
          description,
          userId,
          workspaceId: req.user.currentWorkspaceId || null,
        });

        results.push(createdUrl);
      } catch (err) {
        errors.push({ index, message: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk URL processing complete. Created ${results.length} URLs. ${errors.length} failed.`,
      processedCount: results.length,
      failedCount: errors.length,
      errors,
      urls: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI custom alias suggestions based on target URL
 * @route   GET /api/urls/ai-suggest
 * @access  Private
 */
export const getAiAliasSuggestions = async (req, res, next) => {
  const { url } = req.query;

  try {
    if (!url) {
      return res.status(400).json({ success: false, message: 'Please provide target URL' });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid URL format. Must start with http:// or https://' });
    }

    const hostParts = parsed.hostname.replace('www.', '').split('.');
    const brandName = hostParts[0] || 'link';

    // Extract path tokens and filter out short terms/stop words
    const pathParts = parsed.pathname.split('/').filter(p => p.length > 2);
    const pathWords = pathParts.flatMap(p => p.split(/[-_]/)).filter(w => w.length > 2);

    const keywords = [...pathWords];
    if (keywords.length === 0) {
      keywords.push('promo', 'deals', 'launch');
    }

    const baseKeyword = keywords[0].toLowerCase();

    const suggestions = {
      seo: `${baseKeyword}-best-deals`,
      readable: `${baseKeyword}-deals`,
      campaign: `${brandName}-${baseKeyword}-2026`,
      brand: `${brandName}-${baseKeyword}`
    };

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

