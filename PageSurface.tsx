// Categorie — immagini (light + night) sostituibili da admin.
// Foto consigliate: 800×500px (16:10), WebP q82–85 o JPEG q85.
export interface Category {
  id: string;
  label: string;
  imgLight: string;
  imgNight: string;
}

const img = (id: string, mode: 'light' | 'night') =>
  new URL(`../assets/categories/${id}_${mode}.png`, import.meta.url).href;

export const mockCategories: Category[] = [
  { id: 'vasi',    label: 'Vasi',              imgLight: img('vasi', 'light'),    imgNight: img('vasi', 'night') },
  { id: 'lampade', label: 'Lampade',           imgLight: img('lampade', 'light'), imgNight: img('lampade', 'night') },
  { id: 'orologi', label: 'Orologi da parete', imgLight: img('orologi', 'light'), imgNight: img('orologi', 'night') },
  { id: 'decor',   label: 'Orologi da tavolo', imgLight: img('decor', 'light'),   imgNight: img('decor', 'night') },
];
