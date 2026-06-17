"use strict";

const DEFAULT_BACKEND = "http://localhost:3000";

const els = {
  toggleSettings: document.getElementById("toggleSettings"),
  settings: document.getElementById("settings"),
  backendUrl: document.getElementById("backendUrl"),
  file: document.getElementById("file"),
  generate: document.getElementById("generate"),
  status: document.getElementById("status"),
  result: document.getElementById("result"),
};

// --- Einstellungen (Backend-URL) -----------------------------------------

chrome.storage.local.get(["backendUrl"], (data) => {
  els.backendUrl.value = data.backendUrl || DEFAULT_BACKEND;
});

els.toggleSettings.addEventListener("click", () => {
  els.settings.hidden = !els.settings.hidden;
});

els.backendUrl.addEventListener("change", () => {
  chrome.storage.local.set({ backendUrl: els.backendUrl.value.trim() });
});

// --- Datei wählen + generieren -------------------------------------------

els.file.addEventListener("change", () => {
  els.generate.disabled = !els.file.files || els.file.files.length === 0;
});

els.generate.addEventListener("click", async () => {
  const file = els.file.files && els.file.files[0];
  if (!file) return;

  setStatus("Lese Foto …");
  els.result.hidden = true;
  els.generate.disabled = true;

  try {
    const base64 = await readBase64(file);
    const backend = (els.backendUrl.value || DEFAULT_BACKEND).replace(/\/$/, "");

    setStatus("KI analysiert das Foto …");
    const res = await fetch(`${backend}/api/listing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Fehler bei der Generierung.");

    renderListing(data.listing);
    setStatus("");
  } catch (err) {
    showError(err && err.message ? err.message : String(err));
    setStatus("");
  } finally {
    els.generate.disabled = false;
  }
});

// --- Rendering ------------------------------------------------------------

function renderListing(listing) {
  els.result.innerHTML = "";

  const hashtags = (listing.hashtags || []).map((t) => "#" + t).join(" ");
  const p = listing.preisvorschlag || {};

  addField("Titel", listing.titel);
  addField("Beschreibung", listing.beschreibung);
  addField("Marke", listing.marke);
  addField("Größe", listing.groesse);
  addField("Kategorie", listing.kategorie);
  addField("Zustand", listing.zustand);
  addField("Farbe", listing.farbe);
  addField("Material", listing.material);
  addField("Hashtags", hashtags);

  if (typeof p.empfohlen_eur === "number") {
    const price = `${p.empfohlen_eur.toFixed(2)} € (Spanne ${Number(
      p.min_eur,
    ).toFixed(2)}–${Number(p.max_eur).toFixed(2)} €)`;
    addField("Preisvorschlag", price, true);
  }

  els.result.hidden = false;
}

function addField(label, value, isPrice) {
  if (value === undefined || value === null || value === "") return;
  const text = String(value);

  const wrap = document.createElement("div");
  wrap.className = "field" + (isPrice ? " price" : "");

  const row = document.createElement("div");
  row.className = "row";

  const lab = document.createElement("span");
  lab.className = "label";
  lab.textContent = label;

  const btn = document.createElement("button");
  btn.className = "copy";
  btn.type = "button";
  btn.textContent = "Kopieren";
  btn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Kopiert ✓";
    setTimeout(() => (btn.textContent = "Kopieren"), 1200);
  });

  row.appendChild(lab);
  row.appendChild(btn);

  const val = document.createElement("div");
  val.className = "value";
  val.textContent = text;

  wrap.appendChild(row);
  wrap.appendChild(val);
  els.result.appendChild(wrap);
}

function setStatus(text) {
  els.status.textContent = text;
}

function showError(message) {
  els.result.innerHTML = "";
  const div = document.createElement("div");
  div.className = "error";
  div.textContent = message;
  els.result.appendChild(div);
  els.result.hidden = false;
}

function readBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}
