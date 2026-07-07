/**
 * AUTH-UI.JS
 * -------------------------------------------------------------------
 * Verantwortlich für die Bedienbarkeit der Login/Register-Karte:
 *  - Umschalten zwischen den Tabs "Anmelden" und "Registrieren"
 *  - Die tippende Terminal-Prompt-Zeile oben in der Karte
 *  - Clientseitige Validierung beider Formulare
 *
 * WICHTIG: Clientseitige Validierung ist NUR Komfort für den Nutzer
 * (sofortiges Feedback). Sie ersetzt NICHT die serverseitige Prüfung.
 * Firebase Authentication prüft E-Mail/Passwort ohnehin serverseitig
 * nochmal, und die Firestore Security Rules (nächster Bauabschnitt)
 * prüfen jeden Schreibzugriff unabhängig vom Frontend. Ein Angreifer
 * kann dieses JavaScript komplett umgehen - deshalb darf sich die
 * Sicherheit der Anwendung NIEMALS allein auf diese Datei stützen.
 *
 * TODO (nächster Bauabschnitt - Firebase-Anbindung):
 *   - firebase-config.js: Firebase App initialisieren
 *   - auth.js: createUserWithEmailAndPassword(), sendEmailVerification(),
 *     signInWithEmailAndPassword(), multiFactor()-Setup (2FA)
 *   - Die zwei submit-Handler unten rufen dann statt der Kommentare
 *     die echten Funktionen aus auth.js auf.
 */

(() => {
  "use strict";

  // ------------------------------------------------------------------
  // 1. TABS: zwischen Login- und Register-Formular umschalten
  // ------------------------------------------------------------------
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");
  const statusEl = document.getElementById("auth-status");

  /**
   * Aktiviert den übergebenen Tab (login/register) und blendet das
   * jeweils andere Formular aus. Setzt außerdem den Status-Bereich
   * zurück, damit keine alte Fehlermeldung aus dem anderen Formular
   * stehen bleibt.
   */
  function activateTab(tabName) {
    const isLogin = tabName === "login";

    tabLogin.setAttribute("aria-selected", String(isLogin));
    tabRegister.setAttribute("aria-selected", String(!isLogin));

    formLogin.hidden = !isLogin;
    formRegister.hidden = isLogin;

    setStatus("", "neutral");
  }

  tabLogin.addEventListener("click", () => activateTab("login"));
  tabRegister.addEventListener("click", () => activateTab("register"));

  // ------------------------------------------------------------------
  // 2. TERMINAL-PROMPT: tippt beim Laden einen kurzen Text
  // ------------------------------------------------------------------
  const promptEl = document.getElementById("terminal-prompt");
  const PROMPT_TEXT = "bernd@lernhub:~$ login --secure";

  /**
   * Baut den Prompt-Text Zeichen für Zeichen auf. Rein dekorativ (das
   * Element ist aria-hidden), daher unkritisch für Barrierefreiheit.
   * Nutzt textContent statt innerHTML, auch wenn hier keine
   * Nutzereingabe im Spiel ist - Konsistenz mit der Sicherheitsregel
   * "kein innerHTML" wird so überall im Projekt eingehalten.
   */
  function typePrompt() {
    let index = 0;
    const intervalId = setInterval(() => {
      promptEl.textContent = PROMPT_TEXT.slice(0, index + 1);
      index += 1;
      if (index >= PROMPT_TEXT.length) {
        clearInterval(intervalId);
      }
    }, 45);
  }

  // ------------------------------------------------------------------
  // 3. VALIDIERUNG
  // ------------------------------------------------------------------

  // Einfache, aber robuste E-Mail-Prüfung. Bewusst kein hochkomplexer
  // RFC-5322-Regex (die sind fehleranfällig und schwer wartbar) -
  // die eigentliche, verbindliche Prüfung übernimmt später Firebase
  // Authentication selbst.
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Passwort-Regel passend zum Hinweistext im Formular: mind. 12 Zeichen,
  // mind. ein Großbuchstabe, ein Kleinbuchstabe, eine Ziffer, ein
  // Sonderzeichen. Das ist eine gängige Mindestanforderung für
  // öffentlich erreichbare Konten.
  const PASSWORD_PATTERN =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

  /**
   * Schreibt eine Fehlermeldung in das <span> mit der übergebenen ID.
   * Nutzt ausschließlich textContent (nie innerHTML!), damit ein Wert,
   * der z.B. aus einer serverseitigen Fehlermeldung stammen könnte,
   * niemals als HTML interpretiert und ausgeführt werden kann.
   */
  function setFieldError(fieldErrorId, message) {
    const el = document.getElementById(fieldErrorId);
    if (el) {
      el.textContent = message;
    }
  }

  /** Setzt die zentrale Statuszeile unten in der Karte. */
  function setStatus(message, state) {
    statusEl.textContent = message;
    statusEl.dataset.state = state; // "neutral" | "error" | "success"
  }

  /**
   * Prüft das Login-Formular. Gibt true zurück, wenn alles gültig ist.
   * Räumt vorher alle alten Fehlermeldungen weg, damit korrigierte
   * Felder nicht fälschlich weiter als fehlerhaft markiert bleiben.
   */
  function validateLoginForm(data) {
    let isValid = true;

    setFieldError("login-email-error", "");
    setFieldError("login-password-error", "");

    if (!EMAIL_PATTERN.test(data.email)) {
      setFieldError("login-email-error", "Bitte eine gültige E-Mail-Adresse eingeben.");
      isValid = false;
    }

    if (data.password.length === 0) {
      setFieldError("login-password-error", "Bitte Passwort eingeben.");
      isValid = false;
    }

    return isValid;
  }

  /**
   * Prüft das Registrierungs-Formular inkl. Passwort-Stärke,
   * Passwort-Bestätigung und Zustimmung zu AGB/Datenschutz.
   */
  function validateRegisterForm(data) {
    let isValid = true;

    setFieldError("register-username-error", "");
    setFieldError("register-email-error", "");
    setFieldError("register-password-error", "");
    setFieldError("register-password-confirm-error", "");
    setFieldError("register-terms-error", "");

    // Nutzername: Länge wird schon über minlength/maxlength im HTML
    // eingeschränkt, hier zusätzlich gegen unsichtbare/nur-Leerzeichen-
    // Namen prüfen.
    if (data.username.trim().length < 3) {
      setFieldError("register-username-error", "Nutzername muss mindestens 3 Zeichen haben.");
      isValid = false;
    }

    if (!EMAIL_PATTERN.test(data.email)) {
      setFieldError("register-email-error", "Bitte eine gültige E-Mail-Adresse eingeben.");
      isValid = false;
    }

    if (!PASSWORD_PATTERN.test(data.password)) {
      setFieldError(
        "register-password-error",
        "Passwort erfüllt noch nicht alle Anforderungen (siehe Hinweis oben)."
      );
      isValid = false;
    }

    if (data.password !== data.passwordConfirm) {
      setFieldError("register-password-confirm-error", "Passwörter stimmen nicht überein.");
      isValid = false;
    }

    if (!data.termsAccepted) {
      setFieldError("register-terms-error", "Bitte AGB und Datenschutzerklärung akzeptieren.");
      isValid = false;
    }

    return isValid;
  }

  // ------------------------------------------------------------------
  // 4. FORMULAR-EINREICHUNG
  // ------------------------------------------------------------------

  formLogin.addEventListener("submit", async (event) => {
    // Verhindert den klassischen, vollständigen Seiten-Reload -
    // wir wollen die Anfrage selbst (später an Firebase) steuern.
    event.preventDefault();

    const formData = new FormData(formLogin);
    const data = {
      email: formData.get("email").trim(),
      password: formData.get("password"),
    };

    if (!validateLoginForm(data)) {
      setStatus("Bitte markierte Felder korrigieren.", "error");
      return;
    }

    setStatus("Prüfe Zugangsdaten …", "neutral");

    // TODO (nächster Bauabschnitt): hier signInWithEmailAndPassword()
    // aus auth.js aufrufen, in try/catch, und je nach Ergebnis
    // - bei 2FA-aktiviertem Konto: zweiten Faktor abfragen
    // - bei Erfolg: Weiterleitung zu dashboard.html
    // - bei Fehler: setStatus(...) mit einer ALLGEMEINEN Meldung wie
    //   "E-Mail oder Passwort falsch" - NIE verraten, ob die E-Mail
    //   existiert oder das Passwort falsch war (Prinzip "keine
    //   unnötigen Informationen in Fehlermeldungen").
  });

  formRegister.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(formRegister);
    const data = {
      username: formData.get("username").trim(),
      email: formData.get("email").trim(),
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
      termsAccepted: formData.get("terms") === "on",
    };

    if (!validateRegisterForm(data)) {
      setStatus("Bitte markierte Felder korrigieren.", "error");
      return;
    }

    setStatus("Lege Konto an …", "neutral");

    // TODO (nächster Bauabschnitt): hier createUserWithEmailAndPassword()
    // + sendEmailVerification() aus auth.js aufrufen. Passwort NIE selbst
    // speichern oder loggen - das übernimmt vollständig Firebase
    // Authentication. Nach Erfolg: setStatus("Bitte bestätige deine
    // E-Mail-Adresse über den Link, den wir dir geschickt haben.", "success")
    // und danach den Einrichtungs-Flow für die Zweifach-Authentifizierung
    // starten.
  });

  // ------------------------------------------------------------------
  // Initialisierung, sobald das DOM bereit ist
  // ------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    typePrompt();
  });
})();