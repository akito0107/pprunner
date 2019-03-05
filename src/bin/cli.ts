#!/usr/bin/env node

import { default as program } from "commander";
import { default as fs } from "fs";
import { default as yaml } from "js-yaml";
import { default as path } from "path";
import { default as readdir } from "recursive-readdir";
import {
  clickHandler,
  ensureHandler,
  gotoHandler,
  inputHandler,
  radioHandler,
  screenshotHandler,
  selectHandler,
  waitHandler
} from "../handlers";
import { run } from "../main";
import { convert } from "../util";

import { default as d } from "debug";
const debug = d("pprunner");

import { default as pino } from "pino";
const logger = pino();

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
  .parse(process.argv);

process.on("unhandledRejection", err => {
  // tslint:disable-next-line
  console.error(err);
  process.exit(1);
});

main(program);

async function main(pg) {
  debug(pg);
  const files = await readdir(path.resolve(process.cwd(), pg.path));
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
    ...defaultHandlers(),
    ...extensions
  };

  for (const f of files) {
    const originalBuffer = fs.readFileSync(f);
    const originalYaml = originalBuffer.toString();
    const convertedYaml = convert(originalYaml);

    const doc = yaml.safeLoad(convertedYaml);
    if (doc.skip) {
      process.stdout.write(`${f} skip...`);
      continue;
    }

    if (!doc.name) {
      logger.warn(`scenario: ${f} must be set name prop`);
      continue;
    }
    if (targetScenarios.length !== 0 && !targetScenarios.includes(doc.name)) {
      debug(`skip scenario ${f}`);
      continue;
    }
    await run({
      handlers,
      imageDir,
      launchOption: { headless: !pg.disableHeadless },
      scenario: doc
    });
  }
}

function defaultHandlers() {
  return {
    click: clickHandler,
    ensure: ensureHandler,
    goto: gotoHandler,
    input: inputHandler,
    radio: radioHandler,
    screenshot: screenshotHandler,
    select: selectHandler,
    wait: waitHandler
  };
}
