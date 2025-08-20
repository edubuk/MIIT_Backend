const { join } = require("path");

/** @type {import('puppeteer').Configuration} */
module.exports = {
  // Store downloaded browsers inside the repo
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
