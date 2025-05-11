import "@default-js/defaultjs-extdom/index.js";
import GLOBAL from "@default-js/defaultjs-common-utils/src/Global.js";
import HTMLDownloadElement from "./src/HTMLDowloadElement.js";

GLOBAL.defaultjs = GLOBAL.defaultjs || {};
GLOBAL.defaultjs.html = GLOBAL.defaultjs.html || {};
GLOBAL.defaultjs.html.HTMLDownloadElement = GLOBAL.defaultjs.html.HTMLDownloadElement || HTMLDownloadElement;