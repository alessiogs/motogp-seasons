/**
 * Hand-authored Team data for one Season: data/teams/<class>-<year>.json (GLOSSARY: Team).
 * `name` is the Team's one display name, written on Results; `variants` are other spellings
 * the source uses for the same Team, mapped to `name` by the loader. `colour` is the Team colour
 * ('#rrggbb', approximating the livery); absent when unknown, so the Manufacturer's colour stands in.
 */
export interface TeamFile {
  teams: { name: string; colour?: string; variants?: string[] }[];
}
