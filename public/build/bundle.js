
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
            set_current_component(null);
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
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const showMessage = writable({show: false, message: "", type: ""});
    const invoices = writable([]);
    const selectedInvoice = writable([]);
    const user = writable({});
    const myOrganization = writable({});

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var page = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */
      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           When the port is the default http port 80 for http, or 443 for
           https, internet explorer 11 returns an empty string for loc.port,
           so we need to compare loc.port with an empty string if url.port
           is the default port 80 or 443.
           Also the comparition with `port` is changed from `===` to `==` because
           `port` can be a string sometimes. This only applies to ie11.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || _page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) {
            ctx.routePath = self.path;
            return fn(ctx, next);
          }
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    return page_js;

    })));
    });

    /* src/components/NavBar.svelte generated by Svelte v3.44.2 */
    const file$b = "src/components/NavBar.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (61:0) {:else}
    function create_else_block$1(ctx) {
    	let nav;
    	let div1;
    	let a0;
    	let t0;
    	let t1;
    	let div0;
    	let ul0;
    	let t2;
    	let form;
    	let ul1;
    	let li;
    	let a1;
    	let nav_class_value;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			a0 = element("a");
    			t0 = text(/*brand*/ ctx[1]);
    			t1 = space();
    			div0 = element("div");
    			ul0 = element("ul");
    			t2 = space();
    			form = element("form");
    			ul1 = element("ul");
    			li = element("li");
    			a1 = element("a");
    			a1.textContent = "Login";
    			attr_dev(a0, "class", "navbar-brand");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$b, 63, 6, 2007);
    			attr_dev(ul0, "class", "navbar-nav me-auto");
    			add_location(ul0, file$b, 66, 8, 2127);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$b, 71, 14, 2293);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$b, 70, 12, 2257);
    			attr_dev(ul1, "class", "navbar-nav me-auto");
    			add_location(ul1, file$b, 69, 10, 2213);
    			attr_dev(form, "class", "d-flex");
    			add_location(form, file$b, 68, 8, 2181);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarColor01");
    			add_location(div0, file$b, 65, 6, 2061);
    			attr_dev(div1, "class", "container-fluid");
    			add_location(div1, file$b, 62, 4, 1971);
    			attr_dev(nav, "id", "logged_in_nav");
    			attr_dev(nav, "class", nav_class_value = "navbar navbar-expand-lg navbar-" + (/*bgColour*/ ctx[0] == 'secondary' ? 'light' : 'dark') + " bg-" + /*bgColour*/ ctx[0]);
    			add_location(nav, file$b, 61, 0, 1844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, a0);
    			append_dev(a0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ul0);
    			append_dev(div0, t2);
    			append_dev(div0, form);
    			append_dev(form, ul1);
    			append_dev(ul1, li);
    			append_dev(li, a1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*brand*/ 2) set_data_dev(t0, /*brand*/ ctx[1]);

    			if (dirty & /*bgColour*/ 1 && nav_class_value !== (nav_class_value = "navbar navbar-expand-lg navbar-" + (/*bgColour*/ ctx[0] == 'secondary' ? 'light' : 'dark') + " bg-" + /*bgColour*/ ctx[0])) {
    				attr_dev(nav, "class", nav_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(61:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:0) {#if user_value && user_value.username}
    function create_if_block$3(ctx) {
    	let nav;
    	let div1;
    	let a0;

    	let t0_value = (/*user_value*/ ctx[2].Organization.organization_name
    	? /*user_value*/ ctx[2].Organization.organization_name
    	: /*brand*/ ctx[1]) + "";

    	let t0;
    	let t1;
    	let div0;
    	let ul0;
    	let t2;
    	let form;
    	let ul1;
    	let li;
    	let a1;
    	let nav_class_value;
    	let mounted;
    	let dispose;
    	let each_value = /*navLinks*/ ctx[3][/*user_value*/ ctx[2].user_level];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			form = element("form");
    			ul1 = element("ul");
    			li = element("li");
    			a1 = element("a");
    			a1.textContent = "Logout";
    			attr_dev(a0, "class", "navbar-brand");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$b, 38, 4, 1146);
    			attr_dev(ul0, "class", "navbar-nav me-auto");
    			add_location(ul0, file$b, 41, 6, 1347);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$b, 52, 12, 1692);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$b, 51, 10, 1658);
    			attr_dev(ul1, "class", "navbar-nav me-auto");
    			add_location(ul1, file$b, 50, 8, 1616);
    			attr_dev(form, "class", "d-flex");
    			add_location(form, file$b, 49, 6, 1586);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarColor01");
    			add_location(div0, file$b, 40, 4, 1283);
    			attr_dev(div1, "class", "container-fluid");
    			add_location(div1, file$b, 37, 2, 1112);
    			attr_dev(nav, "id", "logged_out_nav");
    			attr_dev(nav, "class", nav_class_value = "navbar navbar-expand-lg navbar-" + (/*bgColour*/ ctx[0] == 'secondary' ? 'light' : 'dark') + " bg-" + /*bgColour*/ ctx[0]);
    			add_location(nav, file$b, 36, 0, 986);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, a0);
    			append_dev(a0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, ul0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}

    			append_dev(div0, t2);
    			append_dev(div0, form);
    			append_dev(form, ul1);
    			append_dev(ul1, li);
    			append_dev(li, a1);

    			if (!mounted) {
    				dispose = listen_dev(a1, "click", /*logout*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user_value, brand*/ 6 && t0_value !== (t0_value = (/*user_value*/ ctx[2].Organization.organization_name
    			? /*user_value*/ ctx[2].Organization.organization_name
    			: /*brand*/ ctx[1]) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*navLinks, user_value*/ 12) {
    				each_value = /*navLinks*/ ctx[3][/*user_value*/ ctx[2].user_level];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*bgColour*/ 1 && nav_class_value !== (nav_class_value = "navbar navbar-expand-lg navbar-" + (/*bgColour*/ ctx[0] == 'secondary' ? 'light' : 'dark') + " bg-" + /*bgColour*/ ctx[0])) {
    				attr_dev(nav, "class", nav_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(36:0) {#if user_value && user_value.username}",
    		ctx
    	});

    	return block;
    }

    // (43:8) {#each navLinks[user_value.user_level] as nav}
    function create_each_block$5(ctx) {
    	let li;
    	let a;
    	let t0_value = /*nav*/ ctx[5].name + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "class", "nav-link");
    			attr_dev(a, "href", a_href_value = /*nav*/ ctx[5].link);
    			add_location(a, file$b, 44, 10, 1474);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$b, 43, 8, 1442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user_value*/ 4 && t0_value !== (t0_value = /*nav*/ ctx[5].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*user_value*/ 4 && a_href_value !== (a_href_value = /*nav*/ ctx[5].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(43:8) {#each navLinks[user_value.user_level] as nav}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*user_value*/ ctx[2] && /*user_value*/ ctx[2].username) return create_if_block$3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavBar', slots, []);
    	let { bgColour = 'primary' } = $$props;
    	let { brand = 'Home' } = $$props;

    	//Nav links based on user level
    	let navLinks = {
    		1: [
    			{
    				name: 'Organizations',
    				link: '/organizations'
    			},
    			{ name: 'Invoices', link: '/invoices' },
    			{
    				name: 'My Organization',
    				link: '/organization'
    			},
    			{
    				name: 'Organization Users',
    				link: '/organization-users'
    			}
    		],
    		2: [
    			{ name: 'Invoices', link: '/invoices' },
    			{
    				name: 'My Organization',
    				link: '/organization'
    			},
    			{
    				name: 'Organization Users',
    				link: '/organization-users'
    			}
    		],
    		3: [{ name: 'Invoices', link: '/invoices' }]
    	};

    	let user_value;

    	user.subscribe(value => {
    		$$invalidate(2, user_value = value);
    	});

    	function logout() {
    		user.update(user => ({}));
    		localStorage.removeItem("app_user");
    		page.redirect("/");
    	}

    	const writable_props = ['bgColour', 'brand'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('bgColour' in $$props) $$invalidate(0, bgColour = $$props.bgColour);
    		if ('brand' in $$props) $$invalidate(1, brand = $$props.brand);
    	};

    	$$self.$capture_state = () => ({
    		bgColour,
    		brand,
    		user,
    		router: page,
    		navLinks,
    		user_value,
    		logout
    	});

    	$$self.$inject_state = $$props => {
    		if ('bgColour' in $$props) $$invalidate(0, bgColour = $$props.bgColour);
    		if ('brand' in $$props) $$invalidate(1, brand = $$props.brand);
    		if ('navLinks' in $$props) $$invalidate(3, navLinks = $$props.navLinks);
    		if ('user_value' in $$props) $$invalidate(2, user_value = $$props.user_value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bgColour, brand, user_value, navLinks, logout];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { bgColour: 0, brand: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get bgColour() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColour(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get brand() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set brand(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/partials/Alerts.svelte generated by Svelte v3.44.2 */
    const file$a = "src/components/partials/Alerts.svelte";

    // (18:0) {#if showMessage_value.show}
    function create_if_block$2(ctx) {
    	let div;
    	let button;
    	let t0;
    	let h4;
    	let t1_value = /*showMessage_value*/ ctx[0].type + "";
    	let t1;
    	let t2;
    	let t3;
    	let p;
    	let t4_value = /*showMessage_value*/ ctx[0].message + "";
    	let t4;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t0 = space();
    			h4 = element("h4");
    			t1 = text(t1_value);
    			t2 = text("!");
    			t3 = space();
    			p = element("p");
    			t4 = text(t4_value);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn-close");
    			attr_dev(button, "data-bs-dismiss", "alert");
    			add_location(button, file$a, 19, 4, 565);
    			attr_dev(h4, "class", "alert-heading");
    			add_location(h4, file$a, 20, 4, 643);
    			attr_dev(p, "class", "mb-0");
    			add_location(p, file$a, 21, 4, 704);
    			attr_dev(div, "class", div_class_value = "alert alert-dismissible alert-" + /*showMessage_value*/ ctx[0].alert_type.toLowerCase());
    			add_location(div, file$a, 18, 0, 472);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(div, t0);
    			append_dev(div, h4);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			append_dev(div, t3);
    			append_dev(div, p);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*showMessage_value*/ 1 && t1_value !== (t1_value = /*showMessage_value*/ ctx[0].type + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*showMessage_value*/ 1 && t4_value !== (t4_value = /*showMessage_value*/ ctx[0].message + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*showMessage_value*/ 1 && div_class_value !== (div_class_value = "alert alert-dismissible alert-" + /*showMessage_value*/ ctx[0].alert_type.toLowerCase())) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(18:0) {#if showMessage_value.show}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let if_block = /*showMessage_value*/ ctx[0].show && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showMessage_value*/ ctx[0].show) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Alerts', slots, []);
    	let showMessage_value;

    	showMessage.subscribe(value => {
    		$$invalidate(0, showMessage_value = value);

    		if (showMessage_value.show === true) {
    			window.scrollTo(0, 0);
    			setTimeout(hideMessage, 20000);
    		}
    	});

    	function hideMessage() {
    		showMessage.update(newValue => ({
    			show: false,
    			message: "",
    			type: "",
    			header: ""
    		}));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Alerts> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		showMessage,
    		showMessage_value,
    		hideMessage
    	});

    	$$self.$inject_state = $$props => {
    		if ('showMessage_value' in $$props) $$invalidate(0, showMessage_value = $$props.showMessage_value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showMessage_value];
    }

    class Alerts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alerts",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    function CheckNoUser(ctx, next) {
        let user_value;
        user.subscribe(value => {
    	  	user_value = value;
      	});

        if(user_value && user_value.username) {
            next();
        } else {
            page.redirect("/");
        }    
    }

    function CheckForUser(ctx, next){
        let user_value;
        user.subscribe(value => {
    	  	user_value = value;
      	});

        if(user_value && user_value.username) {
            page.redirect("/home");
        } else {
            next();
        }    
    }

    /* src/components/About.svelte generated by Svelte v3.44.2 */

    const file$9 = "src/components/About.svelte";

    function create_fragment$9(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "About";
    			add_location(h1, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios$1 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$1.Axios = Axios_1;

    // Factory for creating new instances
    axios$1.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios$1.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios$1.Cancel = Cancel_1;
    axios$1.CancelToken = CancelToken_1;
    axios$1.isCancel = isCancel;

    // Expose all/spread
    axios$1.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$1.spread = spread;

    // Expose isAxiosError
    axios$1.isAxiosError = isAxiosError;

    var axios_1 = axios$1;

    // Allow use of default import syntax in TypeScript
    var _default = axios$1;
    axios_1.default = _default;

    var axios = axios_1;

    const baseURL = "http://localhost:3000";
    const APIService = {
        get: async function(route, params) {
            let data = {};
            let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")};
            await axios.get(`${baseURL}${route}`, {
                params: params,
                headers: headers
              })
              .then(function (response) {
                data = response.data;
              })
              .catch(function (error) {
                console.log(error);
              })
              .then(function () {
                // always executed
              });
            return data
        }, 
        post: async function(route, body) {
          let data = {};
          let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")};
          await axios.post(`${baseURL}${route}`, body, {headers})
          .then(function (response) {
            data = response;
          })
          .catch(function (error) {
            console.log(error);
          });
          return data
        },
        put: async function(route, body) {
          let data = {};
          let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")};
          await axios.put(`${baseURL}${route}`, body, {headers})
          .then(function (response) {
            data = response;
          })
          .catch(function (error) {
            console.log(error);
          });
          return data
        },
        delete: async function(route, params) {
          let data = {};
          let headers = {"Authorization": "Bearer " + localStorage.getItem("app_token")};
          await axios.delete(`${baseURL}${route}`, 
          {
            headers: headers,
            params: params
          })
          .then(function (response) {
            data = response;
          })
          .catch(function (error) {
            console.log(error);
          });
          return data
        }
    };

    /* src/components/Home.svelte generated by Svelte v3.44.2 */

    const { console: console_1$5 } = globals;
    const file$8 = "src/components/Home.svelte";

    function create_fragment$8(ctx) {
    	let h1;
    	let t0;
    	let t1_value = /*user_value*/ ctx[0].username + "";
    	let t1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Welcome ");
    			t1 = text(t1_value);
    			add_location(h1, file$8, 11, 0, 220);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*user_value*/ 1 && t1_value !== (t1_value = /*user_value*/ ctx[0].username + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let user_value;

    	user.subscribe(value => {
    		$$invalidate(0, user_value = value);
    		console.log(user_value);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$5.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ APIService, user, user_value });

    	$$self.$inject_state = $$props => {
    		if ('user_value' in $$props) $$invalidate(0, user_value = $$props.user_value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user_value];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/404.svelte generated by Svelte v3.44.2 */

    const file$7 = "src/components/404.svelte";

    function create_fragment$7(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "404 Page not found";
    			add_location(h1, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('_404', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<_404> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class _404 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "_404",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Login.svelte generated by Svelte v3.44.2 */

    const { console: console_1$4 } = globals;
    const file$6 = "src/components/Login.svelte";

    function create_fragment$6(ctx) {
    	let div2;
    	let p;
    	let t0;
    	let p_hidden_value;
    	let t1;
    	let form;
    	let fieldset;
    	let h3;
    	let t3;
    	let div0;
    	let label0;
    	let t5;
    	let input0;
    	let t6;
    	let div1;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			p = element("p");
    			t0 = text(/*loginMessage*/ ctx[1]);
    			t1 = space();
    			form = element("form");
    			fieldset = element("fieldset");
    			h3 = element("h3");
    			h3.textContent = "Login form";
    			t3 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Username";
    			t5 = space();
    			input0 = element("input");
    			t6 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Password";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			p.hidden = p_hidden_value = !/*showMessage*/ ctx[0];
    			add_location(p, file$6, 46, 4, 1422);
    			attr_dev(h3, "class", "text-center text-white pt-5");
    			add_location(h3, file$6, 49, 12, 1510);
    			attr_dev(label0, "for", "exampleInputEmail1");
    			attr_dev(label0, "class", "form-label mt-4");
    			add_location(label0, file$6, 51, 16, 1619);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "userInput");
    			attr_dev(input0, "placeholder", "Enter Username");
    			add_location(input0, file$6, 52, 16, 1708);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$6, 50, 12, 1578);
    			attr_dev(label1, "for", "exampleInputPassword1");
    			attr_dev(label1, "class", "form-label mt-4");
    			add_location(label1, file$6, 55, 16, 1887);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "passwordInput");
    			attr_dev(input1, "placeholder", "Password");
    			add_location(input1, file$6, 56, 16, 1979);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$6, 54, 12, 1846);
    			add_location(fieldset, file$6, 48, 8, 1487);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary mt-3");
    			add_location(button, file$6, 59, 8, 2135);
    			add_location(form, file$6, 47, 4, 1472);
    			attr_dev(div2, "class", "login-container svelte-1yt4807");
    			add_location(div2, file$6, 45, 0, 1388);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, p);
    			append_dev(p, t0);
    			append_dev(div2, t1);
    			append_dev(div2, form);
    			append_dev(form, fieldset);
    			append_dev(fieldset, h3);
    			append_dev(fieldset, t3);
    			append_dev(fieldset, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t5);
    			append_dev(div0, input0);
    			set_input_value(input0, /*username*/ ctx[2]);
    			append_dev(fieldset, t6);
    			append_dev(fieldset, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			set_input_value(input1, /*password*/ ctx[3]);
    			append_dev(form, t9);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(button, "click", prevent_default(/*handleLoginClick*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*loginMessage*/ 2) set_data_dev(t0, /*loginMessage*/ ctx[1]);

    			if (dirty & /*showMessage*/ 1 && p_hidden_value !== (p_hidden_value = !/*showMessage*/ ctx[0])) {
    				prop_dev(p, "hidden", p_hidden_value);
    			}

    			if (dirty & /*username*/ 4 && input0.value !== /*username*/ ctx[2]) {
    				set_input_value(input0, /*username*/ ctx[2]);
    			}

    			if (dirty & /*password*/ 8 && input1.value !== /*password*/ ctx[3]) {
    				set_input_value(input1, /*password*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let user_value;

    	user.subscribe(value => {
    		user_value = value;
    	});

    	let showMessage = false;
    	let loginMessage = "";
    	let username;
    	let password;

    	async function handleLoginClick(e) {
    		let loginSuccess = false;

    		if (username && password) {
    			let response = await APIService.post("/api/user/login", { username, password, type: "creds" });

    			if (response.status && response.status === 200) {
    				let data = response.data;
    				console.log(response.data);

    				if (data.status === "success") {
    					loginSuccess = true;
    				} else {
    					loginSuccess = false;
    				}

    				if (loginSuccess) {
    					user.update(user => data.data.user);
    					localStorage.setItem("app_user", JSON.stringify(user_value));
    					localStorage.setItem("app_token", data.data.token);
    					page.redirect("/home");
    				} else {
    					$$invalidate(0, showMessage = true);
    					$$invalidate(1, loginMessage = "Log in Failed");
    				}
    			}
    		}

    		return loginSuccess;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(2, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(3, password);
    	}

    	$$self.$capture_state = () => ({
    		APIService,
    		user,
    		router: page,
    		user_value,
    		showMessage,
    		loginMessage,
    		username,
    		password,
    		handleLoginClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('user_value' in $$props) user_value = $$props.user_value;
    		if ('showMessage' in $$props) $$invalidate(0, showMessage = $$props.showMessage);
    		if ('loginMessage' in $$props) $$invalidate(1, loginMessage = $$props.loginMessage);
    		if ('username' in $$props) $$invalidate(2, username = $$props.username);
    		if ('password' in $$props) $$invalidate(3, password = $$props.password);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showMessage,
    		loginMessage,
    		username,
    		password,
    		handleLoginClick,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    function ShowMessage(response, successMessage) {
        let alert_type = response.data.status === "success" ? "success" : "danger";
        let type = response.data.status === "success" ? "Success" : "Error";
        let message = response.data.status === "success" ? successMessage : `${response.data.data}`;
        showMessage.update(newValue => ({show: true, message: message, alert_type: alert_type, type: type}));
    }

    const OrganizationService = {
        get: async function(id) {
            let response = await APIService.get("/api/organization", {type: "one", id: id});
            return (response.data)
        },
        getMany: async function () {
            let response = await APIService.get("/api/organization", {type: "many"});
            return (response.data)
        },
        getOrgUsers: async function (org_id) {
            let response = await APIService.get("/api/organization", {type: "org_users", org_id: org_id});
            return (response.data)
        },
        update: async function(data) {
            let response = await APIService.put("/api/organization", {data: data});
            ShowMessage(response, "Your Organization has been updated");
            return response.data
        },
        createOAUTH: async function(data) {
            let response = await APIService.post("/api/zoho", {data: data});
            ShowMessage(response, "Auth Created");
            return response.data
        }, 
        getInvoices: async function(id) {
            let response = await APIService.get("/api/zoho/invoices", {"org_id": id});
            return response.data
        },
        getBooksAccounts: async function(org_id) {
            let response = await APIService.get("/api/organization/books/account", {"org_id": org_id, type: "many"});
            return response.data
        },
        addBooksAccount: async function (books_account_code, org_id) {
            let response = await APIService.post("/api/organization/books/account", {data: {books_account_code: books_account_code, org_id: org_id}});
            ShowMessage(response, "Your Books Account has been added");
            return response.data
        },
        removeBooksAccount: async function (books_account_code, org_id) {
            let response = await APIService.delete("/api/organization/books/account", {books_account_code: books_account_code, org_id: org_id});
            ShowMessage(response,"Your Books Account has been removed");
            return response.data
        }, 
        addOrgUser: async function (data) {
            let response = await APIService.post("/api/user", {data: data});
            ShowMessage(response, "Organization User has been added");
            return response.data
        }
        
    };

    /* src/components/MyOrganization.svelte generated by Svelte v3.44.2 */

    const { console: console_1$3 } = globals;
    const file$5 = "src/components/MyOrganization.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (141:10) {:else}
    function create_else_block(ctx) {
    	let h5;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "No books accounts added";
    			add_location(h5, file$5, 141, 10, 6263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(141:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:8) {#if booksAccounts.length > 0}
    function create_if_block$1(ctx) {
    	let h5;
    	let t1;
    	let each_1_anchor;
    	let each_value = /*booksAccounts*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "Account Code";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h5, file$5, 129, 10, 5803);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*clickDeleteBooksAccount, booksAccounts*/ 132) {
    				each_value = /*booksAccounts*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(129:8) {#if booksAccounts.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (131:10) {#each booksAccounts as account}
    function create_each_block$4(ctx) {
    	let div2;
    	let div0;
    	let p;
    	let t0_value = /*account*/ ctx[15].books_account_code + "";
    	let t0;
    	let t1;
    	let div1;
    	let a;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			a = element("a");
    			a.textContent = "X";
    			t3 = space();
    			attr_dev(p, "class", "text-success");
    			add_location(p, file$5, 133, 16, 5949);
    			attr_dev(div0, "class", "col-sm");
    			add_location(div0, file$5, 132, 14, 5912);
    			attr_dev(a, "href", "/");
    			add_location(a, file$5, 136, 16, 6079);
    			attr_dev(div1, "class", "col-sm");
    			add_location(div1, file$5, 135, 14, 6042);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$5, 131, 12, 5880);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, a);
    			append_dev(div2, t3);

    			if (!mounted) {
    				dispose = listen_dev(
    					a,
    					"click",
    					prevent_default(function () {
    						if (is_function(/*clickDeleteBooksAccount*/ ctx[7](/*account*/ ctx[15].books_account_code))) /*clickDeleteBooksAccount*/ ctx[7](/*account*/ ctx[15].books_account_code).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*booksAccounts*/ 4 && t0_value !== (t0_value = /*account*/ ctx[15].books_account_code + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(131:10) {#each booksAccounts as account}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div6;
    	let div0;
    	let h40;
    	let t0_value = /*myOrganization_value*/ ctx[0].organization_name + "";
    	let t0;
    	let t1;
    	let div5;
    	let div4;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let input0_placeholder_value;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let input1_placeholder_value;
    	let t7;
    	let div3;
    	let label2;
    	let t9;
    	let input2;
    	let input2_placeholder_value;
    	let t10;
    	let button0;
    	let t12;
    	let button1;
    	let t14;
    	let p;
    	let t15;
    	let p_hidden_value;
    	let t16;
    	let div13;
    	let div12;
    	let div11;
    	let div7;
    	let h5;
    	let t18;
    	let button2;
    	let span;
    	let t19;
    	let div9;
    	let div8;
    	let label3;
    	let t21;
    	let input3;
    	let t22;
    	let div10;
    	let button3;
    	let t23;
    	let button3_disabled_value;
    	let t24;
    	let div19;
    	let div14;
    	let h41;
    	let t26;
    	let div18;
    	let div17;
    	let div15;
    	let label4;
    	let t28;
    	let input4;
    	let t29;
    	let div16;
    	let label5;
    	let t31;
    	let input5;
    	let t32;
    	let button4;
    	let t34;
    	let div24;
    	let div20;
    	let h42;
    	let t36;
    	let div23;
    	let div22;
    	let div21;
    	let label6;
    	let t38;
    	let input6;
    	let t39;
    	let button5;
    	let t41;
    	let br;
    	let t42;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*booksAccounts*/ ctx[2].length > 0) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Zoho ID";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Client ID";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Client Secret";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Update";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Generate AUTH";
    			t14 = space();
    			p = element("p");
    			t15 = text("Zoho Auth has been setup");
    			t16 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div7 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Generate Zoho Code";
    			t18 = space();
    			button2 = element("button");
    			span = element("span");
    			t19 = space();
    			div9 = element("div");
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Generated Code";
    			t21 = space();
    			input3 = element("input");
    			t22 = space();
    			div10 = element("div");
    			button3 = element("button");
    			t23 = text("Generate");
    			t24 = space();
    			div19 = element("div");
    			div14 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Zoho Details";
    			t26 = space();
    			div18 = element("div");
    			div17 = element("div");
    			div15 = element("div");
    			label4 = element("label");
    			label4.textContent = "Invoice Custom Field";
    			t28 = space();
    			input4 = element("input");
    			t29 = space();
    			div16 = element("div");
    			label5 = element("label");
    			label5.textContent = "Deferral Accounts";
    			t31 = space();
    			input5 = element("input");
    			t32 = space();
    			button4 = element("button");
    			button4.textContent = "Update";
    			t34 = space();
    			div24 = element("div");
    			div20 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Bank Accounts";
    			t36 = space();
    			div23 = element("div");
    			div22 = element("div");
    			div21 = element("div");
    			label6 = element("label");
    			label6.textContent = "New Bank Account";
    			t38 = space();
    			input6 = element("input");
    			t39 = space();
    			button5 = element("button");
    			button5.textContent = "Add";
    			t41 = space();
    			br = element("br");
    			t42 = space();
    			if_block.c();
    			add_location(h40, file$5, 57, 29, 1878);
    			attr_dev(div0, "class", "card-header");
    			add_location(div0, file$5, 57, 4, 1853);
    			attr_dev(label0, "for", "exampleInputPassword1");
    			attr_dev(label0, "class", "form-label mt-4");
    			add_location(label0, file$5, 61, 12, 2037);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "exampleInputPassword1");
    			attr_dev(input0, "placeholder", input0_placeholder_value = /*myOrganization_value*/ ctx[0].organization_zoho_id);
    			add_location(input0, file$5, 62, 12, 2124);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$5, 60, 8, 2000);
    			attr_dev(label1, "for", "exampleInputPassword1");
    			attr_dev(label1, "class", "form-label mt-4");
    			add_location(label1, file$5, 65, 12, 2365);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "exampleInputPassword1");
    			attr_dev(input1, "placeholder", input1_placeholder_value = /*myOrganization_value*/ ctx[0].organization_client_id);
    			add_location(input1, file$5, 66, 12, 2454);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$5, 64, 8, 2328);
    			attr_dev(label2, "for", "exampleInputPassword1");
    			attr_dev(label2, "class", "form-label mt-4");
    			add_location(label2, file$5, 69, 12, 2699);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "exampleInputPassword1");
    			attr_dev(input2, "placeholder", input2_placeholder_value = /*myOrganization_value*/ ctx[0].organization_client_secret);
    			add_location(input2, file$5, 70, 12, 2792);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$5, 68, 8, 2662);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-primary mt-3");
    			add_location(button0, file$5, 72, 8, 3008);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-danger mt-3");
    			attr_dev(button1, "data-toggle", "modal");
    			attr_dev(button1, "data-target", "#OAUTHModal");
    			add_location(button1, file$5, 73, 8, 3115);
    			attr_dev(p, "class", "text-success mt-3");
    			p.hidden = p_hidden_value = !/*myOrganization_value*/ ctx[0].zoho_refresh_token;
    			add_location(p, file$5, 74, 8, 3242);
    			attr_dev(div4, "class", "card-text");
    			add_location(div4, file$5, 59, 6, 1968);
    			attr_dev(div5, "class", "card-body");
    			add_location(div5, file$5, 58, 4, 1938);
    			attr_dev(div6, "class", "card border-secondary mb-3 m-auto mt-3");
    			set_style(div6, "max-width", "50vw");
    			add_location(div6, file$5, 56, 0, 1771);
    			attr_dev(h5, "class", "modal-title");
    			add_location(h5, file$5, 83, 10, 3560);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$5, 85, 12, 3711);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn-close");
    			attr_dev(button2, "data-dismiss", "modal");
    			attr_dev(button2, "aria-label", "Close");
    			add_location(button2, file$5, 84, 10, 3618);
    			attr_dev(div7, "class", "modal-header");
    			add_location(div7, file$5, 82, 8, 3523);
    			attr_dev(label3, "for", "exampleInputPassword1");
    			attr_dev(label3, "class", "form-label mt-4");
    			add_location(label3, file$5, 90, 14, 3863);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "id", "zohoGeneratedCode");
    			add_location(input3, file$5, 91, 14, 3959);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$5, 89, 12, 3824);
    			attr_dev(div9, "class", "modal-body");
    			add_location(div9, file$5, 88, 8, 3787);
    			attr_dev(button3, "type", "button");
    			button3.disabled = button3_disabled_value = /*zoho_code*/ ctx[1].length < 10;
    			attr_dev(button3, "class", "btn btn-primary");
    			attr_dev(button3, "data-dismiss", "modal");
    			add_location(button3, file$5, 95, 10, 4126);
    			attr_dev(div10, "class", "modal-footer");
    			add_location(div10, file$5, 94, 8, 4089);
    			attr_dev(div11, "class", "modal-content");
    			add_location(div11, file$5, 81, 6, 3487);
    			attr_dev(div12, "class", "modal-dialog");
    			attr_dev(div12, "role", "document");
    			add_location(div12, file$5, 80, 4, 3438);
    			attr_dev(div13, "class", "modal fade hidden");
    			attr_dev(div13, "id", "OAUTHModal");
    			add_location(div13, file$5, 79, 2, 3386);
    			add_location(h41, file$5, 102, 29, 4449);
    			attr_dev(div14, "class", "card-header");
    			add_location(div14, file$5, 102, 4, 4424);
    			attr_dev(label4, "for", "exampleInputPassword1");
    			attr_dev(label4, "class", "form-label mt-4");
    			add_location(label4, file$5, 106, 10, 4578);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "id", "exampleInputPassword1");
    			add_location(input4, file$5, 107, 10, 4676);
    			attr_dev(div15, "class", "form-group");
    			add_location(div15, file$5, 105, 8, 4543);
    			attr_dev(label5, "for", "exampleInputPassword1");
    			attr_dev(label5, "class", "form-label mt-4");
    			add_location(label5, file$5, 110, 10, 4802);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "class", "form-control");
    			attr_dev(input5, "id", "exampleInputPassword1");
    			add_location(input5, file$5, 111, 10, 4897);
    			attr_dev(div16, "class", "form-group");
    			add_location(div16, file$5, 109, 8, 4767);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "class", "btn btn-primary mt-3");
    			add_location(button4, file$5, 113, 8, 4990);
    			attr_dev(div17, "class", "card-text");
    			add_location(div17, file$5, 104, 6, 4511);
    			attr_dev(div18, "class", "card-body");
    			add_location(div18, file$5, 103, 4, 4481);
    			attr_dev(div19, "class", "card border-secondary mb-3 m-auto mt-3");
    			set_style(div19, "max-width", "50vw");
    			add_location(div19, file$5, 101, 2, 4342);
    			add_location(h42, file$5, 119, 29, 5244);
    			attr_dev(div20, "class", "card-header");
    			add_location(div20, file$5, 119, 4, 5219);
    			attr_dev(label6, "for", "exampleInputPassword1");
    			attr_dev(label6, "class", "form-label mt-4");
    			add_location(label6, file$5, 123, 12, 5376);
    			attr_dev(input6, "type", "text");
    			attr_dev(input6, "class", "form-control");
    			attr_dev(input6, "id", "exampleInputPassword1");
    			attr_dev(input6, "placeholder", "Account Code");
    			add_location(input6, file$5, 124, 12, 5472);
    			attr_dev(button5, "type", "button");
    			attr_dev(button5, "class", "btn btn-primary mt-3");
    			add_location(button5, file$5, 125, 12, 5611);
    			attr_dev(div21, "class", "form-group");
    			add_location(div21, file$5, 122, 8, 5339);
    			add_location(br, file$5, 127, 8, 5747);
    			attr_dev(div22, "class", "card-text");
    			add_location(div22, file$5, 121, 6, 5307);
    			attr_dev(div23, "class", "card-body");
    			add_location(div23, file$5, 120, 4, 5277);
    			attr_dev(div24, "class", "card border-secondary mb-3 m-auto mt-3");
    			set_style(div24, "max-width", "50vw");
    			add_location(div24, file$5, 118, 2, 5137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div0, h40);
    			append_dev(h40, t0);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			set_input_value(input0, /*myOrganization_value*/ ctx[0].organization_zoho_id);
    			append_dev(div4, t4);
    			append_dev(div4, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, input1);
    			set_input_value(input1, /*myOrganization_value*/ ctx[0].organization_client_id);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t9);
    			append_dev(div3, input2);
    			set_input_value(input2, /*myOrganization_value*/ ctx[0].organization_client_secret);
    			append_dev(div4, t10);
    			append_dev(div4, button0);
    			append_dev(div4, t12);
    			append_dev(div4, button1);
    			append_dev(div4, t14);
    			append_dev(div4, p);
    			append_dev(p, t15);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			append_dev(div7, h5);
    			append_dev(div7, t18);
    			append_dev(div7, button2);
    			append_dev(button2, span);
    			append_dev(div11, t19);
    			append_dev(div11, div9);
    			append_dev(div9, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t21);
    			append_dev(div8, input3);
    			set_input_value(input3, /*zoho_code*/ ctx[1]);
    			append_dev(div11, t22);
    			append_dev(div11, div10);
    			append_dev(div10, button3);
    			append_dev(button3, t23);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, div19, anchor);
    			append_dev(div19, div14);
    			append_dev(div14, h41);
    			append_dev(div19, t26);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div15);
    			append_dev(div15, label4);
    			append_dev(div15, t28);
    			append_dev(div15, input4);
    			append_dev(div17, t29);
    			append_dev(div17, div16);
    			append_dev(div16, label5);
    			append_dev(div16, t31);
    			append_dev(div16, input5);
    			append_dev(div17, t32);
    			append_dev(div17, button4);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, div24, anchor);
    			append_dev(div24, div20);
    			append_dev(div20, h42);
    			append_dev(div24, t36);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, label6);
    			append_dev(div21, t38);
    			append_dev(div21, input6);
    			set_input_value(input6, /*booksAccountCode*/ ctx[3]);
    			append_dev(div21, t39);
    			append_dev(div21, button5);
    			append_dev(div22, t41);
    			append_dev(div22, br);
    			append_dev(div22, t42);
    			if_block.m(div22, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    					listen_dev(button0, "click", /*updateOrganization*/ ctx[4], false, false, false),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[11]),
    					listen_dev(button3, "click", prevent_default(/*generateZohoAUTH*/ ctx[5]), false, true, false),
    					listen_dev(button4, "click", /*updateOrganization*/ ctx[4], false, false, false),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[12]),
    					listen_dev(button5, "click", prevent_default(/*clickAddBooksAccount*/ ctx[6]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*myOrganization_value*/ 1 && t0_value !== (t0_value = /*myOrganization_value*/ ctx[0].organization_name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*myOrganization_value*/ 1 && input0_placeholder_value !== (input0_placeholder_value = /*myOrganization_value*/ ctx[0].organization_zoho_id)) {
    				attr_dev(input0, "placeholder", input0_placeholder_value);
    			}

    			if (dirty & /*myOrganization_value*/ 1 && input0.value !== /*myOrganization_value*/ ctx[0].organization_zoho_id) {
    				set_input_value(input0, /*myOrganization_value*/ ctx[0].organization_zoho_id);
    			}

    			if (dirty & /*myOrganization_value*/ 1 && input1_placeholder_value !== (input1_placeholder_value = /*myOrganization_value*/ ctx[0].organization_client_id)) {
    				attr_dev(input1, "placeholder", input1_placeholder_value);
    			}

    			if (dirty & /*myOrganization_value*/ 1 && input1.value !== /*myOrganization_value*/ ctx[0].organization_client_id) {
    				set_input_value(input1, /*myOrganization_value*/ ctx[0].organization_client_id);
    			}

    			if (dirty & /*myOrganization_value*/ 1 && input2_placeholder_value !== (input2_placeholder_value = /*myOrganization_value*/ ctx[0].organization_client_secret)) {
    				attr_dev(input2, "placeholder", input2_placeholder_value);
    			}

    			if (dirty & /*myOrganization_value*/ 1 && input2.value !== /*myOrganization_value*/ ctx[0].organization_client_secret) {
    				set_input_value(input2, /*myOrganization_value*/ ctx[0].organization_client_secret);
    			}

    			if (dirty & /*myOrganization_value*/ 1 && p_hidden_value !== (p_hidden_value = !/*myOrganization_value*/ ctx[0].zoho_refresh_token)) {
    				prop_dev(p, "hidden", p_hidden_value);
    			}

    			if (dirty & /*zoho_code*/ 2 && input3.value !== /*zoho_code*/ ctx[1]) {
    				set_input_value(input3, /*zoho_code*/ ctx[1]);
    			}

    			if (dirty & /*zoho_code*/ 2 && button3_disabled_value !== (button3_disabled_value = /*zoho_code*/ ctx[1].length < 10)) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}

    			if (dirty & /*booksAccountCode*/ 8 && input6.value !== /*booksAccountCode*/ ctx[3]) {
    				set_input_value(input6, /*booksAccountCode*/ ctx[3]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div22, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div13);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(div19);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(div24);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MyOrganization', slots, []);
    	let user_value;

    	user.subscribe(value => {
    		user_value = value;
    	});

    	let myOrganization_value = {};

    	myOrganization.subscribe(value => {
    		$$invalidate(0, myOrganization_value = value);
    	});

    	function updateOrganization() {
    		OrganizationService.update(myOrganization_value);
    	}

    	let zoho_code = "";

    	function generateZohoAUTH() {
    		OrganizationService.createOAUTH({
    			"org_id": myOrganization_value.id,
    			"code": zoho_code
    		});
    	}

    	let booksAccounts = [];

    	async function getBooksAccounts() {
    		console.log("in books account");
    		$$invalidate(2, booksAccounts = await OrganizationService.getBooksAccounts(user_value.OrganizationId));
    		console.log(booksAccounts);
    	}

    	let booksAccountCode = "";

    	async function clickAddBooksAccount() {
    		if (booksAccountCode.length > 1) {
    			let newBooksAccount = await OrganizationService.addBooksAccount(booksAccountCode, user_value.OrganizationId);

    			if (newBooksAccount.data.id) {
    				await getBooksAccounts();
    				console.log(newBooksAccount);
    			}
    		}
    	}

    	async function clickDeleteBooksAccount(booksAccountId) {
    		let deleteBooksAccount = await OrganizationService.removeBooksAccount(booksAccountId, user_value.OrganizationId);

    		if (deleteBooksAccount.data === 1) {
    			await getBooksAccounts();
    			console.log(deleteBooksAccount.data);
    		}
    	}

    	onMount(async () => {
    		let organization = await OrganizationService.get(user_value.OrganizationId);
    		myOrganization.update(org => organization);
    		await getBooksAccounts();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<MyOrganization> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		myOrganization_value.organization_zoho_id = this.value;
    		$$invalidate(0, myOrganization_value);
    	}

    	function input1_input_handler() {
    		myOrganization_value.organization_client_id = this.value;
    		$$invalidate(0, myOrganization_value);
    	}

    	function input2_input_handler() {
    		myOrganization_value.organization_client_secret = this.value;
    		$$invalidate(0, myOrganization_value);
    	}

    	function input3_input_handler() {
    		zoho_code = this.value;
    		$$invalidate(1, zoho_code);
    	}

    	function input6_input_handler() {
    		booksAccountCode = this.value;
    		$$invalidate(3, booksAccountCode);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		OrganizationService,
    		myOrganization,
    		user,
    		user_value,
    		myOrganization_value,
    		updateOrganization,
    		zoho_code,
    		generateZohoAUTH,
    		booksAccounts,
    		getBooksAccounts,
    		booksAccountCode,
    		clickAddBooksAccount,
    		clickDeleteBooksAccount
    	});

    	$$self.$inject_state = $$props => {
    		if ('user_value' in $$props) user_value = $$props.user_value;
    		if ('myOrganization_value' in $$props) $$invalidate(0, myOrganization_value = $$props.myOrganization_value);
    		if ('zoho_code' in $$props) $$invalidate(1, zoho_code = $$props.zoho_code);
    		if ('booksAccounts' in $$props) $$invalidate(2, booksAccounts = $$props.booksAccounts);
    		if ('booksAccountCode' in $$props) $$invalidate(3, booksAccountCode = $$props.booksAccountCode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		myOrganization_value,
    		zoho_code,
    		booksAccounts,
    		booksAccountCode,
    		updateOrganization,
    		generateZohoAUTH,
    		clickAddBooksAccount,
    		clickDeleteBooksAccount,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input6_input_handler
    	];
    }

    class MyOrganization extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MyOrganization",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Invoices.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1, console: console_1$2 } = globals;
    const file$4 = "src/components/Invoices.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (42:6) {#each headings as heading}
    function create_each_block_1$1(ctx) {
    	let th;
    	let t_value = /*heading*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr_dev(th, "scope", "col");
    			add_location(th, file$4, 42, 8, 1164);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(42:6) {#each headings as heading}",
    		ctx
    	});

    	return block;
    }

    // (48:6) {#each invoices_value as invoice}
    function create_each_block$3(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*invoice*/ ctx[6].invoice_number + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*invoice*/ ctx[6].date + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*invoice*/ ctx[6].customer_name + "";
    	let t4;
    	let t5;
    	let td3;
    	let button;
    	let t6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			button = element("button");
    			t6 = space();
    			add_location(td0, file$4, 49, 8, 1327);
    			add_location(td1, file$4, 50, 8, 1369);
    			add_location(td2, file$4, 51, 8, 1401);
    			add_location(button, file$4, 52, 12, 1446);
    			add_location(td3, file$4, 52, 8, 1442);
    			attr_dev(tr, "class", "table-primary");
    			add_location(tr, file$4, 48, 6, 1292);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, button);
    			append_dev(tr, t6);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					prevent_default(function () {
    						if (is_function(/*selectInvoice*/ ctx[2](/*invoice*/ ctx[6]))) /*selectInvoice*/ ctx[2](/*invoice*/ ctx[6]).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*invoices_value*/ 1 && t0_value !== (t0_value = /*invoice*/ ctx[6].invoice_number + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*invoices_value*/ 1 && t2_value !== (t2_value = /*invoice*/ ctx[6].date + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*invoices_value*/ 1 && t4_value !== (t4_value = /*invoice*/ ctx[6].customer_name + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(48:6) {#each invoices_value as invoice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let t;
    	let tbody;
    	let each_value_1 = /*headings*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*invoices_value*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(tr, file$4, 40, 6, 1117);
    			add_location(thead, file$4, 39, 4, 1103);
    			add_location(tbody, file$4, 46, 4, 1238);
    			attr_dev(table, "class", "table table-hover");
    			add_location(table, file$4, 38, 0, 1065);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*headings*/ 2) {
    				each_value_1 = /*headings*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*selectInvoice, invoices_value*/ 5) {
    				each_value = /*invoices_value*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Invoices', slots, []);
    	let user_value;

    	user.subscribe(value => {
    		user_value = value;
    		console.log(user_value);
    	});

    	let invoice_data = [];
    	let invoices_value = [];
    	let headings = ["Invoice Number", "Date Created", "Customer Name"];

    	invoices.subscribe(value => {
    		$$invalidate(0, invoices_value = value);
    		createInvoiceData();
    	});

    	function createInvoiceData() {
    		invoices_value.forEach(invoice => {
    			invoice_data.push(Object.values(invoice));
    		});

    		console.log(invoices_value);
    	}

    	function selectInvoice(invoice) {
    		selectedInvoice.update(value => invoice);
    		page.redirect("/invoice");
    	}

    	onMount(async () => {
    		let new_invoices = await OrganizationService.getInvoices(user_value.OrganizationId);
    		invoices.update(value => new_invoices);
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Invoices> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		OrganizationService,
    		invoices,
    		selectedInvoice,
    		user,
    		router: page,
    		user_value,
    		invoice_data,
    		invoices_value,
    		headings,
    		createInvoiceData,
    		selectInvoice
    	});

    	$$self.$inject_state = $$props => {
    		if ('user_value' in $$props) user_value = $$props.user_value;
    		if ('invoice_data' in $$props) invoice_data = $$props.invoice_data;
    		if ('invoices_value' in $$props) $$invalidate(0, invoices_value = $$props.invoices_value);
    		if ('headings' in $$props) $$invalidate(1, headings = $$props.headings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [invoices_value, headings, selectInvoice];
    }

    class Invoices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Invoices",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Invoice.svelte generated by Svelte v3.44.2 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/components/Invoice.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (65:2) {#if line_item.item_custom_fields[0] && line_item.item_custom_fields[0].value > 0}
    function create_if_block(ctx) {
    	let div8;
    	let div0;
    	let h4;
    	let t0_value = /*line_item*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let div7;
    	let div6;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let input0_value_value;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let input1_value_value;
    	let t7;
    	let div3;
    	let label2;
    	let t9;
    	let input2;
    	let input2_value_value;
    	let t10;
    	let div4;
    	let label3;
    	let t12;
    	let input3;
    	let input3_value_value;
    	let t13;
    	let div5;
    	let label4;
    	let t15;
    	let input4;
    	let input4_value_value;
    	let t16;
    	let button;
    	let t18;
    	let p;
    	let t20;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Account Name";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Quantity";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Rate";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Item Total";
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Deferral Term";
    			t15 = space();
    			input4 = element("input");
    			t16 = space();
    			button = element("button");
    			button.textContent = "Create Deferral Schedule";
    			t18 = space();
    			p = element("p");
    			p.textContent = "No Deferral Schedule has been generated for this item";
    			t20 = space();
    			add_location(h4, file$3, 66, 31, 2811);
    			attr_dev(div0, "class", "card-header");
    			add_location(div0, file$3, 66, 6, 2786);
    			attr_dev(label0, "for", "exampleInputPassword1");
    			attr_dev(label0, "class", "form-label");
    			add_location(label0, file$3, 70, 12, 2952);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			input0.value = input0_value_value = /*line_item*/ ctx[3].account_name;
    			input0.readOnly = true;
    			attr_dev(input0, "id", "exampleInputPassword1");
    			add_location(input0, file$3, 71, 12, 3039);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$3, 69, 10, 2915);
    			attr_dev(label1, "for", "exampleInputPassword1");
    			attr_dev(label1, "class", "form-label");
    			add_location(label1, file$3, 74, 12, 3213);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			input1.value = input1_value_value = /*line_item*/ ctx[3].quantity;
    			input1.readOnly = true;
    			attr_dev(input1, "id", "exampleInputPassword1");
    			add_location(input1, file$3, 75, 12, 3296);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$3, 73, 10, 3176);
    			attr_dev(label2, "for", "exampleInputPassword1");
    			attr_dev(label2, "class", "form-label");
    			add_location(label2, file$3, 78, 12, 3466);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			input2.value = input2_value_value = /*line_item*/ ctx[3].rate;
    			input2.readOnly = true;
    			attr_dev(input2, "id", "exampleInputPassword1");
    			add_location(input2, file$3, 79, 12, 3545);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$3, 77, 10, 3429);
    			attr_dev(label3, "for", "exampleInputPassword1");
    			attr_dev(label3, "class", "form-label");
    			add_location(label3, file$3, 82, 12, 3711);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "class", "form-control");
    			input3.value = input3_value_value = /*line_item*/ ctx[3].item_total;
    			input3.readOnly = true;
    			attr_dev(input3, "id", "exampleInputPassword1");
    			add_location(input3, file$3, 83, 12, 3796);
    			attr_dev(div4, "class", "form-group");
    			add_location(div4, file$3, 81, 10, 3674);
    			attr_dev(label4, "for", "exampleInputPassword1");
    			attr_dev(label4, "class", "form-label");
    			add_location(label4, file$3, 86, 12, 3968);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "class", "form-control");
    			input4.value = input4_value_value = /*line_item*/ ctx[3].item_custom_fields[0].value;
    			input4.readOnly = true;
    			attr_dev(input4, "id", "exampleInputPassword1");
    			add_location(input4, file$3, 87, 12, 4056);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$3, 85, 10, 3931);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-primary mt-3");
    			add_location(button, file$3, 89, 10, 4208);
    			attr_dev(p, "class", "text-danger mt-3");
    			add_location(p, file$3, 90, 10, 4350);
    			attr_dev(div6, "class", "card-text");
    			add_location(div6, file$3, 68, 8, 2881);
    			attr_dev(div7, "class", "card-body");
    			add_location(div7, file$3, 67, 6, 2849);
    			attr_dev(div8, "class", "card border-secondary mb-3 m-auto mt-3");
    			set_style(div8, "max-width", "50vw");
    			add_location(div8, file$3, 65, 4, 2702);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div8, t1);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div6, t4);
    			append_dev(div6, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, input1);
    			append_dev(div6, t7);
    			append_dev(div6, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t9);
    			append_dev(div3, input2);
    			append_dev(div6, t10);
    			append_dev(div6, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t12);
    			append_dev(div4, input3);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t15);
    			append_dev(div5, input4);
    			append_dev(div6, t16);
    			append_dev(div6, button);
    			append_dev(div6, t18);
    			append_dev(div6, p);
    			append_dev(div8, t20);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*createDeferralSchedule*/ ctx[1](/*line_item*/ ctx[3]))) /*createDeferralSchedule*/ ctx[1](/*line_item*/ ctx[3]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*selectedInvoice_value*/ 1 && t0_value !== (t0_value = /*line_item*/ ctx[3].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*selectedInvoice_value*/ 1 && input0_value_value !== (input0_value_value = /*line_item*/ ctx[3].account_name) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*selectedInvoice_value*/ 1 && input1_value_value !== (input1_value_value = /*line_item*/ ctx[3].quantity) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*selectedInvoice_value*/ 1 && input2_value_value !== (input2_value_value = /*line_item*/ ctx[3].rate) && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (dirty & /*selectedInvoice_value*/ 1 && input3_value_value !== (input3_value_value = /*line_item*/ ctx[3].item_total) && input3.value !== input3_value_value) {
    				prop_dev(input3, "value", input3_value_value);
    			}

    			if (dirty & /*selectedInvoice_value*/ 1 && input4_value_value !== (input4_value_value = /*line_item*/ ctx[3].item_custom_fields[0].value) && input4.value !== input4_value_value) {
    				prop_dev(input4, "value", input4_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(65:2) {#if line_item.item_custom_fields[0] && line_item.item_custom_fields[0].value > 0}",
    		ctx
    	});

    	return block;
    }

    // (64:2) {#each selectedInvoice_value.line_items as line_item}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*line_item*/ ctx[3].item_custom_fields[0] && /*line_item*/ ctx[3].item_custom_fields[0].value > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*line_item*/ ctx[3].item_custom_fields[0] && /*line_item*/ ctx[3].item_custom_fields[0].value > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(64:2) {#each selectedInvoice_value.line_items as line_item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div7;
    	let input0;
    	let t0;
    	let div0;
    	let h4;
    	let t1;
    	let t2_value = /*selectedInvoice_value*/ ctx[0].invoice_number + "";
    	let t2;
    	let t3;
    	let div6;
    	let div5;
    	let div1;
    	let label0;
    	let t5;
    	let input1;
    	let input1_value_value;
    	let t6;
    	let div2;
    	let label1;
    	let t8;
    	let input2;
    	let input2_value_value;
    	let t9;
    	let div3;
    	let label2;
    	let t11;
    	let input3;
    	let input3_value_value;
    	let t12;
    	let div4;
    	let label3;
    	let t14;
    	let input4;
    	let input4_value_value;
    	let t15;
    	let each_1_anchor;
    	let each_value = /*selectedInvoice_value*/ ctx[0].line_items;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div0 = element("div");
    			h4 = element("h4");
    			t1 = text("Invoice ");
    			t2 = text(t2_value);
    			t3 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Customer Name";
    			t5 = space();
    			input1 = element("input");
    			t6 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Date Created";
    			t8 = space();
    			input2 = element("input");
    			t9 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "First Deferral";
    			t11 = space();
    			input3 = element("input");
    			t12 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Next Deferral";
    			t14 = space();
    			input4 = element("input");
    			t15 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "invoice");
    			add_location(input0, file$3, 39, 4, 1263);
    			add_location(h4, file$3, 40, 29, 1329);
    			attr_dev(div0, "class", "card-header");
    			add_location(div0, file$3, 40, 4, 1304);
    			attr_dev(label0, "for", "exampleInputPassword1");
    			attr_dev(label0, "class", "form-label mt-4");
    			add_location(label0, file$3, 44, 10, 1492);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			input1.value = input1_value_value = /*selectedInvoice_value*/ ctx[0].customer_name;
    			input1.readOnly = true;
    			attr_dev(input1, "id", "exampleInputPassword1");
    			add_location(input1, file$3, 45, 10, 1583);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$3, 43, 8, 1457);
    			attr_dev(label1, "for", "exampleInputPassword1");
    			attr_dev(label1, "class", "form-label mt-4");
    			add_location(label1, file$3, 48, 12, 1766);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			input2.value = input2_value_value = /*selectedInvoice_value*/ ctx[0].date;
    			input2.readOnly = true;
    			attr_dev(input2, "id", "exampleInputPassword1");
    			add_location(input2, file$3, 49, 12, 1858);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$3, 47, 8, 1729);
    			attr_dev(label2, "for", "exampleInputPassword1");
    			attr_dev(label2, "class", "form-label mt-4");
    			add_location(label2, file$3, 52, 12, 2032);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "class", "form-control");
    			input3.value = input3_value_value = /*selectedInvoice_value*/ ctx[0].date;
    			input3.readOnly = true;
    			attr_dev(input3, "id", "exampleInputPassword1");
    			add_location(input3, file$3, 53, 12, 2126);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$3, 51, 8, 1995);
    			attr_dev(label3, "for", "exampleInputPassword1");
    			attr_dev(label3, "class", "form-label mt-4");
    			add_location(label3, file$3, 56, 12, 2300);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "class", "form-control");
    			input4.value = input4_value_value = /*selectedInvoice_value*/ ctx[0].date;
    			input4.readOnly = true;
    			attr_dev(input4, "id", "exampleInputPassword1");
    			add_location(input4, file$3, 57, 12, 2393);
    			attr_dev(div4, "class", "form-group");
    			add_location(div4, file$3, 55, 8, 2263);
    			attr_dev(div5, "class", "card-text");
    			add_location(div5, file$3, 42, 6, 1425);
    			attr_dev(div6, "class", "card-body");
    			add_location(div6, file$3, 41, 4, 1395);
    			attr_dev(div7, "class", "card border-secondary mb-3 m-auto mt-3");
    			set_style(div7, "max-width", "50vw");
    			add_location(div7, file$3, 38, 0, 1181);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, input0);
    			append_dev(div7, t0);
    			append_dev(div7, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			append_dev(div7, t3);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, input1);
    			append_dev(div5, t6);
    			append_dev(div5, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t8);
    			append_dev(div2, input2);
    			append_dev(div5, t9);
    			append_dev(div5, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t11);
    			append_dev(div3, input3);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t14);
    			append_dev(div4, input4);
    			insert_dev(target, t15, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedInvoice_value*/ 1 && t2_value !== (t2_value = /*selectedInvoice_value*/ ctx[0].invoice_number + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*selectedInvoice_value*/ 1 && input1_value_value !== (input1_value_value = /*selectedInvoice_value*/ ctx[0].customer_name) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*selectedInvoice_value*/ 1 && input2_value_value !== (input2_value_value = /*selectedInvoice_value*/ ctx[0].date) && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (dirty & /*selectedInvoice_value*/ 1 && input3_value_value !== (input3_value_value = /*selectedInvoice_value*/ ctx[0].date) && input3.value !== input3_value_value) {
    				prop_dev(input3, "value", input3_value_value);
    			}

    			if (dirty & /*selectedInvoice_value*/ 1 && input4_value_value !== (input4_value_value = /*selectedInvoice_value*/ ctx[0].date) && input4.value !== input4_value_value) {
    				prop_dev(input4, "value", input4_value_value);
    			}

    			if (dirty & /*createDeferralSchedule, selectedInvoice_value*/ 3) {
    				each_value = /*selectedInvoice_value*/ ctx[0].line_items;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t15);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Invoice', slots, []);
    	let user_value;

    	user.subscribe(value => {
    		user_value = value;
    	});

    	let selectedInvoice_value = {};

    	selectedInvoice.subscribe(value => {
    		$$invalidate(0, selectedInvoice_value = value);
    	});

    	async function createDeferralSchedule(item) {
    		let deferralData = {
    			"deferrals_invoice_id": selectedInvoice_value.invoice_id,
    			"deferrals_item_id": item.item_id,
    			"deferrals_total_run_times": item.item_custom_fields[0].value,
    			"deferrals_times_ran": 0,
    			"deferrals_total_amount": item.item_total,
    			"deferrals_remaining_amount": item.item_total,
    			"deferrals_next_run": null,
    			"deferrals_last_run": null,
    			"deferrals_all_complete": 0,
    			"OrganizationId": user_value.OrganizationId
    		};

    		let response = await APIService.post("/api/organization/scheduled-deferrals", { data: deferralData });
    		console.log(response);
    	}

    	onMount(async () => {
    		console.log(selectedInvoice_value);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Invoice> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		APIService,
    		selectedInvoice,
    		user,
    		user_value,
    		selectedInvoice_value,
    		createDeferralSchedule
    	});

    	$$self.$inject_state = $$props => {
    		if ('user_value' in $$props) user_value = $$props.user_value;
    		if ('selectedInvoice_value' in $$props) $$invalidate(0, selectedInvoice_value = $$props.selectedInvoice_value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedInvoice_value, createDeferralSchedule];
    }

    class Invoice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Invoice",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Organizations.svelte generated by Svelte v3.44.2 */
    const file$2 = "src/components/Organizations.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (24:6) {#each headings as heading}
    function create_each_block_1(ctx) {
    	let th;
    	let t_value = /*heading*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr_dev(th, "scope", "col");
    			add_location(th, file$2, 24, 8, 637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(24:6) {#each headings as heading}",
    		ctx
    	});

    	return block;
    }

    // (30:6) {#each organizations as organization}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*organization*/ ctx[3].organization_name + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*organization*/ ctx[3].organization_level + "";
    	let t2;
    	let t3;
    	let td2;
    	let button;
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			button = element("button");
    			t4 = space();
    			add_location(td0, file$2, 31, 8, 804);
    			add_location(td1, file$2, 32, 8, 854);
    			add_location(button, file$2, 33, 12, 909);
    			add_location(td2, file$2, 33, 8, 905);
    			attr_dev(tr, "class", "table-primary");
    			add_location(tr, file$2, 30, 6, 769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, button);
    			append_dev(tr, t4);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					prevent_default(function () {
    						if (is_function(/*selectOrganization*/ ctx[2](/*organization*/ ctx[3].id))) /*selectOrganization*/ ctx[2](/*organization*/ ctx[3].id).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*organizations*/ 1 && t0_value !== (t0_value = /*organization*/ ctx[3].organization_name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*organizations*/ 1 && t2_value !== (t2_value = /*organization*/ ctx[3].organization_level + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(30:6) {#each organizations as organization}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let t;
    	let tbody;
    	let each_value_1 = /*headings*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*organizations*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(tr, file$2, 22, 6, 590);
    			add_location(thead, file$2, 21, 4, 576);
    			add_location(tbody, file$2, 28, 4, 711);
    			attr_dev(table, "class", "table table-hover");
    			add_location(table, file$2, 20, 0, 538);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*headings*/ 2) {
    				each_value_1 = /*headings*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*selectOrganization, organizations*/ 5) {
    				each_value = /*organizations*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Organizations', slots, []);
    	let headings = ["Organization Name", "Organization Level"];
    	let organizations = [];

    	function selectOrganization(organizationId) {
    		page.redirect(`/organization/${organizationId}`);
    	}

    	onMount(async () => {
    		let new_organizations = await OrganizationService.getMany();
    		$$invalidate(0, organizations = new_organizations);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Organizations> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		OrganizationService,
    		router: page,
    		headings,
    		organizations,
    		selectOrganization
    	});

    	$$self.$inject_state = $$props => {
    		if ('headings' in $$props) $$invalidate(1, headings = $$props.headings);
    		if ('organizations' in $$props) $$invalidate(0, organizations = $$props.organizations);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [organizations, headings, selectOrganization];
    }

    class Organizations extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Organizations",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Organization.svelte generated by Svelte v3.44.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/Organization.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (59:12) {#each orgUsers as user}
    function create_each_block(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let h4;
    	let t0_value = /*user*/ ctx[12].username + "";
    	let t0;
    	let t1;
    	let div1;
    	let p;
    	let t2;
    	let t3_value = /*user*/ ctx[12].user_level + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			p = element("p");
    			t2 = text("User Level: ");
    			t3 = text(t3_value);
    			t4 = space();
    			add_location(h4, file$1, 61, 49, 2317);
    			attr_dev(div0, "class", "card-header");
    			add_location(div0, file$1, 61, 24, 2292);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$1, 63, 26, 2422);
    			attr_dev(div1, "class", "card-body");
    			add_location(div1, file$1, 62, 24, 2372);
    			attr_dev(div2, "class", "card border-dark mb-3");
    			set_style(div2, "max-width", "20rem");
    			add_location(div2, file$1, 60, 20, 2206);
    			attr_dev(div3, "class", "col-5");
    			add_location(div3, file$1, 59, 16, 2166);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(div3, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*orgUsers*/ 32 && t0_value !== (t0_value = /*user*/ ctx[12].username + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*orgUsers*/ 32 && t3_value !== (t3_value = /*user*/ ctx[12].user_level + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(59:12) {#each orgUsers as user}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div0;
    	let h40;
    	let t0_value = /*selectedOrganization*/ ctx[4].organization_name + "";
    	let t0;
    	let t1;
    	let div4;
    	let div3;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let input0_value_value;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let input1_value_value;
    	let t7;
    	let div10;
    	let div6;
    	let h41;
    	let t9;
    	let div9;
    	let button0;
    	let t11;
    	let div8;
    	let div7;
    	let t12;
    	let div18;
    	let div17;
    	let div16;
    	let div11;
    	let h5;
    	let t14;
    	let button1;
    	let span;
    	let t15;
    	let div15;
    	let form;
    	let fieldset;
    	let p;
    	let t16;
    	let t17;
    	let div12;
    	let label2;
    	let t19;
    	let input2;
    	let t20;
    	let div13;
    	let label3;
    	let t22;
    	let input3;
    	let t23;
    	let div14;
    	let label4;
    	let t25;
    	let input4;
    	let t26;
    	let button2;
    	let mounted;
    	let dispose;
    	let each_value = /*orgUsers*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			t0 = text(t0_value);
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Zoho ID";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Account Level";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div10 = element("div");
    			div6 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Users";
    			t9 = space();
    			div9 = element("div");
    			button0 = element("button");
    			button0.textContent = "+ Add";
    			t11 = space();
    			div8 = element("div");
    			div7 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			div18 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			div11 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Add Organization User";
    			t14 = space();
    			button1 = element("button");
    			span = element("span");
    			t15 = space();
    			div15 = element("div");
    			form = element("form");
    			fieldset = element("fieldset");
    			p = element("p");
    			t16 = text(/*error*/ ctx[3]);
    			t17 = space();
    			div12 = element("div");
    			label2 = element("label");
    			label2.textContent = "Username";
    			t19 = space();
    			input2 = element("input");
    			t20 = space();
    			div13 = element("div");
    			label3 = element("label");
    			label3.textContent = "Password";
    			t22 = space();
    			input3 = element("input");
    			t23 = space();
    			div14 = element("div");
    			label4 = element("label");
    			label4.textContent = "Confirm Password";
    			t25 = space();
    			input4 = element("input");
    			t26 = space();
    			button2 = element("button");
    			button2.textContent = "Submit";
    			add_location(h40, file$1, 37, 29, 1076);
    			attr_dev(div0, "class", "card-header");
    			add_location(div0, file$1, 37, 4, 1051);
    			attr_dev(label0, "for", "exampleInputPassword1");
    			attr_dev(label0, "class", "form-label mt-4");
    			add_location(label0, file$1, 41, 10, 1233);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			input0.value = input0_value_value = /*selectedOrganization*/ ctx[4].organization_zoho_id;
    			input0.readOnly = true;
    			attr_dev(input0, "id", "exampleInputPassword1");
    			add_location(input0, file$1, 42, 10, 1318);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$1, 40, 8, 1198);
    			attr_dev(label1, "for", "exampleInputPassword1");
    			attr_dev(label1, "class", "form-label mt-4");
    			add_location(label1, file$1, 45, 12, 1507);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			input1.value = input1_value_value = /*selectedOrganization*/ ctx[4].organization_level;
    			input1.readOnly = true;
    			attr_dev(input1, "id", "exampleInputPassword1");
    			add_location(input1, file$1, 46, 12, 1600);
    			attr_dev(div2, "class", "form-group");
    			add_location(div2, file$1, 44, 8, 1470);
    			attr_dev(div3, "class", "card-text");
    			add_location(div3, file$1, 39, 6, 1166);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$1, 38, 4, 1136);
    			attr_dev(div5, "class", "card border-secondary mb-3 m-auto mt-3");
    			set_style(div5, "max-width", "50vw");
    			add_location(div5, file$1, 36, 0, 969);
    			add_location(h41, file$1, 53, 29, 1881);
    			attr_dev(div6, "class", "card-header");
    			add_location(div6, file$1, 53, 4, 1856);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-primary mt-3");
    			attr_dev(button0, "data-toggle", "modal");
    			attr_dev(button0, "data-target", "#AddUserModal");
    			add_location(button0, file$1, 55, 8, 1938);
    			attr_dev(div7, "class", "row mt-4");
    			add_location(div7, file$1, 57, 8, 2090);
    			attr_dev(div8, "class", "card-text");
    			add_location(div8, file$1, 56, 6, 2058);
    			attr_dev(div9, "class", "card-body");
    			add_location(div9, file$1, 54, 4, 1906);
    			attr_dev(div10, "class", "card border-secondary mb-3 m-auto mt-3");
    			set_style(div10, "max-width", "50vw");
    			add_location(div10, file$1, 52, 0, 1774);
    			attr_dev(h5, "class", "modal-title");
    			add_location(h5, file$1, 77, 10, 2805);
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file$1, 79, 12, 2959);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn-close");
    			attr_dev(button1, "data-dismiss", "modal");
    			attr_dev(button1, "aria-label", "Close");
    			add_location(button1, file$1, 78, 10, 2866);
    			attr_dev(div11, "class", "modal-header");
    			add_location(div11, file$1, 76, 8, 2768);
    			attr_dev(p, "class", "text-center text-danger");
    			add_location(p, file$1, 85, 20, 3126);
    			attr_dev(label2, "for", "exampleInputEmail1");
    			attr_dev(label2, "class", "form-label");
    			add_location(label2, file$1, 87, 24, 3242);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "userInput");
    			attr_dev(input2, "placeholder", "Enter Username");
    			add_location(input2, file$1, 88, 24, 3334);
    			attr_dev(div12, "class", "form-group");
    			add_location(div12, file$1, 86, 20, 3193);
    			attr_dev(label3, "for", "exampleInputPassword1");
    			attr_dev(label3, "class", "form-label");
    			add_location(label3, file$1, 91, 24, 3537);
    			attr_dev(input3, "type", "password");
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "id", "passwordInput");
    			attr_dev(input3, "placeholder", "Password");
    			add_location(input3, file$1, 92, 24, 3632);
    			attr_dev(div13, "class", "form-group");
    			add_location(div13, file$1, 90, 20, 3488);
    			attr_dev(label4, "for", "exampleInputPassword1");
    			attr_dev(label4, "class", "form-label");
    			add_location(label4, file$1, 95, 24, 3837);
    			attr_dev(input4, "type", "password");
    			attr_dev(input4, "class", "form-control");
    			attr_dev(input4, "id", "passwordInput");
    			attr_dev(input4, "placeholder", "Confirm Password");
    			add_location(input4, file$1, 96, 24, 3940);
    			attr_dev(div14, "class", "form-group");
    			add_location(div14, file$1, 94, 20, 3788);
    			add_location(fieldset, file$1, 84, 16, 3095);
    			attr_dev(button2, "type", "submit");
    			attr_dev(button2, "class", "btn btn-primary mt-3");
    			attr_dev(button2, "data-dismiss", "modal");
    			add_location(button2, file$1, 99, 16, 4135);
    			add_location(form, file$1, 83, 12, 3072);
    			attr_dev(div15, "class", "modal-body");
    			add_location(div15, file$1, 82, 8, 3035);
    			attr_dev(div16, "class", "modal-content");
    			add_location(div16, file$1, 75, 6, 2732);
    			attr_dev(div17, "class", "modal-dialog");
    			attr_dev(div17, "role", "document");
    			add_location(div17, file$1, 74, 4, 2683);
    			attr_dev(div18, "class", "modal fade hidden");
    			attr_dev(div18, "id", "AddUserModal");
    			add_location(div18, file$1, 73, 0, 2629);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, h40);
    			append_dev(h40, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, input1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div6);
    			append_dev(div6, h41);
    			append_dev(div10, t9);
    			append_dev(div10, div9);
    			append_dev(div9, button0);
    			append_dev(div9, t11);
    			append_dev(div9, div8);
    			append_dev(div8, div7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div7, null);
    			}

    			insert_dev(target, t12, anchor);
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div11);
    			append_dev(div11, h5);
    			append_dev(div11, t14);
    			append_dev(div11, button1);
    			append_dev(button1, span);
    			append_dev(div16, t15);
    			append_dev(div16, div15);
    			append_dev(div15, form);
    			append_dev(form, fieldset);
    			append_dev(fieldset, p);
    			append_dev(p, t16);
    			append_dev(fieldset, t17);
    			append_dev(fieldset, div12);
    			append_dev(div12, label2);
    			append_dev(div12, t19);
    			append_dev(div12, input2);
    			set_input_value(input2, /*username*/ ctx[0]);
    			append_dev(fieldset, t20);
    			append_dev(fieldset, div13);
    			append_dev(div13, label3);
    			append_dev(div13, t22);
    			append_dev(div13, input3);
    			set_input_value(input3, /*password*/ ctx[1]);
    			append_dev(fieldset, t23);
    			append_dev(fieldset, div14);
    			append_dev(div14, label4);
    			append_dev(div14, t25);
    			append_dev(div14, input4);
    			set_input_value(input4, /*passwordConfirm*/ ctx[2]);
    			append_dev(form, t26);
    			append_dev(form, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[8]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[9]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[10]),
    					listen_dev(button2, "click", prevent_default(/*clickAddUser*/ ctx[6]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedOrganization*/ 16 && t0_value !== (t0_value = /*selectedOrganization*/ ctx[4].organization_name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*selectedOrganization*/ 16 && input0_value_value !== (input0_value_value = /*selectedOrganization*/ ctx[4].organization_zoho_id) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*selectedOrganization*/ 16 && input1_value_value !== (input1_value_value = /*selectedOrganization*/ ctx[4].organization_level) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*orgUsers*/ 32) {
    				each_value = /*orgUsers*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div7, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*error*/ 8) set_data_dev(t16, /*error*/ ctx[3]);

    			if (dirty & /*username*/ 1 && input2.value !== /*username*/ ctx[0]) {
    				set_input_value(input2, /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input3.value !== /*password*/ ctx[1]) {
    				set_input_value(input3, /*password*/ ctx[1]);
    			}

    			if (dirty & /*passwordConfirm*/ 4 && input4.value !== /*passwordConfirm*/ ctx[2]) {
    				set_input_value(input4, /*passwordConfirm*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div10);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div18);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Organization', slots, []);
    	let { params } = $$props;
    	let username;
    	let password;
    	let passwordConfirm;
    	let error = "";
    	let selectedOrganization = {};
    	let orgUsers = [];

    	async function getOrgUsers() {
    		$$invalidate(5, orgUsers = await OrganizationService.getOrgUsers(params.id));
    	}

    	async function clickAddUser() {
    		if (password === passwordConfirm) {
    			console.log("Add");

    			await OrganizationService.addOrgUser({
    				username,
    				password,
    				user_level: 3,
    				OrganizationId: params.id
    			});

    			getOrgUsers();
    		} else {
    			$$invalidate(3, error = "Passwords do not match");
    		}
    	}

    	onMount(async () => {
    		let organization = await OrganizationService.get(params.id);
    		$$invalidate(4, selectedOrganization = organization);
    		getOrgUsers();
    		console.log(selectedOrganization);
    	});

    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Organization> was created with unknown prop '${key}'`);
    	});

    	function input2_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input3_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	function input4_input_handler() {
    		passwordConfirm = this.value;
    		$$invalidate(2, passwordConfirm);
    	}

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(7, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		OrganizationService,
    		params,
    		username,
    		password,
    		passwordConfirm,
    		error,
    		selectedOrganization,
    		orgUsers,
    		getOrgUsers,
    		clickAddUser
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(7, params = $$props.params);
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('password' in $$props) $$invalidate(1, password = $$props.password);
    		if ('passwordConfirm' in $$props) $$invalidate(2, passwordConfirm = $$props.passwordConfirm);
    		if ('error' in $$props) $$invalidate(3, error = $$props.error);
    		if ('selectedOrganization' in $$props) $$invalidate(4, selectedOrganization = $$props.selectedOrganization);
    		if ('orgUsers' in $$props) $$invalidate(5, orgUsers = $$props.orgUsers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		password,
    		passwordConfirm,
    		error,
    		selectedOrganization,
    		orgUsers,
    		clickAddUser,
    		params,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class Organization extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { params: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Organization",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[7] === undefined && !('params' in props)) {
    			console_1.warn("<Organization> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Organization>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Organization>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let alerts;
    	let t1;
    	let switch_instance;
    	let current;

    	navbar = new NavBar({
    			props: { bgColour: "dark", brand: "ZD" },
    			$$inline: true
    		});

    	alerts = new Alerts({ $$inline: true });
    	var switch_value = /*page*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*params*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(alerts.$$.fragment);
    			t1 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(main, "class", "svelte-1hqtkhz");
    			add_location(main, file, 45, 0, 1538);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			mount_component(alerts, main, null);
    			append_dev(main, t1);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*page*/ ctx[0])) {
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
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(alerts.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(alerts.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(alerts);
    			if (switch_instance) destroy_component(switch_instance);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let page$1;
    	let params;
    	page('/organization/:id', SetParams, CheckNoUser, () => $$invalidate(0, page$1 = Organization));
    	page('/organizations', CheckNoUser, () => $$invalidate(0, page$1 = Organizations));
    	page('/invoice', CheckNoUser, () => $$invalidate(0, page$1 = Invoice));
    	page('/invoices', CheckNoUser, () => $$invalidate(0, page$1 = Invoices));
    	page('/organization', CheckNoUser, () => $$invalidate(0, page$1 = MyOrganization));
    	page('/about', CheckNoUser, () => $$invalidate(0, page$1 = About));
    	page('/home', CheckNoUser, () => $$invalidate(0, page$1 = Home));
    	page('/', CheckForUser, () => $$invalidate(0, page$1 = Login));
    	page('*', () => $$invalidate(0, page$1 = _404));

    	onMount(async () => {
    		let storedUser = localStorage.getItem("app_user");
    		user.update(user => JSON.parse(storedUser));
    		page.start();
    	});

    	function SetParams(ctx, next) {
    		$$invalidate(1, params = ctx.params);
    		next();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		NavBar,
    		Alerts,
    		onMount,
    		router: page,
    		user,
    		CheckNoUser,
    		CheckForUser,
    		About,
    		Home,
    		NotFound: _404,
    		Login,
    		MyOrganization,
    		Invoices,
    		Invoice,
    		Organizations,
    		Organization,
    		page: page$1,
    		params,
    		SetParams
    	});

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate(0, page$1 = $$props.page);
    		if ('params' in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page$1, params];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
