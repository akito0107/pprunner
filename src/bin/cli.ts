#!/usr/bin/env node

// tslint:disable-next-line
require("source-map-support").install();

import { default as cluster } from "cluster";
import { default as program } from "commander";
import { default as fs, PathLike } from "fs";
import { default as yaml } from "js-yaml";
import { default as path } from "path";
import { default as readdir } from "recursive-readdir";
import {
  ActionHandler,
  ActionName,
  BrowserType,
  ChromeHandler,
  IEHandler,
  run
} from "../main";
import { convert } from "../util";

import { default as d } from "debug";
const debug = d("pprunner");

import { default as pino } from "pino";
const logger = pino();

import os from "os";
const numCPUs = os.cpus().length;

program
  .version("0.0.1")
  .option("-p, --path <caseDir>", "cases root dir")
  .option("-i, --image-dir <imgDir>", "screehshots dir")
  .option("-e, --extension-dir <exDir>", "extensions dir")
  .option("-j, --parallel <parallel>", "run parallel (default = 1)")
  .option(
    "-t, --target <targetScenarios>",
    "target scenario names (comma delimited)"
  )
  .option("-h, --disable-headless", "disable headless mode")
  .option("-b, --browser <targetBrowser>", "target browser (default = chrome)")
  .parse(process.argv);

process.on("unhandledRejection", err => {
  // tslint:disable-next-line
  console.error(err);
  process.exit(1);
});

type CliOptions = {
  parallel: number;
  path: string;
} & RunningOptions;

type RunningOptions = {
  imageDir: string;
  targetScenarios: string[];
  handlers: { [key in ActionName]: ActionHandler<key, BrowserType> };
  headlessFlag: boolean;
  browserType: BrowserType;
};

async function main(pg) {
  debug(pg);
  const { parallel, path: caseDir, ...options } = prepare(pg);

  if (cluster.isMaster) {
    const files = ((await readdir(
      path.resolve(process.cwd(), caseDir)
    )) as string[]).sort();
    if (!parallel) {
      // single thread
      for (const f of files) {
        await pprun({ file: f, options });
      }
      return;
    }
    // multi thread
    const pNum = Math.max(numCPUs, parallel);
    for (let i = 0; i < pNum; i++) {
      cluster.fork();
    }
    const workerIds = Object.keys(cluster.workers);
    const workers = workerIds.map(id => cluster.workers[id]);

    let index = 0;
    let done = 0;
    workers.forEach(worker => {
      worker.on("message", message => {
        if (message === "done") {
          done++;
        }
        if (done === files.length) {
          // All files finished
          process.exit();
        }
        const file = files[index++];
        if (file) {
          worker.send({ file });
        }
      });
    });
    return;
  }
  // worker
  process.send("ready");
  process.on("message", async message => {
    await pprun({ file: message.file, options });
    process.send("done");
  });
}

async function pprun({
  file,
  options: { targetScenarios, handlers, imageDir, headlessFlag, browserType }
}: {
  file: PathLike;
  options: RunningOptions;
}) {
  const originalBuffer = fs.readFileSync(file);
  const originalYaml = originalBuffer.toString();
  const convertedYaml = convert(originalYaml);

  const doc = yaml.safeLoad(convertedYaml);
  if (doc.skip) {
    process.stdout.write(`${file} skip...`);
    return;
  }

  if (doc.onlyBrowser && !doc.onlyBrowser.includes(browserType)) {
    process.stdout.write(`this scenario only browser ${doc.onlyBrowser} ${file} skip...`);
    return;
  }

  if (!doc.name) {
    logger.warn(`scenario: ${file} must be set name prop`);
    return;
  }
  if (targetScenarios.length !== 0 && !targetScenarios.includes(doc.name)) {
    debug(`skip scenario ${file}`);
    return;
  }

  const launchOption = {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: headlessFlag,
    ignoreHTTPSErrors: true
  };

  await run({
    browserType,
    handlers,
    imageDir,
    launchOption,
    scenario: doc
  });
}

function prepare(pg): CliOptions {
  const imageDir = path.resolve(process.cwd(), pg.imageDir);

  const extensions = {};
  if (pg.extensionDir && pg.extensionDir !== "") {
    const extensionsDir = path.resolve(process.cwd(), pg.extensionDir);
    const filenames = fs.readdirSync(extensionsDir);

    filenames.forEach(f => {
      const mod = require(path.resolve(extensionsDir, f));
      if (!mod.name) {
        // tslint:disable-next-line
        console.error(`module: ${f} is invalid. required name`);
      }
      extensions[mod.name] = mod.handler;
    });
  }

  const targetScenarios =
    pg.target && pg.target !== "" ? pg.target.split(",") : [];

  const handlers = {
    ...getHandlers(pg.browser),
    ...extensions
  };

  return {
    browserType: pg.browser || "chrome",
    handlers,
    headlessFlag: !pg.disableHeadless,
    imageDir,
    parallel: pg.parallel,
    path: pg.path,
    targetScenarios
  };
}

function getHandlers(browser: BrowserType) {
  const handlers = browser === "ie" ? IEHandler : ChromeHandler;

  return {
    clear: handlers.clearHandler,
    click: handlers.clickHandler,
    ensure: handlers.ensureHandler,
    goto: handlers.gotoHandler,
    input: handlers.inputHandler,
    radio: handlers.radioHandler,
    screenshot: handlers.screenshotHandler,
    select: handlers.selectHandler,
    wait: handlers.waitHandler
  };
}

main(program);
