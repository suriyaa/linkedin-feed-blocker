/**
 * Minimal WebExtension API compatibility shim.
 *
 * Firefox exposes the promise-based `browser.*` namespace natively.
 * Chrome / Edge (MV3) expose `chrome.*`, which already returns promises for the
 * APIs this extension uses (storage, runtime, action). So aliasing `browser` to
 * `chrome` is enough - no callback wrapping or remote polyfill required.
 *
 * Safari Web Extensions expose `browser.*` natively as well, so no change needed
 * there either.
 */
(function () {
  "use strict";
  if (typeof globalThis.browser === "undefined" && typeof globalThis.chrome !== "undefined") {
    globalThis.browser = globalThis.chrome;
  }
})();
