# digital-penpal-168263
# Digital Dove

A digital pen pal platform that brings back the **feeling** of posting mail, choosing stationery, sealing an envelope with wax, and waiting for a letter to actually travel before it can be read. It is a fully client-side application: all state lives in the browser via localStorage.

**Live Deployment:** [https://is-project-2026.github.io/digital-penpal-168263/](https://is-project-2026.github.io/digital-penpal-168263/)

---

## Overview

Digital Dove simulates a real-world correspondence system entirely in the browser:

1. **Write** a letter — pick stationery, handwriting style, and a wax seal, then address it to a recipient.
2. **Send** it — the letter enters transit for a duration based on how "far" the recipient is (Local, Regional, or Global).
3. **Wait** — a live countdown in *The Mailroom* ticks down in real time via a background delivery engine.
4. **Receive** — once the timer hits zero, the letter arrives in *The Archive Inbox*, locked behind its wax seal until you click to break it open.
5. **Auto-replies** — writing to one of the hardcoded "Discover Pen Pals" characters triggers a simulated reply once your letter is delivered, and a "Message in a Bottle" fallback lets you generate a reply from a random stranger if you write to an unknown recipient.

No two letters look alike — stationery texture, font, and seal are all chosen per-letter and preserved when the letter is later read.

---

## Features

- **Identity** — first-time visitors must claim a unique Pen Name Handle before entering the app; this becomes their session identity.
- **The Writing Console** — compose letters with live-updating paper texture and typography previews as you pick stationery and font styles.
- **The Mailroom** — grid view of all outgoing/in-transit letters with per-second countdown timers.
- **The Archive Inbox** — delivered letters appear sealed; clicking one plays a wax-seal-crack animation before revealing the full letter in its original stationery and font.
- **Discover Pen Pals** — a sidebar directory of mock global characters you can write to.
- **Message in a Bottle** — if you write to a recipient who isn't a known pen pal, you can cast the letter as a bottle and get a reply from a random global stranger in exactly one minute.
- **Persistent, offline-first state** — everything is stored in `localStorage`; refreshing or closing the tab doesn't lose any letters, and in-transit letters continue "arriving" correctly based on real timestamps even after the app was closed and reopened.

---

## Technologies Used

HTML5, Tailwind CSS, JavaScript, LocalStorage for persistence

---