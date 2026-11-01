/** Cells of every row of a table, with "||" inline separators expanded. */
export function tableRows(tableText: string): string[][] {
  return tableText
    .split(/^\|-.*$/m)
    .map((row) =>
      row
        .split('\n')
        .filter((l) => /^[!|]/.test(l) && !/^\|[}+]/.test(l))
        .flatMap((l) => l.replace(/^[!|]/, '').split('||'))
        .map((c) => c.trim()),
    )
    .filter((cells) => cells.length > 0);
}
