// utils/urlFilter.js - URL filtering and validation
export class UrlFilter {
  static isValidUrl(url, rootUrl) {
    try {
      const urlObj = new URL(url);
      const rootUrlObj = new URL(
        rootUrl.startsWith("http") ? rootUrl : `https://${rootUrl}`
      );

      // Protocol check
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return false;
      }

      // Domain check - only allow main domain and subdomains
      if (
        urlObj.hostname !== rootUrlObj.hostname &&
        !urlObj.hostname.endsWith(`.${rootUrlObj.hostname}`)
      ) {
        return false;
      }

      // Unwanted file extensions
      const badExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".zip",
        ".rar",
        ".tar",
        ".gz",
        ".exe",
        ".dmg",
        ".pkg",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".svg",
        ".ico",
        ".mp3",
        ".mp4",
        ".avi",
        ".mov",
        ".wmv",
        ".flv",
        ".css",
        ".js",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot",
      ];

      if (
        badExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext))
      ) {
        return false;
      }

      // Unwanted URLs
      const badPatterns = [
        /logout/i,
        /signout/i,
        /delete/i,
        /remove/i,
        /download/i,
        /upload/i,
        /admin\/delete/i,
        /\/ads\//i,
        /\/advertisement/i,
        /\/tracking/i,
        /\/analytics/i,
        /google/i,
        /facebook/i,
        /twitter/i,
        /linkedin/i,
        /instagram/i,
        /youtube/i,
        /mailto:/i,
        /tel:/i,
        /javascript:/i,
      ];

      if (badPatterns.some((pattern) => pattern.test(url))) {
        return false;
      }

      // Clean fragments
      urlObj.hash = "";

      return true;
    } catch {
      return false;
    }
  }

  static normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      urlObj.hash = ""; // Remove fragment

      // Trailing slash'i normalize et
      if (urlObj.pathname.endsWith("/") && urlObj.pathname.length > 1) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  static isDuplicateUrl(url, visitedUrls) {
    const normalized = this.normalizeUrl(url);
    return visitedUrls.has(normalized);
  }
}
