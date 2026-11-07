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
    GreetingWidget: {},

    /**
     * A 25-minute countdown with Start, Stop, and Reset controls, anchored
     * to wall-clock time to prevent drift.
     */
    FocusTimer: {},

    /**
     * Manages tasks with add, edit, toggle-complete, and delete operations,
     * plus duplicate detection and stable sorting, persisting to
     * localStorage on every change.
     */
    TodoList: {},

    /**
     * Manages website shortcut buttons with add, delete, and open
     * operations, persisting to localStorage on every change.
     */
    QuickLinks: {},

    /**
     * Manages the dark/light theme toggle, applies it to the DOM via a
     * `data-theme` attribute and `color-scheme`, and persists the
     * preference to localStorage.
     */
    ThemeManager: {},

    /**
     * Bootstrap controller that feature-detects localStorage, loads saved
     * data, applies the saved theme before first paint, initializes all
     * widget modules, and wires cross-module save callbacks.
     */
    App: {}
  };

  // Expose the namespace on the global object (window in browsers).
  global.Dashboard = Dashboard;
})(typeof window !== 'undefined' ? window : this);
