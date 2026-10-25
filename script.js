const CONFIG = {
  whatsapp: "972544500344",
  email: "akemor135@gmail.com",
};

// Header shadow on scroll
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.getElementById("navToggle");
const nav = document.getElementById("mainNav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Active nav link
const links = [...nav.querySelectorAll("a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => s && navObserver.observe(s));

// Reveal on scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// Contact form → WhatsApp / email
const form = document.getElementById("contactForm");
const errorBox = document.getElementById("formError");

function buildMessage() {
  const f = form.elements;
  const name = f.name.value.trim();
  const phone = f.phone.value.trim();
  [f.name, f.phone].forEach((el) => el.classList.remove("invalid"));
  let error = "";
  if (!name) { f.name.classList.add("invalid"); error = "נא למלא שם מלא"; }
  if (!/^[0-9+\-\s]{9,}$/.test(phone)) { f.phone.classList.add("invalid"); error = error || "נא להזין מספר טלפון תקין"; }
  errorBox.hidden = !error;
  errorBox.textContent = error;
  if (error) return null;

  const lines = [
    "פנייה חדשה מהאתר – א.ק אמור",
    `שם: ${name}`,
    `טלפון: ${phone}`,
  ];
  if (f.city.value.trim()) lines.push(`יישוב: ${f.city.value.trim()}`);
  if (f.service.value) lines.push(`סוג העבודה: ${f.service.value}`);
  if (f.message.value.trim()) lines.push(`פרטים: ${f.message.value.trim()}`);
  return lines.join("\n");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = buildMessage();
  if (!msg) return;
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

document.getElementById("sendEmail").addEventListener("click", () => {
  const msg = buildMessage();
  if (!msg) return;
  const subject = encodeURIComponent("פנייה מהאתר – הצעת מחיר");
  window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${encodeURIComponent(msg)}`;
});

document.getElementById("year").textContent = new Date().getFullYear();
