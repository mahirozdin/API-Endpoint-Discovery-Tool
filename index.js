// index.js - Advanced API Endpoint Discovery Tool
import minimist from "minimist";
import chalk from "chalk";
import { WebCrawler } from "./src/crawler.js";

// Parse command line arguments
const args = minimist(process.argv.slice(2));
const domain = args.domain || args.d;
const maxPages = parseInt(args.maxPages || args.p) || 999999; // Default unlimited
const timeout = parseInt(args.timeout || args.t) || 30000; // 30 seconds
const delay = parseInt(args.delay || args.w) || 1000; // 1 second
const maxDepth = parseInt(args.depth || args.depth) || 999999; // Unlimited depth

// Help message
if (args.help || args.h) {
  console.log(
    chalk.cyan(`
🔍 API Endpoint Discovery Tool - Advanced Penetration Testing Scanner

Usage:
  node index.js --domain=example.com [options]

Required Parameters:
  --domain, -d     Target domain to scan (e.g: example.com or https://example.com)

Optional Parameters:
  --maxPages, -p   Maximum number of pages to scan (default: unlimited)
  --timeout, -t    Page load timeout in ms (default: 30000)
  --delay, -w      Delay between pages in ms (default: 1000)
  --depth          Maximum crawl depth (default: unlimited)
  --help, -h       Show this help message

Examples:
  node index.js --domain=example.com
  node index.js -d example.com -p 100 -t 10000 -w 500
  node index.js --domain=https://api.example.com --maxPages=25 --delay=2000

Features:
  ✅ Advanced form detection and auto-filling
  ✅ Automatic JavaScript button clicking
  ✅ XHR/Fetch request interception
  ✅ Real-time progress tracking
  ✅ Smart URL filtering
  ✅ Multiple HTTP method testing
  ✅ Auth requirement detection
  `)
  );
  process.exit(0);
}

// Domain validation
if (!domain) {
  console.error(
    chalk.red(`
❌ Error: Domain parameter is missing!

Usage: node index.js --domain=example.com

For help: node index.js --help
    `)
  );
  process.exit(1);
}

// Main function
(async () => {
  try {
    console.log(
      chalk.cyan(`
┌─────────────────────────────────────────────┐
│    🔍 API Endpoint Discovery Tool v2.0       │
│    Advanced Penetration Testing Scanner     │
└─────────────────────────────────────────────┘
    `)
    );

    // Show settings
    console.log(chalk.blue(`📋 Scan Settings:`));
    console.log(chalk.gray(`   🌐 Domain: ${domain}`));
    console.log(
      chalk.gray(
        `   📄 Max Pages: ${maxPages === 999999 ? "Unlimited" : maxPages}`
      )
    );
    console.log(chalk.gray(`   ⏱️ Timeout: ${timeout}ms`));
    console.log(chalk.gray(`   ⏳ Delay: ${delay}ms`));
    console.log(
      chalk.gray(
        `   🔗 Max Depth: ${maxDepth === 999999 ? "Unlimited" : maxDepth}`
      )
    );
    console.log("");

    // Start crawler
    const crawler = new WebCrawler(domain, {
      maxPages,
      timeout,
      delay,
      maxDepth,
    });

    await crawler.start();
  } catch (error) {
    console.error(chalk.red(`\n❌ Fatal Error: ${error.message}`));
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
})();
