// test.js - For quick testing
import { WebCrawler } from "./src/crawler.js";

console.log("🧪 Test mode - scanning bubiapps.com...\n");

const crawler = new WebCrawler("bubiapps.com", {
  maxPages: 3,
  timeout: 20000,
  delay: 1500,
});

await crawler.start();
