import { PathLike } from "fs";
import { Page } from "puppeteer";
import { WebDriver } from "selenium-webdriver";
import { ActionName, ActionType } from "../main";

export type Context = {
  currentIteration: number;
  precondition: {
    steps: Array<{}>;
  };
  steps: Array<{}>;
};

export type SupportedEngine = "Chrome" | "IE";

export type ActionHandler<T extends ActionName, E extends SupportedEngine> = (
  page: E extends "Chrome" ? Page : WebDriver,
  action: ActionType<T>,
  options?: { imageDir: PathLike; context: Context }
) => Promise<any>;
