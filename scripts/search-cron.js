import cron from "node-cron";
import { buildSearchData } from "./buildSearchData.js";

buildSearchData();

cron.schedule("0 */2 * * *", () => {
  console.log("⏳ Running scheduled buildSearchData...");
  buildSearchData();
});
