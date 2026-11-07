/**
 * To-Do List Life Dashboard
 * ============================================================================
 * A single-page, client-side web application built with plain HTML, CSS, and
 * vanilla JavaScript (no frameworks or libraries).
 *
 * This file is the project's single JavaScript file (Requirement 7.2). It uses
 * an IIFE namespace pattern to organize all application logic under a global
 * `Dashboard` namespace without external dependencies (Requirements 6.1, 6.2).
 *
 * Modules:
 *   - StorageService : localStorage feature detection, save/load, serialization
 *   - GreetingWidget : time/date display and greeting logic
 *   - FocusTimer      : 25-minute countdown state machine
 *   - TodoList        : task CRUD, validation, duplicate detection, sorting
 *   - QuickLinks      : link CRUD, validation, rendering
 *   - ThemeManager    : dark/light theme toggle, persistence, CSS tokens
 *   - App             : bootstrap controller that initializes and wires modules
 *
 * This skeleton defines the namespace structure and a shared ID-generation
 * utility. The module objects are intentionally empty here; their
 * implementations are added in later tasks.
 *
 * Requirements: 6.1, 6.2, 7.2
 */
(function (global) {
  'use strict';

  var doc = global.document;

  function $(id) { return doc.getElementById(id); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  /**
   * Generates a unique identifier string suitable for use as a Task or
   * QuickLink id.
   *
   * Uses `crypto.randomUUID()` from the Web Crypto API when available. Falls
   * back to a timestamp-plus-random-string generator for older browsers that
   * do not expose `crypto.randomUUID`. This guarantees stable unique ids
   * across sessions and browser versions.
   *
   * @returns {string} A unique identifier string.
   */
  function generateId() {
    // Prefer the Web Crypto API when available (modern browsers).
    if (typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Fallback for older browsers: combine a base-36 timestamp with a
    // base-36 random string. The timestamp seeds uniqueness in time and the
    // random component disambiguates ids generated within the same
    // millisecond.
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /**
   * Shared namespace exposing all Dashboard modules and utilities. Each module
   * is a self-contained object with a clear interface (see the design
   * document). The objects below are placeholders populated in later tasks.
   *
   * @namespace Dashboard
   */
  var Dashboard = {
    // --- Utilities ---------------------------------------------------------

    /** Unique identifier generator (crypto.randomUUID() with fallback). */
    generateId: generateId,

    // --- Modules (implementations added in later tasks) ------------------

    /**
     * Encapsulates all localStorage interactions with built-in error
     * handling: feature detection, save/load, and JSON serialization for
     * tasks, links, theme, and sort preferences.
     */
    StorageService: (function () {
      // --- Private constants --------------------------------------------
      // Storage keys for each persisted data type.
      var TASKS_KEY = 'tdl-tasks';
      var LINKS_KEY = 'tdl-links';
      var THEME_KEY = 'tdl-theme';
      var SORT_KEY = 'tdl-sort';
      var DUMMY_KEY = '__storage_test__';

      // Cached availability result. Feature detection runs once (design
      // decision: "localStorage feature detection upfront") and the result
      // is reused by every save/load call.
      var available = null;

      // --- Private helpers ----------------------------------------------

      /**
       * Checks whether an error is a quota-exceeded error across browser
       * variants. Browsers report this differently: Chrome/Safari use
       * code 22 or name "QuotaExceededError"; Firefox uses code 1014 or
       * name "NS_ERROR_DOM_QUOTA_REACHED".
       *
       * @param {*} err - The caught error object.
       * @returns {boolean} true when the error indicates quota exceeded.
       */
      function isQuotaError(err) {
        return !!err && (
          err.code === 22 ||
          err.code === 1014 ||
          err.name === 'QuotaExceededError' ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        );
      }

      // --- Feature detection --------------------------------------------

      /**
       * Detects whether localStorage is usable by storing and removing a
       * dummy item. Catches SecurityError thrown in private/incognito
       * mode. The result is cached so detection runs only once.
       *
       * @returns {boolean} true when localStorage is available.
       */
      function isAvailable() {
        if (available !== null) {
          return available;
        }
        try {
          var storage = global.localStorage;
          if (!storage) {
            available = false;
            return false;
          }
          storage.setItem(DUMMY_KEY, '1');
          storage.removeItem(DUMMY_KEY);
          available = true;
          return true;
        } catch (err) {
          available = false;
          return false;
        }
        return available;
      }

      // --- Serialization (pure functions) -------------------------------

      /**
       * Serializes a Task[] to a JSON string.
       *
       * @param {Task[]} tasks - The task array to serialize.
       * @returns {string} JSON-encoded string.
       */
      function serializeTasks(tasks) {
        return JSON.stringify(tasks);
      }

      /**
       * Deserializes a JSON string to a Task[]. Returns an empty array
       * on parse failure or invalid structure (non-array, or any element
       * missing id/text/completed with correct types).
       *
       * @param {string|null|undefined} json - The JSON string to parse.
       * @returns {Task[]} The deserialized task array, or [] on failure.
       */
      function deserializeTasks(json) {
        if (json === null || json === undefined || json === '') {
          return [];
        }
        try {
          var parsed = JSON.parse(json);
          if (!Array.isArray(parsed)) {
            return [];
          }
          for (var i = 0; i < parsed.length; i++) {
            var t = parsed[i];
            if (t === null || typeof t !== 'object' ||
                typeof t.id !== 'string' ||
                typeof t.text !== 'string' ||
                typeof t.completed !== 'boolean') {
              return [];
            }
          }
          return parsed;
        } catch (err) {
          return [];
        }
      }

      /**
       * Serializes a QuickLink[] to a JSON string.
       *
       * @param {QuickLink[]} links - The link array to serialize.
       * @returns {string} JSON-encoded string.
       */
      function serializeLinks(links) {
        return JSON.stringify(links);
      }

      /**
       * Deserializes a JSON string to a QuickLink[]. Returns an empty
       * array on parse failure or invalid structure (non-array, or any
       * element missing id/name/url with correct types).
       *
       * @param {string|null|undefined} json - The JSON string to parse.
       * @returns {QuickLink[]} The deserialized link array, or [] on failure.
       */
      function deserializeLinks(json) {
        if (json === null || json === undefined || json === '') {
          return [];
        }
        try {
          var parsed = JSON.parse(json);
          if (!Array.isArray(parsed)) {
            return [];
          }
          for (var i = 0; i < parsed.length; i++) {
            var l = parsed[i];
            if (l === null || typeof l !== 'object' ||
                typeof l.id !== 'string' ||
                typeof l.name !== 'string' ||
                typeof l.url !== 'string') {
              return [];
            }
          }
          return parsed;
        } catch (err) {
          return [];
        }
      }

      // --- Save methods -------------------------------------------------

      /**
       * Saves the task list to localStorage. Returns a success status; on
       * failure (unavailable or quota exceeded) the caller retains data in
       * memory and the error message is surfaced to the user.
       *
       * @param {Task[]} tasks - The task array to save.
       * @returns {{ success: boolean, error?: string }}
       */
      function saveTasks(tasks) {
        if (!isAvailable()) {
          return { success: false, error: 'Storage is unavailable. Data will not persist.' };
        }
        try {
          global.localStorage.setItem(TASKS_KEY, serializeTasks(tasks));
          return { success: true };
        } catch (err) {
          if (isQuotaError(err)) {
            return { success: false, error: 'Storage is full. Could not save tasks.' };
          }
          return { success: false, error: 'Could not save tasks.' };
        }
      }

      /**
       * Saves the quick link list to localStorage. Same contract as
       * saveTasks.
       *
       * @param {QuickLink[]} links - The link array to save.
       * @returns {{ success: boolean, error?: string }}
       */
      function saveLinks(links) {
        if (!isAvailable()) {
          return { success: false, error: 'Storage is unavailable. Data will not persist.' };
        }
        try {
          global.localStorage.setItem(LINKS_KEY, serializeLinks(links));
          return { success: true };
        } catch (err) {
          if (isQuotaError(err)) {
            return { success: false, error: 'Storage is full. Could not save links.' };
          }
          return { success: false, error: 'Could not save links.' };
        }
      }

      /**
       * Saves the active theme to localStorage. Same contract as
       * saveTasks.
       *
       * @param {Theme} theme - The theme to save ('light' | 'dark').
       * @returns {{ success: boolean, error?: string }}
       */
      function saveTheme(theme) {
        if (!isAvailable()) {
          return { success: false, error: 'Storage is unavailable. Data will not persist.' };
        }
        try {
          global.localStorage.setItem(THEME_KEY, JSON.stringify(theme));
          return { success: true };
        } catch (err) {
          if (isQuotaError(err)) {
            return { success: false, error: 'Storage is full. Could not save theme.' };
          }
          return { success: false, error: 'Could not save theme.' };
        }
      }

      /**
       * Saves the selected sort mode to localStorage. Same contract as
       * saveTasks.
       *
       * @param {SortMode} mode - The sort mode to save.
       * @returns {{ success: boolean, error?: string }}
       */
      function saveSortMode(mode) {
        if (!isAvailable()) {
          return { success: false, error: 'Storage is unavailable. Data will not persist.' };
        }
        try {
          global.localStorage.setItem(SORT_KEY, JSON.stringify(mode));
          return { success: true };
        } catch (err) {
          if (isQuotaError(err)) {
            return { success: false, error: 'Storage is full. Could not save sort mode.' };
          }
          return { success: false, error: 'Could not save sort mode.' };
        }
      }



      // --- Load methods -------------------------------------------------

      /**
       * Loads tasks from localStorage. Returns an empty array if no data
       * is saved, localStorage is unavailable, or the data is unparseable.
       *
       * @returns {Task[]}
       */
      function loadTasks() {
        if (!isAvailable()) {
          return [];
        }
        try {
          return deserializeTasks(global.localStorage.getItem(TASKS_KEY));
        } catch (err) {
          return [];
        }
      }

      /**
       * Loads quick links from localStorage. Returns an empty array if no
       * data is saved, localStorage is unavailable, or the data is
       * unparseable.
       *
       * @returns {QuickLink[]}
       */
      function loadLinks() {
        if (!isAvailable()) {
          return [];
        }
        try {
          return deserializeLinks(global.localStorage.getItem(LINKS_KEY));
        } catch (err) {
          return [];
        }
      }

      /**
       * Loads the saved theme from localStorage. Returns 'light' (the
       * default) if no data is saved, localStorage is unavailable, or the
       * data is unparseable.
       *
       * @returns {Theme}
       */
      function loadTheme() {
        if (!isAvailable()) {
          return 'light';
        }
        try {
          var json = global.localStorage.getItem(THEME_KEY);
          if (json === null || json === '') {
            return 'light';
          }
          var parsed = JSON.parse(json);
          if (parsed === 'light' || parsed === 'dark') {
            return parsed;
          }
          return 'light';
        } catch (err) {
          return 'light';
        }
      }

      /**
       * Loads the saved sort mode from localStorage. Returns 'creation'
       * (the default) if no data is saved, localStorage is unavailable, or
       * the data is unparseable.
       *
       * @returns {SortMode}
       */
      function loadSortMode() {
        if (!isAvailable()) {
          return 'creation';
        }
        try {
          var json = global.localStorage.getItem(SORT_KEY);
          if (json === null || json === '') {
            return 'creation';
          }
          var parsed = JSON.parse(json);
          if (parsed === 'creation' || parsed === 'completion' || parsed === 'alphabetical') {
            return parsed;
          }
          return 'creation';
        } catch (err) {
          return 'creation';
        }
      }

      return {
        isAvailable: isAvailable,
        serializeTasks: serializeTasks,
        deserializeTasks: deserializeTasks,
        serializeLinks: serializeLinks,
        deserializeLinks: deserializeLinks,
        saveTasks: saveTasks,
        saveLinks: saveLinks,
        saveTheme: saveTheme,
        saveSortMode: saveSortMode,
        loadTasks: loadTasks,
        loadLinks: loadLinks,
        loadTheme: loadTheme,
        loadSortMode: loadSortMode
      };
    })(),

    /**
     * Displays the current time, current date, and a time-based greeting,
     * updating every second.
     */
    GreetingWidget: (function() {
      var timeEl, dateEl, textEl, intervalId = null;

      function greetingFor(hour) {
        if (hour >= 5 && hour < 12 ) return 'Good morning';
        if (hour >= 12 && hour < 17) return 'Good afternoon';
        if (hour >= 17 && hour < 21) return 'Good evening';
        return 'Good night';
      }

      function update() {
        var now = new Date();
        timeEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        dateEl.textContent = now.toLocaleDateString(undefined, {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        textEl.textContent = greetingFor(now.getHours());
      }

      function init() {
        timeEl = $('greeting-time');
        dateEl = $('greeting-date');
        textEl = $('greeting-text');
        update();
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(update, 1000);
      }

      return { init: init, update: update, greetingFor : greetingFor };
    })(),

    /**
     * A 25-minute countdown with Start, Stop, and Reset controls, anchored
     * to wall-clock time to prevent drift.
     */
    FocusTimer: (function() {
      var DURATION = 25 * 60 * 1000;
      var remaining = DURATION;
      var endTime = 0;
      var running = false;
      var intervalId = null;
      var root, displayEl, progressEl, statusEl, startBtn, stopBtn, resetBtn;

      function format(ms) {
        var total = Math.max(0, Math.ceil(ms / 1000));
        return pad(Math.floor(total / 60)) + ':' + pad(total % 60);
      }

      function render() {
        displayEl.textContent = format(remaining);
        progressEl.style.width = (((DURATION - remaining) / DURATION) * 100) + '%';
        startBtn.disabled = running || remaining <= 0;
        stopBtn.disabled = !running;
        root.classList.toggle('running', running);
        root.classList.toggle('done', remaining <= 0);
        doc.title = running ? format(remaining) + ' · Focus' : 'Life Dashboard';
      }

      function setStatus(text) { statusEl.textContent = text; }

      function tick() {
        remaining = endTime - Date.now();
        if (remaining <= 0) {
          remaining = 0;
          running = false;
          clearInterval(intervalId);
          intervalId = null;
          setStatus("Time's up. Take a break.");
        }
        render();
      }

      function start() {
        if (running || remaining <= 0) return;
        endTime = Date.now() + remaining;
        running = true;
        intervalId = setInterval(tick, 250);
        setStatus('Focusing...');
        render();
      }

      function stop() {
        if (!running) return;
        remaining = Math.max(0, endTime - Date.now());
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        setStatus('Paused.');
        render();
      }

      function reset() {
        running = false;
        clearInterval(intervalId);
        intervalId = null;
        remaining = DURATION;
        setStatus('Ready when you are.');
        render();
      }

      function init() {
        root = $('focus-timer');
        displayEl = $('timer-display');
        progressEl = $('timer-progress');
        statusEl = $('timer-status');
        startBtn = $('timer-start');
        stopBtn = $('timer-stop');
        resetBtn = $('timer-reset');
        startBtn.addEventListener('click', start);
        stopBtn.addEventListener('click', stop);
        resetBtn.addEventListener('click', reset);
        render();
      }

      return { init: init, start: start, stop: stop, reset: reset };
    })(),

    /**
     * Manages tasks with add, edit, toggle-complete, and delete operations,
     * plus duplicate detection and stable sorting, persisting to
     * localStorage on every change.
     */
    TodoList: (function () {
      var tasks = [];
      var sortMode = 'creation';
      var form, input, errorEl, listEl, sortEl, countEl;
      var editingId = null;

      function showError(msg) { errorEl.textContent = msg || ''; }
      
      function persist() {
        var res = Dashboard.StorageService.saveTasks(tasks);
        if (!res.success) showError(res.error);
      }

      function isDuplicate(text, ignoreId) {
        var needle = text.toLowerCase();
        return tasks.some(function (t) {
          return t.id !== ignoreId && t.text.toLowerCase() === needle;
        });
      }

      function sorted() {
        var copy = tasks.slice();
        if (sortMode === 'completion') {
          return copy
            .map(function (t, i) { return { t: t, i: i }; })
            .sort(function (a, b) {
              if (a.t.completed !== b.t.completed) return a.t.completed ? 1 : -1;
              return a.i - b.i;
            })
            .map(function (x) { return x.t; });
        }
        if (sortMode === 'alphabetical') {
          return copy
            .map(function (t, i) { return { t: t, i: i }; })
            .sort(function (a, b) {
              var c = a.t.text.localeCompare(b.t.text, undefined, { sensitivity: 'base' });
              return c !== 0 ? c : a.i - b.i;
            })
            .map(function (x) { return x.t; });
        }
        return copy;
      }

      function makeButton(cls, label, handler) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.textContent = label;
        b.addEventListener('click', handler);
        return b;
      }

      function render() {
        listEl.textContent = '';
        var done = tasks.filter(function (t) { return t.completed; }).length;
        countEl.textContent = tasks.length ? done + '/' + tasks.length + ' done' : '';

        if (!tasks.length) {
          var empty = doc.createElement('li');
          empty.className = 'empty-state';
          empty.textContent = 'Nothing here yet. Add your first task.';
          listEl.appendChild(empty);
          return;
        }

        sorted().forEach(function (task) {
          var li = doc.createElement('li');
          li.className = 'task-row' + (task.completed ? ' completed' : '');

          var cb = doc.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'task-checkbox';
          cb.checked = task.completed;
          cb.setAttribute('aria-label', 'Mark "' + task.text + '" complete');
          cb.addEventListener('change', function () { toggle(task.id); });
          li.appendChild(cb);

          if (editingId === task.id) {
            var edit = doc.createElement('input');
            edit.type = 'text';
            edit.className = 'task-edit-input';
            edit.value = task.text;
            edit.maxLength = 200;
            var finished = false;
            var commit = function () {
              if (finished) return;
              finished = true;
              saveEdit(task.id, edit.value);
            };
            edit.addEventListener('keydown', function (e) {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { finished = true; editingId = null; showError(''); render(); }
            });
            edit.addEventListener('blur', commit);
            li.appendChild(edit);
            listEl.appendChild(li);
            edit.focus();
            edit.select();
            return;
          }

          var span = doc.createElement('span');
          span.className = 'task-text';
          span.textContent = task.text;
          span.addEventListener('dblclick', function () { startEdit(task.id); });
          li.appendChild(span);

          var actions = doc.createElement('div');
          actions.className = 'task-actions';
          actions.appendChild(makeButton('task-edit', 'Edit', function () { startEdit(task.id); }));
          actions.appendChild(makeButton('task-delete', 'Delete', function () { remove(task.id); }));
          li.appendChild(actions);

          listEl.appendChild(li);
        });
      }

      function add(rawText) {
        var text = (rawText || '').trim();
        if (!text) { showError('Please enter a task.'); return false; }
        if (isDuplicate(text)) { showError('That task already exists.'); return false; }
        tasks.push({ id: generateId(), text: text, completed: false });
        showError('');
        persist();
        render();
        return true;
      }

      function startEdit(id) { editingId = id; showError(''); render(); }

      function saveEdit(id, rawText) {
        var text = (rawText || '').trim();
        if (!text) { showError('Task cannot be empty.'); editingId = null; render(); return; }
        if (isDuplicate(text, id)) { showError('That task already exists.'); editingId = null; render(); return; }
        tasks.forEach(function (t) { if (t.id === id) t.text = text; });
        editingId = null;
        showError('');
        persist();
        render();
      }

      function toggle(id) {
        tasks.forEach(function (t) { if (t.id === id) t.completed = !t.completed; });
        persist();
        render();
      }

      function remove(id) {
        tasks = tasks.filter(function (t) { return t.id !== id; });
        showError('');
        persist();
        render();
      }

      function setSortMode(mode) {
        sortMode = mode;
        sortEl.value = mode;
        var res = Dashboard.StorageService.saveSortMode(mode);
        if (!res.success) showError(res.error);
        render();
      }

      function init(initialTasks, initialSort) {
        form = $('task-form');
        input = $('task-input');
        errorEl = $('task-error');
        listEl = $('task-list');
        sortEl = $('sort-mode');
        countEl = $('task-count');
        tasks = initialTasks || [];
        sortMode = initialSort || 'creation';
        sortEl.value = sortMode;

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (add(input.value)) { input.value = ''; }
          input.focus();
        });
        sortEl.addEventListener('change', function () { setSortMode(sortEl.value); });
        render();
      }

      return { init: init, add: add, toggle: toggle, remove: remove, setSortMode: setSortMode };
    })(),

    /**
     * Manages website shortcut buttons with add, delete, and open
     * operations, persisting to localStorage on every change.
     */
    QuickLinks: (function(){
      var MAX_LINKS = 12;
      var links = [];
      var form, nameInput, urlInput, errorEl, maxEl, listEl;

      function showError(msg) { errorEl.textContent = msg || ''; }

      function persist() {
        var res = Dashboard.StorageService.saveLinks(links);
        if (!res.success) showError(res.error);
      }

      function normalizeUrl(raw) {
        var value = (raw || '').trim();
        if (!value) return null;
        if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = 'https://' + value;
        try {
          var u = new URL(value);
          if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
          if (u.hostname.indexOf('.') === -1 && u.hostname !== 'localhost') return null;
          return u.href;
        } catch (e) { return null; }
      }

      function render() {
        listEl.textContent = '';
        links.forEach(function (link) {
          var item = doc.createElement('div');
          item.className = 'link-item';

          var a = doc.createElement('a');
          a.className = 'link-button';
          a.href = link.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = link.name;
          item.appendChild(a);

          var del = doc.createElement('button');
          del.type = 'button';
          del.className = 'link-delete';
          del.textContent = '\u00d7';
          del.setAttribute('aria-label', 'Delete ' + link.name);
          del.addEventListener('click', function () { remove(link.id); });
          item.appendChild(del);

          listEl.appendChild(item);
        });

        var full = links.length >= MAX_LINKS;
        maxEl.textContent = full ? 'Link limit reached (' + MAX_LINKS + '). Delete one to add another.' : '';
        form.querySelector('button[type="submit"]').disabled = full;
      }

      function add(rawName, rawUrl) {
        var name = (rawName || '').trim();
        if (!name) { showError('Please enter a link name.'); return false; }
        var url = normalizeUrl(rawUrl);
        if (!url) { showError('Please enter a valid website address, like example.com.'); return false; }
        if (links.length >= MAX_LINKS) { showError('Link limit reached.'); return false; }
        links.push({ id: generateId(), name: name, url: url });
        showError('');
        persist();
        render();
        return true;
      }

      function remove(id) {
        links = links.filter(function (l) { return l.id !== id; });
        showError('');
        persist();
        render();
      }

      function init(initialLinks) {
        form = $('link-form');
        nameInput = $('link-name');
        urlInput = $('link-url');
        errorEl = $('link-error');
        maxEl = $('link-max-message');
        listEl = $('link-list');
        links = initialLinks || [];

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (add(nameInput.value, urlInput.value)) {
            nameInput.value = '';
            urlInput.value = '';
            nameInput.focus();
          }
        });
        render();
      }

      return { init: init, add: add, remove: remove, persist: persist };
    })(),

    /**
     * Manages the dark/light theme toggle, applies it to the DOM via a
     * `data-theme` attribute and `color-scheme`, and persists the
     * preference to localStorage.
     */
    ThemeManager: (function() {
      var current = 'light';
      var button, labelEl;

      function apply(theme) {
        current = theme;
        doc.documentElement.setAttribute('data-theme', theme);
        if (labelEl) labelEl.textContent = theme === 'dark' ? 'Light' : 'Dark';
        if (button) button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      }

      function toggle() {
        apply(current === 'dark' ? 'light' : 'dark');
        Dashboard.StorageService.saveTheme(current);
      }

      function init(initialTheme) {
        button = $('theme-toggle');
        labelEl = button.querySelector('.theme-label');
        apply(initialTheme || 'light');
        button.addEventListener('click', toggle);
      }

      return { init: init, apply: apply, toggle: toggle };
    })(),

    /**
     * Bootstrap controller that feature-detects localStorage, loads saved
     * data, applies the saved theme before first paint, initializes all
     * widget modules, and wires cross-module save callbacks.
     */
    App: {
      init: function () {
        var S = Dashboard.StorageService;

        var firstRun = false;
        try { firstRun = global.localStorage.getItem('tdl-links') === null; } catch (e) {}

        var links = S.loadLinks();
        if (firstRun) {
          links = [
            { id: generateId(), name: 'Google', url: 'https://www.google.com/' },
            { id: generateId(), name: 'Gmail', url: 'https://mail.google.com/' },
            { id: generateId(), name: 'Calendar', url: 'https://calendar.google.com/' }
          ];
        }

        Dashboard.ThemeManager.init(S.loadTheme());
        Dashboard.GreetingWidget.init();
        Dashboard.FocusTimer.init();
        Dashboard.TodoList.init(S.loadTasks(), S.loadSortMode());
        Dashboard.QuickLinks.init(links);
        if (firstRun) Dashboard.QuickLinks.persist();
      }
    }
  };

  // Expose the namespace on the global object (window in browsers).
  global.Dashboard = Dashboard;
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', Dashboard.App.init);
  } else {
    Dashboard.App.init();
  }
})(typeof window !== 'undefined' ? window : this);
