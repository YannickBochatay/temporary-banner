const style = new CSSStyleSheet()

style.replaceSync(/*css*/`
  :host {
    background-color: #FF8C42;
    color: #000;
    padding: 10px 20px;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 16px;
    display:none;
    align-items:center;
  }
  #banner-message {
    flex:1;
  }
  button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    margin-left: 15px;
    color: #000;
    
    &:hover {
      color: #555;
    }
  }
`)

const template = document.createElement("template")

template.innerHTML = `
<span id="banner-message">
  <slot></slot>
  <span id="period"></span>
</span>
<button>×</button>
`

function formatDay(date) {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString(navigator.language, options);
}

function formatHour(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return minutes === 0 ? `${hours}h` : `${hours}h${minutes}`;
}


class TemporaryBanner extends HTMLElement {

  static observedAttributes = ["displayPeriod", "start", "end"]

  #storageName = "bannerClosed"
  #interval

  constructor() {
    super()
    const root = this.attachShadow({ mode : "open" })
    root.append(template.content.cloneNode(true))
    root.adoptedStyleSheets = [style]
  }

  #checkDate(date) {
    if (Number.isNaN(Date.parse(date))) throw new TypeError(date + " is not a valid date")
    return true
  }

  get start() {
    return this.hasAttribute("start") ? new Date(this.getAttribute("start")) : new Date(0)
  }

  set start(date) {
    if (date instanceof Date) this.setAttribute("start", date.toISOString())
    else if (this.#checkDate(date)) this.setAttribute("start", date)
  }

  get end() {
    return this.hasAttribute("end") ? new Date(this.getAttribute("end")) : new Date(10_000_000_000_000)
  }

  set end(date) {
    if (date instanceof Date) this.setAttribute("end", date.toISOString())
    else if (this.#checkDate(date)) this.setAttribute("end", date)
  }

  get delay() {
    return this.getAttribute("delay") ?? 60_000
  }

  set delay(num) {
    if (isNaN(num)) throw new TypeError(num + " is not a valid delay")
    this.setAttribute("delay", String(num))
  }

  get active() {
    const now = Date.now()
    return now >= this.start && now <= this.end
  }

  get closed() {
    return Boolean(localStorage.getItem(this.#storageName))
  }

  get displayPeriod() {
    return this.hasAttribute("displayPeriod")
  }

  set displayPeriod(bool) {
    if (bool) this.setAttribute("displayPeriod", "")
    else this.removeAttribute("displayPeriod")
  }

  #show() {
    this.style.display = "flex"
  }

  #hide() {
    this.style.display = "none"
  }

  #updateDisplay() {
    console.log(this.active, this.checkVisibility(), this.closed, this.period)
    if (this.active) {
      if (!this.closed) this.#show()
    } else {
      localStorage.removeItem(this.#storageName)
      this.#hide()
    }
  }

  #getPeriod() {
    const dayFormatted = formatDay(this.start);
    const startHour = formatHour(this.start);
    const endHour = formatHour(this.end);
    return `${dayFormatted} de ${startHour} à ${endHour}`;
  }

  #updatePeriod() {
    const period = this.shadowRoot.querySelector("#period");
    period.textContent = this.#getPeriod()
    period.style.display = this.displayPeriod ? "inline" : "none"
  }

  connectedCallback() {
    this.#interval = setInterval(this.#updateDisplay.bind(this), this.delay)
    this.#updateDisplay()

    this.shadowRoot.querySelector("button").addEventListener("click", () => {
      this.#hide()
      localStorage.setItem(this.#storageName, "true")
    })
  }

  disconnectedCallback() {
    clearInterval(this.#interval)
  }

  attributeChangedCallback() {
    this.#updatePeriod()
  }
}

customElements.define("temporary-banner", TemporaryBanner)