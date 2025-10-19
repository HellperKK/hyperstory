const signals = [];
const computeds = [];

const addSignal = (dependencies, callback) =>
  signals.push({ dependencies, callback });
const addComputed = (dependencies, callback, name) =>
  computeds.push({ dependencies, callback, name });

const primitives = ["boolean", "number", "bigint", "string", "symbol", "function", "undefined"]
const firstPass = /^[A-Za-z_0-9]+/;
const indexPass = /^\[(\d+)\]/;
const propertyPass = /^\.([A-Za-z_0-9]+)/;

function set(obj, path, value) {
  const { obj: previousObject, path: previousPath } = dig(obj, path)[1];

  if (/^[A-Za-z_0-9]+$/.test(previousPath)) {
    previousObject[previousPath] = value;
    return;
  }

  let index = null;
  if (indexPass.test(previousPath)) {
    const capture = indexPass.exec(previousPath);
    index = parseInt(capture[1]);
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
  let newPath = path;
  let results = [{ obj, path }];
  if (!firstPass.test(newPath)) {
    throw `invalid name ${newPath}`;
  }

  const firstProperty = firstPass.exec(path)[0];
  result = result[firstProperty];
  newPath = newPath.slice(firstProperty.length);
  results.unshift({ obj: result, path: newPath });

  while (newPath !== "") {
    let index = null;
    let full = null;

    if (indexPass.test(newPath)) {
      const capture = indexPass.exec(newPath);
      full = capture[0];
      index = parseInt(capture[1]);
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
    res += /^\d+$/.test(key) ? `[${key}]` : `.${key}`
  }

  return res;
}

const $ = makeHandler({});

function makeHandler(object, root = []) {
  const handler = {
    get: (target, key) => {
      const value = target[key];

      if (primitives.includes(typeof value)) {
        return value;
      }

      if (typeof value === "object") {
        return makeHandler(value, root.concat(key));
      }

      if (Array.isArray(value)) {
        return makeHandler(value, root.concat(key));
      }

      console.error("value type not managed", typeof value);
    },
    set: (target, key, value) => {
      target[key] = value;

      const fullKey = buildKey(root.concat(key));
      console.log(fullKey);
      

      for (const signal of signals) {
        if (signal.dependencies.some(key => key.startsWith(fullKey))) {
          console.log(signal.dependencies, fullKey);
          const key = signal.dependencies.find(key => key.startsWith(fullKey))
          signal.callback(digb($, key));
        }
      }

      for (const computed of computeds) {
        if (computed.dependencies.some(key => key.startsWith(fullKey))) {
          const values = computed.dependencies.map((dep) => digb($, dep));
          set($, computed.name, computed.callback(...values));
        }
      }

      return true;
    },
  }

  return new Proxy(
    object,
    handler
  )
}

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

class EngineScene extends HTMLDivElement {
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

class EngineChoice extends HTMLButtonElement {
  constructor() {
    super();

    const button = document.createElement("button");
    const text = this.innerText;
    this.innerText = "";
    button.innerText = text;
    this.appendChild(button);
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

class EngineIf extends HTMLSpanElement {
  constructor() {
    super();
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
    this.input.value = digb($, name) ?? "";
    console.log($, name, digb($, name))
    this.input.addEventListener("input", (event) => {
      console.log(name);
      set($, name, event.target.value);
    });

    signals.push({
      dependencies: [name],
      callback: (value) => {
        this.input.value = value;
      },
    });

    this.appendChild(this.input);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  customElements.define("story-input", EngineInput);
  customElements.define("story-if", EngineIf, { extends: "span" });
  customElements.define("story-data", EngineData, { extends: "span" });
  customElements.define("story-choice", EngineChoice, { extends: "button" });
  customElements.define("story-scene", EngineScene, { extends: "div" });
  customElements.define("story-category", EngineCategory, { extends: "div" });
  customElements.define("story-root", EngineRoot, { extends: "div" });
})
