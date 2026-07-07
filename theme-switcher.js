/**
 * THEME-SWITCHER.JS
 * -------------------------------------------------------------------
 * Verantwortlich für:
 *  1. Beim Laden der Seite das zuletzt gewählte Theme wiederherstellen
 *     (bevor Firebase angebunden ist, speichern wir es im localStorage
 *     des Browsers; sobald ein Nutzer eingeloggt ist, wird die Wahl
 *     zusätzlich in seinem Firestore-Profil gesichert, siehe TODO unten).
 *  2. Klicks auf die vier Theme-Buttons entgegennehmen und das Theme
 *     wechseln.
 *
 * Bewusst in eine eigene Datei ausgelagert (Trennung von HTML/CSS/JS,
 * Single-Responsibility-Prinzip): diese Datei kümmert sich NUR um Themes.
 */

// IIFE (Immediately Invoked Function Expression): alles läuft in einem
// eigenen Gültigkeitsbereich, damit KEINE globalen Variablen entstehen
// (Sicherheitsanforderung aus dem Briefing).
(() => {
  "use strict";

  // Der Schlüssel, unter dem wir die Theme-Wahl im Browser speichern.
  const STORAGE_KEY = "lernhub-theme";

  // Erlaubte Theme-Werte. Eine "Whitelist" - falls im localStorage aus
  // irgendeinem Grund ein unerwarteter Wert steht (z.B. manipuliert über
  // die Browser-Konsole), wird er ignoriert und das Standard-Theme genutzt.
  // Das ist eine kleine, aber wichtige Sicherheitsmaßnahme: wir vertrauen
  // nie ungeprüft Werten, die aus Nutzer-kontrolliertem Speicher kommen.
  const ALLOWED_THEMES = ["dunkel", "blumenwiese", "zuckerwatte", "wolke"];
  const DEFAULT_THEME = "dunkel";

  /**
   * Liest das gespeicherte Theme aus localStorage und validiert es
   * gegen die Whitelist. Gibt bei jedem Problem das Standard-Theme zurück.
   */
  function getStoredTheme() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return ALLOWED_THEMES.includes(stored) ? stored : DEFAULT_THEME;
    } catch (error) {
      // z.B. wenn localStorage im Privatmodus blockiert ist - dann
      // einfach beim Standard-Theme bleiben, statt die Seite abstürzen
      // zu lassen.
      return DEFAULT_THEME;
    }
  }

  /**
   * Setzt das Theme: aktualisiert das data-theme-Attribut, speichert die
   * Wahl und markiert den passenden Button visuell als aktiv.
   */
  function applyTheme(themeName) {
    if (!ALLOWED_THEMES.includes(themeName)) {
      return; // ungültiger Wert wird stillschweigend verworfen
    }

    document.documentElement.setAttribute("data-theme", themeName);

    try {
      window.localStorage.setItem(STORAGE_KEY, themeName);
    } catch (error) {
      // Speichern fehlgeschlagen ist kein kritischer Fehler - die Seite
      // funktioniert trotzdem, das Theme wird beim nächsten Besuch nur
      // nicht erinnert.
    }

    // TODO (nächster Bauabschnitt): wenn ein Nutzer eingeloggt ist, hier
    // zusätzlich per firestore-service.js das Feld "theme" im
    // users/{userId}-Dokument aktualisieren, damit das Theme auch auf
    // anderen Geräten übernommen wird.

    // Alle Swatch-Buttons durchgehen und aria-pressed korrekt setzen,
    // damit Screenreader und Sehende gleichermaßen erkennen, welches
    // Theme gerade aktiv ist.
    document.querySelectorAll(".theme-swatch").forEach((button) => {
      const isActive = button.dataset.themeValue === themeName;
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  // Sobald das DOM bereit ist: gespeichertes Theme anwenden und
  // Klick-Handler an alle vier Buttons hängen.
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getStoredTheme());

    document.querySelectorAll(".theme-swatch").forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(button.dataset.themeValue);
      });
    });
  });
})();
