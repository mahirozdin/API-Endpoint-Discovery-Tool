// crawler.js - Main crawler class
import puppeteer from "puppeteer";
import chalk from "chalk";
import { Logger } from "./utils/logger.js";
import { RequestInterceptor } from "./utils/requestInterceptor.js";
import { FormHandler } from "./utils/formHandler.js";
import { UrlFilter } from "./utils/urlFilter.js";
import { FileManager } from "./utils/fileManager.js";

export class WebCrawler {
  constructor(domain, options = {}) {
    this.domain = domain;
    this.rootUrl = domain.startsWith("http") ? domain : `https://${domain}`;
    this.visitedPages = new Set();
    this.visitedEndpoints = new Set();
    this.navigationQueue = [this.rootUrl];
    this.endpointResults = [];
    this.logger = new Logger();
    this.fileManager = new FileManager(domain);
    this.options = {
      maxPages: options.maxPages || 999999, // Default unlimited
      timeout: options.timeout || 30000,
      delay: options.delay || 1000,
      maxDepth: options.maxDepth || 999999, // Default unlimited
      ...options,
    };
    this.currentDepth = 0;
  }

  async start() {
    this.logger.info(`🚀 Starting API Endpoint Discovery: ${this.rootUrl}`);
    this.logger.info(
      `📊 Settings: Max ${this.options.maxPages} pages, ${this.options.maxDepth} depth`
    );
    const browser = await puppeteer.launch({
      headless: false, // Visible mode for debugging
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-extensions",
        "--no-default-browser-check",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });

    // Start request interceptor
    const requestInterceptor = new RequestInterceptor(
      this.domain,
      this.visitedEndpoints,
      this.endpointResults
    );
    await requestInterceptor.setup(page);

    // Start form handler
    const formHandler = new FormHandler();

    let processedPages = 0;

    while (
      this.navigationQueue.length > 0 &&
      processedPages < this.options.maxPages
    ) {
      const currentUrl = this.navigationQueue.shift();

      if (this.visitedPages.has(currentUrl)) {
        continue;
      } // URL filtering
      if (!UrlFilter.isValidUrl(currentUrl, this.rootUrl)) {
        this.logger.debug(`❌ Skipping invalid URL: ${currentUrl}`);
        continue;
      }

      this.visitedPages.add(currentUrl);
      processedPages++;
      try {
        this.logger.progress(
          `🔍 [${processedPages}/${
            this.options.maxPages === 999999 ? "∞" : this.options.maxPages
          }] Scanning: ${currentUrl}`
        );

        // Make page navigation safer
        await page.goto(currentUrl, {
          waitUntil: "domcontentloaded",
          timeout: this.options.timeout,
        });

        // Wait for page to load
        await this.wait(2000);

        // Wait for network activity
        try {
          await page.waitForLoadState?.("networkidle", { timeout: 5000 });
        } catch (e) {
          // Continue if NetworkIdle can't be waited for
        }

        // Find and test forms and buttons
        this.logger.debug("📝 Searching for forms and interactive elements...");
        await formHandler.handleForms(page);
        await formHandler.handleButtons(page); // Collect all links
        this.logger.debug("🔗 Collecting links...");
        const links = await this.extractAllLinks(page);

        let addedLinks = 0;
        for (const link of links) {
          if (
            !this.visitedPages.has(link) &&
            UrlFilter.isValidUrl(link, this.rootUrl) &&
            this.navigationQueue.length < this.options.maxPages * 2
          ) {
            this.navigationQueue.push(link);
            addedLinks++;
          }
        }

        this.logger.debug(
          `➕ ${addedLinks} new links added (Total queue: ${this.navigationQueue.length})`
        );

        // Show API endpoints in real-time
        if (requestInterceptor.getNewEndpointsCount() > 0) {
          this.logger.success(
            `🎯 Found ${requestInterceptor.getNewEndpointsCount()} new endpoints on this page!`
          );
          requestInterceptor.resetNewEndpointsCount();
        }

        await this.wait(this.options.delay);
      } catch (error) {
        this.logger.error(
          `⚠️ Error loading page: ${currentUrl} - ${error.message.slice(
            0,
            100
          )}`
        );

        // Create new page for critical errors
        if (
          error.message.includes("detached") ||
          error.message.includes("closed")
        ) {
          try {
            await page.close();
            const newPage = await browser.newPage();
            await newPage.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            );
            await newPage.setViewport({ width: 1366, height: 768 });
            await requestInterceptor.setup(newPage);
            page = newPage; // Use new page
            this.logger.info("🔄 New browser page created");
          } catch (e) {
            this.logger.error(`❌ Could not create new page: ${e.message}`);
          }
        }
      }

      // Progress report every 5 pages
      if (processedPages % 5 === 0) {
        this.logger.info(
          `📈 Progress: ${processedPages} pages scanned, ${this.endpointResults.length} endpoints found`
        );
      }
    }
    await browser.close();

    // Save results to file
    await this.saveResults(formHandler);

    this.showResults();
  }

  async extractAllLinks(page) {
    return await page.evaluate(() => {
      const links = new Set();

      // Normal links
      document.querySelectorAll("a[href]").forEach((a) => {
        if (a.href && a.href.startsWith("http")) {
          links.add(a.href);
        }
      });

      // JavaScript ile yönlendirmeler
      document.querySelectorAll("[onclick]").forEach((elem) => {
        const onclick = elem.getAttribute("onclick");
        if (onclick) {
          const matches = onclick.match(
            /(?:location\.href\s*=\s*['"`])([^'"`]+)['"`]/
          );
          if (matches && matches[1]) {
            const url = matches[1].startsWith("/")
              ? window.location.origin + matches[1]
              : matches[1];
            links.add(url);
          }
        }
      });

      // Form action'ları
      document.querySelectorAll("form[action]").forEach((form) => {
        let action = form.getAttribute("action");
        if (action) {
          if (action.startsWith("/")) {
            action = window.location.origin + action;
          } else if (!action.startsWith("http")) {
            action =
              window.location.href.split("?")[0].replace(/\/$/, "") +
              "/" +
              action;
          }
          links.add(action);
        }
      });

      return Array.from(links);
    });
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async saveResults(formHandler) {
    this.logger.info("💾 Saving results to file...");

    const formInfo = formHandler.getFoundForms();

    // Save to TXT file
    const txtFile = await this.fileManager.saveEndpoints(
      this.endpointResults,
      formInfo
    );
    if (txtFile) {
      this.logger.success(`📄 TXT report saved: ${txtFile}`);
    }

    // Save JSON report
    const jsonFile = await this.fileManager.saveJsonReport(
      this.endpointResults,
      formInfo,
      this.visitedPages
    );
    if (jsonFile) {
      this.logger.success(`📊 JSON report saved: ${jsonFile}`);
    }
  }

  showResults() {
    this.logger.info("\n" + "=".repeat(60));
    this.logger.info("📊 SCAN RESULTS");
    this.logger.info("=".repeat(60));

    this.logger.info(`📄 Pages scanned: ${this.visitedPages.size}`);
    this.logger.info(
      `🎯 Found Endpoint Count: ${this.endpointResults.length}`
    );

    if (this.endpointResults.length > 0) {
      this.logger.success("\n✅   API endpoints found:");
      this.logger.info("-".repeat(60));

      // Endpoint'leri kategorilere ayır
      const categories = {
        "AUTH REQUIRED": [],
        "NO AUTH": [],
        UNKNOWN: [],
      };

      this.endpointResults.forEach((result) => {
        if (result.includes("AUTH REQUIRED")) {
          categories["AUTH REQUIRED"].push(result);
        } else if (result.includes("NOAUTH")) {
          categories["NO AUTH"].push(result);
        } else {
          categories["UNKNOWN"].push(result);
        }
      });

      Object.entries(categories).forEach(([category, endpoints]) => {
        if (endpoints.length > 0) {
          this.logger.info(`\n🔸 ${category} (${endpoints.length}):`);
          endpoints.forEach((endpoint) => {
            const color =
              category === "AUTH REQUIRED"
                ? "yellow"
                : category === "NO AUTH"
                ? "green"
                : "gray";
            console.log(chalk[color](`  ${endpoint}`));
          });
        }
      });
    } else {
      this.logger.warn("\n⚠️  No API endpoints found.");
    }

    this.logger.info("\n" + "=".repeat(60));
  }
}
