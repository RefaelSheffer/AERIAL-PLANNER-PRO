import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Find the latest cron migration file
const migrationsDir = path.resolve(__dirname, "../supabase/migrations");
const cronFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.includes("cron") || f.includes("push_check_cron"))
  .sort();
const latestCronFile = cronFiles[cronFiles.length - 1];
const sql = fs.readFileSync(path.join(migrationsDir, latestCronFile), "utf-8");

describe(`cron migration (${latestCronFile})`, () => {
  it("contains Authorization header in jsonb_build_object", () => {
    expect(sql).toMatch(/['"]Authorization['"]/);
  });

  it("contains x-cron-secret header", () => {
    expect(sql).toMatch(/['"]x-cron-secret['"]/);
  });

  it("contains Content-Type header", () => {
    expect(sql).toMatch(/['"]Content-Type['"]/);
  });

  it("schedules every 30 minutes (*/30 * * * *)", () => {
    expect(sql).toContain("*/30 * * * *");
  });
});
