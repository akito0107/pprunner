#!/usr/bin/env node

import { default as program } from "commander";
import { default as fs } from "fs";
import { default as yaml } from "js-yaml";
import { default as path } from "path";
import { default as readdir } from "recursive-readdir";
import {
  clickHandler,
  ensureHandler,
  inputHandler,
  radioHandler,
  screenshotHandler,
  selectHandler,
  waitHandler
} from "../handlers";
import { run } from "../main";

import { default as d } from "debug";
const debug = d("pprunner");

program
  .version("0.0.1")
  .option("-p, --path <caseDir>", "cases root dir")
  .option("-i, --image-dir <imgDir>", "screehshots dir")
  .option("-e, --extension-dir <exDir>", "extensions dir")
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

  const handlers = {
    ...defaultHandlers(),
    ...extensions
  };

  for (const f of files) {
    const doc = yaml.safeLoad(fs.readFileSync(f));
    if (doc.skip) {
      process.stdout.write(`${f} skip...`);
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
    input: inputHandler,
    radio: radioHandler,
    screenshot: screenshotHandler,
    select: selectHandler,
    wait: waitHandler
  };
}
