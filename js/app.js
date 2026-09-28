// ============================================================
//  Kliny Services- Application Logic
// ============================================================

// State
const state = {
  currentPage:       "home",
  currentStep:       1,
  qtyAddons:         {},          // { addonId: count }  e.g. { windows: 3, oven: 1 }
  tieredSelections:  {},          // { groupId: tierId }
  timeType:          "weekday",
  quoteId:           null,
  photos:            [],          // Array of { file, dataUrl }
  scheduledDate:     null,        // string from Calendly or manual entry
};

// Label maps
const UNIT_LABELS = {
  bachelor: "Bachelor / Studio",
  "1bed":   "1 Bedroom",
  "2bed":   "2 Bedrooms",
  "3bed":   "3 Bedrooms",
};
const CLEAN_LABELS = {
  standard:  "Standard Clean",
  deep:      "Deep Clean",
  moveinout: "Move-In / Move-Out",
  party:     "Party Clean-Up",
  airbnb:    "Airbnb Turnover",
  postreno:  "Post-Renovation Clean",
};

// ── ROUTER ────────────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById("page-" + pageId);
  if (page) {
    page.classList.add("active");
    state.currentPage = pageId;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (pageId === "quote") {
    buildAddonGrids();
    goToStep(1);
    updateQuote();
  }
}

// ── QUOTE CALCULATOR ──────────────────────────────────────
function updateQuote() {
  const unitType    = document.getElementById("unit-type")?.value  || "";
  const bathrooms   = parseInt(document.getElementById("bathrooms")?.value) || 1;
  const cleanType   = document.getElementById("clean-type")?.value || "";
  const frequencyId = document.getElementById("frequency")?.value  || "onetime";

  renderServiceIncludes(cleanType);

  if (!unitType) { renderSummary([], 0, cleanType); return; }

  const base      = CONFIG.pricing.base[unitType] || 0;
  const extraBath = Math.max(0, bathrooms - 1) * CONFIG.pricing.extraBathroom;
  const typeUp    = CONFIG.pricing.cleanTypeUpgrade[cleanType] || 0;

  const lines = [{ label: UNIT_LABELS[unitType] || unitType, amount: base }];
  if (bathrooms > 1) lines.push({ label: `Extra Bathrooms (x${bathrooms - 1})`, amount: extraBath });
  if (typeUp > 0)    lines.push({ label: CLEAN_LABELS[cleanType] || cleanType,   amount: typeUp });

  let addonTotal = 0;
  let hasCustom  = false;

  // Quantity addons
  Object.entries(state.qtyAddons).forEach(([id, count]) => {
    if (!count) return;
    const a = CONFIG.quantityAddons.find(x => x.id === id);
    if (!a) return;
    const amt = a.priceEach * count;
    const countLabel = count === 1 ? `1 ${a.unit}` : `${count} ${a.unitPlural}`;
    lines.push({ label: `${a.label} (${countLabel})`, amount: amt });
    addonTotal += amt;
  });

  // Tiered addons
  Object.entries(state.tieredSelections).forEach(([groupId, tierId]) => {
    const group = CONFIG.tieredAddons.find(g => g.id === groupId);
    if (!group) return;
    const tier = group.tiers.find(t => t.id === tierId);
    if (!tier) return;
    if (tier.price === null) {
      lines.push({ label: `${group.label} — ${tier.label}`, amount: null, custom: true });
      hasCustom = true;
    } else {
      lines.push({ label: `${group.label} — ${tier.label}`, amount: tier.price });
      addonTotal += tier.price;
    }
  });

  const subtotal    = base + extraBath + typeUp + addonTotal;
  const freqOption  = CONFIG.frequency.find(f => f.id === frequencyId) || CONFIG.frequency[0];
  const discountAmt = Math.round(subtotal * freqOption.discountPct / 100);
  if (discountAmt > 0) {
    lines.push({
      label:  `${freqOption.label.replace(/ \(.*\)/, "")} Discount (${freqOption.discountPct}%)`,
      amount: -discountAmt,
    });
  }
  const total = subtotal - discountAmt;

  renderSummary(lines, total, cleanType, hasCustom);
}

// ── SUMMARY PANEL ─────────────────────────────────────────
function renderSummary(lines, total, cleanType, hasCustom) {
  const container = document.getElementById("summary-lines");
  const totalEl   = document.getElementById("summary-total");
  const checklist = document.getElementById("summary-checklist-area");
  if (!container || !totalEl) return;

  if (!lines.length) {
    container.innerHTML = '<p class="summary-placeholder">Select your options to see the quote.</p>';
    totalEl.textContent = "$0";
    if (checklist) checklist.innerHTML = "";
    return;
  }

  container.innerHTML = lines.map(l => {
    if (l.custom) return `
      <div class="summary-line custom-price">
        <span class="line-label">${l.label}</span>
        <span class="line-amount">Custom quote</span>
      </div>`;
    return `
      <div class="summary-line ${l.amount < 0 ? "discount" : ""}">
        <span class="line-label">${l.label}</span>
        <span class="line-amount">${l.amount < 0 ? "-$" + Math.abs(l.amount) : "$" + l.amount}</span>
      </div>`;
  }).join("");

  totalEl.textContent = hasCustom ? "$" + total + "+" : "$" + total;

  // Checklist
  if (checklist && cleanType && CONFIG.serviceIncludes[cleanType]) {
    const all = [...CONFIG.serviceIncludes[cleanType]];
    Object.entries(state.qtyAddons).forEach(([id, count]) => {
      if (!count) return;
      const a = CONFIG.quantityAddons.find(x => x.id === id);
      if (a) {
        const countLabel = count === 1 ? `1 ${a.unit}` : `${count} ${a.unitPlural}`;
        all.push(`${a.label} (${countLabel}): ${a.includes}`);
      }
    });
    Object.entries(state.tieredSelections).forEach(([groupId, tierId]) => {
      const group = CONFIG.tieredAddons.find(g => g.id === groupId);
      if (!group) return;
      const tier = group.tiers.find(t => t.id === tierId);
      if (tier) all.push(`${group.label} (${tier.label}): ${tier.desc}`);
    });
    checklist.innerHTML = `
      <div class="summary-checklist">
        <div class="summary-checklist-title">What's Included</div>
        <ul>${all.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>`;
  } else if (checklist) {
    checklist.innerHTML = "";
  }
}

// ── SERVICE INCLUDES CHECKLIST (Step 1) ───────────────────
function renderServiceIncludes(cleanType) {
  const area = document.getElementById("service-includes-area");
  if (!area) return;
  if (!cleanType || !CONFIG.serviceIncludes[cleanType]) { area.innerHTML = ""; return; }
  const items = CONFIG.serviceIncludes[cleanType];
  area.innerHTML = `
    <div class="service-includes">
      <div class="service-includes-title">What's Included in This Clean</div>
      <ul class="service-includes-list">${items.map(i => `<li>${i}</li>`).join("")}</ul>
    </div>`;
}

// ── BUILD ADDON GRIDS (Step 2) ────────────────────────────
function buildAddonGrids() {
  // Quantity addons (stepper)
  const sg = document.getElementById("simple-addon-grid");
  if (sg && !sg.dataset.built) {
    sg.innerHTML = CONFIG.quantityAddons.map(a => `
      <div class="qty-addon-card" id="qaddon-${a.id}">
        <div class="qty-addon-top">
          <span class="addon-emoji">${a.emoji}</span>
          <span class="addon-label">${a.label}</span>
          <span class="addon-price">$${a.priceEach} / ${a.unit}</span>
        </div>
        <div class="qty-stepper">
          <button type="button" class="qty-btn qty-minus" onclick="changeQty('${a.id}',-1)" aria-label="Remove one">&#8722;</button>
          <span class="qty-value" id="qty-val-${a.id}">0</span>
          <button type="button" class="qty-btn qty-plus" onclick="changeQty('${a.id}',1)" aria-label="Add one">&#43;</button>
        </div>
      </div>`).join("");
    sg.dataset.built = "1";
  }

  // Tiered addons
  const tg = document.getElementById("tiered-addon-blocks");
  if (tg && !tg.dataset.built) {
    tg.innerHTML = CONFIG.tieredAddons.map(group => `
      <div class="tiered-addon-block" id="tblock-${group.id}">
        <div class="tiered-addon-header">
          <span class="tiered-addon-header-emoji">${group.emoji}</span>
          <span class="tiered-addon-header-label">${group.label}</span>
          <button class="tiered-addon-header-clear" id="tclear-${group.id}"
            onclick="clearTiered('${group.id}')" style="display:none">Clear</button>
        </div>
        <div class="tiered-tier-list">
          ${group.tiers.map(tier => `
            <div class="tiered-tier-row" id="tier-${tier.id}"
              onclick="selectTier('${group.id}','${tier.id}')">
              <div style="display:flex;align-items:flex-start;gap:10px">
                <div class="tier-radio"><div class="tier-radio-dot"></div></div>
                <div>
                  <div class="tier-name">${tier.label}</div>
                  <div class="tier-desc">${tier.desc}</div>
                </div>
              </div>
              <div class="${tier.price === null ? "tier-price custom" : "tier-price"}">
                ${tier.price === null ? "Custom quote" : "+$" + tier.price}
              </div>
            </div>`).join("")}
        </div>
      </div>`).join("");
    tg.dataset.built = "1";
  }
}

// ── QUANTITY ADDON STEPPER ────────────────────────────────
function changeQty(id, delta) {
  const a = CONFIG.quantityAddons.find(x => x.id === id);
  if (!a) return;
  const current = state.qtyAddons[id] || 0;
  const next = Math.max(0, Math.min(a.max, current + delta));
  if (next === 0) delete state.qtyAddons[id];
  else state.qtyAddons[id] = next;
  // Update display
  const valEl = document.getElementById("qty-val-" + id);
  if (valEl) valEl.textContent = next;
  const card = document.getElementById("qaddon-" + id);
  if (card) card.classList.toggle("active", next > 0);
  renderAddonReveals();
  updateQuote();
}

// ── TIERED ADDON SELECT ───────────────────────────────────
function selectTier(groupId, tierId) {
  const prev = state.tieredSelections[groupId];
  if (prev === tierId) {
    // Deselect (tap same again)
    delete state.tieredSelections[groupId];
    document.querySelectorAll(`#tblock-${groupId} .tiered-tier-row`).forEach(r => r.classList.remove("selected"));
    const clear = document.getElementById("tclear-" + groupId);
    if (clear) clear.style.display = "none";
  } else {
    state.tieredSelections[groupId] = tierId;
    document.querySelectorAll(`#tblock-${groupId} .tiered-tier-row`).forEach(r => r.classList.remove("selected"));
    document.getElementById("tier-" + tierId)?.classList.add("selected");
    const clear = document.getElementById("tclear-" + groupId);
    if (clear) clear.style.display = "";
  }
  renderAddonReveals();
  updateQuote();
}

function clearTiered(groupId) {
  delete state.tieredSelections[groupId];
  document.querySelectorAll(`#tblock-${groupId} .tiered-tier-row`).forEach(r => r.classList.remove("selected"));
  const clear = document.getElementById("tclear-" + groupId);
  if (clear) clear.style.display = "none";
  renderAddonReveals();
  updateQuote();
}

// ── ADDON REVEALS ─────────────────────────────────────────
function renderAddonReveals() {
  const area = document.getElementById("addon-reveals");
  if (!area) return;

  const items = [];
  Object.entries(state.qtyAddons).forEach(([id, count]) => {
    if (!count) return;
    const a = CONFIG.quantityAddons.find(x => x.id === id);
    if (!a) return;
    const countLabel = count === 1 ? `1 ${a.unit}` : `${count} ${a.unitPlural}`;
    items.push(`<strong>${a.emoji} ${a.label} (${countLabel}):</strong> ${a.includes}`);
  });
  Object.entries(state.tieredSelections).forEach(([groupId, tierId]) => {
    const group = CONFIG.tieredAddons.find(g => g.id === groupId);
    if (!group) return;
    const tier = group.tiers.find(t => t.id === tierId);
    if (tier) items.push(`<strong>${group.emoji} ${group.label} (${tier.label}):</strong> ${tier.desc}`);
  });

  if (!items.length) { area.innerHTML = ""; return; }

  area.innerHTML = `
    <div class="addon-reveals">
      <div style="font-size:.78rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--green);margin-bottom:8px;">
        Selected Add-Ons Cover
      </div>
      ${items.map(i => `<div class="addon-reveal-item">${i}</div>`).join("")}
    </div>`;
}

// ── PHOTO UPLOAD (stub — photos collected via Google Form link) ───
function handlePhotoUpload() {}  // no-op, kept so any stale HTML refs don't error

// ── STEP NAVIGATION ───────────────────────────────────────
function goToStep(step) {
  if (step > 1 && !validateStep(state.currentStep)) return;

  document.querySelectorAll(".form-step").forEach((s, i) => {
    s.classList.toggle("active", i + 1 === step);
  });

  // Update step indicators via IDs (works regardless of markup structure)
  for (let i = 1; i <= 4; i++) {
    const dot  = document.getElementById("sdot-"  + i);
    const line = document.getElementById("sline-" + (i - 1));
    if (dot) {
      dot.classList.toggle("active",    i === step);
      dot.classList.toggle("completed", i <  step);
    }
    if (line) line.classList.toggle("completed", i <= step);
  }

  state.currentStep = step;
  if (step === 4) renderBookingStep();
  document.querySelector(".quote-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateStep(step) {
  const required = {
    1: ["unit-type", "bathrooms", "floors", "clean-type", "frequency"],
    3: ["client-name", "client-phone", "client-email", "client-address"],
  };
  const fields = required[step];
  if (!fields) return true;
  let valid = true;
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) { el?.classList.add("error"); valid = false; }
    else                          { el?.classList.remove("error"); }
  });
  if (!valid) showToast("Please fill in all required fields.", "error");
  return valid;
}

// ── STEP 4: BOOKING INSTRUCTIONS ─────────────────────────
function renderBookingStep() {
  const area = document.getElementById("booking-content");
  if (!area) return;

  const qid = state.quoteId || "SC-XXXXXXX";
  const weekdayUrl = CONFIG.calendly.weekday;
  const weekendUrl = CONFIG.calendly.weekend;
  const hasCalendly = !weekdayUrl.includes("YOUR_USERNAME");

  area.innerHTML = `
    <div class="booking-success">
      <div class="booking-success-icon">✓</div>
      <h3>Your quote is ready!</h3>
      <p>Your PDF has downloaded and a copy has been emailed to you. Whenever you're ready to book, follow the steps below.</p>
    </div>

    <div class="booking-steps">
      <div class="booking-step">
        <div class="booking-step-num">1</div>
        <div class="booking-step-body">
          <strong>Keep your Quote ID</strong>
          <p>You'll need this when you book. It links your appointment to this quote.</p>
          <div class="quote-id-display">
            <span id="qid-text">${qid}</span>
            <button class="qid-copy-btn" onclick="copyQuoteId()">Copy</button>
          </div>
        </div>
      </div>
      <div class="booking-step">
        <div class="booking-step-num">2</div>
        <div class="booking-step-body">
          <strong>Pick your date and time</strong>
          <p>Choose a slot that works for you. Weekday evenings (Mon–Fri, 4–8 PM) or weekends (Sat 9–5, Sun 9–3).</p>
          ${hasCalendly ? `
          <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
            <a href="${weekdayUrl}" target="_blank" class="booking-link-btn">📅 Weekday Evenings</a>
            <a href="${weekendUrl}" target="_blank" class="booking-link-btn">📅 Weekends</a>
          </div>` : `
          <div class="booking-calendly-note">
            Add your Calendly links in <code>js/config.js</code> — they'll appear as buttons here.
          </div>`}
        </div>
      </div>
      <div class="booking-step">
        <div class="booking-step-num">3</div>
        <div class="booking-step-body">
          <strong>Paste your Quote ID in the Calendly form</strong>
          <p>Calendly will ask for a "Quote ID" — paste <strong>${qid}</strong> there. This lets us pull up your exact quote when we arrive.</p>
        </div>
      </div>
    </div>

    <div class="booking-note">
      <strong>Not ready to book yet?</strong> No problem — your quote is valid for ${CONFIG.quote.validDays} days. The PDF is saved to your device and a copy is in your inbox.
    </div>`;
}

function copyQuoteId() {
  const text = document.getElementById("qid-text")?.textContent || "";
  navigator.clipboard.writeText(text).then(() => {
    showToast("Quote ID copied!", "success");
  }).catch(() => {
    // fallback: select the text
    const el = document.getElementById("qid-text");
    if (el) {
      const range = document.createRange();
      range.selectNode(el);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
    showToast("Quote ID selected — press Ctrl+C to copy", "info");
  });
}

// ── QUOTE SUBMISSION ──────────────────────────────────────
function submitQuote() {
  if (!validateStep(3)) return;

  state.quoteId = "SC-" + Date.now().toString(36).toUpperCase();

  const unitType    = document.getElementById("unit-type").value;
  const cleanType   = document.getElementById("clean-type").value;
  const bathrooms   = document.getElementById("bathrooms").value;
  const floors      = document.getElementById("floors").value;
  const frequencyId = document.getElementById("frequency")?.value || "onetime";
  const notes       = document.getElementById("client-notes")?.value || "";
  const freqOption  = CONFIG.frequency.find(f => f.id === frequencyId) || CONFIG.frequency[0];

  const base        = CONFIG.pricing.base[unitType] || 0;
  const extraBath   = Math.max(0, parseInt(bathrooms) - 1) * CONFIG.pricing.extraBathroom;
  const typeUp      = CONFIG.pricing.cleanTypeUpgrade[cleanType] || 0;
  let   addonTotal  = 0;
  let   hasCustom   = false;

  const addonLines = [];
  Object.entries(state.qtyAddons).forEach(([id, count]) => {
    if (!count) return;
    const a = CONFIG.quantityAddons.find(x => x.id === id);
    if (!a) return;
    const amt = a.priceEach * count;
    const countLabel = count === 1 ? `1 ${a.unit}` : `${count} ${a.unitPlural}`;
    addonLines.push(`${a.label} — ${countLabel} (+$${amt})`);
    addonTotal += amt;
  });
  Object.entries(state.tieredSelections).forEach(([groupId, tierId]) => {
    const group = CONFIG.tieredAddons.find(g => g.id === groupId);
    if (!group) return;
    const tier = group.tiers.find(t => t.id === tierId);
    if (!tier) return;
    if (tier.price === null) { addonLines.push(`${group.label} — ${tier.label} (Custom quote)`); hasCustom = true; }
    else                     { addonLines.push(`${group.label} — ${tier.label} (+$${tier.price})`); addonTotal += tier.price; }
  });

  const subtotal    = base + extraBath + typeUp + addonTotal;
  const discountAmt = Math.round(subtotal * freqOption.discountPct / 100);
  const total       = subtotal - discountAmt;

  const includesList = (CONFIG.serviceIncludes[cleanType] || []).join("; ");
  const addonIncludesList = (() => {
    const parts = [];
    Object.entries(state.qtyAddons).forEach(([id, count]) => {
      if (!count) return;
      const a = CONFIG.quantityAddons.find(x => x.id === id);
      if (!a) return;
      const countLabel = count === 1 ? `1 ${a.unit}` : `${count} ${a.unitPlural}`;
      parts.push(`${a.label} (${countLabel}): ${a.includes}`);
    });
    Object.entries(state.tieredSelections).forEach(([groupId, tierId]) => {
      const group = CONFIG.tieredAddons.find(g => g.id === groupId);
      if (!group) return;
      const tier = group.tiers.find(t => t.id === tierId);
      if (tier) parts.push(`${group.label} (${tier.label}): ${tier.desc}`);
    });
    return parts.join("; ") || "None";
  })();

  const formData = {
    quoteId:          state.quoteId,
    name:             document.getElementById("client-name").value,
    phone:            document.getElementById("client-phone").value,
    email:            document.getElementById("client-email").value,
    address:          document.getElementById("client-address").value,
    unitType:         UNIT_LABELS[unitType]   || unitType,
    cleanType:        CLEAN_LABELS[cleanType] || cleanType,
    bathrooms, floors,
    frequency:        freqOption.label,
    addons:           addonLines.join(", ") || "None",
    serviceIncludes:  includesList,
    addonIncludes:    addonIncludesList,
    subtotal:         "$" + subtotal,
    discount:         discountAmt > 0 ? `-$${discountAmt} (${freqOption.discountPct}% off)` : "None",
    total:            hasCustom ? "$" + total + "+ (custom items TBD)" : "$" + total,
    notes,
    disclaimer:       CONFIG.quote.disclaimer,
    validUntil:       new Date(Date.now() + CONFIG.quote.validDays * 86400000).toLocaleDateString("en-CA"),
    businessName:     CONFIG.business.name,
    businessEmail:    CONFIG.business.email,
    businessPhone:    CONFIG.business.phone,
    businessCity:     CONFIG.business.city,
    bookingNote:      `To book an appointment, visit your Calendly link and enter your Quote ID: ${state.quoteId}`,
  };

  sendEmail(formData);
  showToast("Quote confirmed! Check your email.", "success");
  goToStep(4);
  setTimeout(() => downloadQuotePDF(formData, total, hasCustom), 6000);
}

// ── SEND EMAIL + SHEET ────────────────────────────────────
function sendEmail(data) {
  if (CONFIG.emailjs.publicKey === "YOUR_PUBLIC_KEY") { console.info("EmailJS not configured."); return; }
  emailjs.init(CONFIG.emailjs.publicKey);
  emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.quoteTemplateId, {
    quoteId:   data.quoteId,
    date:      new Date().toLocaleDateString("en-CA"),
    name:      data.name,
    email:     data.email,
    phone:     data.phone,
    address:   data.address,
    unitType:  data.unitType,
    cleanType: data.cleanType,
    frequency: data.frequency,
    addons:    data.addons,
    total:     data.total,
    notes:     data.notes || "None",
  }).then(() => {
    showToast("Quote confirmed! Check your email.", "success");
  }).catch(err => {
    console.error("EmailJS error:", err);
  });

  fetch(CONFIG.sheetsUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(data),
  }).catch(err => console.error("Sheet error:", err));
}

// ── CONTACT FORM ──────────────────────────────────────────
function submitContact() {
  const name    = document.getElementById("contact-name")?.value?.trim();
  const email   = document.getElementById("contact-email")?.value?.trim();
  const message = document.getElementById("contact-message")?.value?.trim();
  const phone   = document.getElementById("contact-phone")?.value?.trim() || "Not provided";
  if (!name || !email || !message) { showToast("Please fill in all required fields.", "error"); return; }
  if (CONFIG.emailjs.publicKey !== "YOUR_PUBLIC_KEY") {
    emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.contactTemplateId, {
      from_name: name,
      reply_to:  email,
      phone:     phone,
      message:   message,
    }).then(() => {
      showToast("Message sent! We'll get back to you soon.", "success");
      ["contact-name", "contact-email", "contact-phone", "contact-message"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    }).catch(err => {
      console.error("EmailJS error:", err);
      showToast("Failed to send message. Please try again.", "error");
    });
  } else {
    showToast("Email not configured yet.", "error");
  }
}

// ── PDF DOWNLOAD ──────────────────────────────────────────
function downloadQuotePDF(formData, total, hasCustom) {
  if (!formData) { showToast("Complete your quote first.", "error"); return; }
  if (!window.jspdf) { showToast("PDF library not loaded.", "error"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const GREEN  = [26, 140, 78];
  const BLACK  = [10, 10, 10];
  const GRAY   = [90, 110, 90];
  const LGRAY  = [220, 222, 220];
  const WHITE  = [255, 255, 255];
  const PALE   = [232, 245, 238];
  const YELLOW = [255, 248, 220];
  const YBORD  = [200, 180, 50];

  // Header bar
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, 210, 32, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 28, 210, 4, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Kliny Services", 20, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Professional Cleaning Services — Sudbury, Ontario", 20, 24);
  doc.text(`Quote #${formData.quoteId}  |  Valid until ${formData.validUntil}`, 210 - 20, 24, { align: "right" });

  let y = 44;

  // Client info box
  doc.setFillColor(...PALE);
  doc.roundedRect(14, y, 182, 34, 3, 3, "F");
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CLIENT INFORMATION", 20, y + 7);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${formData.name}`, 20, y + 15);
  doc.setFontSize(9);
  doc.text(`${formData.address}`, 20, y + 22);
  doc.text(`${formData.phone}   |   ${formData.email}`, 20, y + 29);
  y += 42;

  // Service summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GREEN);
  doc.text("SERVICE SUMMARY", 20, y);
  y += 5;

  const summaryRows = [
    ["Property", `${formData.unitType}  |  ${formData.bathrooms} bath  |  ${formData.cleanType}`],
    ["Frequency", formData.frequency],
    ["Add-Ons", formData.addons || "None"],
  ];

  summaryRows.forEach((row, i) => {
    if (i % 2 === 0) { doc.setFillColor(...LGRAY); doc.rect(14, y, 182, 7, "F"); }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(row[0].toUpperCase(), 20, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize(row[1], 140);
    doc.text(wrapped, 65, y + 5);
    y += Math.max(7, wrapped.length * 5);
  });

  y += 6;

  // Pricing
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GREEN);
  doc.text("PRICING BREAKDOWN", 20, y);
  y += 5;

  const priceParts = formData.subtotal !== "$0" ? [
    ["Service base", formData.subtotal],
    ...(formData.discount !== "None" ? [["Discount", formData.discount]] : []),
  ] : [];

  priceParts.forEach((row, i) => {
    if (i % 2 === 0) { doc.setFillColor(...LGRAY); doc.rect(14, y, 182, 7, "F"); }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text(row[0], 20, y + 5);
    doc.text(row[1], 196, y + 5, { align: "right" });
    y += 7;
  });

  // Total
  doc.setFillColor(...GREEN);
  doc.rect(14, y, 182, 10, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ESTIMATED TOTAL", 20, y + 7);
  doc.text(hasCustom ? "$" + total + "+" : "$" + total, 196, y + 7, { align: "right" });
  y += 18;

  // Checklist
  const includes = CONFIG.serviceIncludes[formData.cleanType?.toLowerCase()?.replace(/[^a-z]/g, "")] ||
                   CONFIG.serviceIncludes.standard;
  const allIncludes = [...includes];
  Object.entries(state.qtyAddons).forEach(([id, count]) => {
    if (!count) return;
    const a = CONFIG.quantityAddons.find(x => x.id === id);
    if (!a) return;
    const countLabel = count === 1 ? `1 ${a.unit}` : `${count} ${a.unitPlural}`;
    allIncludes.push(`${a.label} (${countLabel}): ${a.includes}`);
  });
  Object.entries(state.tieredSelections).forEach(([groupId, tierId]) => {
    const group = CONFIG.tieredAddons.find(g => g.id === groupId);
    if (!group) return;
    const tier = group.tiers.find(t => t.id === tierId);
    if (tier) allIncludes.push(`${group.label} (${tier.label}): ${tier.desc}`);
  });

  if (allIncludes.length && y < 230) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GREEN);
    doc.text("WHAT'S INCLUDED IN YOUR CLEAN", 20, y);
    y += 5;

    const half = Math.ceil(allIncludes.length / 2);
    const col1 = allIncludes.slice(0, half);
    const col2 = allIncludes.slice(half);
    const maxRows = Math.max(col1.length, col2.length);

    for (let i = 0; i < maxRows; i++) {
      if (i % 2 === 0) { doc.setFillColor(...LGRAY); doc.rect(14, y, 182, 6, "F"); }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BLACK);
      if (col1[i]) {
        doc.setTextColor(...GREEN);
        doc.text("✓", 18, y + 4.5);
        doc.setTextColor(...BLACK);
        doc.text(col1[i], 23, y + 4.5);
      }
      if (col2[i]) {
        doc.setTextColor(...GREEN);
        doc.text("✓", 109, y + 4.5);
        doc.setTextColor(...BLACK);
        doc.text(col2[i], 114, y + 4.5);
      }
      y += 6;
    }
    y += 6;
  }

  // Disclaimer
  if (y < 240) {
    doc.setFillColor(...YELLOW);
    doc.rect(14, y, 182, 2, "F");
    doc.setFillColor(255, 250, 220);
    const disclaimerLines = doc.splitTextToSize(CONFIG.quote.disclaimer, 168);
    const dHeight = disclaimerLines.length * 4.5 + 14;
    doc.rect(14, y, 182, dHeight, "F");
    doc.setDrawColor(...YBORD);
    doc.rect(14, y, 182, dHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 80, 0);
    doc.text("IMPORTANT NOTICE", 20, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(disclaimerLines, 20, y + 13);
    y += dHeight + 6;
  }

  // Notes
  if (formData.notes && y < 255) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("NOTES", 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);
    const noteLines = doc.splitTextToSize(formData.notes, 168);
    doc.text(noteLines, 20, y + 5);
  }

  // Footer
  doc.setFillColor(...BLACK);
  doc.rect(0, 282, 210, 15, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${CONFIG.business.name}  |  ${CONFIG.business.city}  |  ${CONFIG.business.phone}  |  ${CONFIG.business.email}`, 105, 291, { align: "center" });

  doc.save(`KlinyServices-Quote-${state.quoteId || "Draft"}.pdf`);
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show " + (type || "");
  setTimeout(() => t.classList.remove("show"), 3500);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("page-home")?.classList.add("active");
  if (window.emailjs) emailjs.init(CONFIG.emailjs.publicKey);
});