export function formatPrice(price, transaction) {
  const formatted = new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return transaction === 'Location'
    ? `${formatted} DT/mois`
    : `${formatted} DT`;
}

export function formatSurface(m2) {
  return m2 ? `${m2} m²` : null;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('fr-TN', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine(s)`;
  return formatDate(dateStr);
}

export const PROPERTY_TYPE_LABELS = {
  Appartement: 'Appartement',
  Villa: 'Villa',
  Maison: 'Maison',
  Bureau: 'Bureau',
  Terrain: 'Terrain',
  Garage: 'Garage',
  'Local commercial': 'Local commercial',
  Ferme: 'Ferme',
};

export const GOVERNORATES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
  'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia',
  'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
  'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

export const TUNISIAN_CITIES = [
  { name: 'Ariana', latitude: 36.8601, longitude: 10.1934 },
  { name: 'Béja', latitude: 36.7256, longitude: 9.1817 },
  { name: 'Ben Arous', latitude: 36.7531, longitude: 10.2187 },
  { name: 'Bizerte', latitude: 37.2744, longitude: 9.8739 },
  { name: 'Gabès', latitude: 33.8815, longitude: 10.0982 },
  { name: 'Gafsa', latitude: 34.4250, longitude: 8.7842 },
  { name: 'Jendouba', latitude: 36.5011, longitude: 8.7804 },
  { name: 'Kairouan', latitude: 35.6781, longitude: 10.0960 },
  { name: 'Kasserine', latitude: 35.1678, longitude: 8.8365 },
  { name: 'Kébili', latitude: 33.7045, longitude: 8.9690 },
  { name: 'Le Kef', latitude: 36.1740, longitude: 8.7041 },
  { name: 'Mahdia', latitude: 35.5047, longitude: 11.0622 },
  { name: 'Manouba', latitude: 36.8090, longitude: 10.0975 },
  { name: 'Médenine', latitude: 33.3540, longitude: 10.5055 },
  { name: 'Monastir', latitude: 35.7778, longitude: 10.8261 },
  { name: 'Nabeul', latitude: 36.4561, longitude: 10.7360 },
  { name: 'Sfax', latitude: 34.7405, longitude: 10.7605 },
  { name: 'Sidi Bouzid', latitude: 35.0382, longitude: 9.4847 },
  { name: 'Siliana', latitude: 36.0844, longitude: 9.3702 },
  { name: 'Sousse', latitude: 35.8256, longitude: 10.6367 },
  { name: 'Tataouine', latitude: 32.9294, longitude: 10.4518 },
  { name: 'Tozeur', latitude: 33.9197, longitude: 8.1334 },
  { name: 'Tunis', latitude: 36.8065, longitude: 10.1815 },
  { name: 'Zaghouan', latitude: 36.4028, longitude: 10.1424 },
];

export function getCityCoordinates(cityName) {
  const city = TUNISIAN_CITIES.find(c => c.name.toLowerCase() === String(cityName || '').trim().toLowerCase());
  return city ? { latitude: city.latitude, longitude: city.longitude } : null;
}
