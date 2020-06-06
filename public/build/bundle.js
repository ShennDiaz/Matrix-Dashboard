
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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

    /* src\pages\content\changelly.svelte generated by Svelte v3.22.3 */

    const file = "src\\pages\\content\\changelly.svelte";

    function create_fragment(ctx) {
    	let section;
    	let div2;
    	let h1;
    	let t0;
    	let br;
    	let hr;
    	let t1;
    	let div1;
    	let div0;
    	let strong0;
    	let t3;
    	let t4;
    	let div53;
    	let div31;
    	let div13;
    	let div8;
    	let div7;
    	let div3;
    	let img0;
    	let img0_src_value;
    	let t5;
    	let div6;
    	let div4;
    	let h40;
    	let t7;
    	let div5;
    	let p0;
    	let t9;
    	let div12;
    	let div11;
    	let div10;
    	let div9;
    	let p1;
    	let t10;
    	let strong1;
    	let t12;
    	let t13;
    	let div15;
    	let div14;
    	let img1;
    	let img1_src_value;
    	let t14;
    	let div30;
    	let div21;
    	let div20;
    	let div16;
    	let img2;
    	let img2_src_value;
    	let t15;
    	let div19;
    	let div17;
    	let h41;
    	let t17;
    	let div18;
    	let p2;
    	let t19;
    	let div25;
    	let div24;
    	let div23;
    	let div22;
    	let p3;
    	let t21;
    	let div29;
    	let div28;
    	let div27;
    	let div26;
    	let p4;
    	let t23;
    	let div48;
    	let div38;
    	let div37;
    	let div36;
    	let div34;
    	let div32;
    	let h42;
    	let t25;
    	let div33;
    	let p5;
    	let t27;
    	let div35;
    	let img3;
    	let img3_src_value;
    	let t28;
    	let div40;
    	let div39;
    	let img4;
    	let img4_src_value;
    	let t29;
    	let div47;
    	let div46;
    	let div45;
    	let div41;
    	let img5;
    	let img5_src_value;
    	let t30;
    	let div44;
    	let div42;
    	let h43;
    	let t32;
    	let div43;
    	let p6;
    	let t34;
    	let div52;
    	let div51;
    	let div50;
    	let div49;
    	let img6;
    	let img6_src_value;
    	let t35;
    	let p7;
    	let input;
    	let t36;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div2 = element("div");
    			h1 = element("h1");
    			t0 = text("CHANGELLY\r\n         ");
    			br = element("br");
    			hr = element("hr");
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Balance";
    			t3 = text(" 5900.0000 ETH");
    			t4 = space();
    			div53 = element("div");
    			div31 = element("div");
    			div13 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div3 = element("div");
    			img0 = element("img");
    			t5 = space();
    			div6 = element("div");
    			div4 = element("div");
    			h40 = element("h4");
    			h40.textContent = "ETHEREUM";
    			t7 = space();
    			div5 = element("div");
    			p0 = element("p");
    			p0.textContent = "1 ETH = 1000.000.000 MTX";
    			t9 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			p1 = element("p");
    			t10 = text("Particial Amount (Avalible: ");
    			strong1 = element("strong");
    			strong1.textContent = "5049.0000";
    			t12 = text(" ETH)");
    			t13 = space();
    			div15 = element("div");
    			div14 = element("div");
    			img1 = element("img");
    			t14 = space();
    			div30 = element("div");
    			div21 = element("div");
    			div20 = element("div");
    			div16 = element("div");
    			img2 = element("img");
    			t15 = space();
    			div19 = element("div");
    			div17 = element("div");
    			h41 = element("h4");
    			h41.textContent = "MATRIX COIN";
    			t17 = space();
    			div18 = element("div");
    			p2 = element("p");
    			p2.textContent = "1 MTX = 1000.000.000 ETH";
    			t19 = space();
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			div22 = element("div");
    			p3 = element("p");
    			p3.textContent = "Your MTX Address(destination address)";
    			t21 = space();
    			div29 = element("div");
    			div28 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			p4 = element("p");
    			p4.textContent = "Your MTX Refund Address";
    			t23 = space();
    			div48 = element("div");
    			div38 = element("div");
    			div37 = element("div");
    			div36 = element("div");
    			div34 = element("div");
    			div32 = element("div");
    			h42 = element("h4");
    			h42.textContent = "YOU ARE EXCHANGING";
    			t25 = space();
    			div33 = element("div");
    			p5 = element("p");
    			p5.textContent = "0.0000000000 ETH";
    			t27 = space();
    			div35 = element("div");
    			img3 = element("img");
    			t28 = space();
    			div40 = element("div");
    			div39 = element("div");
    			img4 = element("img");
    			t29 = space();
    			div47 = element("div");
    			div46 = element("div");
    			div45 = element("div");
    			div41 = element("div");
    			img5 = element("img");
    			t30 = space();
    			div44 = element("div");
    			div42 = element("div");
    			h43 = element("h4");
    			h43.textContent = "YOU WILL RECEIVE";
    			t32 = space();
    			div43 = element("div");
    			p6 = element("p");
    			p6.textContent = "0.0000000000 MTX";
    			t34 = space();
    			div52 = element("div");
    			div51 = element("div");
    			div50 = element("div");
    			div49 = element("div");
    			img6 = element("img");
    			t35 = space();
    			p7 = element("p");
    			input = element("input");
    			t36 = text(" I agree to (Changelly) Coins");
    			add_location(br, file, 4, 9, 117);
    			attr_dev(hr, "width", "100%");
    			attr_dev(hr, "align", "center ");
    			set_style(hr, "border-top", "3px solid #06ceab");
    			set_style(hr, "margin-top", "10px");
    			set_style(hr, "margin-bottom", "-20px");
    			add_location(hr, file, 4, 13, 121);
    			add_location(h1, file, 3, 8, 93);
    			add_location(strong0, file, 8, 41, 354);
    			attr_dev(div0, "class", "breadcrumb-item");
    			add_location(div0, file, 8, 12, 325);
    			attr_dev(div1, "class", "section-header-breadcrumb");
    			add_location(div1, file, 7, 8, 272);
    			attr_dev(div2, "class", "section-header line-grey");
    			add_location(div2, file, 2, 4, 45);
    			if (img0.src !== (img0_src_value = "./assets/img/etc.svg")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "height", "70px");
    			set_style(img0, "margin-right", "0");
    			set_style(img0, "margin-left", "10px");
    			add_location(img0, file, 22, 28, 937);
    			attr_dev(div3, "class", "");
    			add_location(div3, file, 21, 24, 893);
    			add_location(h40, file, 27, 32, 1232);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file, 26, 28, 1173);
    			set_style(p0, "font-size", "15px");
    			set_style(p0, "margin", "0px");
    			add_location(p0, file, 30, 32, 1372);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file, 29, 28, 1315);
    			attr_dev(div6, "class", "card-wrap");
    			add_location(div6, file, 25, 24, 1120);
    			attr_dev(div7, "class", "card border-orange");
    			set_style(div7, "flex-direction", "row");
    			add_location(div7, file, 19, 20, 773);
    			attr_dev(div8, "class", "card card-statistic-1");
    			add_location(div8, file, 17, 16, 678);
    			add_location(strong1, file, 43, 60, 2070);
    			set_style(p1, "font-size", "15px");
    			set_style(p1, "margin-top", "0.5rem");
    			set_style(p1, "margin-bottom", "0.5rem");
    			add_location(p1, file, 42, 32, 1937);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file, 41, 28, 1880);
    			attr_dev(div10, "class", "card-wrap");
    			add_location(div10, file, 39, 24, 1788);
    			attr_dev(div11, "class", "card border-grey");
    			set_style(div11, "flex-direction", "row");
    			add_location(div11, file, 38, 20, 1699);
    			attr_dev(div12, "class", "card card-statistic-1");
    			add_location(div12, file, 36, 16, 1604);
    			attr_dev(div13, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div13, file, 15, 12, 588);
    			if (img1.src !== (img1_src_value = "./assets/img/cha-img1.svg")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "height", "350px");
    			add_location(img1, file, 53, 20, 2428);
    			set_style(div14, "text-align", "center");
    			add_location(div14, file, 52, 16, 2373);
    			attr_dev(div15, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			add_location(div15, file, 50, 12, 2283);
    			if (img2.src !== (img2_src_value = "./assets/img/mtx.svg")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "height", "70px");
    			set_style(img2, "margin-right", "0");
    			set_style(img2, "margin-left", "20px");
    			add_location(img2, file, 67, 28, 3099);
    			attr_dev(div16, "class", "");
    			add_location(div16, file, 66, 24, 3055);
    			add_location(h41, file, 72, 32, 3394);
    			attr_dev(div17, "class", "card-header");
    			add_location(div17, file, 71, 28, 3335);
    			set_style(p2, "font-size", "15px");
    			set_style(p2, "margin", "0px");
    			add_location(p2, file, 75, 32, 3537);
    			attr_dev(div18, "class", "card-body");
    			add_location(div18, file, 74, 28, 3480);
    			attr_dev(div19, "class", "card-wrap");
    			add_location(div19, file, 70, 24, 3282);
    			attr_dev(div20, "class", "card border-green");
    			set_style(div20, "flex-direction", "row");
    			add_location(div20, file, 61, 20, 2753);
    			attr_dev(div21, "class", "card card-statistic-1");
    			add_location(div21, file, 59, 16, 2658);
    			set_style(p3, "font-size", "15px");
    			set_style(p3, "margin-top", "0.5rem");
    			set_style(p3, "margin-bottom", "0.5rem");
    			add_location(p3, file, 87, 32, 4102);
    			attr_dev(div22, "class", "card-body");
    			add_location(div22, file, 86, 28, 4045);
    			attr_dev(div23, "class", "card-wrap");
    			add_location(div23, file, 84, 24, 3953);
    			attr_dev(div24, "class", "card border-grey");
    			set_style(div24, "flex-direction", "row");
    			add_location(div24, file, 83, 20, 3864);
    			attr_dev(div25, "class", "card card-statistic-1");
    			add_location(div25, file, 81, 16, 3769);
    			set_style(p4, "font-size", "15px");
    			set_style(p4, "margin-top", "0.5rem");
    			set_style(p4, "margin-bottom", "0.5rem");
    			add_location(p4, file, 100, 32, 4745);
    			attr_dev(div26, "class", "card-body");
    			add_location(div26, file, 99, 28, 4688);
    			attr_dev(div27, "class", "card-wrap");
    			add_location(div27, file, 97, 24, 4596);
    			attr_dev(div28, "class", "card border-grey");
    			set_style(div28, "flex-direction", "row");
    			add_location(div28, file, 96, 20, 4507);
    			attr_dev(div29, "class", "card card-statistic-1");
    			add_location(div29, file, 94, 16, 4412);
    			attr_dev(div30, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div30, file, 57, 12, 2568);
    			attr_dev(div31, "class", "row");
    			add_location(div31, file, 13, 8, 534);
    			add_location(h42, file, 130, 32, 6449);
    			attr_dev(div32, "class", "card-header");
    			set_style(div32, "text-align", "right");
    			add_location(div32, file, 129, 28, 6363);
    			set_style(p5, "font-size", "25px");
    			set_style(p5, "margin", "0px");
    			set_style(p5, "color", "#797979");
    			add_location(p5, file, 133, 32, 6626);
    			attr_dev(div33, "class", "card-body");
    			set_style(div33, "text-align", "right");
    			add_location(div33, file, 132, 28, 6542);
    			attr_dev(div34, "class", "card-wrap");
    			set_style(div34, "margin-top", "10px");
    			add_location(div34, file, 128, 24, 6284);
    			if (img3.src !== (img3_src_value = "./assets/img/etc.svg")) attr_dev(img3, "src", img3_src_value);
    			set_style(img3, "height", "100px");
    			set_style(img3, "margin-right", "0");
    			set_style(img3, "margin-left", "0px");
    			set_style(img3, "float", "right");
    			add_location(img3, file, 139, 28, 6908);
    			attr_dev(div35, "class", "");
    			add_location(div35, file, 138, 24, 6864);
    			attr_dev(div36, "class", "card");
    			set_style(div36, "flex-direction", "row");
    			set_style(div36, "float", "right");
    			set_style(div36, "box-shadow", "none");
    			set_style(div36, "background-color", "transparent");
    			set_style(div36, "border-radius", "0");
    			set_style(div36, "border-color", "transparent");
    			set_style(div36, "position", "relative");
    			set_style(div36, "margin-bottom", "0");
    			add_location(div36, file, 119, 20, 5735);
    			attr_dev(div37, "class", "card card-statistic-1");
    			set_style(div37, "box-shadow", "none");
    			set_style(div37, "background-color", "transparent");
    			set_style(div37, "border-radius", "0");
    			set_style(div37, "border-color", "transparent");
    			set_style(div37, "position", "relative");
    			set_style(div37, "margin-bottom", "0");
    			add_location(div37, file, 112, 16, 5267);
    			attr_dev(div38, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div38, file, 111, 12, 5202);
    			if (img4.src !== (img4_src_value = "./assets/img/cha-img2.svg")) attr_dev(img4, "src", img4_src_value);
    			set_style(img4, "height", "50px");
    			set_style(img4, "margin-top", "10%");
    			add_location(img4, file, 147, 20, 7271);
    			set_style(div39, "text-align", "center");
    			add_location(div39, file, 146, 16, 7216);
    			attr_dev(div40, "class", "col-lg-2 col-md-5 col-sm-5 col-12");
    			add_location(div40, file, 145, 12, 7151);
    			if (img5.src !== (img5_src_value = "./assets/img/mtx.svg")) attr_dev(img5, "src", img5_src_value);
    			set_style(img5, "height", "100px");
    			set_style(img5, "margin-right", "0");
    			set_style(img5, "margin-left", "10px");
    			add_location(img5, file, 168, 28, 8527);
    			attr_dev(div41, "class", "");
    			add_location(div41, file, 167, 24, 8483);
    			add_location(h43, file, 173, 32, 8849);
    			attr_dev(div42, "class", "card-header");
    			add_location(div42, file, 172, 28, 8790);
    			set_style(p6, "font-size", "20px");
    			set_style(p6, "margin", "0px");
    			set_style(p6, "color", "#797979");
    			add_location(p6, file, 176, 32, 8997);
    			attr_dev(div43, "class", "card-body");
    			add_location(div43, file, 175, 28, 8940);
    			attr_dev(div44, "class", "card-wrap");
    			set_style(div44, "margin-top", "10px");
    			add_location(div44, file, 171, 24, 8711);
    			attr_dev(div45, "class", "card");
    			set_style(div45, "flex-direction", "row");
    			set_style(div45, "float", "left");
    			set_style(div45, "box-shadow", "none");
    			set_style(div45, "background-color", "transparent");
    			set_style(div45, "border-radius", "0");
    			set_style(div45, "border-color", "transparent");
    			set_style(div45, "position", "relative");
    			set_style(div45, "margin-bottom", "0");
    			add_location(div45, file, 159, 20, 7962);
    			attr_dev(div46, "class", "card card-statistic-1");
    			set_style(div46, "box-shadow", "none");
    			set_style(div46, "background-color", "transparent");
    			set_style(div46, "border-radius", "0");
    			set_style(div46, "border-color", "transparent");
    			set_style(div46, "position", "relative");
    			set_style(div46, "margin-bottom", "0");
    			add_location(div46, file, 152, 16, 7494);
    			attr_dev(div47, "class", "col-lg-5 col-md-5 col-sm-5 col-12");
    			add_location(div47, file, 151, 12, 7429);
    			attr_dev(div48, "class", "row");
    			set_style(div48, "background-color", "#fff");
    			set_style(div48, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			add_location(div48, file, 109, 8, 5074);
    			if (img6.src !== (img6_src_value = "./assets/img/cha-img3.svg")) attr_dev(img6, "src", img6_src_value);
    			set_style(img6, "width", "150px");
    			set_style(img6, "margin-bottom", "20px");
    			add_location(img6, file, 190, 12, 9637);
    			attr_dev(div49, "class", "line-grey");
    			add_location(div49, file, 189, 12, 9600);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "cbox1");
    			input.value = "first_checkbox";
    			add_location(input, file, 192, 15, 9753);
    			add_location(p7, file, 192, 12, 9750);
    			set_style(div50, "text-align", "center");
    			set_style(div50, "margin", "0px auto");
    			set_style(div50, "padding", "20px");
    			add_location(div50, file, 188, 12, 9521);
    			set_style(div51, "margin", "0px auto");
    			set_style(div51, "background-color", "#fff");
    			set_style(div51, "box-shadow", "0 4px 8px rgba(0, 0, 0, 0.03)");
    			set_style(div51, "width", "300px");
    			add_location(div51, file, 187, 12, 9398);
    			attr_dev(div52, "class", "row");
    			set_style(div52, "text-align", "center");
    			set_style(div52, "padding", "50px");
    			add_location(div52, file, 186, 8, 9325);
    			attr_dev(div53, "class", "section-body");
    			set_style(div53, "padding-right", "30px");
    			set_style(div53, "padding-left", "30px");
    			add_location(div53, file, 12, 4, 450);
    			attr_dev(section, "class", "section");
    			add_location(section, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div2);
    			append_dev(div2, h1);
    			append_dev(h1, t0);
    			append_dev(h1, br);
    			append_dev(h1, hr);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, strong0);
    			append_dev(div0, t3);
    			append_dev(section, t4);
    			append_dev(section, div53);
    			append_dev(div53, div31);
    			append_dev(div31, div13);
    			append_dev(div13, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div3);
    			append_dev(div3, img0);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, h40);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, p0);
    			append_dev(div13, t9);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, p1);
    			append_dev(p1, t10);
    			append_dev(p1, strong1);
    			append_dev(p1, t12);
    			append_dev(div31, t13);
    			append_dev(div31, div15);
    			append_dev(div15, div14);
    			append_dev(div14, img1);
    			append_dev(div31, t14);
    			append_dev(div31, div30);
    			append_dev(div30, div21);
    			append_dev(div21, div20);
    			append_dev(div20, div16);
    			append_dev(div16, img2);
    			append_dev(div20, t15);
    			append_dev(div20, div19);
    			append_dev(div19, div17);
    			append_dev(div17, h41);
    			append_dev(div19, t17);
    			append_dev(div19, div18);
    			append_dev(div18, p2);
    			append_dev(div30, t19);
    			append_dev(div30, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, p3);
    			append_dev(div30, t21);
    			append_dev(div30, div29);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, p4);
    			append_dev(div53, t23);
    			append_dev(div53, div48);
    			append_dev(div48, div38);
    			append_dev(div38, div37);
    			append_dev(div37, div36);
    			append_dev(div36, div34);
    			append_dev(div34, div32);
    			append_dev(div32, h42);
    			append_dev(div34, t25);
    			append_dev(div34, div33);
    			append_dev(div33, p5);
    			append_dev(div36, t27);
    			append_dev(div36, div35);
    			append_dev(div35, img3);
    			append_dev(div48, t28);
    			append_dev(div48, div40);
    			append_dev(div40, div39);
    			append_dev(div39, img4);
    			append_dev(div48, t29);
    			append_dev(div48, div47);
    			append_dev(div47, div46);
    			append_dev(div46, div45);
    			append_dev(div45, div41);
    			append_dev(div41, img5);
    			append_dev(div45, t30);
    			append_dev(div45, div44);
    			append_dev(div44, div42);
    			append_dev(div42, h43);
    			append_dev(div44, t32);
    			append_dev(div44, div43);
    			append_dev(div43, p6);
    			append_dev(div53, t34);
    			append_dev(div53, div52);
    			append_dev(div52, div51);
    			append_dev(div51, div50);
    			append_dev(div50, div49);
    			append_dev(div49, img6);
    			append_dev(div50, t35);
    			append_dev(div50, p7);
    			append_dev(p7, input);
    			append_dev(p7, t36);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Changelly> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Changelly", $$slots, []);
    	return [];
    }

    class Changelly extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Changelly",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new Changelly({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
