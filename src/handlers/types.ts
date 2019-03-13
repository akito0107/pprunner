import { PathLike } from "fs";
import { Page } from "puppeteer";
import { WebDriver } from "selenium-webdriver";
import { ActionName, ActionType } from "../main";

export type ActionHandler<T extends ActionName> = (
  context: Page | WebDriver,
  action: ActionType<T>,
  options?: { imageDir: PathLike }
) => Promise<any>;
