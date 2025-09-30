// @p VanillaJS
//========================
//#region @r UTILITIES
//========================
// @g Logger
//------------------------
/**
 * @typedef {Object} Logger
 * @property {boolean} active - Flag to activate/deactivate the logger
 * @property {Object.<string, string>} styles - Mapping of log modes to CSS styles
 * @property {function(string, ...any):void} styled - Styled log with function name
 * @property {function(...any):void} default - Plain log without colors
 * @property {function(...any):void} gray - Shortcut for gray logs
 * @property {function(...any):void} orange - Shortcut for orange logs
 * @property {function(...any):void} blue - Shortcut for blue logs
 * @property {function(...any):void} red - Shortcut for red logs
 * @property {function(...any):void} white - Shortcut for white logs
 * @property {function(...any):void} yellow - Shortcut for yellow logs
 * @property {function():void} init - Initializes shortcut methods
 */
/** @type {Logger} */
const Log = {
	active: true,
	styles: {
		blue: { style: 'color: steelblue;', active: true },
		gray: { style: 'color: gray;', active: true },
		orange: { style: 'color: orange;', active: true },
		red: { style: 'color: red;', active: true },
		white: { style: 'color: white;', active: true },
		yellow: { style: 'color: yellow;', active: true },
	},
	// @b Styled log
	//------------------------
	styled(mode, ...args) {
		if (!this.active) return
		const styleObj = this.styles[mode]
		if (!styleObj || !styleObj.active) return
		const stack = new Error().stack
		const caller =
			stack
				?.split('\n')[3]
				?.trim()
				.split(' ')[1]
				?.replace(/^(HTML\w+|Object)/, '')
				?.replace(/[^a-zA-Z0-9_$]/g, '') || 'anonymous'
		const content = args
			.map((a) =>
				a instanceof HTMLElement ? `[${a.tagName}]` : typeof a === 'object' ? JSON.stringify(a, null, 2) : a
			)
			.join(', ')
		console.log(`%c${caller}%c(${content})`, `${styleObj.style}font-weight: bold;`, styleObj.style)
	},
	// @b Default log
	//------------------------
	default(...args) {
		if (!this.active) return
		console.log(...args)
	},
	// @b Initialize
	//------------------------
	init() {
		Object.keys(this.styles).forEach((mode) => {
			this[mode] = (...args) => this.styled(mode, ...args)
		})
	},
}

// @g Storage
//------------------------
const Storage = {
	// @b Get from
	//------------------------
	get: (key, defaultValue = null) => {
		try {
			const item = localStorage.getItem(key)
			return item ? JSON.parse(item) : defaultValue
		} catch (e) {
			Log.red('Storage read error:', e)
			return defaultValue
		}
	},
	// @b Set to
	//------------------------
	set: (key, value) => {
		try {
			localStorage.setItem(key, JSON.stringify(value))
			return true
		} catch (e) {
			Log.red('Storage write error:', e)
			return false
		}
	},
}

// @g DOM API
//------------------------
const DOM = {
	// @b Selectors
	//------------------------
	get: (selector, context = document) => context.querySelector(selector),
	getAll: (selector, context = document) => context.querySelectorAll(selector),
	getById: (id) => document.getElementById(id),

	// @b Properties
	//------------------------
	getValue: (element) => element?.value || '',
	setValue: (element, value) => element && (element.value = value),
	setDisabled: (element, disabled) => element && (element.disabled = disabled),
	isDisabled: (element) => element?.disabled || false,

	// @b Content
	//------------------------
	clear: (element) => element && (element.innerHTML = ''),
	setHTML: (element, html) => element && (element.innerHTML = html),
	setText: (element, text) => element && (element.innerText = text),
	getText: (element) => element?.innerText || '',
	getHTML: (element) => element?.innerHTML || '',

	// @b Classes
	//------------------------
	addClass: (element, className) => element?.classList.add(className),
	removeClass: (element, className) => element?.classList.remove(className),
	toggleClass: (element, className) => element?.classList.toggle(className),
	hasClass: (element, className) => element?.classList.contains(className) || false,

	// @b Styles
	//------------------------
	setStyle: (element, property, value) => {
		if (!element) return
		if (typeof property === 'object') {
			Object.entries(property).forEach(([key, val]) => (element.style[key] = val))
		} else {
			element.style[property] = value
		}
	},
	getStyle: (element, property) => (element ? getComputedStyle(element)[property] : null),
	setCSS: (property, value) => document.documentElement.style.setProperty(property, value),

	// @b Attributes
	//------------------------
	getAttr: (element, name) => element?.getAttribute(name),
	setAttr: (element, name, value) => element?.setAttribute(name, value),
	removeAttr: (element, name) => element?.removeAttribute(name),
	hasAttr: (element, name) => element?.hasAttribute(name) || false,

	// @b Visibility
	//------------------------
	hide: (element) => element && (element.style.display = 'none'),
	show: (element, display = 'block') => element && (element.style.display = display),
	isVisible: (element) => (element ? element.style.display !== 'none' : false),

	// @b Events
	//------------------------
	on: (element, event, handler, options) => element?.addEventListener(event, handler, options),
	off: (element, event, handler, options) => element?.removeEventListener(event, handler, options),
	trigger: (element, eventName) => {
		if (element) {
			const event = new Event(eventName, { bubbles: true })
			element.dispatchEvent(event)
		}
	},
	onSelectWheel: (selectElement, callback) => {
		if (!selectElement) return
		DOM.on(selectElement, 'wheel', (event) => {
			event.preventDefault()
			const currentIndex = selectElement.selectedIndex
			const maxIndex = selectElement.options.length - 1
			const newIndex = event.deltaY > 0 ? Math.min(currentIndex + 1, maxIndex) : Math.max(currentIndex - 1, 0)
			if (newIndex !== currentIndex) {
				selectElement.selectedIndex = newIndex
				callback()
			}
		})
	},

	// @b Manipulation
	//------------------------
	remove: (element) => element?.remove(),
	append: (parent, child) => parent?.appendChild(child),
	/**
	 * Creates a new HTML element and configures it based on the provided options.
	 * @param {object} options - An object containing the element configuration options.
	 * @param {string} [options.type='div'] - The type of the element to be created. Defaults to "div".
	 * @param {HTMLElement} [options.parent] - The parent to which the created element should be appended.
	 * @param {Array<HTMLElement|string|number>|HTMLElement|string|number} [options.children] - An array of elements or strings representing the children to be appended to the element.
	 * @param {Array<string>} [options.classes=[]] - Array of CSS class names to add.
	 * @param {Object<string, Function>} [options.listeners] - An object containing event listeners. Each key-value pair represents an event name and the corresponding event handler function.
	 * @param {Object<string, string>} [options.dataset] - An object containing key-value pairs to be set as data-* attributes.
	 * @param {Object<string, *>} [options.attributes] - Additional HTML attributes for configuring the element.
	 * @returns {HTMLElement} The created HTML element.
	 * @example
	 * DOM.create({
	 *   type: 'button',
	 *   parent: document.body,
	 *   children: 'Click me',
	 *   classes: ['button'],
	 *   listeners: { click: handleClick },
	 *   dataset: { id: 'button' },
	 *   disabled: false
	 * })
	 */
	create: ({ type = 'div', parent, children, classes = [], listeners, dataset, ...attributes }) => {
		const element = document.createElement(type)
		if (parent) parent.appendChild(element)
		if (classes.length > 0) {
			element.classList.add(...classes)
		}
		if (dataset) {
			Object.entries(dataset).forEach(([key, value]) => {
				element.dataset[key] = value
			})
		}
		if (attributes) {
			Object.entries(attributes).forEach(([key, value]) => {
				element.setAttribute(key, value)
			})
		}
		if (listeners) {
			Object.entries(listeners).forEach(([key, value]) => {
				element.addEventListener(key, value)
			})
		}
		if (children) {
			if (!Array.isArray(children)) children = [children]
			children.forEach((child) => {
				if (typeof child === 'string' || typeof child === 'number') {
					element.appendChild(document.createTextNode(child))
				} else if (child instanceof HTMLElement) {
					element.appendChild(child)
				}
			})
		}
		return element
	},

	// @b Document
	//------------------------
	setFavicon: (canvas) => {
		const existingLink = DOM.get("link[rel='icon']")
		if (existingLink) DOM.remove(existingLink)
		DOM.create({
			type: 'link',
			rel: 'icon',
			href: canvas.toDataURL('image/png'),
			parent: document.head,
		})
	},
	setTitle: (title) => (document.title = title),
	getTemplate: (id) => {
		const template = DOM.getById(id)
		if (!template) {
			console.error(`Template ${id} not found`)
			return null
		}
		return template.content.cloneNode(true)
	},	
	scrollTo: (element, options) => element?.scrollTo(options),
	lockScroll: () => (document.body.style.overflow = 'hidden'),
	unlockScroll: () => (document.body.style.overflow = ''),
}

// @g Tools
//------------------------
const Tools = {
	// @b Capitalize
	//------------------------
	capitalize: (str) => {
		if (typeof str !== 'string' || str.length === 0) return str
		return str.charAt(0).toUpperCase() + str.slice(1)
	},

	// @b Debounce
	//------------------------
	debounce: (func, delay) => {
		let timeoutId
		return function (...args) {
			clearTimeout(timeoutId)
			timeoutId = setTimeout(() => func.apply(this, args), delay)
		}
	},

	// @b Lighten color
	//------------------------
	lightenColor: (hex, percent) =>
		'#' +
		hex.slice(1).replace(/../g, (c) =>
			Math.round(parseInt(c, 16) + (255 - parseInt(c, 16)) * percent)
				.toString(16)
				.padStart(2, '0')
		),

	// @b Throttle
	//------------------------
	throttle: (func, limit) => {
		let lastFunc
		let lastRan
		return function (...args) {
			if (!lastRan) {
				func.apply(this, args)
				lastRan = Date.now()
			} else {
				clearTimeout(lastFunc)
				lastFunc = setTimeout(() => {
					if (Date.now() - lastRan >= limit) {
						func.apply(this, args)
						lastRan = Date.now()
					}
				}, limit - (Date.now() - lastRan))
			}
		}
	},
}
// #endregion
//========================
//#region @r COMPONENTS
//========================
// @g Modal
//------------------------
const Modal = {
	// @b Selectors
	//------------------------
	$: {
		element: DOM.get('.modal'),
		container: DOM.get('.modal__container'),
		content: DOM.get('.modal__content'),
		close: DOM.get('.modal__close'),
	},

	// @b Initialize
	//------------------------
	init: () => {
		// Modal background click
		DOM.on(Modal.$.element, 'click', (e) => {
			if (e.target === Modal.$.element) Modal.close()
		})
		// Modal close button
		DOM.on(Modal.$.close, 'click', Modal.close)
		// Modal ESC key
		DOM.on(document, 'keydown', (e) => {
			if (e.key === 'Escape' && Modal.isOpen()) Modal.close()
		})
	},

	// @b Open modal
	//------------------------
	open: (content) => {
		if (!Modal.$.element) {
			Log.red('Modal not initialized')
			return
		}

		DOM.clear(Modal.$.content)

		if (typeof content === 'string') {
			DOM.setHTML(Modal.$.content, content)
		} else if (content instanceof DocumentFragment || content instanceof HTMLElement) {
			DOM.append(Modal.$.content, content)
		}

		DOM.addClass(Modal.$.element, 'modal--active')
		DOM.lockScroll()
		Log.gray('Modal opened')
	},

	// @b Close modal
	//------------------------
	close: () => {
		if (!Modal.$.element) return
		DOM.removeClass(Modal.$.element, 'modal--active')
		DOM.unlockScroll()
		Log.gray('Modal closed')
	},

	// @b Check if modal is open
	//------------------------
	isOpen: () => {
		return Modal.$.element && DOM.hasClass(Modal.$.element, 'modal--active')
	},

	// @b Create simple alert modal
	//------------------------
	alert: (title, message) => {
		const content = DOM.getTemplate('modal-alert')
		if (!content) return

		// Fill in content
		content.querySelector('.modal__title').textContent = title
		content.querySelector('.modal__text').textContent = message

		// First append to modal, then add listener
		Modal.open(content)

		// Add event listener after content is in DOM
		const button = DOM.get('.modal__button', Modal.$.content)
		if (button) {
			DOM.on(button, 'click', Modal.close)
		}
	},

	// @b Create confirm modal
	//------------------------
	confirm: (title, message, onConfirm) => {
		const content = DOM.getTemplate('modal-confirm')
		if (!content) return

		// Fill in content
		DOM.get('.modal__title', content).textContent = title
		DOM.get('.modal__text', content).textContent = message

		Modal.open(content)

		// Add event listeners
		const cancelBtn = DOM.get('.modal__button--cancel', Modal.$.content)
		const confirmBtn = DOM.get('.modal__button--confirm', Modal.$.content)

		if (cancelBtn) {
			DOM.on(cancelBtn, 'click', Modal.close)
		}

		if (confirmBtn) {
			DOM.on(confirmBtn, 'click', () => {
				Modal.close()
				onConfirm()
			})
		}
	},
}
// #endregion
//========================
//#region @r CONFIG
//========================
const CONFIG = {
	storage: {
		mainColor: 'main-color',
	},
	defaults: {
		mainColor: '#111',
	},
}
//#endregion
//========================
//#region @r STATE
//========================
const STATE = {
	mainColor: Storage.get(CONFIG.storage.mainColor) || CONFIG.defaults.mainColor,
}

//#endregion
//========================
//#region @r SELECTORS
//========================
const $ = {
	body: DOM.get('body'),
	header: {
		element: DOM.get('header'),
	},
	main: {
		element: DOM.get('main'),
		button: DOM.get('.main__button'),
	},
	footer: {
		element: DOM.get('footer'),
	},
}

//#endregion
//========================
//#region @r PURE FUNCTIONS
//========================
const Pure = {
	getRandomGray: () => {
		const intensity = Math.floor(Math.random() * 255)
		const hex = intensity.toString(16).padStart(2, '0')
		return `#${hex}${hex}${hex}`
	},
}
//#endregion
//========================
//#region @r SIDE EFFECTS
//========================
const Effects = {
	// @b Update favicon
	//------------------------
	updateFavicon: () => {
		const canvas = DOM.create({
			type: 'canvas',
			height: 32,
			width: 32,
		})

		const ctx = canvas.getContext('2d')
		ctx.fillStyle = 'black'
		ctx.fillRect(0, 0, 32, 32)

		DOM.setFavicon(canvas)
	},

	// @b Update main color
	//------------------------
	updateMainColor: (newColor) => {
		if (!newColor) return
		STATE.mainColor = newColor
		Log.white(newColor)
		DOM.setStyle($.main.element, 'backgroundColor', newColor)
		Storage.set(CONFIG.storage.mainColor, newColor)
	},
}
//#endregion
//========================
//#region @r MAIN LOGIC
//========================
const Logic = {
	// @b Change color
	//------------------------
	changeColor: () => {
		const newColor = Pure.getRandomGray()
		Effects.updateMainColor(newColor)
	},
}
//#endregion
//========================
//#region @r HANDLERS
//========================
const Handlers = {
	// @b Change color click
	//------------------------
	changeColorClick: () => {
		Log.blue()
		Modal.confirm('Change color?', 'Do you want to change the background color?', () => {
			Logic.changeColor()
			setTimeout(() => {
				Modal.alert('Success!', 'The color has been changed.')
			}, 500)
		})
	},
}
//#endregion
//========================
//#region @r LISTENERS
//========================
const Listeners = {
	init: () => {
		// Main button
		DOM.on($.main.button, 'click', Handlers.changeColorClick)
	},
}
//#endregion
//========================
//#region @r APP INIT
//========================
const App = {
	init: () => {
		Log.init()
		Log.yellow('App started...')
		Modal.init()
		Listeners.init()
		Effects.updateMainColor(STATE.mainColor)
		Effects.updateFavicon()
	},
}

App.init()
// #endregion
