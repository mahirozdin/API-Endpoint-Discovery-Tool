// utils/logger.js - Advanced logging system
import chalk from "chalk";

export class Logger {
  constructor() {
    this.startTime = Date.now();
  }

  getTimestamp() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    return chalk.gray(`[${elapsed}s]`);
  }

  info(message) {
    console.log(`${this.getTimestamp()} ${chalk.blue("ℹ")} ${message}`);
  }

  success(message) {
    console.log(`${this.getTimestamp()} ${chalk.green("✅")} ${message}`);
  }

  warn(message) {
    console.log(`${this.getTimestamp()} ${chalk.yellow("⚠️")} ${message}`);
  }

  error(message) {
    console.log(`${this.getTimestamp()} ${chalk.red("❌")} ${message}`);
  }

  debug(message) {
    console.log(
      `${this.getTimestamp()} ${chalk.gray("🔧")} ${chalk.gray(message)}`
    );
  }

  progress(message) {
    console.log(`${this.getTimestamp()} ${chalk.cyan("🔄")} ${message}`);
  }
}
