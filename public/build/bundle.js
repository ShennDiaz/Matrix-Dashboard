
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
    			h41.textContent = "ETHEREUM";
    			t12 = space();
    			div15 = element("div");
    			p2 = element("p");
    			p2.textContent = "1 ETH = 1000.000.000 MTX";
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
    			attr_dev(img0, "class", "mt-2");
    			set_style(img0, "height", "50px");
    			set_style(img0, "margin-right", "0");
    			set_style(img0, "margin-left", "10px");
    			add_location(img0, file, 14, 28, 535);
    			attr_dev(div0, "class", "");
    			add_location(div0, file, 13, 24, 491);
    			add_location(h40, file, 19, 32, 843);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file, 18, 28, 784);
    			set_style(p0, "font-size", "15px");
    			set_style(p0, "margin", "0px");
    			add_location(p0, file, 22, 32, 983);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file, 21, 28, 926);
    			attr_dev(div3, "class", "card-wrap");
    			add_location(div3, file, 17, 24, 731);
    			attr_dev(div4, "class", "row");
    			set_style(div4, "padding", "15px");
    			add_location(div4, file, 11, 20, 392);
    			attr_dev(div5, "class", "card card-statistic-1");
    			add_location(div5, file, 9, 16, 297);
    			add_location(strong, file, 35, 60, 1681);
    			set_style(p1, "font-size", "15px");
    			set_style(p1, "margin-top", "0.5rem");
    			set_style(p1, "margin-bottom", "0.5rem");
    			add_location(p1, file, 34, 32, 1548);
    			attr_dev(div6, "class", "card-body");
    			add_location(div6, file, 33, 28, 1491);
    			attr_dev(div7, "class", "card-wrap");
    			add_location(div7, file, 31, 24, 1399);
    			attr_dev(div8, "class", "card border-grey");
    			set_style(div8, "flex-direction", "row");
    			add_location(div8, file, 30, 20, 1310);
    			attr_dev(div9, "class", "card card-statistic-1");
    			add_location(div9, file, 28, 16, 1215);
    			attr_dev(div10, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div10, file, 7, 12, 207);
    			if (img1.src !== (img1_src_value = "./assets/img/cha-img1.svg")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "height", "350px");
    			add_location(img1, file, 45, 20, 2039);
    			set_style(div11, "text-align", "center");
    			add_location(div11, file, 44, 16, 1984);
    			attr_dev(div12, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			add_location(div12, file, 42, 12, 1894);
    			if (img2.src !== (img2_src_value = "./assets/img/mtx.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "mt-2");
    			set_style(img2, "height", "50px");
    			set_style(img2, "margin-right", "0");
    			set_style(img2, "margin-left", "10px");
    			add_location(img2, file, 56, 28, 2511);
    			attr_dev(div13, "class", "");
    			add_location(div13, file, 55, 24, 2467);
    			add_location(h41, file, 61, 32, 2819);
    			attr_dev(div14, "class", "card-header");
    			add_location(div14, file, 60, 28, 2760);
    			set_style(p2, "font-size", "15px");
    			set_style(p2, "margin", "0px");
    			add_location(p2, file, 64, 32, 2959);
    			attr_dev(div15, "class", "card-body");
    			add_location(div15, file, 63, 28, 2902);
    			attr_dev(div16, "class", "card-wrap");
    			add_location(div16, file, 59, 24, 2707);
    			attr_dev(div17, "class", "row");
    			set_style(div17, "padding", "15px");
    			add_location(div17, file, 53, 20, 2364);
    			attr_dev(div18, "class", "card card-statistic-1");
    			add_location(div18, file, 51, 16, 2269);
    			set_style(p3, "font-size", "15px");
    			set_style(p3, "margin-top", "0.5rem");
    			set_style(p3, "margin-bottom", "0.5rem");
    			add_location(p3, file, 76, 32, 3523);
    			attr_dev(div19, "class", "card-body");
    			add_location(div19, file, 75, 28, 3466);
    			attr_dev(div20, "class", "card-wrap");
    			add_location(div20, file, 73, 24, 3374);
    			attr_dev(div21, "class", "card border-grey");
    			set_style(div21, "flex-direction", "row");
    			add_location(div21, file, 72, 20, 3285);
    			attr_dev(div22, "class", "card card-statistic-1");
    			add_location(div22, file, 70, 16, 3190);
    			set_style(p4, "font-size", "15px");
    			set_style(p4, "margin-top", "0.5rem");
    			set_style(p4, "margin-bottom", "0.5rem");
    			add_location(p4, file, 89, 32, 4166);
    			attr_dev(div23, "class", "card-body");
    			add_location(div23, file, 88, 28, 4109);
    			attr_dev(div24, "class", "card-wrap");
    			add_location(div24, file, 86, 24, 4017);
    			attr_dev(div25, "class", "card border-grey");
    			set_style(div25, "flex-direction", "row");
    			add_location(div25, file, 85, 20, 3928);
    			attr_dev(div26, "class", "card card-statistic-1");
    			add_location(div26, file, 83, 16, 3833);
    			attr_dev(div27, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div27, file, 49, 12, 2179);
    			attr_dev(div28, "class", "row");
    			add_location(div28, file, 5, 8, 153);
    			add_location(h42, file, 119, 32, 5870);
    			attr_dev(div29, "class", "card-header");
    			set_style(div29, "text-align", "right");
    			add_location(div29, file, 118, 28, 5784);
    			set_style(p5, "font-size", "25px");
    			set_style(p5, "margin", "0px");
    			set_style(p5, "color", "#797979");
    			add_location(p5, file, 122, 32, 6047);
    			attr_dev(div30, "class", "card-body");
    			set_style(div30, "text-align", "right");
    			add_location(div30, file, 121, 28, 5963);
    			attr_dev(div31, "class", "card-wrap");
    			set_style(div31, "margin-top", "10px");
    			add_location(div31, file, 117, 24, 5705);
    			if (img3.src !== (img3_src_value = "./assets/img/etc.svg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "height", "100px");
    			set_style(img3, "margin-right", "0");
    			set_style(img3, "margin-left", "0px");
    			set_style(img3, "float", "right");
    			add_location(img3, file, 128, 28, 6329);
    			attr_dev(div32, "class", "");
    			add_location(div32, file, 127, 24, 6285);
    			attr_dev(div33, "class", "card");
    			set_style(div33, "flex-direction", "row");
    			set_style(div33, "float", "right");
    			set_style(div33, "box-shadow", "none");
    			set_style(div33, "background-color", "transparent");
    			set_style(div33, "border-radius", "0");
    			set_style(div33, "border-color", "transparent");
    			set_style(div33, "position", "relative");
    			set_style(div33, "margin-bottom", "0");
    			add_location(div33, file, 108, 20, 5156);
    			attr_dev(div34, "class", "card card-statistic-1");
    			set_style(div34, "box-shadow", "none");
    			set_style(div34, "background-color", "transparent");
    			set_style(div34, "border-radius", "0");
    			set_style(div34, "border-color", "transparent");
    			set_style(div34, "position", "relative");
    			set_style(div34, "margin-bottom", "0");
    			add_location(div34, file, 101, 16, 4688);
    			attr_dev(div35, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div35, file, 100, 12, 4623);
    			if (img4.src !== (img4_src_value = "./assets/img/cha-img2.svg")) attr_dev(img4, "src", img4_src_value);
    			set_style(img4, "height", "50px");
    			set_style(img4, "margin-top", "10%");
    			add_location(img4, file, 136, 20, 6692);
    			set_style(div36, "text-align", "center");
    			add_location(div36, file, 135, 16, 6637);
    			attr_dev(div37, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			add_location(div37, file, 134, 12, 6572);
    			if (img5.src !== (img5_src_value = "./assets/img/mtx.svg")) attr_dev(img5, "src", img5_src_value);
    			set_style(img5, "height", "100px");
    			set_style(img5, "margin-right", "0");
    			set_style(img5, "margin-left", "10px");
    			add_location(img5, file, 157, 28, 7948);
    			attr_dev(div38, "class", "");
    			add_location(div38, file, 156, 24, 7904);
    			add_location(h43, file, 162, 32, 8270);
    			attr_dev(div39, "class", "card-header");
    			add_location(div39, file, 161, 28, 8211);
    			set_style(p6, "font-size", "20px");
    			set_style(p6, "margin", "0px");
    			set_style(p6, "color", "#797979");
    			add_location(p6, file, 165, 32, 8418);
    			attr_dev(div40, "class", "card-body");
    			add_location(div40, file, 164, 28, 8361);
    			attr_dev(div41, "class", "card-wrap");
    			set_style(div41, "margin-top", "10px");
    			add_location(div41, file, 160, 24, 8132);
    			attr_dev(div42, "class", "card");
    			set_style(div42, "flex-direction", "row");
    			set_style(div42, "float", "left");
    			set_style(div42, "box-shadow", "none");
    			set_style(div42, "background-color", "transparent");
    			set_style(div42, "border-radius", "0");
    			set_style(div42, "border-color", "transparent");
    			set_style(div42, "position", "relative");
    			set_style(div42, "margin-bottom", "0");
    			add_location(div42, file, 148, 20, 7383);
    			attr_dev(div43, "class", "card card-statistic-1");
    			set_style(div43, "box-shadow", "none");
    			set_style(div43, "background-color", "transparent");
    			set_style(div43, "border-radius", "0");
    			set_style(div43, "border-color", "transparent");
    			set_style(div43, "position", "relative");
    			set_style(div43, "margin-bottom", "0");
    			add_location(div43, file, 141, 16, 6915);
    			attr_dev(div44, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div44, file, 140, 12, 6850);
    			attr_dev(div45, "class", "row");
    			set_style(div45, "background-color", "#fff");
    			set_style(div45, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			add_location(div45, file, 98, 8, 4495);
    			if (img6.src !== (img6_src_value = "./assets/img/cha-img3.svg")) attr_dev(img6, "src", img6_src_value);
    			set_style(img6, "width", "150px");
    			set_style(img6, "margin-bottom", "20px");
    			add_location(img6, file, 179, 12, 9058);
    			attr_dev(div46, "class", "line-grey");
    			add_location(div46, file, 178, 12, 9021);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "cbox1");
    			input.value = "first_checkbox";
    			add_location(input, file, 181, 15, 9174);
    			add_location(p7, file, 181, 12, 9171);
    			set_style(div47, "text-align", "center");
    			set_style(div47, "margin", "0px auto");
    			set_style(div47, "padding", "20px");
    			add_location(div47, file, 177, 12, 8942);
    			set_style(div48, "margin", "0px auto");
    			set_style(div48, "background-color", "#fff");
    			set_style(div48, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			set_style(div48, "width", "300px");
    			add_location(div48, file, 176, 12, 8819);
    			attr_dev(div49, "class", "row");
    			set_style(div49, "text-align", "center");
    			set_style(div49, "padding", "50px");
    			add_location(div49, file, 175, 8, 8746);
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
    	let div10;
    	let div0;
    	let t0;
    	let nav;
    	let ul0;
    	let div1;
    	let a0;
    	let t2;
    	let a1;
    	let i;
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
    	let div6;
    	let t35;
    	let footer;
    	let div8;
    	let t36;
    	let div7;
    	let t37;
    	let a9;
    	let t39;
    	let div9;
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
    			i = element("i");
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			strong = element("strong");
    			strong.textContent = "Balance";
    			t5 = text(" 5900.0000 ETH");
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
    			li5 = element("li");
    			a6 = element("a");
    			img6 = element("img");
    			t22 = space();
    			span4 = element("span");
    			span4.textContent = "ADDRESS BOOK";
    			t24 = space();
    			li6 = element("li");
    			t25 = text("SETTINGS\r\n                    ");
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
    			t30 = text("APP\r\n                    ");
    			img9 = element("img");
    			t31 = space();
    			li9 = element("li");
    			a8 = element("a");
    			img10 = element("img");
    			t32 = space();
    			span6 = element("span");
    			span6.textContent = "CHANGELLY";
    			t34 = space();
    			div6 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t35 = space();
    			footer = element("footer");
    			div8 = element("div");
    			t36 = text("Copyright © 2020\r\n            ");
    			div7 = element("div");
    			t37 = space();
    			a9 = element("a");
    			a9.textContent = "Matrix Coin";
    			t39 = space();
    			div9 = element("div");
    			attr_dev(div0, "class", "navbar-bg line-grey");
    			add_location(div0, file$1, 6, 4, 156);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "sidebar-gone-hide w-100");
    			add_location(a0, file$1, 11, 16, 398);
    			attr_dev(i, "class", "fas fa-bars");
    			add_location(i, file$1, 12, 85, 544);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "nav-link sidebar-gone-show");
    			attr_dev(a1, "data-toggle", "sidebar");
    			add_location(a1, file$1, 12, 16, 475);
    			attr_dev(div1, "class", "navbar-brand");
    			add_location(div1, file$1, 10, 12, 354);
    			attr_dev(ul0, "class", "navbar-nav mr-auto");
    			add_location(ul0, file$1, 9, 8, 309);
    			add_location(strong, file$1, 18, 16, 724);
    			add_location(div2, file$1, 17, 12, 701);
    			attr_dev(div3, "class", "nav navbar-nav navbar-right");
    			add_location(div3, file$1, 16, 8, 646);
    			attr_dev(nav, "class", "navbar navbar-expand-lg main-navbar");
    			set_style(nav, "height", "45px");
    			add_location(nav, file$1, 8, 4, 228);
    			if (img0.src !== (img0_src_value = "assets/img/1.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "pt-2");
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "width", "100");
    			set_style(img0, "padding-top", "2rem", 1);
    			add_location(img0, file$1, 28, 16, 1094);
    			attr_dev(div4, "class", "sidebar-brand line");
    			add_location(div4, file$1, 27, 12, 1044);
    			if (img1.src !== (img1_src_value = "./assets/img/icons/menu.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "icon-grey");
    			add_location(img1, file$1, 34, 24, 1384);
    			set_style(span0, "font-size", "11px");
    			add_location(span0, file$1, 35, 24, 1467);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "nav-link");
    			add_location(a2, file$1, 33, 20, 1329);
    			add_location(li0, file$1, 32, 16, 1303);
    			if (img2.src !== (img2_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "class", "icon-green");
    			add_location(img2, file$1, 39, 20, 1638);
    			attr_dev(li1, "class", "menu-header line");
    			add_location(li1, file$1, 38, 16, 1581);
    			if (img3.src !== (img3_src_value = "./assets/img/icons/arrow-r.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "class", "icon-grey");
    			add_location(img3, file$1, 42, 24, 1801);
    			set_style(span1, "font-size", "11px");
    			add_location(span1, file$1, 43, 24, 1887);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "nav-link");
    			add_location(a3, file$1, 41, 20, 1746);
    			add_location(li2, file$1, 40, 16, 1720);
    			if (img4.src !== (img4_src_value = "./assets/img/icons/arrow-l.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "class", "icon-grey");
    			add_location(img4, file$1, 48, 24, 2080);
    			set_style(span2, "font-size", "11px");
    			add_location(span2, file$1, 49, 24, 2166);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "nav-link");
    			add_location(a4, file$1, 47, 20, 2025);
    			add_location(li3, file$1, 46, 16, 1999);
    			if (img5.src !== (img5_src_value = "./assets/img/icons/history.svg")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "class", "icon-grey");
    			add_location(img5, file$1, 54, 24, 2356);
    			set_style(span3, "font-size", "11px");
    			add_location(span3, file$1, 55, 24, 2442);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "nav-link");
    			add_location(a5, file$1, 53, 20, 2301);
    			add_location(li4, file$1, 52, 16, 2275);
    			if (img6.src !== (img6_src_value = "./assets/img/icons/book.svg")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "class", "icon-grey");
    			add_location(img6, file$1, 60, 24, 2635);
    			set_style(span4, "font-size", "11px");
    			add_location(span4, file$1, 61, 24, 2718);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "nav-link");
    			add_location(a6, file$1, 59, 20, 2580);
    			add_location(li5, file$1, 58, 16, 2554);
    			if (img7.src !== (img7_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "class", "icon-green");
    			add_location(img7, file$1, 65, 20, 2894);
    			attr_dev(li6, "class", "menu-header line");
    			add_location(li6, file$1, 64, 16, 2835);
    			if (img8.src !== (img8_src_value = "./assets/img/icons/settings.svg")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "class", "icon-grey");
    			add_location(img8, file$1, 68, 24, 3057);
    			set_style(span5, "font-size", "11px");
    			add_location(span5, file$1, 69, 24, 3144);
    			attr_dev(a7, "href", "#");
    			attr_dev(a7, "class", "nav-link");
    			add_location(a7, file$1, 67, 20, 3002);
    			add_location(li7, file$1, 66, 16, 2976);
    			if (img9.src !== (img9_src_value = "./assets/img/icons/arrow.svg")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "class", "icon-green");
    			add_location(img9, file$1, 73, 20, 3311);
    			attr_dev(li8, "class", "menu-header line");
    			add_location(li8, file$1, 72, 16, 3257);
    			if (img10.src !== (img10_src_value = "./assets/img/icons/change.svg")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "class", "icon-grey");
    			add_location(img10, file$1, 76, 24, 3474);
    			set_style(span6, "font-size", "11px");
    			add_location(span6, file$1, 77, 24, 3559);
    			attr_dev(a8, "href", "#");
    			attr_dev(a8, "class", "nav-link");
    			add_location(a8, file$1, 75, 20, 3419);
    			add_location(li9, file$1, 74, 16, 3393);
    			attr_dev(ul1, "class", "sidebar-menu pt-3");
    			add_location(ul1, file$1, 31, 12, 1255);
    			attr_dev(aside, "id", "sidebar-wrapper");
    			add_location(aside, file$1, 25, 8, 977);
    			attr_dev(div5, "class", "main-sidebar sidebar-style-2");
    			set_style(div5, "overflow", "hidden");
    			set_style(div5, "outline", "currentcolor none medium");
    			attr_dev(div5, "tabindex", "1");
    			add_location(div5, file$1, 23, 4, 841);
    			attr_dev(div6, "class", "main-content");
    			set_style(div6, "min-height", "680px");
    			add_location(div6, file$1, 85, 4, 3768);
    			attr_dev(div7, "class", "bullet");
    			add_location(div7, file$1, 91, 12, 3992);
    			attr_dev(a9, "href", "");
    			add_location(a9, file$1, 92, 12, 4032);
    			attr_dev(div8, "class", "footer-left");
    			add_location(div8, file$1, 89, 8, 3923);
    			attr_dev(div9, "class", "footer-right");
    			add_location(div9, file$1, 94, 8, 4084);
    			attr_dev(footer, "class", "main-footer");
    			add_location(footer, file$1, 88, 4, 3885);
    			attr_dev(div10, "class", "main-wrapper main-wrapper-1");
    			add_location(div10, file$1, 4, 0, 80);
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
    			append_dev(a1, i);
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
    			append_dev(ul1, t21);
    			append_dev(ul1, li5);
    			append_dev(li5, a6);
    			append_dev(a6, img6);
    			append_dev(a6, t22);
    			append_dev(a6, span4);
    			append_dev(ul1, t24);
    			append_dev(ul1, li6);
    			append_dev(li6, t25);
    			append_dev(li6, img7);
    			append_dev(ul1, t26);
    			append_dev(ul1, li7);
    			append_dev(li7, a7);
    			append_dev(a7, img8);
    			append_dev(a7, t27);
    			append_dev(a7, span5);
    			append_dev(ul1, t29);
    			append_dev(ul1, li8);
    			append_dev(li8, t30);
    			append_dev(li8, img9);
    			append_dev(ul1, t31);
    			append_dev(ul1, li9);
    			append_dev(li9, a8);
    			append_dev(a8, img10);
    			append_dev(a8, t32);
    			append_dev(a8, span6);
    			append_dev(div10, t34);
    			append_dev(div10, div6);

    			if (switch_instance) {
    				mount_component(switch_instance, div6, null);
    			}

    			append_dev(div10, t35);
    			append_dev(div10, footer);
    			append_dev(footer, div8);
    			append_dev(div8, t36);
    			append_dev(div8, div7);
    			append_dev(div8, t37);
    			append_dev(div8, a9);
    			append_dev(footer, t39);
    			append_dev(footer, div9);
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
    					mount_component(switch_instance, div6, null);
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
    			if (detaching) detach_dev(div10);
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
