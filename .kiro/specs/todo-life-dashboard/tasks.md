# Implementation Plan: To-Do List Life Dashboard

## Overview

The implementation builds a single-page, client-side web application with plain HTML, one CSS file, and one vanilla JavaScript file. The JavaScript file (`js/app.js`) uses an IIFE namespace pattern to organize five modules: StorageService, GreetingWidget, FocusTimer, TodoList, and QuickLinks, plus an App bootstrap controller. Pure logic functions (validation, formatting, serialization, state transitions) are extracted from DOM and I/O concerns to enable property-based testing with fast-check. The focus timer anchors to wall-clock time via `Date.now()` to prevent drift. localStorage interactions are wrapped with feature detection and quota-error handling. Testing uses Vitest with jsdom for DOM tests and the default Node environment for pure logic tests.

## Tasks

- [ ] 1. Set up project structure and testing framework
  - [ ] 1.1 Create `index.html` with widget containers
    - Create the single HTML page with semantic containers for GreetingWidget (time, date, greeting), FocusTimer (display + Start/Stop/Reset buttons), TodoList (input form + task list), and QuickLinks (input form + link buttons)
    - Include `<link>` to `css/style.css` and `<script src="js/app.js">` with `defer`
    - _Requirements: 9.3_

  - [ ] 1.2 Create `css/style.css` with base styling, layout, and accessibility
    - Style the four widget containers as distinct, non-overlapping display areas
    - Set body text to at least 16px with a contrast ratio of at least 4.5:1 between text and background
    - Add styling for task rows, link buttons, error messages, timer display, and form inputs
    - _Requirements: 9.3, 9.4_

  - [ ] 1.3 Set up Vitest, fast-check, and jsdom testing configuration
    - Create `package.json` with devDependencies for `vitest`, `fast-check`, and `jsdom`
    - Create `vitest.config.js` configuring jsdom environment for DOM-related tests and default Node environment for pure logic tests
    - Create `tests/` directory structure: `tests/unit/`, `tests/integration/`, `tests/smoke/`
    - _Requirements: 6.2_

  - [ ] 1.4 Create `js/app.js` IIFE skeleton with module namespace structure
    - Create the IIFE wrapper exposing a global `Dashboard` namespace
    - Define empty module objects: `StorageService`, `GreetingWidget`, `FocusTimer`, `TodoList`, `QuickLinks`, `App`
    - Add an ID generation utility using `crypto.randomUUID()` with timestamp-plus-random fallback
    - _Requirements: 6.1, 6.2, 7.2_

- [ ] 2. Implement StorageService module
  - [ ] 2.1 Implement StorageService with localStorage feature detection, save/load, and serialization
    - Implement `isAvailable()` feature detection by storing and removing a dummy item, catching SecurityError
    - Implement `saveTasks(tasks)` and `saveLinks(links)` with try-catch wrapping `setItem`, detecting QuotaExceededError across browser variants (code 22, code 1014, name `QuotaExceededError`, name `NS_ERROR_DOM_QUOTA_REACHED`)
    - Implement `loadTasks()` and `loadLinks()` that read and parse JSON from localStorage keys `tdl-tasks` and `tdl-links`
    - Implement `serializeTasks(tasks)`, `deserializeTasks(json)`, `serializeLinks(links)`, `deserializeLinks(json)` as pure functions returning empty arrays on parse failure or invalid structure
    - Return `{ success: boolean, error?: string }` from save methods; return `Task[]` or `QuickLink[]` from load methods
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.4, 6.5_

  - [ ]* 2.2 Write property test for serialization round-trip preservation
    - **Property 15: Serialization round-trip preserves all data**
    - **Validates: Requirements 5.5**
    - Generate arbitrary `Task[]` and `QuickLink[]` with fast-check; assert `deserialize(serialize(arr))` produces an equivalent array preserving every element's id, text/name, completion status/url, and ordering

  - [ ]* 2.3 Write property test for deserialization returning empty on invalid data
    - **Property 16: Deserialization returns empty for missing or invalid data**
    - **Validates: Requirements 5.4, 5.7**
    - Generate missing keys, empty strings, malformed JSON, and structurally invalid data; assert deserialization returns an empty array without throwing

- [ ] 3. Implement GreetingWidget module
  - [ ] 3.1 Implement GreetingWidget with pure functions, DOM rendering, and init
    - Implement `getGreeting(hour)` mapping 0-23 to "Good morning" (5-11), "Good afternoon" (12-17), "Good evening" (18-23, 0-4)
    - Implement `formatTime(date)` producing 12-hour format with seconds and AM/PM (e.g., "1:05:30 PM")
    - Implement `formatDate(date)` producing full month name, numeric day, four-digit year (e.g., "January 5, 2025")
    - Implement `init(container)` that renders time, date, and greeting, updating at one-second intervals via `setInterval`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.2 Write property test for time format AM/PM indicator
    - **Property 1: Time format includes AM or PM indicator**
    - **Validates: Requirements 1.1**
    - Generate arbitrary `Date` values; assert `formatTime(date)` includes "AM" or "PM" and correct hour (1-12), minute (00-59), second (00-59)

  - [ ]* 3.3 Write property test for date format full month name and year
    - **Property 2: Date format includes full month name, numeric day, and four-digit year**
    - **Validates: Requirements 1.2**
    - Generate arbitrary `Date` values; assert `formatDate(date)` contains the full month name, numeric day, and four-digit year

  - [ ]* 3.4 Write property test for greeting hour mapping
    - **Property 3: Greeting maps each hour to the correct time-of-day greeting**
    - **Validates: Requirements 1.3, 1.4, 1.5**
    - Generate integers 0-23; assert `getGreeting(h)` returns "Good morning" for 5-11, "Good afternoon" for 12-17, "Good evening" for 18-23 and 0-4

- [ ] 4. Checkpoint - Ensure greeting and storage tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement FocusTimer module
  - [ ] 5.1 Implement FocusTimer with formatTimer, state machine, wall-clock countdown, DOM rendering, and init
    - Implement `formatTimer(remainingMs)` as a pure function producing zero-padded "MM:SS" (e.g., 1499000 → "24:59", 0 → "00:00")
    - Implement the timer state machine with states: idle, running, paused, completed
    - Implement `start()`: transitions idle/paused → running; no-op when running or completed; no-op when remaining is zero
    - Implement `stop()`: transitions running → paused, retains remaining duration; no-op from idle/paused/completed
    - Implement `reset()`: transitions any state → idle, sets remaining to 1500000ms (25 min), stops countdown
    - Anchor countdown to wall-clock time using `Date.now()`; compute remaining as `endTime - Date.now()` on each tick; schedule ticks with `setTimeout` synced to whole-second boundaries; add `visibilitychange` listener for immediate re-render
    - When remaining reaches zero, transition to completed and stop countdown
    - Implement `init(container)` rendering the timer display and wiring Start/Stop/Reset button event listeners
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 5.2 Write property test for timer display zero-padding
    - **Property 4: Timer display is zero-padded minutes and seconds**
    - **Validates: Requirements 2.2**
    - Generate integers 0 to 1500000 (ms); assert `formatTimer(remainingMs)` produces exactly 5 characters matching `MM:SS` with zero-padded two-digit minutes and seconds

  - [ ]* 5.3 Write property test for Start control state transitions
    - **Property 5: Start control transitions correctly from every timer state**
    - **Validates: Requirements 2.3, 2.7, 2.8**
    - Model the timer state machine; from any state, assert Start transitions idle/paused → running and is a no-op (no state change, no duration alteration) from running/completed

  - [ ]* 5.4 Write property test for Stop control pause and preservation
    - **Property 6: Stop control pauses and preserves remaining duration**
    - **Validates: Requirements 2.4**
    - Generate running timers with arbitrary remaining > 0; assert Stop transitions to paused and remaining duration is unchanged

  - [ ]* 5.5 Write property test for Reset control restoring 25 minutes
    - **Property 7: Reset control restores 25 minutes from any state**
    - **Validates: Requirements 2.5**
    - Generate timers in arbitrary states; assert Reset transitions to idle, sets remaining to 1500000ms, and stops the countdown

  - [ ]* 5.6 Write property test for countdown stopping at zero
    - **Property 8: Countdown stops when remaining duration reaches zero**
    - **Validates: Requirements 2.6**
    - Generate running timers approaching zero; assert the timer transitions to completed and stops when remaining reaches zero

- [ ] 6. Implement TodoList module
  - [ ] 6.1 Implement TodoList with validateTaskText, CRUD operations, DOM rendering, event delegation, and init
    - Implement `validateTaskText(text)` as a pure function: invalid if `text.trim().length === 0` or `text.length > 200`, otherwise valid; return `{ valid, error? }`
    - Implement `addTask(text)`: validate, create Task with unique id and `completed: false`, append to list, persist via StorageService, return `{ success, error? }`
    - Implement `editTask(id, newText)`: validate, replace text if valid (preserving id and completion status), retain original if invalid, persist, return `{ success, error? }`
    - Implement `toggleTask(id)`: flip completion status, persist
    - Implement `deleteTask(id)`: remove task by id, persist
    - Implement `init(container)` rendering the task list with edit/done/delete controls per row using event delegation on the container
    - Display error messages inline for invalid submissions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1_

  - [ ]* 6.2 Write property test for task text validation classification
    - **Property 9: Task text validation classifies valid and invalid text correctly**
    - **Validates: Requirements 3.1, 3.6**
    - Generate arbitrary strings (empty, whitespace-only, short, long, boundary at 200/201 chars); assert `validateTaskText(s)` returns valid iff `s.trim().length >= 1` and `s.length <= 200`

  - [ ]* 6.3 Write property test for toggle completion involution
    - **Property 10: Task completion toggle is an involution**
    - **Validates: Requirements 3.3**
    - Generate tasks with arbitrary completion status; assert toggling once produces the opposite status and toggling twice restores the original

  - [ ]* 6.4 Write property test for task deletion by id
    - **Property 11: Task deletion removes the task by id**
    - **Validates: Requirements 3.4**
    - Generate task lists containing a task with id `x`; assert deleting by id `x` removes that task, reduces length by one, and leaves all other tasks unchanged

  - [ ]* 6.5 Write property test for task edit success and rejection
    - **Property 12: Task edit succeeds for valid text and retains original on invalid text**
    - **Validates: Requirements 3.7, 3.8**
    - Generate tasks with text `t` and arbitrary replacement text `s`; assert edit succeeds (replacing text, preserving id and completion status) iff `s` is valid, and is rejected (retaining `t`) when `s` is invalid

- [ ] 7. Checkpoint - Ensure timer and todo tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement QuickLinks module
  - [ ] 8.1 Implement QuickLinks with validateLink, isAtMaxLinks, CRUD operations, DOM rendering, event delegation, and init
    - Implement `validateLink(name, url, existingUrls)` as a pure function: invalid if name is empty (field error, highest priority), invalid if URL does not start with `http://` or `https://` (field error), invalid if URL is duplicate (duplicate error); empty-name error takes priority over duplicate-URL error; return `{ valid, error? }`
    - Implement `isAtMaxLinks(links)` returning true when `links.length === 20`
    - Implement `addLink(name, url)`: validate against existing URLs, create QuickLink with unique id, append, persist, return `{ success, error? }`; disable add control and show message when at 20 links
    - Implement `deleteLink(id)`: remove link by id, persist
    - Implement `openLink(url)`: call `window.open(url, '_blank')`
    - Implement `init(container)` rendering link buttons with delete controls using event delegation; disable add control when at max
    - Display inline error messages for invalid submissions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.2_

  - [ ]* 8.2 Write property test for link validation with error priority
    - **Property 13: Quick link validation rejects invalid input with correct error priority**
    - **Validates: Requirements 4.3, 4.5, 4.6, 4.8**
    - Generate names, URLs, and existing URL sets; assert `validateLink` returns valid iff name is non-empty, URL starts with `http://` or `https://`, and URL is not in existing set; assert empty-name error takes priority over duplicate-URL error

  - [ ]* 8.3 Write property test for link deletion by id
    - **Property 14: Quick link deletion removes the link by id**
    - **Validates: Requirements 4.4**
    - Generate link lists containing a link with id `x`; assert deleting by id `x` removes that link, reduces length by one, and leaves all other links unchanged

- [ ] 9. Implement App Controller and wire modules together
  - [ ] 9.1 Implement App.init bootstrap, module initialization, data loading, and save callbacks
    - Implement `App.init()`: feature-detect localStorage via StorageService, load saved tasks and links, initialize GreetingWidget, FocusTimer, TodoList, and QuickLinks with their DOM containers
    - Pass loaded data to TodoList and QuickLinks for initial rendering
    - Wire TodoList and QuickLinks to call StorageService save methods after each mutation (add, edit, toggle, delete)
    - If localStorage is unavailable, display an error message and retain data in memory
    - _Requirements: 5.3, 5.4, 6.5_

- [ ] 10. Checkpoint - Ensure all module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Write integration and smoke tests
  - [ ]* 11.1 Write integration tests for DOM rendering and widget interactions
    - Test GreetingWidget updates the DOM at one-second intervals
    - Test TodoList renders all tasks with text and completion status
    - Test QuickLinks render as clickable buttons labeled with link name
    - Test opening a link calls `window.open` with the URL and `_blank`
    - Test saving tasks/links calls StorageService after each mutation
    - Test loading the dashboard populates widgets from localStorage
    - _Requirements: 1.1, 3.5, 4.1, 4.2, 5.1, 5.2, 5.3_

  - [ ]* 11.2 Write integration tests for localStorage I/O with mocks
    - Test quota exceeded: mock `setItem` to throw QuotaExceededError, verify in-memory data retained and error shown
    - Test localStorage unavailable: feature detection fails, verify error shown and data in memory
    - _Requirements: 5.6, 6.5_

  - [ ]* 11.3 Write smoke tests for project structure and technology constraints
    - Assert exactly one CSS file at `css/style.css`
    - Assert exactly one JavaScript file at `js/app.js`
    - Assert no JavaScript frameworks or libraries imported
    - Assert no backend server or network calls (no fetch/XHR)
    - Assert body text computed font-size is at least 16px
    - Assert text-to-background contrast ratio is at least 4.5:1
    - _Requirements: 6.2, 6.3, 6.4, 7.1, 7.2, 9.4_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at natural breaks
- Property tests validate universal correctness properties using fast-check with at least 100 iterations per test
- Unit tests and integration tests validate specific examples, edge cases, and DOM behavior
- Smoke tests verify project structure and technology stack constraints
- All pure logic functions are extracted from DOM and I/O concerns to enable property-based testing without a browser environment
- The single `js/app.js` file uses an IIFE namespace pattern to organize all modules without external dependencies

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "5.1"] },
    { "id": 4, "tasks": ["3.3", "5.2", "6.1"] },
    { "id": 5, "tasks": ["3.4", "5.3", "6.2", "8.1"] },
    { "id": 6, "tasks": ["5.4", "6.3", "8.2", "9.1"] },
    { "id": 7, "tasks": ["5.5", "6.4", "8.3"] },
    { "id": 8, "tasks": ["5.6", "6.5"] },
    { "id": 9, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
