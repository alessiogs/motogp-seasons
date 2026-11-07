// Chassis builders that race an engine of another brand: the Manufacturer is the builder ("Chevallier-Honda NS500" is a Chevallier).
const CHASSIS = ['Chevallier', 'Elf', 'Fior', 'Harris', 'Spondon', 'Paton', 'König', 'Morbidelli', 'Sanvenero', 'Cagiva', 'Seeley', 'Linto', 'Münch', 'Kawasaki'];

/**
 * The Manufacturer of a bike from the machine cell of a standings matrix ("YZR500", "Elf3-RS500"); null when the cell names none.
 * A cell naming several bikes ("Bultaco / Kawasaki", a Rider who changed bikes during the Season) stands for the first: the
 * matrix gives no machine per Round.
 */
export function manufacturerOfMachine(machine: string | null): string | null {
  const text = (machine ?? '').trim();
  if (!text) return null;
  return brandOf(text.split(/\s+\/\s+/)[0].trim());
}

function brandOf(text: string): string {
  for (const builder of CHASSIS) if (new RegExp(`^${builder}|\\b${builder}\\b`, 'i').test(text)) return builder;
  if (/M[eé]tisse/i.test(text)) return 'Métisse';
  if (/^(YZR|OW|TZ|YZ)|Yamaha/i.test(text)) return 'Yamaha';
  if (/^(RG|RGB|RGV|XR|TR\d)|Suzuki/i.test(text)) return 'Suzuki';
  if (/^(NS|NSR|RS|RSC|RC|CB)|Honda/i.test(text)) return 'Honda';
  if (/^GP500/i.test(text)) return 'Cagiva';
  if (/^MV\d|^MV Agusta/i.test(text)) return 'MV Agusta';
  if (/^H1R/i.test(text)) return 'Kawasaki';
  if (/Harley|^RR\d/i.test(text)) return 'Harley-Davidson';
  if (/Husqvarna/i.test(text)) return 'Husqvarna'; // Husqvarna-Proto: a Husqvarna engine in a one-off frame
  if (/^Yamsel/i.test(text)) return 'Seeley'; // Yamaha engine in a Seeley frame
  if (/^G50|Matchless/i.test(text)) return 'Matchless';
  if (/Manx|^Norton/i.test(text)) return 'Norton';
  // A one-off special named "Builder-Engine" (Coleman-Suzuki, Kettle-Norton, Hughes-Triumph): the engine's brand.
  const dash = text.lastIndexOf('-');
  return dash > 0 ? brandOf(text.slice(dash + 1).trim()) : text;
}
