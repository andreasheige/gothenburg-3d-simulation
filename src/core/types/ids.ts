// String-literal identifier unions — the single source of truth for every id used
// across the game data. Typos in data files are caught at compile time because the
// data must conform to these unions.

/** Items the player can carry / trade. */
export type ItemId =
  | 'ticket'
  | 'kanelbulle'
  | 'korv'
  | 'coffee'
  | 'fish'
  | 'wallet'
  | 'souvenir'
  | 'beer'
  | 'drink'
  | 'fishchips'
  | 'rakmacka'
  | 'akband'
  | 'nalle';

/** Interior décor/music themes for enterable venues. */
export type VenueTheme = 'pub' | 'rock' | 'jazz' | 'disco' | 'concert' | 'cocktail';

/** Which interior scene an enterable place renders. */
export type InteriorKind = 'nightlife' | 'fishmarket' | 'amusement';

/** Live-concert genres a concert venue can host on a given night. */
export type ConcertGenre = 'blackmetal' | 'hiphop' | 'indie' | 'singer' | 'techno';

/** Enterable nightlife venue category. */
export type VenueKind = 'bar' | 'club';

/** Non-enterable shop category (sold at the door). */
export type ShopKind = 'cafe' | 'kiosk' | 'fish' | 'shop' | 'pawn';

/** District character, drives ground colour + building density. */
export type DistrictKind = 'urban' | 'industrial' | 'suburb' | 'park';

/** Landmark mesh builder key. */
export type LandmarkType =
  | 'ferris'
  | 'church'
  | 'fishhall'
  | 'statue'
  | 'fountain'
  | 'fort'
  | 'tower'
  | 'crane'
  | 'forest'
  | 'opera'
  | 'stadium';

/** Orientation of a floating street label. */
export type StreetDir = 'h' | 'v';

/** Tram stop identifiers (keys of the STATIONS table). */
export type StationId =
  | 'hjalmar'
  | 'lindholmen'
  | 'centralen'
  | 'nordstan'
  | 'brunns'
  | 'gronsak'
  | 'kungsport'
  | 'vasa'
  | 'valand'
  | 'korsvagen'
  | 'liseberg'
  | 'molndal'
  | 'jarntorget'
  | 'hagakyrkan'
  | 'linne'
  | 'masthugget'
  | 'markland'
  | 'mariaplan'
  | 'kungssten'
  | 'gotaplatsen'
  | 'frolunda'
  | 'opaltorget'
  | 'redberg'
  | 'gamlestaden'
  | 'kviberg'
  | 'kortedala'
  | 'bergsjon'
  | 'angered'
  | 'ostra';

/** Scene the game is currently rendering. */
export type SceneId = 'city' | 'interior';

/** Categories of proximity interaction surfaced to the player. */
export type InteractionKind =
  | 'venue'
  | 'shop'
  | 'landmark'
  | 'tourist'
  | 'tram'
  | 'bar'
  | 'exit'
  | 'buy'
  | 'ride';

/** Toast severity, drives the coloured left border. */
export type ToastKind = 'info' | 'good' | 'bad' | 'warn';
