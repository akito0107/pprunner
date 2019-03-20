import { PathLike } from "fs";
import { default as produce } from "immer";
import { reduce } from "p-iteration";
import { default as pino } from "pino";
import { default as puppeteer, Page } from "puppeteer";
import { Builder, WebDriver } from "selenium-webdriver";
import { Action, ActionName, BrowserEngine, RunnerOption } from "./main";
import { ActionHandler, BrowserType, Context } from "./types";
import { isPuppeteer } from "./util";

const logger = pino();

export async function getBrowser(
  type: BrowserType,
  opts
): Promise<BrowserEngine<BrowserType>> {
  return type === "ie"
    ? new Builder().forBrowser("internet explorer").build()
    : puppeteer.launch(opts);
}

export const run = async ({
  browser,
  scenario,
  handlers,
  imageDir
}: RunnerOption) => {
  logger.info("precondition start.");

  let page: puppeteer.Page | WebDriver = browser as WebDriver;
  if (isPuppeteer(browser)) {
    page = await (browser as puppeteer.Browser).newPage();
  }

  const precondition = scenario.precondition;
  const context: Context = {
    currentIteration: 0,
    precondition: { steps: [] },
    steps: []
  };
  if (precondition) {
    await handlers.goto(page, {
      action: { type: "goto", url: precondition.url }
    });
    try {
      await handleAction(
        0,
        page,
        handlers,
        precondition.steps,
        { imageDir, context },
        (ctx, res) => {
          return produce(ctx, draft => {
            draft.precondition.steps.push(res);
          });
        }
      );
    } catch (e) {
      logger.error(e);
      await handlers.screenshot(
        page,
        {
          action: { type: "screenshot", name: "pre" }
        },
        { imageDir }
      );
    }
    logger.info("precondition done.");
  }

  const now = Date.now();
  logger.info(`main scenario start. at ${now.toLocaleString()}`);
  for (let i = 0; i < scenario.iteration; i++) {
    logger.info(`${i} th iteration start`);
    try {
      logger.info(`${scenario.name} start`);
      await handlers.goto(page, {
        action: { type: "goto", url: scenario.url }
      });
      await handleAction(
        i,
        page,
        handlers,
        scenario.steps,
        { context, imageDir },
        (ctx, res) => {
          return produce(ctx, draft => {
            draft.steps.push(res);
          });
        }
      );
    } catch (e) {
      await handlers.screenshot(
        page,
        {
          action: { type: "screenshot", name: i.toString() }
        },
        { imageDir }
      );
      throw e;
    }
  }
  logger.info("main scenario end");

  await browser.close();
};

type ContextReducer = (ctx: Context, res: object) => Context;

async function handleAction(
  iteration: number,
  page: Page | WebDriver,
  handlers: { [key in ActionName]: ActionHandler<key> },
  steps: Action[],
  { imageDir, context }: { imageDir: PathLike; context: Context },
  reducer: ContextReducer
) {
  return reduce(
    steps,
    async (acc: Context, step) => {
      const action = step.action;
      logger.info(action);
      const handler = handlers[action.type];
      if (!handler) {
        throw new Error(`unknown action type: ${(action as any).type}`);
      }
      const res = await handler(page, { action } as any, {
        context: {
          ...acc,
          currentIteration: iteration
        },
        imageDir
      });
      return reducer(acc, res);
    },
    context
  );
}
