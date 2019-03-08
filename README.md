# pprunner

[puppeteer](https://github.com/GoogleChrome/puppeteer) runner.

[![npm version](https://badge.fury.io/js/pprunner.svg)](https://badge.fury.io/js/pprunner) [![Greenkeeper badge](https://badges.greenkeeper.io/akito0107/pprunner.svg)](https://greenkeeper.io/)

## Getting Started

### Prerequisites
- Node.js v8+
- npm or yarn

### Installing
```
$ yarn global add pprunner
```

## Options
```
$ pprunner --help
Usage: pprunner [options]

Options:
  -V, --version                   output the version number
  -p, --path <caseDir>            cases root dir
  -i, --image-dir <imgDir>        screehshots dir
  -e, --extension-dir <exDir>     extensions dir
  -t, --target <targetScenarios>  target scenario names (comma delimited)
  -h, --disable-headless          disable headless mode
  -h, --help                      output usage information
  -b, --browser                   browser type (default puppeteer)
```

## selenium-webdriver
You can also run pprunner on Internet Explorer 11 using [selenium-webdriver](https://www.seleniumhq.org/projects/webdriver/).

Please run and connect a [selenium-standalone-server](https://www.seleniumhq.org/download/).

```
 SELENIUM_REMOTE_URL=http://${selenium-server-host}:4444/wd/hub pprunner -b ie -p ${caseDir} -i ${imageDir}
```

## License
This project is licensed under the Apache License 2.0 License - see the [LICENSE](LICENSE) file for details
