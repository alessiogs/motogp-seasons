// Chassis builders that race an engine of another brand: the Manufacturer is the builder ("Chevallier-Honda NS500" is a Chevallier).
const CHASSIS = ['Chevallier', 'Elf', 'Fior', 'Harris', 'Spondon', 'Paton', 'König', 'Morbidelli', 'Sanvenero', 'Cagiva', 'Kawasaki'];

/** The Manufacturer of a bike from the machine cell of a standings matrix ("YZR500", "Elf3-RS500"); null when the cell names none. */
export function manufacturerOfMachine(machine: string | null): string | null {
  const text = (machine ?? '').trim();
  if (!text) return null;
  for (const builder of CHASSIS) if (new RegExp(`^${builder}|\\b${builder}\\b`, 'i').test(text)) return builder;
  if (/^(YZR|OW|TZ|YZ)|Yamaha/i.test(text)) return 'Yamaha';
  if (/^(RG|RGB|RGV|XR)|Suzuki/i.test(text)) return 'Suzuki';
  if (/^(NS|NSR|RS|RSC|RC|CB)|Honda/i.test(text)) return 'Honda';
  if (/^GP500/i.test(text)) return 'Cagiva';
  return text;
}
