// ===============================
// FitBlueprint MVP (client-side)
// ===============================

// 1) Put YOUR Amazon Associate tag here (example: "fitblueprint-20")
const AFFILIATE = {
  amazonTag: "YOURTAG-20", // <-- CHANGE THIS
  // Optional: you can also add other partner base urls later
};

// Starter product catalog (replace ASINs with your preferred top converters)
const CATALOG = [
  // Core / universal
  { id:"mat", name:"Thick Exercise Mat", cat:"Yoga/General", footprint:[72,24], price:35, asin:"B07G2ZQK9L", tags:["yoga","mobility","recovery"] },
  { id:"bands", name:"Resistance Bands Set", cat:"Strength", footprint:[10,6], price:25, asin:"B01AVDVHTI", tags:["strength","muscle","crossfit"] },
  { id:"kettlebell", name:"Kettlebell (35 lb)", cat:"Strength", footprint:[10,10], price:55, asin:"B07X2KPN8W", tags:["strength","crossfit","muscle"] },
  { id:"db_adj", name:"Adjustable Dumbbells (Pair)", cat:"Weights", footprint:[16,8], price:299, asin:"B07Q3Y2J6Q", tags:["strength","muscle","weights"] },
  { id:"bench", name:"Adjustable Weight Bench", cat:"Weights", footprint:[50,20], price:159, asin:"B07B3QMNZL", tags:["weights","strength","muscle"] },
  { id:"rack_compact", name:"Compact Squat Stand / Rack", cat:"Weights", footprint:[50,48], price:249, asin:"B07KJH7KQ6", tags:["weights","strength","crossfit"] },
  { id:"plates", name:"Bumper Plates Set", cat:"Weights", footprint:[18,18], price:199, asin:"B07D1B4Z2M", tags:["weights","crossfit","strength"] },
  { id:"barbell", name:"Olympic Barbell", cat:"Weights", footprint:[86,2], price:189, asin:"B07KQ4Q6Q1", tags:["weights","crossfit","strength"] },
  { id:"storage_tree", name:"Dumbbell / Plate Storage Rack", cat:"Storage", footprint:[24,24], price:129, asin:"B07H9XQ5ZQ", tags:["storage"] },

  // Cardio
  { id:"jump", name:"Speed Jump Rope", cat:"Cardio", footprint:[10,6], price:14, asin:"B00K1QJ4QG", tags:["cardio","crossfit","endurance"] },
  { id:"bike", name:"Stationary Bike (Compact)", cat:"Cardio", footprint:[42,20], price:299, asin:"B08R6WJ3QK", tags:["cardio","endurance","cycling"] },
  { id:"tread_fold", name:"Folding Treadmill", cat:"Cardio", footprint:[60,28], price:449, asin:"B09JZ3QH4Z", tags:["cardio","weight_loss","endurance"] },

  // Rowing
  { id:"row", name:"Rowing Machine (Foldable)", cat:"Rowing", footprint:[84,20], price:399, asin:"B07BNQ7F3K", tags:["rowing","cardio","endurance"] },

  // Boxing
  { id:"wraps", name:"Boxing Hand Wraps", cat:"Boxing", footprint:[8,4], price:12, asin:"B01M0N7Q4F", tags:["boxing"] },
  { id:"gloves", name:"Boxing Gloves (14oz)", cat:"Boxing", footprint:[14,10], price:49, asin:"B01N7Q3Q9N", tags:["boxing"] },
  { id:"bag", name:"Heavy Bag + Hanging Kit", cat:"Boxing", footprint:[48,16], price:159, asin:"B07Q2Q4H5K", tags:["boxing","cardio"] },

  // Flooring / noise
  { id:"tiles", name:"Rubber Flooring Tiles (Pack)", cat:"Flooring", footprint:[24,24], price:79, asin:"B00K2Q1ZQ4", tags:["noise","flooring"] },
  { id:"under", name:"Vibration / Equipment Mat", cat:"Noise", footprint:[36,24], price:39, asin:"B01M7Q5Z2Q", tags:["noise"] },
];

const $ = (id) => document.getElementById(id);

const state = {
  goals: new Set(),
  trainings: new Set(["weights","cardio"]),
  lastPlan: null
};

// --- UI wiring
$("year").textContent = new Date().getFullYear();

const budgetEl = $("budget");
const budgetVal = $("budgetVal");
budgetVal.textContent = `$${Number(budgetEl.value).toLocaleString()}`;
budgetEl.addEventListener("input", () => {
  budgetVal.textContent = `$${Number(budgetEl.value).toLocaleString()}`;
});

document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    const k = btn.dataset.goal;
    if (state.goals.has(k)) { state.goals.delete(k); btn.classList.remove("is-on"); }
    else { state.goals.add(k); btn.classList.add("is-on"); }
  });
});

document.querySelectorAll('.checks input[type="checkbox"]').forEach(cb => {
  cb.addEventListener("change", () => {
    if (cb.checked) state.trainings.add(cb.value);
    else state.trainings.delete(cb.value);
  });
});

// Photo preview
$("roomPhoto").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  $("photoPreview").src = url;
  $("photoPreviewWrap").style.display = "block";
  $("photoMeta").textContent = `${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`;
});

// Modals
const disclosure = $("modalDisclosure");
const privacy = $("modalPrivacy");
$("openDisclosure").addEventListener("click", (e)=>{ e.preventDefault(); disclosure.showModal(); });
$("openPrivacy").addEventListener("click", (e)=>{ e.preventDefault(); privacy.showModal(); });
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", ()=> b.closest("dialog").close()));

// Main generate
$("generate").addEventListener("click", () => {
  const plan = buildPlan(readInputs());
  state.lastPlan = plan;
  render(plan);
});

// Copy list
$("copyList").addEventListener("click", async () => {
  if (!state.lastPlan) return;
  const lines = state.lastPlan.items.map(p => `${p.name} — $${p.price} — ${amazonLink(p.asin)}`);
  const text = ["FitBlueprint Shopping List", ...lines, `Estimated total: $${state.lastPlan.total}`].join("\n");
  try{
    await navigator.clipboard.writeText(text);
    alert("Copied shopping list to clipboard.");
  }catch{
    alert("Could not copy automatically. (Browser permissions) You can still select and copy from the table.");
  }
});

// Download plan (simple)
$("download").addEventListener("click", () => {
  if (!state.lastPlan) return;
  const html = exportPlanHTML(state.lastPlan);
  const blob = new Blob([html], {type:"text/html"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fitblueprint-plan.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

function readInputs(){
  const lenFt = clampNum($("lenFt").value, 4, 60);
  const widFt = clampNum($("widFt").value, 4, 60);
  const ceilFt = clampNum($("ceilFt").value, 6, 20);
  const budget = clampNum($("budget").value, 200, 50000);
  const pref = $("pref").value;
  const noise = $("noise").value;
  const storage = $("storage").value;
  const floorType = $("floorType").value;

  return {
    lenFt, widFt, ceilFt, budget, pref, noise, storage, floorType,
    goals: Array.from(state.goals),
    trainings: Array.from(state.trainings),
  };
}

function buildPlan(input){
  const area = input.lenFt * input.widFt;
  const roomIn = { L: input.lenFt * 12, W: input.widFt * 12 };
  const maxFootprint = Math.floor(area * 144 * 0.25); // allow ~25% of room area for equipment footprints in MVP
  const compactBias = input.pref === "compact" ? 1.2 : 1.0;

  // Score each product based on training tags and goals
  const scored = CATALOG.map(p => {
    let score = 0;

    // Training match
    for (const t of input.trainings) if (p.tags.includes(t)) score += 4;

    // Goal match
    if (input.goals.includes("weight_loss") && (p.tags.includes("cardio") || p.tags.includes("rowing"))) score += 3;
    if (input.goals.includes("strength") && (p.tags.includes("strength") || p.tags.includes("weights"))) score += 3;
    if (input.goals.includes("muscle") && (p.tags.includes("weights") || p.tags.includes("muscle"))) score += 3;
    if (input.goals.includes("endurance") && (p.tags.includes("cardio") || p.tags.includes("rowing"))) score += 3;
    if (input.goals.includes("mobility") && (p.tags.includes("yoga") || p.tags.includes("recovery"))) score += 3;
    if (input.goals.includes("boxing") && p.tags.includes("boxing")) score += 5;

    // Noise considerations
    if (input.noise === "high" && (p.id === "tiles" || p.id === "under")) score += 4;
    if (input.noise === "high" && p.id === "barbell") score -= 1;

    // Floor type
    if (input.floorType === "hard" && p.id === "tiles") score += 2;
    if (input.floorType === "carpet" && p.id === "under") score += 2;
    if (input.floorType === "garage" && (p.id === "rack_compact" || p.id === "plates")) score += 1;

    // Storage needs
    if (input.storage === "high" && p.id === "storage_tree") score += 3;

    // Compact preference: favor smaller footprints
    const footprintArea = (p.footprint[0] * p.footprint[1]);
    const footprintPenalty = (footprintArea / 2000) / compactBias; // scale
    score -= footprintPenalty;

    return { ...p, _score: score, _footArea: footprintArea };
  });

  // Filter out items that exceed room dimensions unreasonably (basic check)
  const fitsRoom = (p) => {
    const [a,b] = p.footprint;
    return (a <= roomIn.L && b <= roomIn.W) || (b <= roomIn.L && a <= roomIn.W);
  };

  const candidates = scored
    .filter(p => fitsRoom(p))
    .sort((a,b) => b._score - a._score);

  // Build a balanced basket
  const mustHave = [];
  const wants = [];

  // Universal base: flooring/noise and a mat if yoga/mobility/recovery selected
  if (input.noise !== "low" || input.floorType !== "garage") mustHave.push("tiles");
  if (input.noise === "high") mustHave.push("under");
  if (input.trainings.includes("yoga") || input.goals.includes("mobility") || input.trainings.includes("recovery")) mustHave.push("mat");

  // Core strength base
  if (input.trainings.includes("weights") || input.trainings.includes("crossfit")) {
    mustHave.push("db_adj", "bench", "bands");
    if (area >= 110 && input.budget >= 700) wants.push("rack_compact", "barbell", "plates");
  } else if (input.trainings.includes("crossfit")) {
    mustHave.push("kettlebell", "jump", "bands");
  }

  // Cardio / endurance
  if (input.trainings.includes("rowing")) wants.push("row");
  if (input.trainings.includes("cardio")) {
    // pick bike vs treadmill depending on space
    if (roomIn.L >= 120 && roomIn.W >= 96) wants.push("tread_fold");
    else wants.push("bike");
    wants.push("jump");
  }

  // Boxing
  if (input.trainings.includes("boxing") || input.goals.includes("boxing")) {
    mustHave.push("wraps","gloves");
    if (area >= 100 && input.budget >= 500) wants.push("bag");
  }

  // Storage
  if (input.storage !== "low") wants.push("storage_tree");

  // Deduplicate while preserving order
  const uniqueIds = [];
  const pushUnique = (id) => { if (!uniqueIds.includes(id)) uniqueIds.push(id); };
  mustHave.forEach(pushUnique);
  wants.forEach(pushUnique);

  // Select items by budget and footprint constraints
  let total = 0;
  let footprintSum = 0;
  const selected = [];

  for (const id of uniqueIds) {
    const p = candidates.find(x => x.id === id) || CATALOG.find(x => x.id === id);
    if (!p) continue;
    const nextTotal = total + p.price;
    const nextFoot = footprintSum + (p.footprint[0] * p.footprint[1]);

    if (nextTotal <= input.budget && nextFoot <= maxFootprint) {
      selected.push(p);
      total = nextTotal;
      footprintSum = nextFoot;
    }
  }

  // If nothing selected (tiny budgets), choose a minimal “starter kit”
  if (selected.length === 0) {
    const starter = ["bands","mat","jump"].map(id => CATALOG.find(p => p.id === id)).filter(Boolean);
    starter.forEach(p => { if (total + p.price <= input.budget) { selected.push(p); total += p.price; } });
  }

  // Zones suggestion (simple)
  const zones = [];
  if (input.trainings.includes("weights") || input.trainings.includes("crossfit")) zones.push("Strength zone: bench + dumbbells near one wall");
  if (input.trainings.includes("cardio")) zones.push("Cardio zone: bike/tread along the longest wall");
  if (input.trainings.includes("rowing")) zones.push("Row zone: rower aligned with room length");
  if (input.trainings.includes("yoga") || input.trainings.includes("recovery")) zones.push("Mobility zone: mat in open floor area");
  if (input.trainings.includes("boxing")) zones.push("Boxing zone: clear radius around bag (if included)");

  const checks = [];
  checks.push(`Room size: ${input.lenFt}ft × ${input.widFt}ft (${area.toFixed(0)} sq ft)`);
  checks.push(`Selected footprint: ${(footprintSum/144).toFixed(1)} sq ft (target ≤ ${(maxFootprint/144).toFixed(1)} sq ft)`);
  checks.push(`Budget: $${input.budget.toLocaleString()} · Estimated: $${total.toLocaleString()}`);
  if (input.noise === "high") checks.push("Noise: High → added vibration + flooring recommendations");
  if (input.ceilFt < 7.5) checks.push("Ceiling: Low → avoid tall racks/pull-up rigs (MVP does compact picks)");

  const summary = buildSummaryText(input, selected, total);

  return { input, area, items: selected, total, zones, checks };
}

function buildSummaryText(input, items, total){
  const trainings = input.trainings.map(t => title(t)).join(", ");
  const goals = (input.goals.length ? input.goals.map(g => title(g.replace("_"," "))).join(", ") : "General fitness");
  const headline = `Plan for ${goals} — focused on ${trainings}.`;
  const note = `We prioritized space-aware equipment and kept the estimated total near your budget.`;
  const n = items.length;
  return `${headline} Recommended ${n} item${n===1?"":"s"} with an estimated total of $${total.toLocaleString()}. ${note}`;
}

function render(plan){
  $("summary").textContent = plan.summary;
  $("zones").innerHTML = plan.zones.map(z => `<li>${escapeHtml(z)}</li>`).join("") || `<li class="muted">No zones generated yet.</li>`;
  $("checks").innerHTML = plan.checks.map(c => `<li>${escapeHtml(c)}</li>`).join("");

  const rows = plan.items.map(p => {
    const fp = `${p.footprint[0]}×${p.footprint[1]}`;
    const url = amazonLink(p.asin);
    return `
      <tr>
        <td>
          <div style="font-weight:900">${escapeHtml(p.name)}</div>
          <div class="muted tiny">${escapeHtml(p.id.toUpperCase())}</div>
        </td>
        <td><span class="pill">${escapeHtml(p.cat)}</span></td>
        <td class="muted">${fp}</td>
        <td style="font-weight:900">$${Number(p.price).toLocaleString()}</td>
        <td style="text-align:right">
          <a class="btn btn--ghost" href="${url}" target="_blank" rel="noopener noreferrer">Buy on Amazon</a>
        </td>
      </tr>
    `;
  }).join("");

  $("products").innerHTML = rows || `<tr><td colspan="5" class="muted">No products selected.</td></tr>`;
  $("count").textContent = plan.items.length.toString();
  $("total").textContent = `$${Number(plan.total).toLocaleString()}`;
}

function amazonLink(asin){
  // Using the dp link format. Tag added as required.
  const tag = encodeURIComponent(AFFILIATE.amazonTag || "YOURTAG-20");
  return `https://www.amazon.com/dp/${encodeURIComponent(asin)}?tag=${tag}`;
}

function exportPlanHTML(plan){
  const items = plan.items.map(p => `
    <li>
      <strong>${escapeHtml(p.name)}</strong> — $${p.price}
      — <a href="${amazonLink(p.asin)}">Amazon link</a>
      <div style="opacity:.8;font-size:12px">Footprint: ${p.footprint[0]}×${p.footprint[1]} in · Category: ${escapeHtml(p.cat)}</div>
    </li>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>FitBlueprint Plan</title>
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.4;padding:18px;max-width:860px;margin:0 auto">
  <h1>FitBlueprint Plan</h1>
  <p>${escapeHtml(plan.summary)}</p>
  <h3>Zones</h3>
  <ul>${plan.zones.map(z=>`<li>${escapeHtml(z)}</li>`).join("")}</ul>
  <h3>Shopping List</h3>
  <ul>${items}</ul>
  <p><strong>Estimated total:</strong> $${Number(plan.total).toLocaleString()}</p>
  <hr/>
  <p style="opacity:.75;font-size:12px">Affiliate disclosure: As an Amazon Associate, we earn from qualifying purchases.</p>
</body>
</html>`;
}

function clampNum(v, min, max){
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function title(s){ return s.replace(/(^|\s)\S/g, t => t.toUpperCase()); }
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
