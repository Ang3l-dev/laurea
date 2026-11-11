/* ============================================================
   CONFIGURAZIONE DELL'INVITO — modifica solo questo blocco
   ============================================================ */
const CONFIG = {
  nome: "Andrea Venticinque",
  corso: "Corso di Laurea in Ingegneria Industriale",
  universita: "",                             // facoltativo: lascia vuoto per non mostrarla
  data: "2026-11-21",                         // AAAA-MM-GG del giorno della festa
  fine: "16:00",                              // orario indicativo di fine (per il calendario)
  rsvpEntro: "18 novembre",
  // WhatsApp per le conferme: prefisso internazionale senza "+" né spazi
  whatsapp: "393669028675",
  // In alternativa (o in aggiunta) un'email per le conferme
  email: "",
  programma: [
    { ora: "11:00", icona: "🎓", titolo: "Arrivo in cantina", testo: "Ci ritroviamo alle Cantine La Contea, a Mascali." },
    { ora: "11:30", icona: "🍷", titolo: "Degustazione", testo: "Visita al palmento e degustazione dei vini dell'Etna DOC." },
    { ora: "13:00", icona: "🍽️", titolo: "Pranzo", testo: "A tavola insieme, tra i vigneti con vista sul mare." },
  ],
};

/* ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- Testi dinamici ---- */
const [y, m, d] = CONFIG.data.split("-").map(Number);
const eventDate = new Date(y, m - 1, d);
const iniziali = CONFIG.nome.split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();

const values = {
  nome: CONFIG.nome,
  corso: CONFIG.corso,
  universita: CONFIG.universita,
  rsvpEntro: CONFIG.rsvpEntro,
  iniziali,
  giornoSettimana: eventDate.toLocaleDateString("it-IT", { weekday: "long" }),
  giorno: String(d),
  meseAnno: eventDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" }),
};
$$("[data-bind]").forEach(el => {
  el.textContent = values[el.dataset.bind] ?? "";
  if (!el.textContent) el.hidden = true;
});
document.title = `Invito di Laurea · ${CONFIG.nome}`;

/* Giorni mancanti: calcolati una volta, nessun timer */
const today = new Date(); today.setHours(0, 0, 0, 0);
const diff = Math.round((eventDate - today) / 86400000);
$("#countdown").textContent =
  diff > 1 ? `Mancano ${diff} giorni` : diff === 1 ? "È domani!" : diff === 0 ? "È oggi!" : "Grazie a chi c'era";

/* ---- Programma ---- */
$("#timeline").innerHTML = CONFIG.programma.map(p => `
  <li class="reveal">
    <span class="timeline__icon" aria-hidden="true">${p.icona}</span>
    <div>
      <div class="timeline__time">${p.ora}</div>
      <div class="timeline__title">${p.titolo}</div>
      <p class="timeline__text">${p.testo}</p>
    </div>
  </li>`).join("");

/* ---- Foto reali: se esistono in img/ sostituiscono l'illustrazione ---- */
$$(".photo svg").forEach(s => s.setAttribute("preserveAspectRatio", "xMidYMid slice"));
$$(".photo[data-src]").forEach(fig => {
  const img = new Image();
  img.alt = fig.querySelector("figcaption")?.textContent || "";
  img.onload = () => fig.insertBefore(img, fig.querySelector("figcaption"));
  img.src = fig.dataset.src;
});

/* ---- Comparsa al scroll (una volta) ---- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const siblings = $$(".reveal:not(.is-in)", e.target.parentElement);
    const i = Math.max(0, siblings.indexOf(e.target));
    e.target.style.transitionDelay = `${Math.min(i, 4) * 90}ms`;
    e.target.classList.add("is-in");
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

/* ---- Apertura della busta ---- */
const intro = $("#intro");
const envelope = $("#openBtn");
let opened = false;

function openInvite() {
  if (opened) return;
  opened = true;
  envelope.classList.add("is-open");
  const delay = reduceMotion ? 0 : 1500;
  setTimeout(() => {
    intro.classList.add("is-gone");
    document.body.classList.remove("is-locked");
    $$(".reveal").forEach(el => io.observe(el));
    if (!reduceMotion) confetti();
  }, delay);
}
envelope.addEventListener("click", openInvite);

/* ---- Coriandoli: una sola raffica, poi si fermano ---- */
function confetti() {
  const c = $("#confetti");
  const ctx = c.getContext("2d");
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#6b1f2e", "#b88a44", "#e7b96a", "#8c3a4a", "#7d8b4f"];
  const parts = Array.from({ length: 70 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3,
    s: Math.random() * 6 + 4, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    col: colors[(Math.random() * colors.length) | 0],
  }));
  const start = performance.now();
  (function frame(t) {
    const life = (t - start) / 2600;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (life >= 1) return;
    ctx.globalAlpha = 1 - life * life;
    parts.forEach(p => {
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  })(start);
}

/* ---- Conferma presenza (WhatsApp o email) ---- */
$("#rsvp").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const yes = e.submitter?.value !== "no";
  const nome = f.get("nome").trim();
  const note = f.get("note").trim();
  const msg = yes
    ? `Ciao! Sono ${nome}, ci sarò alla tua festa di laurea il ${d} ${values.meseAnno} 🥂 Saremo in ${f.get("persone")}.${note ? ` Note: ${note}.` : ""}`
    : `Ciao! Sono ${nome}, purtroppo non riesco a esserci il ${d} ${values.meseAnno}. Congratulazioni di cuore! 🎓`;

  if (CONFIG.whatsapp) {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  } else if (CONFIG.email) {
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Festa di laurea")}&body=${encodeURIComponent(msg)}`;
  } else {
    alert("Conferma registrata in anteprima:\n\n" + msg + "\n\n(Imposta whatsapp o email in app.js)");
  }
});

/* ---- Aggiungi al calendario (.ics) ---- */
$("#calBtn").addEventListener("click", () => {
  const pad = n => String(n).padStart(2, "0");
  const first = CONFIG.programma[0]?.ora || "11:00";
  const last = CONFIG.fine || "17:00";
  const stamp = (hm) => `${y}${pad(m)}${pad(d)}T${hm.replace(":", "")}00`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//invito-laurea//IT", "BEGIN:VEVENT",
    `UID:laurea-${CONFIG.data}@invito`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${stamp(first)}`, `DTEND:${stamp(last)}`,
    `SUMMARY:Festa di laurea di ${CONFIG.nome}`,
    "LOCATION:Cantine La Contea\\, Via Santa Venera Superiore 25\\, Mascali (CT)",
    "DESCRIPTION:Degustazione di vini e pranzo alle Cantine La Contea.",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "festa-di-laurea.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
