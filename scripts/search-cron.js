import cron from "node-cron";
import { buildSearchData } from "./build-search-data.mjs";

buildSearchData();

cron.schedule("0 */2 * * *", () => {
  console.log("⏳ Running scheduled buildSearchData...");
  buildSearchData();
});
