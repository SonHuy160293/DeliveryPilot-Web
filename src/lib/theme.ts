export function readInitialTheme(): "light" {
  return "light";
}

export function initializeTheme() {
  document.documentElement.classList.remove("dark");
  try {
    window.localStorage.removeItem("deliverypilot-theme");
  } catch {
    // Graceful handling when storage is unavailable.
  }
}
