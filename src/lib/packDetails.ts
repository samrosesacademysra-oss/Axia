export function stripPackDetails(text: string) {
  return text
    .replace(/\d+\s*cartons?\s*[×x]\s*\d+\s*pieces(?:\s*,\s*plus\s*\d+\s*loose pieces)?\.?/gi, '')
    .replace(/\d+\s*pieces per carton\.?/gi, '')
    .replace(/\d+\s*cartons?\.?/gi, '')
    .replace(/Carton price GH₵\s*[\d,]+(?:\.\d+)?\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

export function readPackDetails(text: string | null) {
  const source = text || '';
  const pack = source.match(/(\d+)\s*cartons?\s*[×x]\s*(\d+)\s*pieces/i);
  const loose = source.match(/plus\s*(\d+)\s*loose pieces/i);
  const perCarton = source.match(/(\d+)\s*pieces per carton/i);
  const countOnly = source.match(/(\d+)\s*cartons?\b/i);
  const price = source.match(/Carton price GH₵\s*([\d,]+(?:\.\d+)?)/i);
  return {
    cartonCount: pack?.[1] || countOnly?.[1] || '',
    unitsPerCarton: pack?.[2] || perCarton?.[1] || '',
    loosePieces: loose?.[1] || '',
    cartonPrice: price ? price[1].replace(/,/g, '') : '',
  };
}

export function writePackDetails(
  notes: string,
  pack: { cartonCount: string; unitsPerCarton: string; loosePieces: string; cartonPrice: string }
) {
  const parts: string[] = [];
  const base = stripPackDetails(notes);
  if (base) parts.push(base.endsWith('.') ? base : `${base}.`);

  const units = Number(pack.unitsPerCarton);
  if (pack.cartonCount && units > 0) {
    const loose = pack.loosePieces ? `, plus ${pack.loosePieces} loose pieces` : '';
    parts.push(`${pack.cartonCount} cartons × ${units} pieces${loose}.`);
  } else if (pack.cartonCount) {
    parts.push(`${pack.cartonCount} cartons.`);
  } else if (units > 0) {
    parts.push(`${units} pieces per carton.`);
  }

  if (pack.cartonPrice !== '') {
    const price = Number(pack.cartonPrice);
    if (!Number.isNaN(price)) {
      parts.push(`Carton price GH₵${price.toLocaleString('en-GH')}.`);
    }
  }

  return parts.join(' ').trim();
}
