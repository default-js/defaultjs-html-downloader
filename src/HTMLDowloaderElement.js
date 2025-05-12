import { Component, componentBaseOf, define } from "@default-js/defaultjs-html-components/index.js";
import { Template, Renderer } from "@default-js/defaultjs-template-language/index.js";
import { getFilenameByHeader } from "./Utils.js";


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

const EVENT__REQUEST_AUTH = `${NODENAME}--request--auth-handle`;
const EVENT__RESPONSE_AUTH = `${NODENAME}--response--auth-handle`;

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

class HTMLDownloaderElement extends Component {
	static NODENAME = NODENAME;
	static observedAttributes = ATTRIBUTES;
	static STATES = STATES;

	static EVENT__REQUEST_AUTH = EVENT__REQUEST_AUTH;
	static EVENT__RESPONSE_AUTH = EVENT__RESPONSE_AUTH;

    /**
     * 
     * @param {Template|String|URL} aTemplate 
     */
	static defaultTemplate(aTemplate) {
		DEFAULTTEMPLATE = aTemplate instanceof HTMLTemplateElement ? new Template(aTemplate) : Template.load(aTemplate);
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

		this.on("click", (/** @type Event */ event) => {
			event.preventDefault();
			event.stopPropagation();
			const state = this.#state;
			if (state == STATE__READY) this.#download();
		});

		this.on(EVENT__RESPONSE_AUTH, (event) => {
			event.preventDefault();
			event.stopPropagation();
			(async () => {
				const response = await fetch(event.detail);
				this.#filename = getFilenameByHeader(response, this.#filename);
				const blob = await response.blob();
				const file = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = file;
				link.download = this.#filename;
				link.click();

				URL.revokeObjectURL(file);
				this.#setState(STATE__READY);
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
			else this.#template = Template.load(template);

			if(!this.hasAttribute(ATTRIBUTE__USE_AUTH_HANDLE_EVENT)){
                this.on(EVENT__REQUEST_AUTH, (event) => {
                    event.preventDefault();
			        event.stopPropagation();
                    this.trigger(EVENT__RESPONSE_AUTH, event.detail);
                })
            }

			this.#render();
		}
	}

	#setState(/** @type {STATES} */ aState) {
		this.#state = STATES[aState] || this.#state;
		this.attr(ATTRIBUTE__STATE, aState);
	}

	async #download() {
		this.#setState(STATE__LOADING);
		this.#render();
		const request = new Request(new URL(this.#href, location));
		this.trigger(EVENT__REQUEST_AUTH, request);
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
