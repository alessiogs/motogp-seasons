/**
 * Hand-authored Manufacturer colours: data/manufacturers.json (GLOSSARY: Manufacturer, Team colour).
 * `name` is the Manufacturer as written on Results; `colour` ('#rrggbb') stands in as the Team colour
 * of a Result whose Team has none.
 */
export interface ManufacturerFile {
  manufacturers: { name: string; colour: string }[];
}
