# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application that helps users organize their day from a single homepage-style interface. The Dashboard displays a time-based greeting, a 25-minute focus timer, a to-do list for task management, and quick links to favorite websites. All user data (tasks and quick links) persists across sessions using the browser Local Storage API. The Dashboard is built with HTML, CSS, and vanilla JavaScript, requires no backend server, and is compatible with modern browsers.

## Glossary

- **Dashboard**: The single web page that organizes the user's day, composed of the Greeting_Widget, Focus_Timer, To_Do_List, and Quick_Links components.
- **Greeting_Widget**: The Dashboard component that displays the current time, current date, and a greeting based on the time of day.
- **Focus_Timer**: The Dashboard component that runs a 25-minute countdown with Start, Stop, and Reset controls.
- **To_Do_List**: The Dashboard component that manages tasks and persists them to Local_Storage.
- **Task**: A single to-do item consisting of text and a completion status (incomplete or complete).
- **Quick_Links**: The Dashboard component that displays user-saved website shortcuts as clickable buttons.
- **Quick_Link**: A single website shortcut consisting of a display name and a URL, rendered as a button.
- **Local_Storage**: The browser Web Storage API (`window.localStorage`) used for client-side data persistence of Tasks and Quick_Links.
- **Vanilla JavaScript**: JavaScript written without frameworks or external libraries such as React, Vue, or Angular.
- **Theme**: The active visual color scheme of the Dashboard, configured as either dark mode or light mode.
- **Dark_Mode**: A Theme configuration that uses a dark background color with light text.
- **Light_Mode**: A Theme configuration that uses a light background color with dark text.
- **Sort_Mode**: The ordering applied to the To_Do_List, selected from creation order, completion status, or alphabetical order.

## Requirements

### Requirement 1: Display Time-Based Greeting

**User Story:** As a user, I want to see the current time, current date, and a greeting based on the time of day, so that I can orient myself to the time of day when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 12-hour format including an AM or PM indicator, updating at one-second intervals.
2. THE Greeting_Widget SHALL display the current local date in a format showing the full month name, numeric day, and four-digit year.
3. WHILE the current local time is between 05:00 and 11:59 inclusive, THE Greeting_Widget SHALL display a "Good morning" greeting.
4. WHILE the current local time is between 12:00 and 17:59 inclusive, THE Greeting_Widget SHALL display a "Good afternoon" greeting.
5. WHILE the current local time is between 18:00 and 23:59 inclusive or between 00:00 and 04:59 inclusive, THE Greeting_Widget SHALL display a "Good evening" greeting.

### Requirement 2: Provide a 25-Minute Focus Timer

**User Story:** As a user, I want a 25-minute focus timer with Start, Stop, and Reset controls, so that I can run focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown duration of 25 minutes.
2. THE Focus_Timer SHALL display the remaining time in a zero-padded minutes-and-seconds format showing two digits for minutes and two digits for seconds.
3. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down from the current remaining duration in 1-second decrements.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the remaining duration.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL restore the remaining duration to 25 minutes and stop the countdown.
6. WHEN the remaining duration reaches zero, THE Focus_Timer SHALL stop the countdown.
7. IF the user activates the Start control while the countdown is already in progress, THEN THE Focus_Timer SHALL continue the countdown without restarting or altering the remaining duration.
8. IF the user activates the Start control when the remaining duration is zero, THEN THE Focus_Timer SHALL not begin a new countdown.

### Requirement 3: Manage To-Do List Tasks

**User Story:** As a user, I want to add, edit, mark complete, and delete tasks, so that I can track what I need to do each day.

#### Acceptance Criteria

1. WHEN the user submits new task text containing 1 to 200 characters, THE To_Do_List SHALL add a new Task to the list with a completion status of incomplete.
2. WHEN the user activates the edit control on a Task, THE To_Do_List SHALL make the Task text editable.
3. WHEN the user activates the done control on a Task, THE To_Do_List SHALL toggle the Task completion status.
4. WHEN the user activates the delete control on a Task, THE To_Do_List SHALL remove the Task from the list.
5. THE To_Do_List SHALL display each Task with its text and current completion status.
6. IF the user submits new task text that is empty, contains only whitespace, or exceeds 200 characters, THEN THE To_Do_List SHALL reject the submission, add no Task, and display an error message indicating that the task text must be between 1 and 200 characters.
7. WHEN the user submits modified Task text of 1 to 200 characters, THE To_Do_List SHALL replace the original Task text with the submitted modification.
8. IF the user submits modified Task text that is empty, contains only whitespace, or exceeds 200 characters, THEN THE To_Do_List SHALL reject the modification, retain the original Task text, and display an error message indicating that the task text must be between 1 and 200 characters.

### Requirement 4: Provide Quick Links to Favorite Websites

**User Story:** As a user, I want buttons that open my favorite websites and the ability to add or remove them, so that I can quickly navigate to sites I use often.

#### Acceptance Criteria

1. THE Quick_Links component SHALL display each Quick_Link as a clickable button labeled with the Quick_Link name.
2. WHEN the user activates a Quick_Link button, THE Dashboard SHALL open the Quick_Link URL in a new browser tab.
3. WHEN the user submits a new Quick_Link with a name and a URL, THE Quick_Links component SHALL add a new button to the list.
4. WHEN the user activates the delete control on a Quick_Link, THE Quick_Links component SHALL remove the button from the list.
5. IF the user submits a Quick_Link with an empty name or a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links component SHALL reject the submission, add no Quick_Link, and display an inline error message indicating which field is invalid.
6. IF the user submits a Quick_Link whose URL is identical to an existing Quick_Link URL, THEN THE Quick_Links component SHALL reject the submission and display an inline error message indicating the URL already exists.
7. IF the number of Quick_Links already equals 20, THEN THE Quick_Links component SHALL disable the add submission control and display a message indicating the maximum number of Quick_Links has been reached.
8. IF the user submits a Quick_Link with both an empty name and a duplicate URL, THEN THE Quick_Links component SHALL reject the submission and display the invalid-field error message with priority over the duplicate-URL error message.

### Requirement 5: Persist Data with Local Storage

**User Story:** As a user, I want my tasks and quick links saved in the browser, so that my data persists when I close and reopen the Dashboard.

#### Acceptance Criteria

1. WHEN a Task is added, edited, toggled, or deleted, THE Dashboard SHALL save the updated Task list to Local_Storage.
2. WHEN a Quick_Link is added or deleted, THE Dashboard SHALL save the updated Quick_Link list to Local_Storage.
3. WHEN the Dashboard loads, THE Dashboard SHALL retrieve saved Tasks and Quick_Links from Local_Storage and display them.
4. IF Local_Storage contains no saved data on load, THEN THE Dashboard SHALL display empty Task and Quick_Link lists.
5. WHEN the Dashboard saves data to Local_Storage and subsequently loads, THE Dashboard SHALL reproduce the saved Tasks and Quick_Links without loss, preserving each Task's text and completion status and each Quick_Link's name and URL (round-trip property).
6. IF a write to Local_Storage fails due to quota exceeded or storage being unavailable, THEN THE Dashboard SHALL retain the current data in the user interface and display an error message indicating that the save failed.
7. IF Local_Storage contains data that cannot be parsed as valid Tasks or Quick_Links, THEN THE Dashboard SHALL display empty Task and Quick_Link lists.

### Requirement 6: Constrain the Technology Stack

**User Story:** As a developer, I want the Dashboard built with HTML, CSS, and vanilla JavaScript, so that it runs without frameworks or a backend server.

#### Acceptance Criteria

1. THE Dashboard SHALL use HTML for structure, CSS for styling, and Vanilla JavaScript for behavior.
2. THE Dashboard SHALL use no JavaScript frameworks or libraries.
3. THE Dashboard SHALL require no backend server for operation.
4. THE Dashboard SHALL use the browser LocalStorage API as the sole mechanism for all data persistence.
5. IF the browser LocalStorage API is unavailable or its storage quota is exceeded, THEN THE Dashboard SHALL display an error message indicating that data persistence has failed and retain the current session data in memory.

### Requirement 7: Follow the Project File Structure

**User Story:** As a developer, I want a clean project structure with exactly one CSS file and one JavaScript file, so that the code remains maintainable and readable.

#### Acceptance Criteria

1. THE Dashboard SHALL contain exactly one CSS file in the project, located in the `css/` directory.
2. THE Dashboard SHALL contain exactly one JavaScript file in the project, located in the `js/` directory.

### Requirement 8: Support Modern Browsers

**User Story:** As a user, I want the Dashboard to work across modern browsers, so that I can use it regardless of my browser choice.

#### Acceptance Criteria

1. THE Dashboard SHALL display the same set of user interface elements without unhandled errors in the two most recent major versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.
2. WHEN a user interacts with any Dashboard control, THE Dashboard SHALL respond to the interaction without unhandled errors in the two most recent major versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.

### Requirement 9: Deliver Responsive Performance and Clean Visual Design

**User Story:** As a user, I want a fast, clean, and readable Dashboard, so that I can use it comfortably every day.

#### Acceptance Criteria

1. THE Dashboard SHALL load and render all four widgets within 2 seconds on a connection of at least 10 Mbps, measured from navigation start to the point where all four widgets are visibly rendered.
2. WHEN the user provides a click or keyboard input, THE Dashboard SHALL update the user interface within 100 milliseconds.
3. THE Dashboard SHALL present a minimal interface containing only the Greeting_Widget, Focus_Timer, To_Do_List, and Quick_Links arranged in distinct, non-overlapping display areas.
4. THE Dashboard SHALL use body text of at least 16 pixels in size with a contrast ratio of at least 4.5:1 between text and background.

### Requirement 10: Toggle Dark and Light Mode

**User Story:** As a user, I want to switch between dark and light mode with a single toggle, so that I can choose a comfortable visual theme that persists across sessions.

#### Acceptance Criteria

1. THE Dashboard SHALL display a single toggle button that switches the active Theme between dark mode and light mode.
2. WHEN the user activates the Theme toggle button, THE Dashboard SHALL toggle the Theme from dark mode to light mode, or from light mode to dark mode.
3. WHILE the Theme is dark mode, THE Dashboard SHALL display a dark background color with light text.
4. WHILE the Theme is light mode, THE Dashboard SHALL display a light background color with dark text.
5. WHEN the user changes the Theme, THE Dashboard SHALL save the Theme preference to Local_Storage.
6. WHEN the Dashboard loads, THE Dashboard SHALL retrieve the saved Theme from Local_Storage and apply the saved Theme to the Dashboard.
7. IF Local_Storage contains no saved Theme on load, THEN THE Dashboard SHALL apply light mode as the default Theme.
8. THE Dashboard SHALL maintain a contrast ratio of at least 4.5:1 between text and background in both dark mode and light mode.

### Requirement 11: Sort Tasks

**User Story:** As a user, I want to sort my tasks by creation order, completion status, or alphabetical order, so that I can organize my task list according to my preference.

#### Acceptance Criteria

1. THE To_Do_List SHALL provide a Sort_Mode control that allows the user to select from creation order, completion status, and alphabetical order.
2. WHEN the user selects a Sort_Mode, THE To_Do_List SHALL reorder the displayed Tasks according to the selected Sort_Mode.
3. WHEN the user selects a Sort_Mode, THE Dashboard SHALL save the Sort_Mode preference to Local_Storage.
4. WHEN the Dashboard loads, THE Dashboard SHALL retrieve the saved Sort_Mode from Local_Storage and apply the saved Sort_Mode to the displayed Tasks.
5. IF Local_Storage contains no saved Sort_Mode on load, THEN THE To_Do_List SHALL default to creation order.
6. WHEN the To_Do_List reorders Tasks according to a Sort_Mode, THE To_Do_List SHALL preserve all Task text and completion status without loss.

### Requirement 12: Prevent Duplicate Tasks

**User Story:** As a user, I want to be prevented from adding a task with text identical to an existing task, so that my task list does not contain duplicates.

#### Acceptance Criteria

1. IF the user submits new task text that, after trimming leading and trailing whitespace and ignoring case, is identical to the text of an existing Task, THEN THE To_Do_List SHALL reject the submission, add no Task, and display an error message indicating the task already exists.
2. IF the user submits modified task text that, after trimming leading and trailing whitespace and ignoring case, is identical to the text of another existing Task, THEN THE To_Do_List SHALL reject the modification, retain the original Task text, and display an error message indicating the task already exists.
