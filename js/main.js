/* Ayşe Öztürk Art. Die Seite funktioniert ohne dieses Skript: Bilder öffnen als Datei, Links springen zum Formular. */
(function () {
  "use strict";

  // Bild gross ansehen
  var dialog = document.querySelector("dialog.gross");
  if (dialog && dialog.showModal) {
    var grossBild = dialog.querySelector("img");
    var grossTitel = dialog.querySelector(".gross-titel");
    var ausloeser = null;
    document.querySelectorAll("a.bild").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var img = link.querySelector("img");
        ausloeser = link;
        grossBild.src = link.href;
        grossBild.alt = img.alt;
        grossTitel.textContent = link.dataset.titel || "";
        dialog.showModal();
      });
    });
    dialog.querySelector("button").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () {
      grossBild.removeAttribute("src");
      if (ausloeser) ausloeser.focus();
    });
  }

  // Bild anfragen: Auswahl im Formular setzen
  var auswahl = document.getElementById("anliegen");
  document.querySelectorAll("[data-werk]").forEach(function (link) {
    link.addEventListener("click", function () {
      if (auswahl) auswahl.value = link.dataset.werk;
    });
  });

  // Aktiver Navigationspunkt
  var navLinks = {};
  document.querySelectorAll('.kopf nav a[href^="#"]').forEach(function (a) {
    navLinks[a.getAttribute("href").slice(1)] = a;
  });
  if ("IntersectionObserver" in window) {
    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(navLinks).forEach(function (k) { navLinks[k].removeAttribute("aria-current"); });
        if (navLinks[e.target.id]) navLinks[e.target.id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(navLinks).concat("start").forEach(function (id) {
      var el = document.getElementById(id);
      if (el) beobachter.observe(el);
    });
  }

  // Formular
  var form = document.querySelector("form[data-modus]");
  if (!form) return;
  var start = Date.now();
  var meldungen = {
    name: "Bitte schreib deinen Namen hin.",
    email: "Bitte gib eine E-Mail-Adresse wie name@beispiel.ch an, damit ich antworten kann.",
    nachricht: "Bitte schreib mir kurz, worum es geht."
  };

  function pruefe(feld) {
    var fehler = document.getElementById(feld.id + "-fehler");
    var ok = feld.checkValidity();
    if (ok) feld.removeAttribute("aria-invalid"); else feld.setAttribute("aria-invalid", "true");
    if (fehler) fehler.textContent = ok ? "" : meldungen[feld.id];
    return ok;
  }

  ["name", "email", "nachricht"].forEach(function (id) {
    var feld = document.getElementById(id);
    // Beim Tippen, nie beim Verlassen: sonst springt der Knopf weg, während man ihn drückt
    feld.addEventListener("input", function () { if (feld.hasAttribute("aria-invalid")) pruefe(feld); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var felder = ["name", "email", "nachricht"].map(function (id) { return document.getElementById(id); });
    var falsch = felder.filter(function (f) { return !pruefe(f); });
    if (falsch.length) { falsch[0].focus(); return; }

    // Honigtopf und Zeitprüfung: Maschinen füllen schnell und alles
    if (form.elements.website.value || Date.now() - start < 2500) return;

    function fertig() {
      var danke = document.createElement("p");
      danke.className = "danke";
      danke.tabIndex = -1;
      danke.setAttribute("role", "status");
      danke.textContent = form.dataset.danke;
      form.replaceChildren(danke);
      danke.focus();
    }

    if (form.dataset.modus === "prototyp") { fertig(); return; }

    var knopf = form.querySelector("button");
    knopf.disabled = true;
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { if (d && d.success) fertig(); else return Promise.reject(); })
      .catch(function () {
        knopf.disabled = false;
        document.getElementById("nachricht-fehler").textContent =
          "Das hat nicht geklappt. Schreib mir bitte direkt an " + form.dataset.post + ".";
      });
  });
})();
