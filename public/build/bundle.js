
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    /* src/pages/content/dashboard.svelte generated by Svelte v3.22.3 */

    const file = "src/pages/content/dashboard.svelte";

    function create_fragment(ctx) {
    	let section;
    	let div50;
    	let div28;
    	let div10;
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
    	let div9;
    	let div8;
    	let div7;
    	let div6;
    	let p1;
    	let t5;
    	let strong;
    	let t7;
    	let t8;
    	let div12;
    	let div11;
    	let img1;
    	let img1_src_value;
    	let t9;
    	let div27;
    	let div18;
    	let div17;
    	let div13;
    	let img2;
    	let img2_src_value;
    	let t10;
    	let div16;
    	let div14;
    	let h41;
    	let t12;
    	let div15;
    	let p2;
    	let t14;
    	let div22;
    	let div21;
    	let div20;
    	let div19;
    	let p3;
    	let t16;
    	let div26;
    	let div25;
    	let div24;
    	let div23;
    	let p4;
    	let t18;
    	let div45;
    	let div35;
    	let div34;
    	let div33;
    	let div31;
    	let div29;
    	let h42;
    	let t20;
    	let div30;
    	let p5;
    	let t22;
    	let div32;
    	let img3;
    	let img3_src_value;
    	let t23;
    	let div37;
    	let div36;
    	let img4;
    	let img4_src_value;
    	let t24;
    	let div44;
    	let div43;
    	let div42;
    	let div38;
    	let img5;
    	let img5_src_value;
    	let t25;
    	let div41;
    	let div39;
    	let h43;
    	let t27;
    	let div40;
    	let p6;
    	let t29;
    	let div49;
    	let div48;
    	let div47;
    	let div46;
    	let img6;
    	let img6_src_value;
    	let t30;
    	let p7;
    	let input;
    	let t31;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div50 = element("div");
    			div28 = element("div");
    			div10 = element("div");
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
    			p0.textContent = "1 ETH = 1000.000.000 MTX";
    			t4 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			p1 = element("p");
    			t5 = text("Particial Amount (Avalible: ");
    			strong = element("strong");
    			strong.textContent = "5049.0000";
    			t7 = text(" ETH)");
    			t8 = space();
    			div12 = element("div");
    			div11 = element("div");
    			img1 = element("img");
    			t9 = space();
    			div27 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			div13 = element("div");
    			img2 = element("img");
    			t10 = space();
    			div16 = element("div");
    			div14 = element("div");
    			h41 = element("h4");
    			h41.textContent = "MATRIX COIN";
    			t12 = space();
    			div15 = element("div");
    			p2 = element("p");
    			p2.textContent = "1 MTX = 1000.000.000 ETH";
    			t14 = space();
    			div22 = element("div");
    			div21 = element("div");
    			div20 = element("div");
    			div19 = element("div");
    			p3 = element("p");
    			p3.textContent = "Your MTX Address(destination address)";
    			t16 = space();
    			div26 = element("div");
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			p4 = element("p");
    			p4.textContent = "Your MTX Refund Address";
    			t18 = space();
    			div45 = element("div");
    			div35 = element("div");
    			div34 = element("div");
    			div33 = element("div");
    			div31 = element("div");
    			div29 = element("div");
    			h42 = element("h4");
    			h42.textContent = "YOU ARE EXCHANGING";
    			t20 = space();
    			div30 = element("div");
    			p5 = element("p");
    			p5.textContent = "0.0000000000 ETH";
    			t22 = space();
    			div32 = element("div");
    			img3 = element("img");
    			t23 = space();
    			div37 = element("div");
    			div36 = element("div");
    			img4 = element("img");
    			t24 = space();
    			div44 = element("div");
    			div43 = element("div");
    			div42 = element("div");
    			div38 = element("div");
    			img5 = element("img");
    			t25 = space();
    			div41 = element("div");
    			div39 = element("div");
    			h43 = element("h4");
    			h43.textContent = "YOU WILL RECEIVE";
    			t27 = space();
    			div40 = element("div");
    			p6 = element("p");
    			p6.textContent = "0.0000000000 MTX";
    			t29 = space();
    			div49 = element("div");
    			div48 = element("div");
    			div47 = element("div");
    			div46 = element("div");
    			img6 = element("img");
    			t30 = space();
    			p7 = element("p");
    			input = element("input");
    			t31 = text(" I agree to (Changelly) Coins");
    			if (img0.src !== (img0_src_value = "./assets/img/etc.svg")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "height", "70px");
    			set_style(img0, "margin-right", "0");
    			set_style(img0, "margin-left", "10px");
    			add_location(img0, file, 14, 28, 556);
    			attr_dev(div0, "class", "");
    			add_location(div0, file, 13, 24, 512);
    			add_location(h40, file, 19, 32, 851);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file, 18, 28, 792);
    			set_style(p0, "font-size", "15px");
    			set_style(p0, "margin", "0px");
    			add_location(p0, file, 22, 32, 991);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file, 21, 28, 934);
    			attr_dev(div3, "class", "card-wrap");
    			add_location(div3, file, 17, 24, 739);
    			attr_dev(div4, "class", "card border-orange");
    			set_style(div4, "flex-direction", "row");
    			add_location(div4, file, 11, 20, 392);
    			attr_dev(div5, "class", "card card-statistic-1");
    			add_location(div5, file, 9, 16, 297);
    			add_location(strong, file, 35, 60, 1689);
    			set_style(p1, "font-size", "15px");
    			set_style(p1, "margin-top", "0.5rem");
    			set_style(p1, "margin-bottom", "0.5rem");
    			add_location(p1, file, 34, 32, 1556);
    			attr_dev(div6, "class", "card-body");
    			add_location(div6, file, 33, 28, 1499);
    			attr_dev(div7, "class", "card-wrap");
    			add_location(div7, file, 31, 24, 1407);
    			attr_dev(div8, "class", "card border-grey");
    			set_style(div8, "flex-direction", "row");
    			add_location(div8, file, 30, 20, 1318);
    			attr_dev(div9, "class", "card card-statistic-1");
    			add_location(div9, file, 28, 16, 1223);
    			attr_dev(div10, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div10, file, 7, 12, 207);
    			if (img1.src !== (img1_src_value = "./assets/img/cha-img1.svg")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "height", "350px");
    			add_location(img1, file, 45, 20, 2047);
    			set_style(div11, "text-align", "center");
    			add_location(div11, file, 44, 16, 1992);
    			attr_dev(div12, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			add_location(div12, file, 42, 12, 1902);
    			if (img2.src !== (img2_src_value = "./assets/img/mtx.svg")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "height", "70px");
    			set_style(img2, "margin-right", "0");
    			set_style(img2, "margin-left", "20px");
    			add_location(img2, file, 59, 28, 2718);
    			attr_dev(div13, "class", "");
    			add_location(div13, file, 58, 24, 2674);
    			add_location(h41, file, 64, 32, 3013);
    			attr_dev(div14, "class", "card-header");
    			add_location(div14, file, 63, 28, 2954);
    			set_style(p2, "font-size", "15px");
    			set_style(p2, "margin", "0px");
    			add_location(p2, file, 67, 32, 3156);
    			attr_dev(div15, "class", "card-body");
    			add_location(div15, file, 66, 28, 3099);
    			attr_dev(div16, "class", "card-wrap");
    			add_location(div16, file, 62, 24, 2901);
    			attr_dev(div17, "class", "card border-green");
    			set_style(div17, "flex-direction", "row");
    			add_location(div17, file, 53, 20, 2372);
    			attr_dev(div18, "class", "card card-statistic-1");
    			add_location(div18, file, 51, 16, 2277);
    			set_style(p3, "font-size", "15px");
    			set_style(p3, "margin-top", "0.5rem");
    			set_style(p3, "margin-bottom", "0.5rem");
    			add_location(p3, file, 79, 32, 3721);
    			attr_dev(div19, "class", "card-body");
    			add_location(div19, file, 78, 28, 3664);
    			attr_dev(div20, "class", "card-wrap");
    			add_location(div20, file, 76, 24, 3572);
    			attr_dev(div21, "class", "card border-grey");
    			set_style(div21, "flex-direction", "row");
    			add_location(div21, file, 75, 20, 3483);
    			attr_dev(div22, "class", "card card-statistic-1");
    			add_location(div22, file, 73, 16, 3388);
    			set_style(p4, "font-size", "15px");
    			set_style(p4, "margin-top", "0.5rem");
    			set_style(p4, "margin-bottom", "0.5rem");
    			add_location(p4, file, 92, 32, 4364);
    			attr_dev(div23, "class", "card-body");
    			add_location(div23, file, 91, 28, 4307);
    			attr_dev(div24, "class", "card-wrap");
    			add_location(div24, file, 89, 24, 4215);
    			attr_dev(div25, "class", "card border-grey");
    			set_style(div25, "flex-direction", "row");
    			add_location(div25, file, 88, 20, 4126);
    			attr_dev(div26, "class", "card card-statistic-1");
    			add_location(div26, file, 86, 16, 4031);
    			attr_dev(div27, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div27, file, 49, 12, 2187);
    			attr_dev(div28, "class", "row");
    			add_location(div28, file, 5, 8, 153);
    			add_location(h42, file, 122, 32, 6068);
    			attr_dev(div29, "class", "card-header");
    			set_style(div29, "text-align", "right");
    			add_location(div29, file, 121, 28, 5982);
    			set_style(p5, "font-size", "25px");
    			set_style(p5, "margin", "0px");
    			set_style(p5, "color", "#797979");
    			add_location(p5, file, 125, 32, 6245);
    			attr_dev(div30, "class", "card-body");
    			set_style(div30, "text-align", "right");
    			add_location(div30, file, 124, 28, 6161);
    			attr_dev(div31, "class", "card-wrap");
    			set_style(div31, "margin-top", "10px");
    			add_location(div31, file, 120, 24, 5903);
    			if (img3.src !== (img3_src_value = "./assets/img/etc.svg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "height", "100px");
    			set_style(img3, "margin-right", "0");
    			set_style(img3, "margin-left", "0px");
    			set_style(img3, "float", "right");
    			add_location(img3, file, 131, 28, 6527);
    			attr_dev(div32, "class", "");
    			add_location(div32, file, 130, 24, 6483);
    			attr_dev(div33, "class", "card");
    			set_style(div33, "flex-direction", "row");
    			set_style(div33, "float", "right");
    			set_style(div33, "box-shadow", "none");
    			set_style(div33, "background-color", "transparent");
    			set_style(div33, "border-radius", "0");
    			set_style(div33, "border-color", "transparent");
    			set_style(div33, "position", "relative");
    			set_style(div33, "margin-bottom", "0");
    			add_location(div33, file, 111, 20, 5354);
    			attr_dev(div34, "class", "card card-statistic-1");
    			set_style(div34, "box-shadow", "none");
    			set_style(div34, "background-color", "transparent");
    			set_style(div34, "border-radius", "0");
    			set_style(div34, "border-color", "transparent");
    			set_style(div34, "position", "relative");
    			set_style(div34, "margin-bottom", "0");
    			add_location(div34, file, 104, 16, 4886);
    			attr_dev(div35, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div35, file, 103, 12, 4821);
    			if (img4.src !== (img4_src_value = "./assets/img/cha-img2.svg")) attr_dev(img4, "src", img4_src_value);
    			set_style(img4, "height", "50px");
    			set_style(img4, "margin-top", "10%");
    			add_location(img4, file, 139, 20, 6890);
    			set_style(div36, "text-align", "center");
    			add_location(div36, file, 138, 16, 6835);
    			attr_dev(div37, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			add_location(div37, file, 137, 12, 6770);
    			if (img5.src !== (img5_src_value = "./assets/img/mtx.svg")) attr_dev(img5, "src", img5_src_value);
    			set_style(img5, "height", "100px");
    			set_style(img5, "margin-right", "0");
    			set_style(img5, "margin-left", "10px");
    			add_location(img5, file, 160, 28, 8146);
    			attr_dev(div38, "class", "");
    			add_location(div38, file, 159, 24, 8102);
    			add_location(h43, file, 165, 32, 8468);
    			attr_dev(div39, "class", "card-header");
    			add_location(div39, file, 164, 28, 8409);
    			set_style(p6, "font-size", "20px");
    			set_style(p6, "margin", "0px");
    			set_style(p6, "color", "#797979");
    			add_location(p6, file, 168, 32, 8616);
    			attr_dev(div40, "class", "card-body");
    			add_location(div40, file, 167, 28, 8559);
    			attr_dev(div41, "class", "card-wrap");
    			set_style(div41, "margin-top", "10px");
    			add_location(div41, file, 163, 24, 8330);
    			attr_dev(div42, "class", "card");
    			set_style(div42, "flex-direction", "row");
    			set_style(div42, "float", "left");
    			set_style(div42, "box-shadow", "none");
    			set_style(div42, "background-color", "transparent");
    			set_style(div42, "border-radius", "0");
    			set_style(div42, "border-color", "transparent");
    			set_style(div42, "position", "relative");
    			set_style(div42, "margin-bottom", "0");
    			add_location(div42, file, 151, 20, 7581);
    			attr_dev(div43, "class", "card card-statistic-1");
    			set_style(div43, "box-shadow", "none");
    			set_style(div43, "background-color", "transparent");
    			set_style(div43, "border-radius", "0");
    			set_style(div43, "border-color", "transparent");
    			set_style(div43, "position", "relative");
    			set_style(div43, "margin-bottom", "0");
    			add_location(div43, file, 144, 16, 7113);
    			attr_dev(div44, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div44, file, 143, 12, 7048);
    			attr_dev(div45, "class", "row");
    			set_style(div45, "background-color", "#fff");
    			set_style(div45, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			add_location(div45, file, 101, 8, 4693);
    			if (img6.src !== (img6_src_value = "./assets/img/cha-img3.svg")) attr_dev(img6, "src", img6_src_value);
    			set_style(img6, "width", "150px");
    			set_style(img6, "margin-bottom", "20px");
    			add_location(img6, file, 182, 12, 9256);
    			attr_dev(div46, "class", "line-grey");
    			add_location(div46, file, 181, 12, 9219);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "cbox1");
    			input.value = "first_checkbox";
    			add_location(input, file, 184, 15, 9372);
    			add_location(p7, file, 184, 12, 9369);
    			set_style(div47, "text-align", "center");
    			set_style(div47, "margin", "0px auto");
    			set_style(div47, "padding", "20px");
    			add_location(div47, file, 180, 12, 9140);
    			set_style(div48, "margin", "0px auto");
    			set_style(div48, "background-color", "#fff");
    			set_style(div48, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			set_style(div48, "width", "300px");
    			add_location(div48, file, 179, 12, 9017);
    			attr_dev(div49, "class", "row");
    			set_style(div49, "text-align", "center");
    			set_style(div49, "padding", "50px");
    			add_location(div49, file, 178, 8, 8944);
    			attr_dev(div50, "class", "section-body");
    			set_style(div50, "padding-right", "30px");
    			set_style(div50, "padding-left", "30px");
    			add_location(div50, file, 4, 4, 69);
    			attr_dev(section, "class", "section");
    			add_location(section, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div50);
    			append_dev(div50, div28);
    			append_dev(div28, div10);
    			append_dev(div10, div5);
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
    			append_dev(div10, t4);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, p1);
    			append_dev(p1, t5);
    			append_dev(p1, strong);
    			append_dev(p1, t7);
    			append_dev(div28, t8);
    			append_dev(div28, div12);
    			append_dev(div12, div11);
    			append_dev(div11, img1);
    			append_dev(div28, t9);
    			append_dev(div28, div27);
    			append_dev(div27, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div13);
    			append_dev(div13, img2);
    			append_dev(div17, t10);
    			append_dev(div17, div16);
    			append_dev(div16, div14);
    			append_dev(div14, h41);
    			append_dev(div16, t12);
    			append_dev(div16, div15);
    			append_dev(div15, p2);
    			append_dev(div27, t14);
    			append_dev(div27, div22);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, p3);
    			append_dev(div27, t16);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, p4);
    			append_dev(div50, t18);
    			append_dev(div50, div45);
    			append_dev(div45, div35);
    			append_dev(div35, div34);
    			append_dev(div34, div33);
    			append_dev(div33, div31);
    			append_dev(div31, div29);
    			append_dev(div29, h42);
    			append_dev(div31, t20);
    			append_dev(div31, div30);
    			append_dev(div30, p5);
    			append_dev(div33, t22);
    			append_dev(div33, div32);
    			append_dev(div32, img3);
    			append_dev(div45, t23);
    			append_dev(div45, div37);
    			append_dev(div37, div36);
    			append_dev(div36, img4);
    			append_dev(div45, t24);
    			append_dev(div45, div44);
    			append_dev(div44, div43);
    			append_dev(div43, div42);
    			append_dev(div42, div38);
    			append_dev(div38, img5);
    			append_dev(div42, t25);
    			append_dev(div42, div41);
    			append_dev(div41, div39);
    			append_dev(div39, h43);
    			append_dev(div41, t27);
    			append_dev(div41, div40);
    			append_dev(div40, p6);
    			append_dev(div50, t29);
    			append_dev(div50, div49);
    			append_dev(div49, div48);
    			append_dev(div48, div47);
    			append_dev(div47, div46);
    			append_dev(div46, img6);
    			append_dev(div47, t30);
    			append_dev(div47, p7);
    			append_dev(p7, input);
    			append_dev(p7, t31);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
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

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", $$slots, []);
    	return [];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/pages/principal.svelte generated by Svelte v3.22.3 */
    const file$1 = "src/pages/principal.svelte";

    function create_fragment$1(ctx) {
    	let div8;
    	let div0;
    	let t0;
    	let nav;
    	let a0;
    	let t2;
    	let a1;
    	let i;
    	let t3;
    	let div1;
    	let strong;
    	let t5;
    	let t6;
    	let div3;
    	let aside;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t7;
    	let ul;
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
    	let li5;
    	let a6;
    	let img6;
    	let img6_src_value;
    	let t22;
    	let span4;
    	let t24;
    	let li6;
    	let t25;
    	let img7;
    	let img7_src_value;
    	let t26;
    	let li7;
    	let a7;
    	let img8;
    	let img8_src_value;
    	let t27;
    	let span5;
    	let t29;
    	let li8;
    	let t30;
    	let img9;
    	let img9_src_value;
    	let t31;
    	let li9;
    	let a8;
    	let img10;
    	let img10_src_value;
    	let t32;
    	let span6;
    	let t34;
    	let div4;
    	let t35;
    	let footer;
    	let div6;
    	let t36;
    	let div5;
    	let t37;
    	let a9;
    	let t39;
    	let div7;
    	let current;
    	var switch_value = Dashboard;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			t0 = space();
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "MATRIX COIN";
    			t2 = space();
    			a1 = element("a");
    			i = element("i");
    			t3 = space();
    			div1 = element("div");
    			strong = element("strong");
    			strong.textContent = "Balance";
    			t5 = text(" 5900.0000 ETH");
    			t6 = space();
    			div3 = element("div");
    			aside = element("aside");
    			div2 = element("div");
    			img0 = element("img");
    			t7 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a2 = element("a");
    			img1 = element("img");
    			t8 = space();
    			span0 = element("span");
    			span0.textContent = "DASHBOARD";
    			t10 = space();
    			li1 = element("li");
    			t11 = text("WALLET\r\n                ");
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
    			li5 = element("li");
    			a6 = element("a");
    			img6 = element("img");
    			t22 = space();
    			span4 = element("span");
    			span4.textContent = "ADDRESS BOOK";
    			t24 = space();
    			li6 = element("li");
    			t25 = text("SETTINGS\r\n                ");
    			img7 = element("img");
    			t26 = space();
    			li7 = element("li");
    			a7 = element("a");
    			img8 = element("img");
    			t27 = space();
    			span5 = element("span");
    			span5.textContent = "SETTINGS";
    			t29 = space();
    			li8 = element("li");
    			t30 = text("APP\r\n                ");
    			img9 = element("img");
    			t31 = space();
    			li9 = element("li");
    			a8 = element("a");
    			img10 = element("img");
    			t32 = space();
    			span6 = element("span");
    			span6.textContent = "CHANGELLY";
    			t34 = space();
    			div4 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t35 = space();
    			footer = element("footer");
    			div6 = element("div");
    			t36 = text("Copyright © 2020\r\n                ");
    			div5 = element("div");
    			t37 = space();
    			a9 = element("a");
    			a9.textContent = "Matrix Coin";
    			t39 = space();
    			div7 = element("div");
    			attr_dev(div0, "class", "navbar-bg line-grey");
    			add_location(div0, file$1, 6, 4, 148);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "navbar-brand sidebar-gone-hide w-100");
    			add_location(a0, file$1, 10, 9, 313);
    			attr_dev(i, "class", "fas fa-bars");
    			add_location(i, file$1, 11, 78, 465);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "nav-link sidebar-gone-show");
    			attr_dev(a1, "data-toggle", "sidebar");
    			add_location(a1, file$1, 11, 9, 396);
    			add_location(strong, file$1, 13, 43, 568);
    			attr_dev(div1, "class", "breadcrumb-item col-2");
    			add_location(div1, file$1, 13, 8, 533);
    			attr_dev(nav, "class", "navbar navbar-expand-lg main-navbar");
    			set_style(nav, "height", "45px");
    			add_location(nav, file$1, 8, 4, 220);
    			if (img0.src !== (img0_src_value = "assets/img/1.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "pt-2");
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "width", "100");
    			set_style(img0, "padding-top", "2rem", 1);
    			add_location(img0, file$1, 21, 16, 900);
    			attr_dev(div2, "class", "sidebar-brand line");
    			add_location(div2, file$1, 20, 12, 850);
    			if (img1.src !== (img1_src_value = "./assets/img/icons/menu.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "icon-grey");
    			add_location(img1, file$1, 27, 24, 1189);
    			set_style(span0, "font-size", "11px");
    			add_location(span0, file$1, 28, 24, 1272);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$1, 26, 19, 1134);
    			add_location(li0, file$1, 25, 16, 1109);
    			if (img2.src !== (img2_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "icon-green");
    			add_location(img2, file$1, 32, 16, 1439);
    			attr_dev(li1, "class", "menu-header line");
    			add_location(li1, file$1, 31, 16, 1386);
    			if (img3.src !== (img3_src_value = "./assets/img/icons/arrow-r.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "class", "icon-grey");
    			add_location(img3, file$1, 35, 24, 1601);
    			set_style(span1, "font-size", "11px");
    			add_location(span1, file$1, 36, 24, 1687);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$1, 34, 19, 1546);
    			add_location(li2, file$1, 33, 16, 1521);
    			if (img4.src !== (img4_src_value = "./assets/img/icons/arrow-l.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "class", "icon-grey");
    			add_location(img4, file$1, 41, 24, 1879);
    			set_style(span2, "font-size", "11px");
    			add_location(span2, file$1, 42, 24, 1965);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$1, 40, 19, 1824);
    			add_location(li3, file$1, 39, 16, 1799);
    			if (img5.src !== (img5_src_value = "./assets/img/icons/history.svg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "class", "icon-grey");
    			add_location(img5, file$1, 47, 24, 2154);
    			set_style(span3, "font-size", "11px");
    			add_location(span3, file$1, 48, 24, 2240);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "nav-link");
    			add_location(a5, file$1, 46, 19, 2099);
    			add_location(li4, file$1, 45, 16, 2074);
    			if (img6.src !== (img6_src_value = "./assets/img/icons/book.svg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "class", "icon-grey");
    			add_location(img6, file$1, 53, 24, 2432);
    			set_style(span4, "font-size", "11px");
    			add_location(span4, file$1, 54, 24, 2515);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "nav-link");
    			add_location(a6, file$1, 52, 19, 2377);
    			add_location(li5, file$1, 51, 16, 2352);
    			if (img7.src !== (img7_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "class", "icon-green");
    			add_location(img7, file$1, 58, 16, 2687);
    			attr_dev(li6, "class", "menu-header line");
    			add_location(li6, file$1, 57, 16, 2632);
    			if (img8.src !== (img8_src_value = "./assets/img/icons/settings.svg")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "class", "icon-grey");
    			add_location(img8, file$1, 61, 24, 2849);
    			set_style(span5, "font-size", "11px");
    			add_location(span5, file$1, 62, 24, 2936);
    			attr_dev(a7, "href", "#");
    			attr_dev(a7, "class", "nav-link");
    			add_location(a7, file$1, 60, 19, 2794);
    			add_location(li7, file$1, 59, 16, 2769);
    			if (img9.src !== (img9_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "class", "icon-green");
    			add_location(img9, file$1, 66, 16, 3099);
    			attr_dev(li8, "class", "menu-header line");
    			add_location(li8, file$1, 65, 16, 3049);
    			if (img10.src !== (img10_src_value = "./assets/img/icons/change.svg")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "class", "icon-grey");
    			add_location(img10, file$1, 69, 24, 3261);
    			set_style(span6, "font-size", "11px");
    			add_location(span6, file$1, 70, 24, 3346);
    			attr_dev(a8, "href", "#");
    			attr_dev(a8, "class", "nav-link");
    			add_location(a8, file$1, 68, 19, 3206);
    			add_location(li9, file$1, 67, 16, 3181);
    			attr_dev(ul, "class", "sidebar-menu pt-3");
    			add_location(ul, file$1, 24, 12, 1061);
    			attr_dev(aside, "id", "sidebar-wrapper");
    			add_location(aside, file$1, 18, 8, 787);
    			attr_dev(div3, "class", "main-sidebar sidebar-style-2");
    			set_style(div3, "overflow", "hidden");
    			set_style(div3, "outline", "currentcolor none medium");
    			attr_dev(div3, "tabindex", "1");
    			add_location(div3, file$1, 16, 4, 651);
    			attr_dev(div4, "class", "main-content");
    			set_style(div4, "min-height", "680px");
    			add_location(div4, file$1, 78, 4, 3551);
    			attr_dev(div5, "class", "bullet");
    			add_location(div5, file$1, 84, 16, 3783);
    			attr_dev(a9, "href", "");
    			add_location(a9, file$1, 85, 16, 3827);
    			attr_dev(div6, "class", "footer-left");
    			add_location(div6, file$1, 82, 8, 3706);
    			attr_dev(div7, "class", "footer-right");
    			add_location(div7, file$1, 87, 8, 3879);
    			attr_dev(footer, "class", "main-footer");
    			add_location(footer, file$1, 81, 4, 3668);
    			attr_dev(div8, "class", "main-wrapper main-wrapper-1");
    			add_location(div8, file$1, 4, 0, 76);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div8, t0);
    			append_dev(div8, nav);
    			append_dev(nav, a0);
    			append_dev(nav, t2);
    			append_dev(nav, a1);
    			append_dev(a1, i);
    			append_dev(nav, t3);
    			append_dev(nav, div1);
    			append_dev(div1, strong);
    			append_dev(div1, t5);
    			append_dev(div8, t6);
    			append_dev(div8, div3);
    			append_dev(div3, aside);
    			append_dev(aside, div2);
    			append_dev(div2, img0);
    			append_dev(aside, t7);
    			append_dev(aside, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a2);
    			append_dev(a2, img1);
    			append_dev(a2, t8);
    			append_dev(a2, span0);
    			append_dev(ul, t10);
    			append_dev(ul, li1);
    			append_dev(li1, t11);
    			append_dev(li1, img2);
    			append_dev(ul, t12);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			append_dev(a3, img3);
    			append_dev(a3, t13);
    			append_dev(a3, span1);
    			append_dev(ul, t15);
    			append_dev(ul, li3);
    			append_dev(li3, a4);
    			append_dev(a4, img4);
    			append_dev(a4, t16);
    			append_dev(a4, span2);
    			append_dev(ul, t18);
    			append_dev(ul, li4);
    			append_dev(li4, a5);
    			append_dev(a5, img5);
    			append_dev(a5, t19);
    			append_dev(a5, span3);
    			append_dev(ul, t21);
    			append_dev(ul, li5);
    			append_dev(li5, a6);
    			append_dev(a6, img6);
    			append_dev(a6, t22);
    			append_dev(a6, span4);
    			append_dev(ul, t24);
    			append_dev(ul, li6);
    			append_dev(li6, t25);
    			append_dev(li6, img7);
    			append_dev(ul, t26);
    			append_dev(ul, li7);
    			append_dev(li7, a7);
    			append_dev(a7, img8);
    			append_dev(a7, t27);
    			append_dev(a7, span5);
    			append_dev(ul, t29);
    			append_dev(ul, li8);
    			append_dev(li8, t30);
    			append_dev(li8, img9);
    			append_dev(ul, t31);
    			append_dev(ul, li9);
    			append_dev(li9, a8);
    			append_dev(a8, img10);
    			append_dev(a8, t32);
    			append_dev(a8, span6);
    			append_dev(div8, t34);
    			append_dev(div8, div4);

    			if (switch_instance) {
    				mount_component(switch_instance, div4, null);
    			}

    			append_dev(div8, t35);
    			append_dev(div8, footer);
    			append_dev(footer, div6);
    			append_dev(div6, t36);
    			append_dev(div6, div5);
    			append_dev(div6, t37);
    			append_dev(div6, a9);
    			append_dev(footer, t39);
    			append_dev(footer, div7);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    					mount_component(switch_instance, div4, null);
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
    			if (detaching) detach_dev(div8);
    			if (switch_instance) destroy_component(switch_instance);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Principal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Principal", $$slots, []);
    	$$self.$capture_state = () => ({ Dashboard });
    	return [];
    }

    class Principal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Principal",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new Principal({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
