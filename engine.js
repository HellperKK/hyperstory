const signals = [];
const computeds = [];

const addSignal = (dependencies, callback) => signals.push({ dependencies, callback });
const addComputed = (dependencies, callback, name) => computeds.push({ dependencies, callback, name });

const $state = new Proxy(
  {},
  {
    get: (target, key) => target[key] || "",
    set: (target, key, value) => {
      target[key] = value;
      for (const signal of signals) {
        if (signal.dependencies.includes(key)) {
          signal.callback(value);
        }
      }
      for (const computed of computeds) {
        if (computed.dependencies.includes(key)) {
          const values = computed.dependencies.map((dep) => target[dep]);
          $state[computed.name] = computed.callback(...values);
        }
      }
      return true;
    },
  }
);

class EngineRoot extends HTMLDivElement {
  constructor() {
    super();

    this.startPage = this.querySelector("story-scene[start]");
    this.startPage.activate();
    this.currentPage = this.startPage;

    this.allPages = this.querySelectorAll("story-scene");
    this.allPages.forEach((page) => {
      page.connect((id) => {
        this.next(id);
      });
    });
  }

  next(id) {
    const nextPage = this.querySelector(`story-scene[page-id="${id}"]`);

    if (!nextPage) {
      console.error(`No page with id ${id}`);
      return;
    }

    this.currentPage.deactivate();
    nextPage.activate();
    this.currentPage = nextPage;
  }
}

class EnginePage extends HTMLDivElement {
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

class EngineLink extends HTMLButtonElement {
  constructor() {
    super();

    const iff = this.getAttribute("if");
    if (iff && !$state[iff]) {
      this.classList.add("hidden");
    }
    if (iff) {
      signals.push({
        dependencies: [iff],
        callback: (value) => {
          if (value) {
            this.classList.remove("hidden");
          }
          else {
            this.classList.add("hidden");
          }
        },
      });
    }
  }

  connect(callback) {
    this.addEventListener("click", () => {
      callback(this.getAttribute("to"));
    });
  }
}

class EngineData extends HTMLSpanElement {
  constructor() {
    super();
    this.innerText = $state[this.getAttribute("name")];
    signals.push({
      dependencies: [this.getAttribute("name")],
      callback: (value) => {
        this.innerText = value;
      },
    });
  }
}

class EngineCategory extends HTMLDivElement {
  constructor() {
    super();
  }
}

class EngineInput extends HTMLElement {
  constructor() {
    super();
    this.input = document.createElement("input");
    this.input.type = this.getAttribute("type");
    this.input.placeholder = this.getAttribute("placeholder") ?? "";

    const name = this.getAttribute("name");
    this.input.value = $state[name] ?? "";
    this.input.addEventListener("input", (event) => {
      $state[name] = event.target.value;
    });

    this.appendChild(this.input);
  }

  connectedCallback() {
  }
}

customElements.define("story-input", EngineInput);
customElements.define("story-data", EngineData, { extends: "span" });
customElements.define("story-choice", EngineLink, { extends: "button" });
customElements.define("story-scene", EnginePage, { extends: "div" });
customElements.define("story-category", EngineCategory, { extends: "div" });
customElements.define("story-root", EngineRoot, { extends: "div" });
