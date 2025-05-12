import "@default-js/defaultjs-extdom/index.js";
import GLOBAL from "@default-js/defaultjs-common-utils/src/Global.js";
import HTMLDownloaderElement from "./src/HTMLDowloaderElement.js";

GLOBAL.defaultjs = GLOBAL.defaultjs || {};
GLOBAL.defaultjs.html = GLOBAL.defaultjs.html || {};
GLOBAL.defaultjs.html.HTMLDownloaderElement = GLOBAL.defaultjs.html.HTMLDownloaderElement || HTMLDownloaderElement;