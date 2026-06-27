# Manual test plan

Load the extension (see README), then walk this checklist. Use a logged-in
LinkedIn account.

## 1. Homepage feed blocked

- [ ] Visit `https://www.linkedin.com/feed/` → feed is replaced by the card.
- [ ] Visit `https://www.linkedin.com/` (root) → redirects to feed and is blocked.
- [ ] No visible flash of the real feed before the card appears.
- [ ] Card shows "LinkedIn feed blocked" + the custom line (default text).
- [ ] Quick links (Jobs / Messaging / Notifications / My Network) navigate correctly.
- [ ] Top navigation bar is still present and usable.

## 2. Jobs still works

- [ ] `https://www.linkedin.com/jobs/` loads normally, no overlay.
- [ ] Searching and opening a job posting works.

## 3. Messaging still works

- [ ] `https://www.linkedin.com/messaging/` loads normally, no overlay.
- [ ] Open a conversation and confirm it renders.

## 4. Profile / company / search still work

- [ ] Your own profile (`/in/...`) loads normally.
- [ ] A company page (`/company/...`) loads normally.
- [ ] Search results (`/search/results/...`) load normally.
- [ ] A direct post permalink (`/feed/update/...`) loads normally **with strict
      mode OFF**.

## 5. Pause / unpause

- [ ] In the popup, click **Pause 10 min** → status shows "Paused - … left".
- [ ] Reload the feed → feed is visible (not blocked).
- [ ] Click **Resume now** in popup → reload feed → blocked again.
- [ ] On the overlay card, **Pause N min** also pauses (matches options default).

## 6. Disable on this page once

- [ ] On the feed overlay, click **Disable on this page once** → feed appears.
- [ ] Reload the page → overlay returns (the opt-out was per-load only).

## 7. Strict mode

- [ ] Options → enable **Strict mode**.
- [ ] Open a `/feed/update/...` permalink → now blocked.
- [ ] Disable strict mode → permalink loads normally again.

## 8. Optional surfaces

- [ ] Options → enable **Block sidebar recommendations** → on any LinkedIn page
      with rails, the `aside` recommendation modules are hidden.
- [ ] Options → enable **Block suggested / promoted content** → promoted/
      "people you may know" cards are hidden where they appear.

## 9. Popup + settings persistence

- [ ] Toggle the master switch off in the popup → feed loads normally.
- [ ] Toggle back on → feed blocked.
- [ ] Change custom message text in options → reopen feed → new text shows.
- [ ] Change default pause duration → overlay's pause button label updates.
- [ ] Reload the browser / reopen options → all settings persisted.
- [ ] **Reset to defaults** in options restores original values.

## 10. Accessibility

- [ ] Popup is fully keyboard-navigable (Tab/Shift+Tab/Enter/Space).
- [ ] Options page is keyboard-navigable; focus rings are visible.
- [ ] Overlay buttons/links are reachable and have visible focus.
- [ ] Light and dark OS themes both render the overlay/popup/options correctly.

## 11. Cross-browser smoke

- [ ] Firefox: all of the above (reference).
- [ ] Chrome/Edge: load unpacked, repeat sections 1–9.
- [ ] (If building Safari) converter runs and the feed block works in Safari.
