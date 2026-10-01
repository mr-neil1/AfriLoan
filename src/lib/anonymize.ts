export const AFRICAN_FIRST_NAMES = [
  "Mamadou", "Ibrahim", "Amadou", "Oumar", "Seydou", "Abdoulaye", "Adama", "Moussa",
  "Boubacar", "Bakary", "Souleymane", "Cheick", "Tidiane", "Lamine", "Youssouf", "Alassane",
  "Harouna", "Issouf", "Drissa", "Salif", "Lassina", "Siaka", "Daouda", "Sekou",
  "Modibo", "Hamed", "Mohamed", "Jean-Marc", "Jean-Yves", "Koffi", "Kouassi", "Yao",
  "Konan", "Kouamé", "N'Guessan", "N'Dri", "Brou", "Patrick", "Christian", "Emmanuel",
  "David", "Serge", "Stéphane", "Thierry", "Brice", "Kevin", "Fabrice", "Franck",
  "Fatou", "Aïcha", "Aminata", "Mariam", "Fanta", "Bintou", "Kadiatou", "Oumou",
  "Rokiatou", "Djeneba", "Saran", "Salimata", "Assetou", "Nafissatou", "Ramatoulaye",
  "Coumba", "Astou", "Khady", "Yacine", "Awa", "Sokhna", "Penda", "Adja", "Anta"
];

export const AFRICAN_LAST_NAMES = [
  "Traoré", "Konan", "Kouamé", "Diop", "Bamba", "Diallo", "N'Guessan", "Touré",
  "Cissé", "Kouassi", "Sidibé", "Yao", "N'Dri", "Keita", "Bado", "Gnakpa",
  "Mensah", "Ouattara", "Aka", "Sow", "Ba", "Kane", "Camara", "Fofana",
  "Diarra", "Barry", "Sylla", "Koné", "Coulibaly", "Soro", "Tuo", "Silué",
  "Yeo", "Bakayoko", "Sangaré", "Doumbia", "Sanogo", "Dembélé", "Samaké", "Guindo",
  "Maïga", "Niang", "Ndiaye", "Fall", "Diouf", "Faye", "Seck", "Gueye"
];

export const AFRICAN_CITIES = [
  "Abidjan", "Dakar", "Douala", "Yaoundé", "Bamako", "Ouagadougou", "Lomé", "Cotonou",
  "Conakry", "Niamey", "Libreville", "Brazzaville", "Kinshasa", "Kigali"
];

export function getRandomBorrowerName(): string {
  const fIdx = Math.floor(Math.random() * AFRICAN_FIRST_NAMES.length);
  const lIdx = Math.floor(Math.random() * AFRICAN_LAST_NAMES.length);
  return `${AFRICAN_FIRST_NAMES[fIdx]} ${AFRICAN_LAST_NAMES[lIdx].slice(0, 1)}.`;
}

export function getRandomCity(): string {
  return AFRICAN_CITIES[Math.floor(Math.random() * AFRICAN_CITIES.length)];
}
