import UAParser from 'ua-parser-js';

/**
 * Parses user agent string and extracts browser, device, and OS metadata
 * @param {string} uaString User-Agent header from request
 * @returns {object} Parsed user agent info
 */
export const parseUserAgent = (uaString) => {
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  // Determine device type
  let deviceType = 'Desktop';
  if (result.device.type === 'mobile') {
    deviceType = 'Mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'Tablet';
  } else if (!result.device.type) {
    // Some mobile devices might not explicitly show type but display mobile OS
    const os = result.os.name ? result.os.name.toLowerCase() : '';
    if (os === 'android' || os === 'ios') {
      deviceType = 'Mobile';
    }
  }

  return {
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    device: deviceType,
  };
};
