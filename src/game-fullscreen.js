// Dialogs cannot request fullscreen themselves. Keep the modal above a fullscreen root.
// The full-viewport CSS remains available when the browser declines the request.
export function createGameFullscreen(document) {
  let wanted = false;
  let owned = false;
  let pending = null;
  function exitOwned() {
    if (!owned) return;
    owned = false;
    if (document.fullscreenElement === document.documentElement) {
      try { Promise.resolve(document.exitFullscreen()).catch(() => {}); } catch {}
    }
  }
  return {
    enter() {
      wanted = true;
      if (pending || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
      try {
        pending = Promise.resolve(document.documentElement.requestFullscreen())
          .then(() => { owned = true; if (!wanted) exitOwned(); })
          .catch(() => {})
          .finally(() => { pending = null; });
      } catch { pending = null; }
    },
    exit() { wanted = false; exitOwned(); }
  };
}
