import { Component, componentBaseOf, define } from "@default-js/defaultjs-html-components/index.js";
import { Template, Renderer } from "@default-js/defaultjs-template-language/index.js";
import { getFilenameByHeader } from "./Utils.js";

const DOCUMENT = document;

const DEFAULTFILENAME = "downloaded-file";
const NODENAME = "d-downloader";

const ATTRIBUTE__HREF = "href";
const ATTRIBUTE__TEMPLATE = "template";
const ATTRIBUTE__FILENAME = "filename";
const ATTRIBUTE__STATE = "state";
const ATTRIBUTE__USE_AUTH_HANDLE_EVENT = "use-auth-handle-event";
const ATTRIBUTES = [];

let DEFAULTTEMPLATE = Template.load(
	`<a href="\${href}" download="\${filename}"></a>
    <span jstl-if="\${state == 'loading'}">(loading ...)</span>
    `,
	false,
);

const EVENT__ACTION__DOWNLOAD = `${NODENAME}--action--download`;
const EVENT__EXECUTING__DOWNLOAD = `${NODENAME}--executing--download`;
const EVENT__ACKNOWLEDGE__DOWNLOAD = `${NODENAME}--acknowledge--download`;
const EVENT__REQUEST__AUTHENTICATION = `${NODENAME}--request--authentication`;
const EVENT__RESPONSE__AUTHENTICATION = `${NODENAME}--response--authentication`;

const STATE__READY = "ready";
const STATE__LOADING = "loading";

/**
 * Enum STATES.
 * @readonly
 * @enum {string}
 */
export const STATES = {
	ready: STATE__READY,
	loading: STATE__LOADING,
};

/**
 *
 * @param {HTMLElement} self
 * @param {String} template
 */
const loadTemplate = async (self, template) => {
	let result = null;
	try {
		result = self.querySelector(template);
	} catch (e) {}
	if (result == null)
		try {
			result = DOCUMENT.querySelector(template);
		} catch (e) {}
	if (result == null) return Template.load(new URL(template, location));
	return Template.load(result);
};

class HTMLDownloaderElement extends Component {
	static NODENAME = NODENAME;
	static observedAttributes = ATTRIBUTES;
	static STATES = STATES;

	static EVENT__ACTION__DOWNLOAD = EVENT__ACTION__DOWNLOAD;
	static EVENT__EXECUTING__DOWNLOAD = EVENT__EXECUTING__DOWNLOAD;
	static EVENT__ACKNOWLEDGE__DOWNLOAD = EVENT__ACKNOWLEDGE__DOWNLOAD;
	static EVENT__REQUEST__AUTHENTICATION = EVENT__REQUEST__AUTHENTICATION;
	static EVENT__RESPONSE__AUTHENTICATION = EVENT__RESPONSE__AUTHENTICATION;

	/**
	 *
	 * @param {Template|String|URL} aTemplate
	 */
	static defaultTemplate(aTemplate) {
		DEFAULTTEMPLATE = (() => {
			if (typeof aTemplate === "function") return aTemplate();
			if (aTemplate instanceof Promise) return aTemplate;
			if (aTemplate instanceof HTMLTemplateElement) return new Template(aTemplate);
			return Template.load(aTemplate);
		})();
	}

	/**@type {string} */
	#state = STATE__READY;
	/**@type {Promise<Template>} */
	#template = null;
	/**@type {string} */
	#href = null;
	/**@type {string} */
	#filename = null;
	/**@type {Array<Node>} */
	#content = null;

	constructor() {
		super();

		this.on(["click", EVENT__ACTION__DOWNLOAD], (/** @type Event */ event) => {
			event.preventDefault();
			event.stopPropagation();
			const state = this.#state;
			if (state == STATE__READY) this.#download();
		});

		this.on(EVENT__RESPONSE__AUTHENTICATION, (event) => {
			event.preventDefault();
			event.stopPropagation();
			(async () => {
				const { url, request } = event.detail;
				const response = await fetch(url, request);
				this.#filename = getFilenameByHeader(response, this.#filename);
				const blob = await response.blob();
				const file = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = file;
				link.download = this.#filename;
				link.click();

				URL.revokeObjectURL(file);
				this.#setState(STATE__READY);
				this.trigger(EVENT__ACKNOWLEDGE__DOWNLOAD);
				this.#render();
			})();
		});
	}

	async init() {
		await super.init();
		if (!this.ready.resolved) {
			this.#setState(STATE__READY);
			this.#content = Array.from(this.root.content());
			this.#href = this.attr(ATTRIBUTE__HREF);
			this.#filename = this.attr(ATTRIBUTE__FILENAME) || DEFAULTFILENAME;
			const template = (this.attr(ATTRIBUTE__TEMPLATE) || "").trim();
			if (template.length == 0) this.#template = DEFAULTTEMPLATE;
			else this.#template = loadTemplate(this, template);

			if (!this.hasAttribute(ATTRIBUTE__USE_AUTH_HANDLE_EVENT)) {
				this.on(EVENT__REQUEST__AUTHENTICATION, (event) => {
					event.preventDefault();
					event.stopPropagation();
					this.trigger(EVENT__RESPONSE__AUTHENTICATION, event.detail);
				});
			}

			this.#render();
		}
	}

	#setState(/** @type {STATES} */ aState) {
		this.#state = STATES[aState] || this.#state;
		this.attr(ATTRIBUTE__STATE, aState);
	}

	/**
	 *
	 * @returns {Promise}
	 */
	download() {
		return new Promise((resolve, reject) => {
			const callback = (event) => {
				this.removeOn(callback);
				resolve();
			};

			this.on(EVENT__ACKNOWLEDGE__DOWNLOAD, callback);
			this.trigger(EVENT__ACTION__DOWNLOAD);
		});
	}

	async #download() {
		this.#setState(STATE__LOADING);
		this.#render();
		this.trigger(EVENT__EXECUTING__DOWNLOAD);
		const url = new URL(this.#href, location);
		const request = { method: "get", headers: new Headers() };
		this.trigger(EVENT__REQUEST__AUTHENTICATION, { url, request });
	}

	async #render() {
		await Renderer.render({
			data: {
				state: this.#state,
				href: this.#href,
				filename: this.#filename || "",
			},
			template: await this.#template,
			container: this,
		});
		const link = this.find("a").first();
		if (link) link.append(this.#content);
	}
}

define(HTMLDownloaderElement);
export default HTMLDownloaderElement;
