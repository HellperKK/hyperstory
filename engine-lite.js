const signals = [];
const computeds = [];
const events = []
let saveName = "save";

const addSignal = (dependencies, callback) =>
    signals.push({ dependencies, callback });
const addComputed = (dependencies, callback, name) =>
    computeds.push({ dependencies, callback, name });
const addEvent = (condition, callback) =>
    events.push({ condition, callback });

let $ = new Proxy(
    {},
    {
        get: (target, key) => {
            return target[key];
        },
        set: (target, key, value) => {
            target[key] = value;

            for (const signal of signals) {
                if (signal.dependencies.some(k => key === k)) {
                    signal.callback($[key]);
                }
            }

            for (const computed of computeds) {
                if (computed.dependencies.some(k => key === k)) {
                    const values = computed.dependencies.map((dep) => $[dep]);
                    $[computed.name] = computed.callback(...values);
                }
            }

            return true;
        },
    }
);

class ERoot extends HTMLDivElement {
    constructor() {
        super();
    }
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
                    event.callback(id, this)
                }
            }
        }
    }
}

class EScene extends HTMLDivElement {
    constructor() {
        super();
    }

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

class EChoice extends HTMLButtonElement {
    constructor() {
        super();
    }

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

class EData extends HTMLSpanElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const name = this.getAttribute("name");

        this.innerText = $[name];
        addSignal([name],
            (value) => {
                this.innerText = value;
            },
        );
    }
}

class EIf extends HTMLSpanElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const iff = this.getAttribute("if");
        if (!$[iff]) {
            this.classList.add("hidden");
        }

        addSignal([iff],
            (value) => {
                if (value) {
                    this.classList.remove("hidden");
                } else {
                    this.classList.add("hidden");
                }
            },
        );
    }
}

class ECategory extends HTMLDivElement {
    constructor() {
        super();
    }
}

class EInput extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const input = document.createElement("input");
        input.type = this.getAttribute("type");
        input.placeholder = this.getAttribute("placeholder") ?? "";

        const name = this.getAttribute("name");
        input.value = $[name];
        input.addEventListener("input", (event) => {
            set($, name, event.target.value);
        });

        addSignal([name],
            (value) => {
                input.value = value;
            },
        );

        this.appendChild(input);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const c = customElements;
    c.define("s-input", EInput);
    c.define("s-if", EIf, { extends: "span" });
    c.define("s-data", EData, { extends: "span" });
    c.define("s-choice", EChoice, { extends: "button" });
    c.define("s-scene", EScene, { extends: "div" });
    c.define("s-category", ECategory, { extends: "div" });
    c.define("s-root", ERoot, { extends: "div" });
})
