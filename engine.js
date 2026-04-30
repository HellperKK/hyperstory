const signals = [];
const computeds = [];
const events = [];
const saveName = "save";

const addSignal = (dependencies, callback) =>
	signals.push({ dependencies, callback });
const addComputed = (dependencies, callback, name) =>
	computeds.push({ dependencies, callback, name });
const addEvent = (condition, callback) => events.push({ condition, callback });

const primitives = [
	"boolean",
	"number",
	"bigint",
	"string",
	"symbol",
	"function",
	"undefined",
];
const indexPass = /^\[(\d+)\]/;
const propertyPass = /^\.([A-Za-z_0-9]+)/;

function set(obj, path, value) {
	const { obj: previousObject, path: previousPath } = dig(obj, path)[1];

	let index = null;
	if (indexPass.test(previousPath)) {
		const capture = indexPass.exec(previousPath);
		index = parseInt(capture[1], 10);
	}

	if (propertyPass.test(previousPath)) {
		const capture = propertyPass.exec(previousPath);
		index = capture[1];
	}

	if (index === null) {
		throw `invalid name ${previousPath}`;
	}

	previousObject[index] = value;
}

function dig(obj, path) {
	let result = obj;
	let newPath = `.${path}`;
	const results = [{ obj: result, path: newPath }];

	while (newPath !== "") {
		let index = null;
		let full = null;

		if (indexPass.test(newPath)) {
			const capture = indexPass.exec(newPath);
			full = capture[0];
			index = parseInt(capture[1], 10);
		}

		if (propertyPass.test(newPath)) {
			const capture = propertyPass.exec(newPath);
			full = capture[0];
			index = capture[1];
		}

		if (index === null) {
			throw `invalid name ${newPath}`;
		}

		result = result[index];
		newPath = newPath.slice(full.length);
		results.unshift({ obj: result, path: newPath });
	}

	return results;
}

function digb(obj, path) {
	return dig(obj, path)[0].obj;
}

function buildKey(keys) {
	let res = keys.shift();

	for (const key of keys) {
		res += /^\d+$/.test(key) ? `[${key}]` : `.${key}`;
	}

	return res;
}

function makeHandler(object, root = []) {
	const handler = {
		get: (target, key) => {
			if (key === "toJson") {
				return () => target;
			}

			const value = target[key];

			if (primitives.includes(typeof value) || value === null) {
				return value;
			}
			return makeHandler(value, root.concat(key));
		},
		set: (target, key, value) => {
			target[key] = value;

			const fullKey = buildKey(root.concat(key));

			for (const signal of signals) {
				if (signal.dependencies.some((key) => key.startsWith(fullKey))) {
					const key = signal.dependencies.find((key) =>
						key.startsWith(fullKey),
					);
					signal.callback(digb($, key));
				}
			}

			for (const computed of computeds) {
				if (computed.dependencies.some((key) => key.startsWith(fullKey))) {
					const values = computed.dependencies.map((dep) => digb($, dep));
					set($, computed.name, computed.callback(...values));
				}
			}

			return true;
		},
	};

	return new Proxy(object, handler);
}

let $ = makeHandler({});
let game;

function save() {
	localStorage.setItem(saveName, JSON.stringify({ state: $, pageId: game.id }));
}
function load() {
	const data = JSON.parse(localStorage.getItem(saveName));
	$ = makeHandler({});
	Object.assign($, data.state);
	game.next(data.pageId, false);
}
class EngineRoot extends HTMLElement {
	connectedCallback() {
		game = this;
		this.startPage = this.querySelector("story-scene[start]");
		this.startPage.activate();
		this.currentPage = this.startPage;
		this.id = this.currentPage.getAttribute("pageid");

		this.allPages = this.querySelectorAll("story-scene");
		this.allPages.forEach((page) => {
			page.connect((id) => {
				this.next(id);
			});
		});
	}

	next(id, trigger = true) {
		this.id = id;
		const nextPage = this.querySelector(`story-scene[page-id="${id}"]`);

		if (!nextPage) {
			console.error(`No page with id ${id}`);
			return;
		}

		this.currentPage.deactivate();
		nextPage.activate();
		this.currentPage = nextPage;

		if (trigger) {
			for (const event of events) {
				if (event.condition()) {
					event.callback(id, this);
				}
			}
		}
	}
}

class EngineScene extends HTMLElement {
	activate() {
		this.classList.add("active");
	}

	deactivate() {
		this.classList.remove("active");
	}

	connect(callback) {
		this.querySelectorAll("story-choice").forEach((link) => {
			link.connect(callback);
		});
	}
}

class EngineChoice extends HTMLElement {
	connect(callback) {
		this.addEventListener("click", () => {
			callback(this.getAttribute("to"));
		});
	}

	connectedCallback() {
		const button = document.createElement("button");
		const text = this.innerText;
		this.innerText = "";
		button.innerText = text;
		this.appendChild(button);
	}
}

class EngineData extends HTMLElement {
	connectedCallback() {
		const name = this.getAttribute("name");

		this.innerText = digb($, name);
		signals.push({
			dependencies: [name],
			callback: (value) => {
				this.innerText = value;
			},
		});
	}
}

class EngineIf extends HTMLElement {
	connectedCallback() {
		const iff = this.getAttribute("if");
		if (!digb($, iff)) {
			this.classList.add("hidden");
		}

		signals.push({
			dependencies: [iff],
			callback: (value) => {
				if (value) {
					this.classList.remove("hidden");
				} else {
					this.classList.add("hidden");
				}
			},
		});
	}
}

class EngineCategory extends HTMLElement { }
class EngineDialogue extends HTMLElement {
	connectedCallback() {
		this.innerText = `“${this.innerText.trim()}”`;
		const speaker = document.createElement("span");
		speaker.innerText = this.getAttribute("speaker");
		speaker.classList.add("speaker");
		this.prepend(speaker);
	}
}

class EngineInput extends HTMLElement {
	connectedCallback() {
		this.getAttribute("type");
		const input = document.createElement("input");
		input.type = this.getAttribute("type");
		input.placeholder = this.getAttribute("placeholder") ?? "";

		const name = this.getAttribute("name");
		input.value = digb($, name) ?? "";
		input.addEventListener("input", (event) => {
			set($, name, event.target.value);
		});

		signals.push({
			dependencies: [name],
			callback: (value) => {
				input.value = value;
			},
		});

		this.appendChild(input);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	customElements.define("story-input", EngineInput);
	customElements.define("story-if", EngineIf);
	customElements.define("story-data", EngineData);
	customElements.define("story-choice", EngineChoice);
	customElements.define("story-scene", EngineScene);
	customElements.define("story-category", EngineCategory);
	customElements.define("story-dialogue", EngineDialogue);
	customElements.define("story-root", EngineRoot);
});
