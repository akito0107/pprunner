import { default as Handlebars } from "handlebars";
import { BrowserType } from "./types";

export function convert(yaml: string): string {
  const data = {
    hostUrl: process.env.HOST_URL || "http://localhost:3000",
    password: process.env.PASSWORD || "passw0rd",
    userId: process.env.USER_ID || "test@example.com"
  };
  const template = Handlebars.compile(yaml);
  const converted = template(data);
  return converted;
}

export function isPuppeteer(browser: any): boolean {
  return browser.newPage !== undefined;
}

// TODO: contextから取得する
export function getBrowserType(browser: any): BrowserType {
  return isPuppeteer(browser) ? "chrome" : "ie";
}
