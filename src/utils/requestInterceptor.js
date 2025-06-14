// utils/requestInterceptor.js - Advanced request interception
import axios from "axios";
import chalk from "chalk";

export class RequestInterceptor {
  constructor(domain, visitedEndpoints, endpointResults) {
    this.domain = domain;
    this.visitedEndpoints = visitedEndpoints;
    this.endpointResults = endpointResults;
    this.newEndpointsCount = 0;
  }

  async setup(page) {
    // Request interceptor
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      // Pass requests but log them
      const url = request.url();
      if (this.isApiEndpoint(url) && this.isInternalUrl(url)) {
        console.log(chalk.gray(`📡 Request: ${request.method()} ${url}`));
      }
      request.continue();
    }); // Response interceptor - daha detaylı
    page.on("response", async (response) => {
      try {
        const request = response.request();
        const url = request.url();
        const method = request.method();
        const status = response.status();

        if (this.isApiEndpoint(url) && this.isInternalUrl(url)) {
          console.log(
            chalk.cyan(
              `🔍 API Response captured: ${method} ${url} -> ${status}`
            )
          );

          if (!this.visitedEndpoints.has(url)) {
            this.visitedEndpoints.add(url);

            // Endpoint'i hemen test et
            setTimeout(async () => {
              const testResult = await this.testEndpoint(url, method);
              if (testResult) {
                const log = `${url} - ${
                  testResult.auth ? "AUTH REQUIRED" : "NOAUTH"
                } - ${testResult.method} - Status: ${testResult.status}`;
                this.endpointResults.push(log);
                this.newEndpointsCount++;
                console.log(
                  chalk.green(
                    `✅ Endpoint added: ${testResult.method} ${url} (${
                      testResult.auth ? "Auth Required" : "No Auth"
                    })`
                  )
                );
              }
            }, 100);
          }
        }
      } catch (error) {
        // Silent pass
      }
    }); // Console log interceptor - JavaScript hatalarını ve API çağrılarını yakala
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("XHR:") || text.includes("FETCH:")) {
        console.log(chalk.magenta(`🖥️ Console API call: ${text}`));

        // Console'dan API URL'lerini çıkar ve test et
        const urlMatch = text.match(
          /(?:XHR:|FETCH:)\s*\w+\s+(https?:\/\/[^\s]+)/
        );
        if (urlMatch && urlMatch[1]) {
          const url = urlMatch[1];
          if (
            this.isApiEndpoint(url) &&
            this.isInternalUrl(url) &&
            !this.visitedEndpoints.has(url)
          ) {
            this.visitedEndpoints.add(url);

            setTimeout(async () => {
              const method = text.includes("POST") ? "POST" : "GET";
              const testResult = await this.testEndpoint(url, method);
              if (testResult) {
                const log = `${url} - ${
                  testResult.auth ? "AUTH REQUIRED" : "NOAUTH"
                } - ${testResult.method} - Console`;
                this.endpointResults.push(log);
                this.newEndpointsCount++;
                console.log(
                  chalk.green(
                    `✅ Console Endpoint added: ${testResult.method} ${url}`
                  )
                );
              }
            }, 200);
          }
        }
      }
    });

    // Network events
    await page.evaluateOnNewDocument(() => {
      // Override XMLHttpRequest
      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function () {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;

        xhr.open = function (method, url, ...args) {
          console.log(`XHR: ${method} ${url}`);
          return originalOpen.apply(this, [method, url, ...args]);
        };

        return xhr;
      };

      // Override Fetch
      const originalFetch = window.fetch;
      window.fetch = function (url, options = {}) {
        const method = options.method || "GET";
        console.log(`FETCH: ${method} ${url}`);
        return originalFetch.apply(this, arguments);
      };
    });
  }

  isApiEndpoint(url) {
    const apiPatterns = [
      /\/api\//i,
      /\/ajax\//i,
      /\/rest\//i,
      /\/graphql/i,
      /\.json(\?|$)/i,
      /\.xml(\?|$)/i,
      /\.php(\?|$)/i,
      /\.aspx(\?|$)/i,
      /\.jsp(\?|$)/i,
      /\/v\d+\//i, // API versioning
      /\/service\//i,
      /\/endpoint\//i,
    ];

    return apiPatterns.some((pattern) => pattern.test(url));
  }

  isInternalUrl(url) {
    try {
      const urlObj = new URL(url);
      const domainObj = new URL(
        this.domain.startsWith("http") ? this.domain : `https://${this.domain}`
      );

      // Main domain or subdomain check
      return (
        urlObj.hostname === domainObj.hostname ||
        urlObj.hostname.endsWith(`.${domainObj.hostname}`)
      );
    } catch {
      return false;
    }
  }

  async testEndpoint(url, originalMethod) {
    const methods = [originalMethod, "GET", "POST", "PUT", "DELETE", "PATCH"];
    const uniqueMethods = [...new Set(methods)];

    for (const method of uniqueMethods) {
      try {
        const response = await axios({
          method,
          url,
          timeout: 5000,
          validateStatus: () => true,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json, text/plain, */*",
          },
        });

        const status = response.status;

        // Successful responses
        if (status >= 200 && status < 300) {
          return { method, auth: false, status };
        }

        // Auth required
        if (status === 401 || status === 403) {
          return { method, auth: true, status };
        }

        // Method not allowed değilse devam et
        if (status !== 405) {
          return { method, auth: false, status };
        }
      } catch (error) {
        // Timeout veya network error
        continue;
      }
    }

    return null;
  }

  getNewEndpointsCount() {
    return this.newEndpointsCount;
  }

  resetNewEndpointsCount() {
    this.newEndpointsCount = 0;
  }
}
