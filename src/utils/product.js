/* ============================ HELPERS ================================= */
export const eur = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
export function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return "";
  return d.getDate() + " " + MESI[d.getMonth()] + " " + d.getFullYear();
}
export function gimg(a, b) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='600' height='600' fill='url(#g)'/><circle cx='300' cy='285' r='150' fill='rgba(255,255,255,.12)'/><circle cx='300' cy='285' r='95' fill='rgba(255,255,255,.10)'/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
export function avatarURI(name) {
  const init = ((name || "?").trim()[0] || "?").toUpperCase();
  const cols = ["#1593EE", "#7C4DE0", "#E0457E", "#0FA68C", "#E8801C", "#5BA34D"];
  let h = 0;
  for (const ch of name || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = cols[h % cols.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><circle cx='40' cy='40' r='40' fill='${c}'/><text x='40' y='53' font-family='Arial,sans-serif' font-size='38' font-weight='700' fill='#fff' text-anchor='middle'>${init}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
export function colImg(c) {
  if (!c) return gimg("#cfc4b4", "#9a8d79");
  return c.img || gimg(c.a, c.b);
}
export function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 2400;
        let w = img.width, h = img.height;
        if (w >= h && w > max) { h = Math.round((h * max) / w); w = max; }
        else if (h > w && h > max) { w = Math.round((w * max) / h); h = max; }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        cv.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function mapPrint(r) {
  const cols = (r.print_colors || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((c) => {
      const imgs = (c.images && c.images.length) ? c.images : (c.image_url ? [c.image_url] : []);
      return { id: c.id, name: c.name, a: c.color_a, b: c.color_b, img: imgs[0] || "", imgs };
    });
  if (!cols.length) {
    const img0 = r.images && r.images.length ? r.images[0] : "";
    cols.push({ id: null, name: "Unico", a: "#cfc4b4", b: "#9a8d79", img: img0, imgs: img0 ? [img0] : [] });
  }
  return {
    id: r.id,
    title: r.title,
    price: Number(r.price) || 0,
    material: r.material || "",
    desc: r.description || "",
    likeCount: r.like_count || 0,
    category_id: r.category_id || "",
    isElectrical: !!r.is_electrical,
    addons: { braided: Number(r.addon_braided) || 0, bulb: Number(r.addon_bulb) || 0, holder: Number(r.addon_holder) || 0 },
    allowBraided: r.allow_braided !== false,
    featured: !!r.featured,
    categoryName: r.categories ? r.categories.name : "",
    categoryIcon: r.categories ? r.categories.icon : "v_classico",
    cols,
    createdAt: r.created_at,
  };
}
