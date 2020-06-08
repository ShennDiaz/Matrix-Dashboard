
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

    /* node_modules/fa-svelte/src/Icon.svelte generated by Svelte v3.22.3 */

    const file = "node_modules/fa-svelte/src/Icon.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let path_1;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path_1 = svg_element("path");
    			attr_dev(path_1, "fill", "currentColor");
    			attr_dev(path_1, "d", /*path*/ ctx[0]);
    			add_location(path_1, file, 7, 2, 129);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-p8vizn"));
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[2]);
    			add_location(svg, file, 0, 0, 0);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
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
    		init(this, options, instance, create_fragment, safe_not_equal, { icon: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
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

    /* src/pages/content/dashboard.svelte generated by Svelte v3.22.3 */
    const file$1 = "src/pages/content/dashboard.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let div66;
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
    	let div65;
    	let div64;
    	let div63;
    	let div62;
    	let div61;
    	let div59;
    	let img4;
    	let img4_src_value;
    	let t41;
    	let div60;
    	let input;
    	let t42;
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
    			div66 = element("div");
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
    			div65 = element("div");
    			div64 = element("div");
    			div63 = element("div");
    			div62 = element("div");
    			div61 = element("div");
    			div59 = element("div");
    			img4 = element("img");
    			t41 = space();
    			div60 = element("div");
    			input = element("input");
    			t42 = space();
    			label = element("label");
    			label.textContent = "I agree to exchange coins";
    			if (img0.src !== (img0_src_value = "./assets/img/etc.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "mt-2");
    			set_style(img0, "height", "50px");
    			set_style(img0, "margin-right", "0");
    			set_style(img0, "margin-left", "10px");
    			add_location(img0, file$1, 27, 28, 849);
    			attr_dev(div0, "class", "");
    			add_location(div0, file$1, 26, 24, 805);
    			add_location(h40, file$1, 33, 32, 1191);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file$1, 32, 28, 1132);
    			set_style(p0, "font-size", "15px");
    			set_style(p0, "margin", "0px");
    			add_location(p0, file$1, 36, 32, 1331);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file$1, 35, 28, 1274);
    			attr_dev(div3, "class", "card-wrap");
    			add_location(div3, file$1, 31, 24, 1079);
    			attr_dev(div4, "class", "row");
    			set_style(div4, "padding", "15px");
    			add_location(div4, file$1, 24, 20, 702);
    			attr_dev(div5, "class", "card card-statistic-1");
    			add_location(div5, file$1, 22, 16, 603);
    			set_style(p1, "font-size", "15px");
    			add_location(p1, file$1, 48, 32, 1824);
    			attr_dev(div6, "class", "text-truncate");
    			set_style(div6, "margin-top", "-10px");
    			set_style(div6, "font-size", "15px");
    			add_location(div6, file$1, 49, 32, 1905);
    			attr_dev(div7, "class", "card-body");
    			add_location(div7, file$1, 47, 28, 1767);
    			attr_dev(div8, "class", "card-wrap");
    			add_location(div8, file$1, 45, 24, 1672);
    			attr_dev(div9, "class", "flex-nowrap");
    			add_location(div9, file$1, 44, 20, 1612);
    			attr_dev(div10, "class", "card");
    			add_location(div10, file$1, 42, 16, 1530);
    			set_style(p2, "font-size", "15px");
    			add_location(p2, file$1, 65, 36, 2606);
    			add_location(strong0, file$1, 67, 51, 2784);
    			set_style(div11, "margin-top", "-10px");
    			set_style(div11, "font-size", "15px");
    			add_location(div11, file$1, 66, 36, 2682);
    			attr_dev(div12, "class", "col");
    			add_location(div12, file$1, 64, 32, 2551);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$1, 63, 28, 2494);
    			attr_dev(div14, "class", "card-wrap");
    			add_location(div14, file$1, 61, 24, 2399);
    			attr_dev(div15, "class", "row");
    			add_location(div15, file$1, 60, 20, 2347);
    			attr_dev(div16, "class", "card");
    			add_location(div16, file$1, 58, 16, 2265);
    			attr_dev(div17, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div17, file$1, 20, 12, 509);
    			set_style(a0, "color", "#06ceab");
    			set_style(a0, "font-size", "25px");
    			add_location(a0, file$1, 84, 40, 3535);
    			set_style(a1, "color", "#9e9e9e");
    			set_style(a1, "font-size", "25px");
    			add_location(a1, file$1, 88, 40, 3792);
    			attr_dev(div18, "class", "col-lg-10 mt-2");
    			set_style(div18, "margin-left", "10px");
    			add_location(div18, file$1, 83, 36, 3438);
    			attr_dev(div19, "class", "text-center");
    			attr_dev(div19, "id", "circle");
    			add_location(div19, file$1, 82, 28, 3363);
    			attr_dev(div20, "class", "center-element d-flex justify-content-around");
    			add_location(div20, file$1, 81, 24, 3275);
    			attr_dev(div21, "class", "vertical-divider");
    			add_location(div21, file$1, 80, 20, 3219);
    			attr_dev(div22, "class", "");
    			add_location(div22, file$1, 79, 16, 3183);
    			attr_dev(div23, "class", "col-lg-2 col-md-5 col-sm-5 col-12 d-none d-lg-block");
    			add_location(div23, file$1, 77, 12, 3071);
    			if (img1.src !== (img1_src_value = "./assets/img/mtx.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "mt-2");
    			set_style(img1, "height", "50px");
    			set_style(img1, "margin-right", "0");
    			set_style(img1, "margin-left", "10px");
    			add_location(img1, file$1, 106, 28, 4571);
    			attr_dev(div24, "class", "");
    			add_location(div24, file$1, 105, 24, 4527);
    			add_location(h41, file$1, 112, 32, 4913);
    			attr_dev(div25, "class", "card-header");
    			add_location(div25, file$1, 111, 28, 4854);
    			set_style(p3, "font-size", "15px");
    			set_style(p3, "margin", "0px");
    			add_location(p3, file$1, 115, 32, 5053);
    			attr_dev(div26, "class", "card-body");
    			add_location(div26, file$1, 114, 28, 4996);
    			attr_dev(div27, "class", "card-wrap");
    			add_location(div27, file$1, 110, 24, 4801);
    			attr_dev(div28, "class", "row");
    			set_style(div28, "padding", "15px");
    			add_location(div28, file$1, 103, 20, 4424);
    			attr_dev(div29, "class", "card card-statistic-1");
    			add_location(div29, file$1, 101, 16, 4325);
    			set_style(p4, "font-size", "15px");
    			add_location(p4, file$1, 127, 32, 5576);
    			attr_dev(div30, "class", "text-truncate");
    			set_style(div30, "margin-top", "-10px");
    			set_style(div30, "font-size", "15px");
    			add_location(div30, file$1, 128, 32, 5658);
    			attr_dev(div31, "class", "card-body");
    			add_location(div31, file$1, 126, 28, 5519);
    			attr_dev(div32, "class", "card-wrap");
    			add_location(div32, file$1, 124, 24, 5424);
    			attr_dev(div33, "class", "flex-nowrap");
    			add_location(div33, file$1, 123, 20, 5364);
    			attr_dev(div34, "class", "card");
    			add_location(div34, file$1, 121, 16, 5282);
    			set_style(p5, "font-size", "15px");
    			add_location(p5, file$1, 143, 36, 6357);
    			add_location(strong1, file$1, 145, 51, 6535);
    			set_style(div35, "margin-top", "-10px");
    			set_style(div35, "font-size", "15px");
    			add_location(div35, file$1, 144, 36, 6433);
    			attr_dev(div36, "class", "col");
    			add_location(div36, file$1, 142, 32, 6302);
    			attr_dev(div37, "class", "card-body");
    			add_location(div37, file$1, 141, 28, 6245);
    			attr_dev(div38, "class", "card-wrap");
    			add_location(div38, file$1, 139, 24, 6150);
    			attr_dev(div39, "class", "row");
    			add_location(div39, file$1, 138, 20, 6098);
    			attr_dev(div40, "class", "card");
    			add_location(div40, file$1, 136, 16, 6016);
    			attr_dev(div41, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div41, file$1, 99, 12, 4231);
    			attr_dev(div42, "class", "row");
    			add_location(div42, file$1, 18, 8, 451);
    			add_location(h42, file$1, 176, 32, 8196);
    			attr_dev(div43, "class", "card-header pr-0");
    			set_style(div43, "text-align", "right");
    			add_location(div43, file$1, 175, 28, 8105);
    			set_style(p6, "font-size", "18px");
    			set_style(p6, "color", "#797979");
    			set_style(p6, "font-weight", "400", 1);
    			add_location(p6, file$1, 179, 32, 8373);
    			attr_dev(div44, "class", "card-body");
    			set_style(div44, "text-align", "right");
    			add_location(div44, file$1, 178, 28, 8289);
    			attr_dev(div45, "class", "card-wrap");
    			set_style(div45, "margin-top", "10px");
    			add_location(div45, file$1, 174, 24, 8026);
    			if (img2.src !== (img2_src_value = "./assets/img/etc.svg")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "height", "85px");
    			set_style(img2, "margin", "5px auto");
    			set_style(img2, "float", "right");
    			add_location(img2, file$1, 185, 28, 8677);
    			attr_dev(div46, "class", "");
    			add_location(div46, file$1, 184, 24, 8633);
    			attr_dev(div47, "class", "card");
    			set_style(div47, "flex-direction", "row");
    			set_style(div47, "float", "right");
    			set_style(div47, "box-shadow", "none");
    			set_style(div47, "background-color", "transparent");
    			set_style(div47, "border-radius", "0");
    			set_style(div47, "border-color", "transparent");
    			set_style(div47, "position", "relative");
    			set_style(div47, "margin-bottom", "0");
    			add_location(div47, file$1, 165, 20, 7497);
    			attr_dev(div48, "class", "card card-statistic-1");
    			set_style(div48, "box-shadow", "none");
    			set_style(div48, "background-color", "transparent");
    			set_style(div48, "border-radius", "0");
    			set_style(div48, "border-color", "transparent");
    			set_style(div48, "position", "relative");
    			set_style(div48, "margin-bottom", "0");
    			add_location(div48, file$1, 158, 16, 7029);
    			attr_dev(div49, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div49, file$1, 157, 12, 6964);
    			set_style(a2, "color", "#9e9e9e");
    			set_style(a2, "font-size", "30px");
    			set_style(a2, "font-weight", "lighter");
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "");
    			attr_dev(a2, "data-toggle", "sidebar");
    			add_location(a2, file$1, 192, 16, 9015);
    			attr_dev(div50, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			attr_dev(div50, "align", "center");
    			set_style(div50, "margin", "30px auto");
    			add_location(div50, file$1, 191, 12, 8908);
    			if (img3.src !== (img3_src_value = "./assets/img/mtx.svg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "height", "100px");
    			set_style(img3, "margin-right", "0");
    			set_style(img3, "margin-left", "10px");
    			add_location(img3, file$1, 216, 28, 10402);
    			attr_dev(div51, "class", "");
    			add_location(div51, file$1, 215, 24, 10358);
    			add_location(h43, file$1, 221, 32, 10724);
    			attr_dev(div52, "class", "card-header");
    			add_location(div52, file$1, 220, 28, 10665);
    			set_style(p7, "font-size", "18px");
    			set_style(p7, "margin", "0");
    			set_style(p7, "color", "#797979");
    			set_style(p7, "font-weight", "400", 1);
    			add_location(p7, file$1, 224, 32, 10872);
    			attr_dev(div53, "class", "card-body");
    			add_location(div53, file$1, 223, 28, 10815);
    			attr_dev(div54, "class", "card-wrap");
    			set_style(div54, "margin-top", "10px");
    			add_location(div54, file$1, 219, 24, 10586);
    			attr_dev(div55, "class", "card");
    			set_style(div55, "flex-direction", "row");
    			set_style(div55, "float", "left");
    			set_style(div55, "box-shadow", "none");
    			set_style(div55, "background-color", "transparent");
    			set_style(div55, "border-radius", "0");
    			set_style(div55, "border-color", "transparent");
    			set_style(div55, "position", "relative");
    			set_style(div55, "margin-bottom", "0");
    			add_location(div55, file$1, 207, 20, 9833);
    			attr_dev(div56, "class", "card card-statistic-1");
    			set_style(div56, "box-shadow", "none");
    			set_style(div56, "background-color", "transparent");
    			set_style(div56, "border-radius", "0");
    			set_style(div56, "border-color", "transparent");
    			set_style(div56, "position", "relative");
    			set_style(div56, "margin-bottom", "0");
    			add_location(div56, file$1, 200, 16, 9365);
    			attr_dev(div57, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div57, file$1, 199, 12, 9300);
    			attr_dev(div58, "class", "row");
    			set_style(div58, "background-color", "#fff");
    			set_style(div58, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			add_location(div58, file$1, 155, 8, 6832);
    			if (img4.src !== (img4_src_value = "./assets/img/cha-img3.svg")) attr_dev(img4, "src", img4_src_value);
    			set_style(img4, "width", "150px");
    			set_style(img4, "margin-bottom", "20px");
    			add_location(img4, file$1, 242, 32, 11663);
    			attr_dev(div59, "class", "line-grey");
    			add_location(div59, file$1, 241, 32, 11606);
    			attr_dev(input, "class", "form-check-input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "agree_exchange");
    			input.value = "option1";
    			add_location(input, file$1, 245, 32, 11889);
    			attr_dev(label, "class", "form-check-label");
    			attr_dev(label, "for", "agree_exchange");
    			add_location(label, file$1, 246, 32, 12007);
    			attr_dev(div60, "class", "form-check form-check-inline mt-3");
    			add_location(div60, file$1, 244, 28, 11808);
    			attr_dev(div61, "class", "col");
    			add_location(div61, file$1, 240, 28, 11555);
    			attr_dev(div62, "class", "card-body");
    			add_location(div62, file$1, 239, 24, 11502);
    			attr_dev(div63, "class", "card-wrap");
    			add_location(div63, file$1, 237, 20, 11415);
    			attr_dev(div64, "class", "card");
    			add_location(div64, file$1, 235, 12, 11337);
    			attr_dev(div65, "class", "col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-5");
    			set_style(div65, "margin", "0 auto");
    			add_location(div65, file$1, 234, 8, 11235);
    			attr_dev(div66, "class", "section-body");
    			set_style(div66, "padding-right", "30px");
    			set_style(div66, "padding-left", "30px");
    			add_location(div66, file$1, 17, 4, 367);
    			attr_dev(section, "class", "section");
    			add_location(section, file$1, 13, 0, 294);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div66);
    			append_dev(div66, div42);
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
    			append_dev(div66, t29);
    			append_dev(div66, div58);
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
    			append_dev(div66, t40);
    			append_dev(div66, div65);
    			append_dev(div65, div64);
    			append_dev(div64, div63);
    			append_dev(div63, div62);
    			append_dev(div62, div61);
    			append_dev(div61, div59);
    			append_dev(div59, img4);
    			append_dev(div61, t41);
    			append_dev(div61, div60);
    			append_dev(div60, input);
    			append_dev(div60, t42);
    			append_dev(div60, label);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$1.name
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
    const file$2 = "src/pages/principal.svelte";

    function create_fragment$2(ctx) {
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
    			add_location(div0, file$2, 8, 4, 261);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "sidebar-gone-hide w-100");
    			add_location(a0, file$2, 13, 16, 502);
    			set_style(a1, "margin-top", "-5px");
    			set_style(a1, "color", "#9e9e9e");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "nav-link sidebar-gone-show");
    			attr_dev(a1, "data-toggle", "sidebar");
    			add_location(a1, file$2, 14, 16, 579);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file$2, 12, 12, 458);
    			attr_dev(ul0, "class", "navbar-nav mr-auto");
    			add_location(ul0, file$2, 11, 8, 413);
    			add_location(strong, file$2, 23, 16, 932);
    			add_location(div2, file$2, 22, 12, 909);
    			attr_dev(div3, "class", "nav navbar-nav navbar-right");
    			add_location(div3, file$2, 21, 8, 854);
    			attr_dev(nav, "class", "navbar navbar-expand-lg main-navbar");
    			set_style(nav, "height", "45px");
    			add_location(nav, file$2, 10, 4, 333);
    			if (img0.src !== (img0_src_value = "assets/img/1.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "pt-2");
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "width", "100");
    			add_location(img0, file$2, 33, 16, 1303);
    			attr_dev(div4, "class", "sidebar-brand line");
    			add_location(div4, file$2, 32, 12, 1253);
    			if (img1.src !== (img1_src_value = "./assets/img/icons/menu.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "icon-grey");
    			add_location(img1, file$2, 39, 24, 1555);
    			set_style(span0, "font-size", "11px");
    			add_location(span0, file$2, 40, 24, 1638);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$2, 38, 20, 1500);
    			add_location(li0, file$2, 37, 16, 1474);
    			if (img2.src !== (img2_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "icon-green");
    			add_location(img2, file$2, 44, 20, 1809);
    			attr_dev(li1, "class", "menu-header line");
    			add_location(li1, file$2, 43, 16, 1752);
    			if (img3.src !== (img3_src_value = "./assets/img/icons/arrow-r.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "class", "icon-grey");
    			add_location(img3, file$2, 47, 24, 1972);
    			set_style(span1, "font-size", "11px");
    			add_location(span1, file$2, 48, 24, 2058);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$2, 46, 20, 1917);
    			add_location(li2, file$2, 45, 16, 1891);
    			if (img4.src !== (img4_src_value = "./assets/img/icons/arrow-l.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "class", "icon-grey");
    			add_location(img4, file$2, 53, 24, 2251);
    			set_style(span2, "font-size", "11px");
    			add_location(span2, file$2, 54, 24, 2337);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$2, 52, 20, 2196);
    			add_location(li3, file$2, 51, 16, 2170);
    			if (img5.src !== (img5_src_value = "./assets/img/icons/history.svg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "class", "icon-grey");
    			add_location(img5, file$2, 59, 24, 2527);
    			set_style(span3, "font-size", "11px");
    			add_location(span3, file$2, 60, 24, 2613);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "nav-link");
    			add_location(a5, file$2, 58, 20, 2472);
    			add_location(li4, file$2, 57, 16, 2446);
    			attr_dev(ul1, "class", "sidebar-menu pt-3");
    			add_location(ul1, file$2, 36, 12, 1426);
    			attr_dev(aside, "id", "sidebar-wrapper");
    			add_location(aside, file$2, 30, 8, 1186);
    			attr_dev(div5, "class", "main-sidebar sidebar-style-2");
    			set_style(div5, "overflow", "hidden");
    			set_style(div5, "outline", "currentcolor none medium");
    			attr_dev(div5, "tabindex", "1");
    			add_location(div5, file$2, 28, 4, 1050);
    			attr_dev(div6, "class", "main-content");
    			set_style(div6, "min-height", "680px");
    			add_location(div6, file$2, 90, 4, 3948);
    			attr_dev(div7, "class", "bullet");
    			add_location(div7, file$2, 96, 12, 4172);
    			attr_dev(a6, "href", "");
    			add_location(a6, file$2, 97, 12, 4212);
    			attr_dev(div8, "class", "footer-left");
    			add_location(div8, file$2, 94, 8, 4103);
    			attr_dev(div9, "class", "footer-right");
    			add_location(div9, file$2, 99, 8, 4264);
    			attr_dev(footer, "class", "main-footer");
    			add_location(footer, file$2, 93, 4, 4065);
    			attr_dev(div10, "class", "main-wrapper main-wrapper-1");
    			add_location(div10, file$2, 6, 0, 185);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Principal",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new Principal({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
