const signals = [];
const computeds = [];
const events = []

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
        this.currentPage = this.querySelector("story-scene[start]");
        this.currentPage.activate();
        this.id = this.currentPage.getAttribute("pageid");

        this.querySelectorAll("story-scene").forEach((page) => {
            page.connect((id) => this.next(id))
        });
    }

    next(id, trigger = true) {
        const nextPage = this.querySelector(`story-scene[page-id="${id}"]`);

        if (!nextPage) {
            alert(`No page with id ${id}`);
            return;
        }

        this.currentPage.setActive(false);
        nextPage.setActive(true);
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

    setActive(flag) {
        this.classList.toggle("active", flag);
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
        this.onclick = () => callback(this.getAttribute("to"));
    }

    connectedCallback() {
        const button = document.createElement("button");
        button.innerText = this.innerText;
        this.innerText = "";
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
        this.classList.toggle("hidden", $[iff]);

        addSignal([iff],
            (value) => {
                this.classList.toggle("hidden", value)
            },
        );
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
        input.oninput = (event) => set($, name, event.target.value);

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
    c.define("s-root", ERoot, { extends: "div" });
})
