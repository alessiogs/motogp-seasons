import type { Flag } from '../types/flag';

/** country name, ISO 3166-1 alpha-2 (null = no emoji flag exists) */
type Entry = readonly [name: string, iso2: string | null];

const COUNTRIES: Record<string, Entry> = {
  // Sources mix spellings of the same country (SPA/ESP, RSA/SAF, POR/PRT, ...): all map to one entry.
  ITA: ['Italy', 'IT'],
  SPA: ['Spain', 'ES'],
  ESP: ['Spain', 'ES'],
  FRA: ['France', 'FR'],
  GBR: ['Great Britain', 'GB'],
  GER: ['Germany', 'DE'],
  DEU: ['Germany', 'DE'],
  AUS: ['Australia', 'AU'],
  AUT: ['Austria', 'AT'],
  BEL: ['Belgium', 'BE'],
  BRA: ['Brazil', 'BR'],
  CZE: ['Czech Republic', 'CZ'],
  FIN: ['Finland', 'FI'],
  HUN: ['Hungary', 'HU'],
  IRL: ['Ireland', 'IE'],
  JPN: ['Japan', 'JP'],
  MYS: ['Malaysia', 'MY'],
  MAL: ['Malaysia', 'MY'],
  NED: ['Netherlands', 'NL'],
  NLD: ['Netherlands', 'NL'],
  NZL: ['New Zealand', 'NZ'],
  POR: ['Portugal', 'PT'],
  PRT: ['Portugal', 'PT'],
  RSA: ['South Africa', 'ZA'],
  SAF: ['South Africa', 'ZA'],
  SWE: ['Sweden', 'SE'],
  SUI: ['Switzerland', 'CH'],
  CHE: ['Switzerland', 'CH'],
  THA: ['Thailand', 'TH'],
  USA: ['United States', 'US'],
  VEN: ['Venezuela', 'VE'],
  ARG: ['Argentina', 'AR'],
  AND: ['Andorra', 'AD'],
  CAN: ['Canada', 'CA'],
  COL: ['Colombia', 'CO'],
  DEN: ['Denmark', 'DK'],
  IND: ['India', 'IN'],
  INA: ['Indonesia', 'ID'],
  IDN: ['Indonesia', 'ID'],
  KOR: ['South Korea', 'KR'],
  LUX: ['Luxembourg', 'LU'],
  MEX: ['Mexico', 'MX'],
  NOR: ['Norway', 'NO'],
  POL: ['Poland', 'PL'],
  QAT: ['Qatar', 'QA'],
  ROU: ['Romania', 'RO'],
  RUS: ['Russia', 'RU'],
  SVK: ['Slovakia', 'SK'],
  SLO: ['Slovenia', 'SI'],
  TUR: ['Turkey', 'TR'],
  UKR: ['Ukraine', 'UA'],
  IRE: ['Ireland', 'IE'],
  UK: ['Great Britain', 'GB'],
  GB: ['Great Britain', 'GB'],
  JAP: ['Japan', 'JP'],
  ZAF: ['South Africa', 'ZA'],
  DNK: ['Denmark', 'DK'],
  CH: ['Switzerland', 'CH'],
  SWI: ['Switzerland', 'CH'],
  SMR: ['San Marino', 'SM'],
  GRE: ['Greece', 'GR'],
  ZIM: ['Zimbabwe', 'ZW'],
  HKG: ['Hong Kong', 'HK'],
  CHI: ['Chile', 'CL'],
  CHL: ['Chile', 'CL'],
  IOM: ['Isle of Man', 'IM'],
  // Countries that no longer exist. West Germany raced under the same black-red-gold flag as Germany today.
  FRG: ['West Germany', 'DE'],
  BRD: ['West Germany', 'DE'],
  GDR: ['East Germany', null],
  TCH: ['Czechoslovakia', null],
  CZS: ['Czechoslovakia', null],
  CSK: ['Czechoslovakia', null],
  YUG: ['Yugoslavia', null],
  URS: ['Soviet Union', null],
  RHO: ['Rhodesia', null],
};

// Some articles name the country in full instead of giving a code.
const NAMES: Record<string, string> = {
  ...Object.fromEntries(Object.entries(COUNTRIES).map(([code, [name]]) => [name, code])),
  'United Kingdom': 'GBR',
  'The Netherlands': 'NED',
};

function emojiFlag(iso2: string): string {
  return String.fromCodePoint(...[...iso2].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** The flag a Rider raced under, from the Nationality code stored on their Result. */
export function flagOf(code: string | null): Flag | null {
  if (!code) return null;
  const entry = COUNTRIES[code] ?? COUNTRIES[NAMES[code]];
  if (!entry) return { code, name: code, emoji: null };
  const [name, iso2] = entry;
  return { code, name, emoji: iso2 ? emojiFlag(iso2) : null };
}
