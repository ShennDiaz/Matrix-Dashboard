
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.22.3 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (219:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(219:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (217:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(217:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return tick().then(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return tick().then(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return tick().then(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	// eslint-disable-next-line no-console
    	console.warn("nextTickPromise from 'svelte-spa-router' is deprecated and will be removed in version 3; use the 'tick' method from the Svelte runtime instead");

    	return tick().then(cb);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		tick().then(() => {
    			dispatch(name, detail);
    		});
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/metamask_button.svelte generated by Svelte v3.22.3 */

    const file = "src/components/metamask_button.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Enter with\n        Metamask";
    			attr_dev(img, "class", "pt-1 ml-1");
    			set_style(img, "float", "left");
    			attr_dev(img, "width", "40");
    			if (img.src !== (img_src_value = "./assets/img/metamask-light.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 1, 4, 98);
    			attr_dev(p, "class", "pt-2");
    			set_style(p, "font-weight", "500");
    			set_style(p, "color", "white");
    			set_style(p, "font-size", "14px");
    			add_location(p, file, 2, 4, 195);
    			set_style(div, "border-radius", ".2rem");
    			set_style(div, "background-color", "#212121");
    			set_style(div, "height", "43px");
    			set_style(div, "cursor", "pointer");
    			add_location(div, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Metamask_button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Metamask_button", $$slots, []);
    	return [];
    }

    class Metamask_button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Metamask_button",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* node_modules/fa-svelte/src/Icon.svelte generated by Svelte v3.22.3 */

    const file$1 = "node_modules/fa-svelte/src/Icon.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path_1;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path_1 = svg_element("path");
    			attr_dev(path_1, "fill", "currentColor");
    			attr_dev(path_1, "d", /*path*/ ctx[0]);
    			add_location(path_1, file$1, 7, 2, 129);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-p8vizn"));
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[2]);
    			add_location(svg, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*path*/ 1) {
    				attr_dev(path_1, "d", /*path*/ ctx[0]);
    			}

    			if (dirty & /*classes*/ 2 && svg_class_value !== (svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-p8vizn"))) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*viewBox*/ 4) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { icon } = $$props;
    	let path = [];
    	let classes = "";
    	let viewBox = "";
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Icon", $$slots, []);

    	$$self.$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("icon" in $$new_props) $$invalidate(3, icon = $$new_props.icon);
    	};

    	$$self.$capture_state = () => ({ icon, path, classes, viewBox });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
    		if ("icon" in $$props) $$invalidate(3, icon = $$new_props.icon);
    		if ("path" in $$props) $$invalidate(0, path = $$new_props.path);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("viewBox" in $$props) $$invalidate(2, viewBox = $$new_props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 8) {
    			 $$invalidate(2, viewBox = "0 0 " + icon.icon[0] + " " + icon.icon[1]);
    		}

    		 $$invalidate(1, classes = "fa-svelte " + ($$props.class ? $$props.class : ""));

    		if ($$self.$$.dirty & /*icon*/ 8) {
    			 $$invalidate(0, path = icon.icon[4]);
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [path, classes, viewBox, icon];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { icon: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[3] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var faArrowLeft = {
      prefix: 'fas',
      iconName: 'arrow-left',
      icon: [448, 512, [], "f060", "M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"]
    };
    var faArrowRight = {
      prefix: 'fas',
      iconName: 'arrow-right',
      icon: [448, 512, [], "f061", "M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"]
    };

    /* src/pages/content/login.svelte generated by Svelte v3.22.3 */
    const file$2 = "src/pages/content/login.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let div4;
    	let div3;
    	let div2;
    	let ul;
    	let li0;
    	let div1;
    	let div0;
    	let h4;
    	let t1;
    	let li1;
    	let current;
    	const metabutton = new Metamask_button({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			div1 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Login";
    			t1 = space();
    			li1 = element("li");
    			create_component(metabutton.$$.fragment);
    			set_style(h4, "font-weight", "500");
    			set_style(h4, "color", "#262626");
    			set_style(h4, "text-align", "start");
    			add_location(h4, file$2, 18, 32, 704);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$2, 17, 28, 654);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$2, 16, 24, 608);
    			attr_dev(li0, "class", "list-group-item");
    			add_location(li0, file$2, 15, 20, 555);
    			attr_dev(li1, "class", "list-group-item");
    			add_location(li1, file$2, 22, 20, 892);
    			attr_dev(ul, "class", "list-group list-group-flush");
    			add_location(ul, file$2, 14, 16, 494);
    			attr_dev(div2, "class", "card");
    			add_location(div2, file$2, 13, 12, 459);
    			attr_dev(div3, "class", "col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-5");
    			set_style(div3, "margin", "0 auto");
    			add_location(div3, file$2, 12, 8, 358);
    			attr_dev(div4, "class", "section-body");
    			set_style(div4, "padding-right", "30px");
    			set_style(div4, "padding-left", "30px");
    			add_location(div4, file$2, 11, 4, 275);
    			attr_dev(section, "class", "section");
    			add_location(section, file$2, 7, 0, 206);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			mount_component(metabutton, li1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(metabutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(metabutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(metabutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Login", $$slots, []);

    	$$self.$capture_state = () => ({
    		MetaButton: Metamask_button,
    		Icon,
    		faArrowRight,
    		faArrowLeft
    	});

    	return [];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/content/dashboard.svelte generated by Svelte v3.22.3 */
    const file$3 = "src/pages/content/dashboard.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let div65;
    	let div42;
    	let div17;
    	let div5;
    	let div4;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div3;
    	let div1;
    	let h40;
    	let t2;
    	let div2;
    	let p0;
    	let t4;
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let p1;
    	let t6;
    	let div6;
    	let t8;
    	let div16;
    	let div15;
    	let div14;
    	let div13;
    	let div12;
    	let p2;
    	let t10;
    	let div11;
    	let t11;
    	let strong0;
    	let t13;
    	let div23;
    	let div22;
    	let div21;
    	let div20;
    	let div19;
    	let div18;
    	let a0;
    	let t14;
    	let a1;
    	let t15;
    	let div41;
    	let div29;
    	let div28;
    	let div24;
    	let img1;
    	let img1_src_value;
    	let t16;
    	let div27;
    	let div25;
    	let h41;
    	let t18;
    	let div26;
    	let p3;
    	let t20;
    	let div34;
    	let div33;
    	let div32;
    	let div31;
    	let p4;
    	let t22;
    	let div30;
    	let t24;
    	let div40;
    	let div39;
    	let div38;
    	let div37;
    	let div36;
    	let p5;
    	let t26;
    	let div35;
    	let t27;
    	let strong1;
    	let t29;
    	let div58;
    	let div49;
    	let div48;
    	let div47;
    	let div45;
    	let div43;
    	let h42;
    	let t31;
    	let div44;
    	let p6;
    	let t33;
    	let div46;
    	let img2;
    	let img2_src_value;
    	let t34;
    	let div50;
    	let a2;
    	let t35;
    	let div57;
    	let div56;
    	let div55;
    	let div51;
    	let img3;
    	let img3_src_value;
    	let t36;
    	let div54;
    	let div52;
    	let h43;
    	let t38;
    	let div53;
    	let p7;
    	let t40;
    	let div64;
    	let div63;
    	let div62;
    	let div61;
    	let div60;
    	let img4;
    	let img4_src_value;
    	let t41;
    	let hr;
    	let t42;
    	let div59;
    	let input;
    	let t43;
    	let label;
    	let current;

    	const icon0 = new Icon({
    			props: { icon: faArrowRight },
    			$$inline: true
    		});

    	const icon1 = new Icon({
    			props: { icon: faArrowLeft },
    			$$inline: true
    		});

    	const icon2 = new Icon({
    			props: { icon: faArrowRight },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			div65 = element("div");
    			div42 = element("div");
    			div17 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			h40 = element("h4");
    			h40.textContent = "ETHEREUM";
    			t2 = space();
    			div2 = element("div");
    			p0 = element("p");
    			p0.textContent = "1 ETH = 235 USD";
    			t4 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			p1 = element("p");
    			p1.textContent = "SENDING ADDRESS";
    			t6 = space();
    			div6 = element("div");
    			div6.textContent = "0x8467a0c1b28c1980d85acc20244f9e9ab039b97f";
    			t8 = space();
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			p2 = element("p");
    			p2.textContent = "AMOUNT";
    			t10 = space();
    			div11 = element("div");
    			t11 = text("0.00000000 ");
    			strong0 = element("strong");
    			strong0.textContent = "ETH";
    			t13 = space();
    			div23 = element("div");
    			div22 = element("div");
    			div21 = element("div");
    			div20 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			a0 = element("a");
    			create_component(icon0.$$.fragment);
    			t14 = space();
    			a1 = element("a");
    			create_component(icon1.$$.fragment);
    			t15 = space();
    			div41 = element("div");
    			div29 = element("div");
    			div28 = element("div");
    			div24 = element("div");
    			img1 = element("img");
    			t16 = space();
    			div27 = element("div");
    			div25 = element("div");
    			h41 = element("h4");
    			h41.textContent = "ETHEREUM";
    			t18 = space();
    			div26 = element("div");
    			p3 = element("p");
    			p3.textContent = "1 ETH = 100000 MTX";
    			t20 = space();
    			div34 = element("div");
    			div33 = element("div");
    			div32 = element("div");
    			div31 = element("div");
    			p4 = element("p");
    			p4.textContent = "RECEIVER ADDRESS";
    			t22 = space();
    			div30 = element("div");
    			div30.textContent = "0x8467a0c1b28c1980d85acc20244f9e9ab039b97f";
    			t24 = space();
    			div40 = element("div");
    			div39 = element("div");
    			div38 = element("div");
    			div37 = element("div");
    			div36 = element("div");
    			p5 = element("p");
    			p5.textContent = "AMOUNT";
    			t26 = space();
    			div35 = element("div");
    			t27 = text("0.00000000 ");
    			strong1 = element("strong");
    			strong1.textContent = "MTX";
    			t29 = space();
    			div58 = element("div");
    			div49 = element("div");
    			div48 = element("div");
    			div47 = element("div");
    			div45 = element("div");
    			div43 = element("div");
    			h42 = element("h4");
    			h42.textContent = "YOU ARE EXCHANGING";
    			t31 = space();
    			div44 = element("div");
    			p6 = element("p");
    			p6.textContent = "0.00000000 ETH";
    			t33 = space();
    			div46 = element("div");
    			img2 = element("img");
    			t34 = space();
    			div50 = element("div");
    			a2 = element("a");
    			create_component(icon2.$$.fragment);
    			t35 = space();
    			div57 = element("div");
    			div56 = element("div");
    			div55 = element("div");
    			div51 = element("div");
    			img3 = element("img");
    			t36 = space();
    			div54 = element("div");
    			div52 = element("div");
    			h43 = element("h4");
    			h43.textContent = "YOU WILL RECEIVE";
    			t38 = space();
    			div53 = element("div");
    			p7 = element("p");
    			p7.textContent = "0.00000000 MTX";
    			t40 = space();
    			div64 = element("div");
    			div63 = element("div");
    			div62 = element("div");
    			div61 = element("div");
    			div60 = element("div");
    			img4 = element("img");
    			t41 = space();
    			hr = element("hr");
    			t42 = space();
    			div59 = element("div");
    			input = element("input");
    			t43 = space();
    			label = element("label");
    			label.textContent = "I agree to exchange coins";
    			if (img0.src !== (img0_src_value = "./assets/img/etc.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "mt-2");
    			set_style(img0, "height", "50px");
    			set_style(img0, "margin-right", "0");
    			set_style(img0, "margin-left", "10px");
    			add_location(img0, file$3, 27, 28, 850);
    			attr_dev(div0, "class", "");
    			add_location(div0, file$3, 26, 24, 806);
    			add_location(h40, file$3, 33, 32, 1192);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$3, 32, 28, 1133);
    			set_style(p0, "font-size", "15px");
    			set_style(p0, "margin", "0px");
    			add_location(p0, file$3, 36, 32, 1332);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file$3, 35, 28, 1275);
    			attr_dev(div3, "class", "card-wrap");
    			add_location(div3, file$3, 31, 24, 1080);
    			attr_dev(div4, "class", "row");
    			set_style(div4, "padding", "15px");
    			add_location(div4, file$3, 24, 20, 703);
    			attr_dev(div5, "class", "card card-statistic-1");
    			add_location(div5, file$3, 22, 16, 604);
    			set_style(p1, "font-size", "15px");
    			add_location(p1, file$3, 48, 32, 1825);
    			attr_dev(div6, "class", "text-truncate");
    			set_style(div6, "margin-top", "-10px");
    			set_style(div6, "font-size", "15px");
    			add_location(div6, file$3, 49, 32, 1906);
    			attr_dev(div7, "class", "card-body");
    			add_location(div7, file$3, 47, 28, 1768);
    			attr_dev(div8, "class", "card-wrap");
    			add_location(div8, file$3, 45, 24, 1673);
    			attr_dev(div9, "class", "flex-nowrap");
    			add_location(div9, file$3, 44, 20, 1613);
    			attr_dev(div10, "class", "card");
    			add_location(div10, file$3, 42, 16, 1531);
    			set_style(p2, "font-size", "15px");
    			add_location(p2, file$3, 65, 36, 2607);
    			add_location(strong0, file$3, 67, 51, 2785);
    			set_style(div11, "margin-top", "-10px");
    			set_style(div11, "font-size", "15px");
    			add_location(div11, file$3, 66, 36, 2683);
    			attr_dev(div12, "class", "col");
    			add_location(div12, file$3, 64, 32, 2552);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$3, 63, 28, 2495);
    			attr_dev(div14, "class", "card-wrap");
    			add_location(div14, file$3, 61, 24, 2400);
    			attr_dev(div15, "class", "row");
    			add_location(div15, file$3, 60, 20, 2348);
    			attr_dev(div16, "class", "card");
    			add_location(div16, file$3, 58, 16, 2266);
    			attr_dev(div17, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div17, file$3, 20, 12, 510);
    			set_style(a0, "color", "#06ceab");
    			set_style(a0, "font-size", "25px");
    			add_location(a0, file$3, 84, 36, 3528);
    			set_style(a1, "color", "#9e9e9e");
    			set_style(a1, "font-size", "25px");
    			add_location(a1, file$3, 88, 36, 3769);
    			attr_dev(div18, "class", "col-lg-10 mt-2");
    			set_style(div18, "margin-left", "10px");
    			add_location(div18, file$3, 83, 32, 3435);
    			attr_dev(div19, "class", "text-center");
    			attr_dev(div19, "id", "circle");
    			add_location(div19, file$3, 82, 28, 3364);
    			attr_dev(div20, "class", "center-element d-flex justify-content-around");
    			add_location(div20, file$3, 81, 24, 3276);
    			attr_dev(div21, "class", "vertical-divider");
    			add_location(div21, file$3, 80, 20, 3220);
    			attr_dev(div22, "class", "");
    			add_location(div22, file$3, 79, 16, 3184);
    			attr_dev(div23, "class", "col-lg-2 col-md-5 col-sm-5 col-12 d-none d-lg-block");
    			add_location(div23, file$3, 77, 12, 3072);
    			if (img1.src !== (img1_src_value = "./assets/img/mtx.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "mt-2");
    			set_style(img1, "height", "50px");
    			set_style(img1, "margin-right", "0");
    			set_style(img1, "margin-left", "10px");
    			add_location(img1, file$3, 106, 28, 4532);
    			attr_dev(div24, "class", "");
    			add_location(div24, file$3, 105, 24, 4488);
    			add_location(h41, file$3, 112, 32, 4874);
    			attr_dev(div25, "class", "card-header");
    			add_location(div25, file$3, 111, 28, 4815);
    			set_style(p3, "font-size", "15px");
    			set_style(p3, "margin", "0px");
    			add_location(p3, file$3, 115, 32, 5014);
    			attr_dev(div26, "class", "card-body");
    			add_location(div26, file$3, 114, 28, 4957);
    			attr_dev(div27, "class", "card-wrap");
    			add_location(div27, file$3, 110, 24, 4762);
    			attr_dev(div28, "class", "row");
    			set_style(div28, "padding", "15px");
    			add_location(div28, file$3, 103, 20, 4385);
    			attr_dev(div29, "class", "card card-statistic-1");
    			add_location(div29, file$3, 101, 16, 4286);
    			set_style(p4, "font-size", "15px");
    			add_location(p4, file$3, 127, 32, 5537);
    			attr_dev(div30, "class", "text-truncate");
    			set_style(div30, "margin-top", "-10px");
    			set_style(div30, "font-size", "15px");
    			add_location(div30, file$3, 128, 32, 5619);
    			attr_dev(div31, "class", "card-body");
    			add_location(div31, file$3, 126, 28, 5480);
    			attr_dev(div32, "class", "card-wrap");
    			add_location(div32, file$3, 124, 24, 5385);
    			attr_dev(div33, "class", "flex-nowrap");
    			add_location(div33, file$3, 123, 20, 5325);
    			attr_dev(div34, "class", "card");
    			add_location(div34, file$3, 121, 16, 5243);
    			set_style(p5, "font-size", "15px");
    			add_location(p5, file$3, 143, 36, 6318);
    			add_location(strong1, file$3, 145, 51, 6496);
    			set_style(div35, "margin-top", "-10px");
    			set_style(div35, "font-size", "15px");
    			add_location(div35, file$3, 144, 36, 6394);
    			attr_dev(div36, "class", "col");
    			add_location(div36, file$3, 142, 32, 6263);
    			attr_dev(div37, "class", "card-body");
    			add_location(div37, file$3, 141, 28, 6206);
    			attr_dev(div38, "class", "card-wrap");
    			add_location(div38, file$3, 139, 24, 6111);
    			attr_dev(div39, "class", "row");
    			add_location(div39, file$3, 138, 20, 6059);
    			attr_dev(div40, "class", "card");
    			add_location(div40, file$3, 136, 16, 5977);
    			attr_dev(div41, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div41, file$3, 99, 12, 4192);
    			attr_dev(div42, "class", "row");
    			add_location(div42, file$3, 18, 8, 452);
    			add_location(h42, file$3, 176, 32, 8157);
    			attr_dev(div43, "class", "card-header pr-0");
    			set_style(div43, "text-align", "right");
    			add_location(div43, file$3, 175, 28, 8066);
    			set_style(p6, "font-size", "18px");
    			set_style(p6, "color", "#797979");
    			set_style(p6, "font-weight", "400", 1);
    			add_location(p6, file$3, 179, 32, 8334);
    			attr_dev(div44, "class", "card-body");
    			set_style(div44, "text-align", "right");
    			add_location(div44, file$3, 178, 28, 8250);
    			attr_dev(div45, "class", "card-wrap");
    			set_style(div45, "margin-top", "10px");
    			add_location(div45, file$3, 174, 24, 7987);
    			if (img2.src !== (img2_src_value = "./assets/img/etc.svg")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "height", "85px");
    			set_style(img2, "margin", "5px auto");
    			set_style(img2, "float", "right");
    			add_location(img2, file$3, 185, 28, 8638);
    			attr_dev(div46, "class", "");
    			add_location(div46, file$3, 184, 24, 8594);
    			attr_dev(div47, "class", "card");
    			set_style(div47, "flex-direction", "row");
    			set_style(div47, "float", "right");
    			set_style(div47, "box-shadow", "none");
    			set_style(div47, "background-color", "transparent");
    			set_style(div47, "border-radius", "0");
    			set_style(div47, "border-color", "transparent");
    			set_style(div47, "position", "relative");
    			set_style(div47, "margin-bottom", "0");
    			add_location(div47, file$3, 165, 20, 7458);
    			attr_dev(div48, "class", "card card-statistic-1");
    			set_style(div48, "box-shadow", "none");
    			set_style(div48, "background-color", "transparent");
    			set_style(div48, "border-radius", "0");
    			set_style(div48, "border-color", "transparent");
    			set_style(div48, "position", "relative");
    			set_style(div48, "margin-bottom", "0");
    			add_location(div48, file$3, 158, 16, 6990);
    			attr_dev(div49, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div49, file$3, 157, 12, 6925);
    			set_style(a2, "color", "#9e9e9e");
    			set_style(a2, "font-size", "30px");
    			set_style(a2, "font-weight", "lighter");
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "");
    			attr_dev(a2, "data-toggle", "sidebar");
    			add_location(a2, file$3, 192, 16, 8976);
    			attr_dev(div50, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			attr_dev(div50, "align", "center");
    			set_style(div50, "margin", "30px auto");
    			add_location(div50, file$3, 191, 12, 8869);
    			if (img3.src !== (img3_src_value = "./assets/img/mtx.svg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "height", "100px");
    			set_style(img3, "margin-right", "0");
    			set_style(img3, "margin-left", "10px");
    			add_location(img3, file$3, 216, 28, 10363);
    			attr_dev(div51, "class", "");
    			add_location(div51, file$3, 215, 24, 10319);
    			add_location(h43, file$3, 221, 32, 10685);
    			attr_dev(div52, "class", "card-header");
    			add_location(div52, file$3, 220, 28, 10626);
    			set_style(p7, "font-size", "18px");
    			set_style(p7, "margin", "0");
    			set_style(p7, "color", "#797979");
    			set_style(p7, "font-weight", "400", 1);
    			add_location(p7, file$3, 224, 32, 10833);
    			attr_dev(div53, "class", "card-body");
    			add_location(div53, file$3, 223, 28, 10776);
    			attr_dev(div54, "class", "card-wrap");
    			set_style(div54, "margin-top", "10px");
    			add_location(div54, file$3, 219, 24, 10547);
    			attr_dev(div55, "class", "card");
    			set_style(div55, "flex-direction", "row");
    			set_style(div55, "float", "left");
    			set_style(div55, "box-shadow", "none");
    			set_style(div55, "background-color", "transparent");
    			set_style(div55, "border-radius", "0");
    			set_style(div55, "border-color", "transparent");
    			set_style(div55, "position", "relative");
    			set_style(div55, "margin-bottom", "0");
    			add_location(div55, file$3, 207, 20, 9794);
    			attr_dev(div56, "class", "card card-statistic-1");
    			set_style(div56, "box-shadow", "none");
    			set_style(div56, "background-color", "transparent");
    			set_style(div56, "border-radius", "0");
    			set_style(div56, "border-color", "transparent");
    			set_style(div56, "position", "relative");
    			set_style(div56, "margin-bottom", "0");
    			add_location(div56, file$3, 200, 16, 9326);
    			attr_dev(div57, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div57, file$3, 199, 12, 9261);
    			attr_dev(div58, "class", "row");
    			set_style(div58, "background-color", "#fff");
    			set_style(div58, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			add_location(div58, file$3, 155, 8, 6793);
    			if (img4.src !== (img4_src_value = "./assets/img/cha-img3.svg")) attr_dev(img4, "src", img4_src_value);
    			set_style(img4, "width", "150px");
    			set_style(img4, "margin-bottom", "20px");
    			add_location(img4, file$3, 241, 28, 11547);
    			attr_dev(hr, "class", "mt-3 mb-3");
    			add_location(hr, file$3, 242, 28, 11656);
    			attr_dev(input, "class", "form-check-input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "agree_exchange");
    			input.value = "option1";
    			add_location(input, file$3, 244, 32, 11790);
    			attr_dev(label, "class", "form-check-label");
    			attr_dev(label, "for", "agree_exchange");
    			add_location(label, file$3, 245, 32, 11908);
    			attr_dev(div59, "class", "form-check form-check-inline mt-3");
    			add_location(div59, file$3, 243, 28, 11709);
    			attr_dev(div60, "class", "col");
    			add_location(div60, file$3, 240, 24, 11500);
    			attr_dev(div61, "class", "card-body");
    			add_location(div61, file$3, 239, 20, 11451);
    			attr_dev(div62, "class", "card-wrap");
    			add_location(div62, file$3, 237, 16, 11372);
    			attr_dev(div63, "class", "card");
    			add_location(div63, file$3, 235, 12, 11298);
    			attr_dev(div64, "class", "col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-5");
    			set_style(div64, "margin", "0 auto");
    			add_location(div64, file$3, 234, 8, 11196);
    			attr_dev(div65, "class", "section-body");
    			set_style(div65, "padding-right", "30px");
    			set_style(div65, "padding-left", "30px");
    			add_location(div65, file$3, 17, 4, 368);
    			attr_dev(section, "class", "section");
    			add_location(section, file$3, 13, 0, 295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div65);
    			append_dev(div65, div42);
    			append_dev(div42, div17);
    			append_dev(div17, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, img0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h40);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(div17, t4);
    			append_dev(div17, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, p1);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			append_dev(div17, t8);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, p2);
    			append_dev(div12, t10);
    			append_dev(div12, div11);
    			append_dev(div11, t11);
    			append_dev(div11, strong0);
    			append_dev(div42, t13);
    			append_dev(div42, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, a0);
    			mount_component(icon0, a0, null);
    			append_dev(div18, t14);
    			append_dev(div18, a1);
    			mount_component(icon1, a1, null);
    			append_dev(div42, t15);
    			append_dev(div42, div41);
    			append_dev(div41, div29);
    			append_dev(div29, div28);
    			append_dev(div28, div24);
    			append_dev(div24, img1);
    			append_dev(div28, t16);
    			append_dev(div28, div27);
    			append_dev(div27, div25);
    			append_dev(div25, h41);
    			append_dev(div27, t18);
    			append_dev(div27, div26);
    			append_dev(div26, p3);
    			append_dev(div41, t20);
    			append_dev(div41, div34);
    			append_dev(div34, div33);
    			append_dev(div33, div32);
    			append_dev(div32, div31);
    			append_dev(div31, p4);
    			append_dev(div31, t22);
    			append_dev(div31, div30);
    			append_dev(div41, t24);
    			append_dev(div41, div40);
    			append_dev(div40, div39);
    			append_dev(div39, div38);
    			append_dev(div38, div37);
    			append_dev(div37, div36);
    			append_dev(div36, p5);
    			append_dev(div36, t26);
    			append_dev(div36, div35);
    			append_dev(div35, t27);
    			append_dev(div35, strong1);
    			append_dev(div65, t29);
    			append_dev(div65, div58);
    			append_dev(div58, div49);
    			append_dev(div49, div48);
    			append_dev(div48, div47);
    			append_dev(div47, div45);
    			append_dev(div45, div43);
    			append_dev(div43, h42);
    			append_dev(div45, t31);
    			append_dev(div45, div44);
    			append_dev(div44, p6);
    			append_dev(div47, t33);
    			append_dev(div47, div46);
    			append_dev(div46, img2);
    			append_dev(div58, t34);
    			append_dev(div58, div50);
    			append_dev(div50, a2);
    			mount_component(icon2, a2, null);
    			append_dev(div58, t35);
    			append_dev(div58, div57);
    			append_dev(div57, div56);
    			append_dev(div56, div55);
    			append_dev(div55, div51);
    			append_dev(div51, img3);
    			append_dev(div55, t36);
    			append_dev(div55, div54);
    			append_dev(div54, div52);
    			append_dev(div52, h43);
    			append_dev(div54, t38);
    			append_dev(div54, div53);
    			append_dev(div53, p7);
    			append_dev(div65, t40);
    			append_dev(div65, div64);
    			append_dev(div64, div63);
    			append_dev(div63, div62);
    			append_dev(div62, div61);
    			append_dev(div61, div60);
    			append_dev(div60, img4);
    			append_dev(div60, t41);
    			append_dev(div60, hr);
    			append_dev(div60, t42);
    			append_dev(div60, div59);
    			append_dev(div59, input);
    			append_dev(div59, t43);
    			append_dev(div59, label);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const icon0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				icon0_changes.$$scope = { dirty, ctx };
    			}

    			icon0.$set(icon0_changes);
    			const icon1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				icon1_changes.$$scope = { dirty, ctx };
    			}

    			icon1.$set(icon1_changes);
    			const icon2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				icon2_changes.$$scope = { dirty, ctx };
    			}

    			icon2.$set(icon2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_component(icon2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", $$slots, []);
    	$$self.$capture_state = () => ({ Icon, faArrowRight, faArrowLeft });
    	return [];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var faBars = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'bars';
    var width = 448;
    var height = 512;
    var ligatures = [];
    var unicode = 'f0c9';
    var svgPathData = 'M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faBars = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    unwrapExports(faBars);
    var faBars_1 = faBars.definition;
    var faBars_2 = faBars.faBars;
    var faBars_3 = faBars.prefix;
    var faBars_4 = faBars.iconName;
    var faBars_5 = faBars.width;
    var faBars_6 = faBars.height;
    var faBars_7 = faBars.ligatures;
    var faBars_8 = faBars.unicode;
    var faBars_9 = faBars.svgPathData;

    /* src/pages/principal.svelte generated by Svelte v3.22.3 */
    const file$4 = "src/pages/principal.svelte";

    function create_fragment$5(ctx) {
    	let div10;
    	let div0;
    	let t0;
    	let nav;
    	let ul0;
    	let div1;
    	let a0;
    	let t2;
    	let a1;
    	let t3;
    	let div3;
    	let div2;
    	let strong;
    	let t5;
    	let t6;
    	let div5;
    	let aside;
    	let div4;
    	let img0;
    	let img0_src_value;
    	let t7;
    	let ul1;
    	let li0;
    	let a2;
    	let img1;
    	let img1_src_value;
    	let t8;
    	let span0;
    	let t10;
    	let li1;
    	let t11;
    	let img2;
    	let img2_src_value;
    	let t12;
    	let li2;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let t13;
    	let span1;
    	let t15;
    	let li3;
    	let a4;
    	let img4;
    	let img4_src_value;
    	let t16;
    	let span2;
    	let t18;
    	let li4;
    	let a5;
    	let img5;
    	let img5_src_value;
    	let t19;
    	let span3;
    	let t21;
    	let div6;
    	let t22;
    	let footer;
    	let div8;
    	let t23;
    	let div7;
    	let t24;
    	let a6;
    	let t26;
    	let div9;
    	let current;
    	const icon = new Icon({ props: { icon: faBars_2 }, $$inline: true });
    	var switch_value = Dashboard;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			t0 = space();
    			nav = element("nav");
    			ul0 = element("ul");
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "MATRIX COIN";
    			t2 = space();
    			a1 = element("a");
    			create_component(icon.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			strong = element("strong");
    			strong.textContent = "Balance";
    			t5 = text(" 0.00000000 ETH");
    			t6 = space();
    			div5 = element("div");
    			aside = element("aside");
    			div4 = element("div");
    			img0 = element("img");
    			t7 = space();
    			ul1 = element("ul");
    			li0 = element("li");
    			a2 = element("a");
    			img1 = element("img");
    			t8 = space();
    			span0 = element("span");
    			span0.textContent = "DASHBOARD";
    			t10 = space();
    			li1 = element("li");
    			t11 = text("WALLET\r\n                    ");
    			img2 = element("img");
    			t12 = space();
    			li2 = element("li");
    			a3 = element("a");
    			img3 = element("img");
    			t13 = space();
    			span1 = element("span");
    			span1.textContent = "RECEIVE";
    			t15 = space();
    			li3 = element("li");
    			a4 = element("a");
    			img4 = element("img");
    			t16 = space();
    			span2 = element("span");
    			span2.textContent = "SEND";
    			t18 = space();
    			li4 = element("li");
    			a5 = element("a");
    			img5 = element("img");
    			t19 = space();
    			span3 = element("span");
    			span3.textContent = "HISTORY";
    			t21 = space();
    			div6 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t22 = space();
    			footer = element("footer");
    			div8 = element("div");
    			t23 = text("Copyright © 2020\r\n            ");
    			div7 = element("div");
    			t24 = space();
    			a6 = element("a");
    			a6.textContent = "Matrix Coin";
    			t26 = space();
    			div9 = element("div");
    			attr_dev(div0, "class", "navbar-bg line-grey");
    			add_location(div0, file$4, 8, 4, 261);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "sidebar-gone-hide w-100");
    			add_location(a0, file$4, 13, 16, 502);
    			set_style(a1, "margin-top", "-5px");
    			set_style(a1, "color", "#9e9e9e");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "nav-link sidebar-gone-show");
    			attr_dev(a1, "data-toggle", "sidebar");
    			add_location(a1, file$4, 14, 16, 579);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file$4, 12, 12, 458);
    			attr_dev(ul0, "class", "navbar-nav mr-auto");
    			add_location(ul0, file$4, 11, 8, 413);
    			add_location(strong, file$4, 23, 16, 932);
    			add_location(div2, file$4, 22, 12, 909);
    			attr_dev(div3, "class", "nav navbar-nav navbar-right");
    			add_location(div3, file$4, 21, 8, 854);
    			attr_dev(nav, "class", "navbar navbar-expand-lg main-navbar");
    			set_style(nav, "height", "45px");
    			add_location(nav, file$4, 10, 4, 333);
    			if (img0.src !== (img0_src_value = "assets/img/1.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "pt-2");
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "width", "100");
    			add_location(img0, file$4, 33, 16, 1303);
    			attr_dev(div4, "class", "sidebar-brand line");
    			add_location(div4, file$4, 32, 12, 1253);
    			if (img1.src !== (img1_src_value = "./assets/img/icons/menu.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "icon-grey");
    			add_location(img1, file$4, 39, 24, 1555);
    			set_style(span0, "font-size", "11px");
    			add_location(span0, file$4, 40, 24, 1638);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$4, 38, 20, 1500);
    			add_location(li0, file$4, 37, 16, 1474);
    			if (img2.src !== (img2_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "icon-green");
    			add_location(img2, file$4, 44, 20, 1809);
    			attr_dev(li1, "class", "menu-header line");
    			add_location(li1, file$4, 43, 16, 1752);
    			if (img3.src !== (img3_src_value = "./assets/img/icons/arrow-r.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "class", "icon-grey");
    			add_location(img3, file$4, 47, 24, 1972);
    			set_style(span1, "font-size", "11px");
    			add_location(span1, file$4, 48, 24, 2058);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$4, 46, 20, 1917);
    			add_location(li2, file$4, 45, 16, 1891);
    			if (img4.src !== (img4_src_value = "./assets/img/icons/arrow-l.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "class", "icon-grey");
    			add_location(img4, file$4, 53, 24, 2251);
    			set_style(span2, "font-size", "11px");
    			add_location(span2, file$4, 54, 24, 2337);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$4, 52, 20, 2196);
    			add_location(li3, file$4, 51, 16, 2170);
    			if (img5.src !== (img5_src_value = "./assets/img/icons/history.svg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "class", "icon-grey");
    			add_location(img5, file$4, 59, 24, 2527);
    			set_style(span3, "font-size", "11px");
    			add_location(span3, file$4, 60, 24, 2613);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "nav-link");
    			add_location(a5, file$4, 58, 20, 2472);
    			add_location(li4, file$4, 57, 16, 2446);
    			attr_dev(ul1, "class", "sidebar-menu pt-3");
    			add_location(ul1, file$4, 36, 12, 1426);
    			attr_dev(aside, "id", "sidebar-wrapper");
    			add_location(aside, file$4, 30, 8, 1186);
    			attr_dev(div5, "class", "main-sidebar sidebar-style-2");
    			set_style(div5, "overflow", "hidden");
    			set_style(div5, "outline", "currentcolor none medium");
    			attr_dev(div5, "tabindex", "1");
    			add_location(div5, file$4, 28, 4, 1050);
    			attr_dev(div6, "class", "main-content");
    			set_style(div6, "min-height", "680px");
    			add_location(div6, file$4, 90, 4, 3948);
    			attr_dev(div7, "class", "bullet");
    			add_location(div7, file$4, 96, 12, 4172);
    			attr_dev(a6, "href", "");
    			add_location(a6, file$4, 97, 12, 4212);
    			attr_dev(div8, "class", "footer-left");
    			add_location(div8, file$4, 94, 8, 4103);
    			attr_dev(div9, "class", "footer-right");
    			add_location(div9, file$4, 99, 8, 4264);
    			attr_dev(footer, "class", "main-footer");
    			add_location(footer, file$4, 93, 4, 4065);
    			attr_dev(div10, "class", "main-wrapper main-wrapper-1");
    			add_location(div10, file$4, 6, 0, 185);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div10, t0);
    			append_dev(div10, nav);
    			append_dev(nav, ul0);
    			append_dev(ul0, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t2);
    			append_dev(div1, a1);
    			mount_component(icon, a1, null);
    			append_dev(nav, t3);
    			append_dev(nav, div3);
    			append_dev(div3, div2);
    			append_dev(div2, strong);
    			append_dev(div2, t5);
    			append_dev(div10, t6);
    			append_dev(div10, div5);
    			append_dev(div5, aside);
    			append_dev(aside, div4);
    			append_dev(div4, img0);
    			append_dev(aside, t7);
    			append_dev(aside, ul1);
    			append_dev(ul1, li0);
    			append_dev(li0, a2);
    			append_dev(a2, img1);
    			append_dev(a2, t8);
    			append_dev(a2, span0);
    			append_dev(ul1, t10);
    			append_dev(ul1, li1);
    			append_dev(li1, t11);
    			append_dev(li1, img2);
    			append_dev(ul1, t12);
    			append_dev(ul1, li2);
    			append_dev(li2, a3);
    			append_dev(a3, img3);
    			append_dev(a3, t13);
    			append_dev(a3, span1);
    			append_dev(ul1, t15);
    			append_dev(ul1, li3);
    			append_dev(li3, a4);
    			append_dev(a4, img4);
    			append_dev(a4, t16);
    			append_dev(a4, span2);
    			append_dev(ul1, t18);
    			append_dev(ul1, li4);
    			append_dev(li4, a5);
    			append_dev(a5, img5);
    			append_dev(a5, t19);
    			append_dev(a5, span3);
    			append_dev(div10, t21);
    			append_dev(div10, div6);

    			if (switch_instance) {
    				mount_component(switch_instance, div6, null);
    			}

    			append_dev(div10, t22);
    			append_dev(div10, footer);
    			append_dev(footer, div8);
    			append_dev(div8, t23);
    			append_dev(div8, div7);
    			append_dev(div8, t24);
    			append_dev(div8, a6);
    			append_dev(footer, t26);
    			append_dev(footer, div9);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const icon_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				icon_changes.$$scope = { dirty, ctx };
    			}

    			icon.$set(icon_changes);

    			if (switch_value !== (switch_value = Dashboard)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div6, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_component(icon);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Principal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Principal", $$slots, []);
    	$$self.$capture_state = () => ({ Dashboard, Icon, faBars: faBars_2 });
    	return [];
    }

    class Principal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Principal",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const routes = {
        '/':  Principal,
        '/login': Login
    };

    /* src/App.svelte generated by Svelte v3.22.3 */

    function create_fragment$6(ctx) {
    	let current;
    	const router = new Router({ props: { routes }, $$inline: true });
    	router.$on("conditionsFailed", conditionsFailed);

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function conditionsFailed(event) {
    	
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Router,
    		replace,
    		routes,
    		conditionsFailed
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
