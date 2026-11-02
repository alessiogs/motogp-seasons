export interface RiderFile {
  id: string;
  name: string;
  sourceIds: Record<string, string>;
  /** Three letters for the short name, only when the surname is not what follows the first name. */
  abbreviation?: string;
}
