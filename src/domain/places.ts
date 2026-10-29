/**
 * Větší česká města pro přibližnou polohu. Klient ani odborník nezadávají
 * adresu, jen nejbližší větší město. Souřadnice jsou přibližné středy měst
 * a slouží jen k odhadu vzdálenosti vzdušnou čarou.
 */

export interface City {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
}

export const CITIES: readonly City[] = [
  { id: 'praha', name: 'Praha', region: 'Hlavní město Praha', lat: 50.08, lon: 14.43 },
  { id: 'kladno', name: 'Kladno', region: 'Středočeský kraj', lat: 50.15, lon: 14.1 },
  { id: 'mlada-boleslav', name: 'Mladá Boleslav', region: 'Středočeský kraj', lat: 50.41, lon: 14.9 },
  { id: 'kolin', name: 'Kolín', region: 'Středočeský kraj', lat: 50.03, lon: 15.2 },
  { id: 'pribram', name: 'Příbram', region: 'Středočeský kraj', lat: 49.69, lon: 14.01 },
  { id: 'beroun', name: 'Beroun', region: 'Středočeský kraj', lat: 49.96, lon: 14.07 },
  { id: 'benesov', name: 'Benešov', region: 'Středočeský kraj', lat: 49.78, lon: 14.69 },
  { id: 'ceske-budejovice', name: 'České Budějovice', region: 'Jihočeský kraj', lat: 48.97, lon: 14.47 },
  { id: 'tabor', name: 'Tábor', region: 'Jihočeský kraj', lat: 49.41, lon: 14.68 },
  { id: 'pisek', name: 'Písek', region: 'Jihočeský kraj', lat: 49.31, lon: 14.15 },
  { id: 'plzen', name: 'Plzeň', region: 'Plzeňský kraj', lat: 49.74, lon: 13.38 },
  { id: 'klatovy', name: 'Klatovy', region: 'Plzeňský kraj', lat: 49.4, lon: 13.3 },
  { id: 'karlovy-vary', name: 'Karlovy Vary', region: 'Karlovarský kraj', lat: 50.23, lon: 12.87 },
  { id: 'cheb', name: 'Cheb', region: 'Karlovarský kraj', lat: 50.08, lon: 12.37 },
  { id: 'usti-nad-labem', name: 'Ústí nad Labem', region: 'Ústecký kraj', lat: 50.66, lon: 14.03 },
  { id: 'teplice', name: 'Teplice', region: 'Ústecký kraj', lat: 50.64, lon: 13.82 },
  { id: 'most', name: 'Most', region: 'Ústecký kraj', lat: 50.5, lon: 13.64 },
  { id: 'chomutov', name: 'Chomutov', region: 'Ústecký kraj', lat: 50.46, lon: 13.42 },
  { id: 'decin', name: 'Děčín', region: 'Ústecký kraj', lat: 50.78, lon: 14.21 },
  { id: 'liberec', name: 'Liberec', region: 'Liberecký kraj', lat: 50.77, lon: 15.06 },
  { id: 'jablonec-nad-nisou', name: 'Jablonec nad Nisou', region: 'Liberecký kraj', lat: 50.72, lon: 15.17 },
  { id: 'ceska-lipa', name: 'Česká Lípa', region: 'Liberecký kraj', lat: 50.69, lon: 14.54 },
  { id: 'hradec-kralove', name: 'Hradec Králové', region: 'Královéhradecký kraj', lat: 50.21, lon: 15.83 },
  { id: 'trutnov', name: 'Trutnov', region: 'Královéhradecký kraj', lat: 50.56, lon: 15.91 },
  { id: 'nachod', name: 'Náchod', region: 'Královéhradecký kraj', lat: 50.42, lon: 16.16 },
  { id: 'pardubice', name: 'Pardubice', region: 'Pardubický kraj', lat: 50.04, lon: 15.78 },
  { id: 'chrudim', name: 'Chrudim', region: 'Pardubický kraj', lat: 49.95, lon: 15.79 },
  { id: 'svitavy', name: 'Svitavy', region: 'Pardubický kraj', lat: 49.76, lon: 16.47 },
  { id: 'jihlava', name: 'Jihlava', region: 'Kraj Vysočina', lat: 49.4, lon: 15.59 },
  { id: 'trebic', name: 'Třebíč', region: 'Kraj Vysočina', lat: 49.21, lon: 15.88 },
  { id: 'havlickuv-brod', name: 'Havlíčkův Brod', region: 'Kraj Vysočina', lat: 49.61, lon: 15.58 },
  { id: 'brno', name: 'Brno', region: 'Jihomoravský kraj', lat: 49.2, lon: 16.61 },
  { id: 'znojmo', name: 'Znojmo', region: 'Jihomoravský kraj', lat: 48.86, lon: 16.05 },
  { id: 'breclav', name: 'Břeclav', region: 'Jihomoravský kraj', lat: 48.76, lon: 16.88 },
  { id: 'hodonin', name: 'Hodonín', region: 'Jihomoravský kraj', lat: 48.85, lon: 17.13 },
  { id: 'olomouc', name: 'Olomouc', region: 'Olomoucký kraj', lat: 49.59, lon: 17.25 },
  { id: 'prostejov', name: 'Prostějov', region: 'Olomoucký kraj', lat: 49.47, lon: 17.11 },
  { id: 'prerov', name: 'Přerov', region: 'Olomoucký kraj', lat: 49.46, lon: 17.45 },
  { id: 'sumperk', name: 'Šumperk', region: 'Olomoucký kraj', lat: 49.97, lon: 16.97 },
  { id: 'zlin', name: 'Zlín', region: 'Zlínský kraj', lat: 49.23, lon: 17.67 },
  { id: 'kromeriz', name: 'Kroměříž', region: 'Zlínský kraj', lat: 49.3, lon: 17.39 },
  { id: 'uherske-hradiste', name: 'Uherské Hradiště', region: 'Zlínský kraj', lat: 49.07, lon: 17.46 },
  { id: 'vsetin', name: 'Vsetín', region: 'Zlínský kraj', lat: 49.34, lon: 17.99 },
  { id: 'ostrava', name: 'Ostrava', region: 'Moravskoslezský kraj', lat: 49.83, lon: 18.29 },
  { id: 'opava', name: 'Opava', region: 'Moravskoslezský kraj', lat: 49.94, lon: 17.9 },
  { id: 'havirov', name: 'Havířov', region: 'Moravskoslezský kraj', lat: 49.78, lon: 18.43 },
  { id: 'frydek-mistek', name: 'Frýdek-Místek', region: 'Moravskoslezský kraj', lat: 49.68, lon: 18.35 },
  { id: 'karvina', name: 'Karviná', region: 'Moravskoslezský kraj', lat: 49.85, lon: 18.54 },
];

export const CITY_IDS = CITIES.map((c) => c.id);

export function cityById(id: string | null | undefined): City | null {
  if (!id) return null;
  return CITIES.find((c) => c.id === id) ?? null;
}

/** Města seskupená podle kraje pro výběrové pole. */
export function citiesByRegion(): Array<{ region: string; cities: City[] }> {
  const groups = new Map<string, City[]>();
  for (const city of CITIES) groups.set(city.region, [...(groups.get(city.region) ?? []), city]);
  return [...groups.entries()].map(([region, cities]) => ({
    region,
    cities: [...cities].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
  }));
}

/** Vzdálenost vzdušnou čarou v kilometrech (haversinův vzorec). */
export function distanceKm(a: City, b: City): number {
  if (a.id === b.id) return 0;
  const R = 6371;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** „ve stejném městě“, „cca 25 km“ */
export function formatDistance(km: number): string {
  if (km < 3) return 've stejném městě';
  if (km < 10) return `cca ${Math.round(km)} km`;
  return `cca ${Math.round(km / 5) * 5} km`;
}

/** „Online videohovor“ / „Osobně · Brno“ */
export function formatLabel(format: 'online' | 'in_person', cityId: string | null): string {
  if (format === 'online') return 'Online videohovor';
  const city = cityById(cityId);
  return city ? `Osobně · ${city.name}` : 'Osobně';
}
