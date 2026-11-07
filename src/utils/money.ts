/**
 * Integer-Paise Precision Financial Math Engine
 * Inspired by industrial POS systems (e.g. Puter POS totals.js).
 * All monetary allocations, GST calculations, and discounts are computed in
 * integer paise (1 Rupee = 100 Paise) using the Largest Remainder Method
 * (Hare-Niemeyer quota) to ensure zero-penny drift and exact statutory compliance.
 */

export const toPaise = (amount: number | string | null | undefined): number => {
  if (amount === null || amount === undefined || amount === '') return 0;
  const num = Number(amount);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
};

export const fromPaise = (paise: number | null | undefined): number => {
  if (paise === null || paise === undefined) return 0;
  const p = Math.round(Number(paise) || 0);
  return Number((p / 100).toFixed(2));
};

export const rupeesToPaise = toPaise;
export const paiseToRupees = fromPaise;

/**
 * Splits `totalPaise` across `weights` proportionally using the Largest Remainder Method
 * (Hare-Niemeyer quota).
 *
 * Guarantees:
 * 1. sum(result) === totalPaise (ZERO penny/paise drift).
 * 2. If weights represent maximums and totalPaise <= sum(weights), no share exceeds its weight.
 * 3. Fractional remainders receive 1 paisa in descending order of remainder fraction.
 */
export function allocatePaise(totalPaise: number, weights: number[]): number[] {
  if (!weights || weights.length === 0 || totalPaise <= 0) {
    return (weights || []).map(() => 0);
  }

  const sumWeights = weights.reduce((acc, w) => acc + Math.max(0, w), 0);
  if (sumWeights <= 0) {
    return weights.map(() => 0);
  }

  // Cap total to sum if weights represent upper bounds and total is smaller
  const capped = Math.min(totalPaise, sumWeights);
  const exact = weights.map((w) => (capped * Math.max(0, w)) / sumWeights);
  const parts = exact.map(Math.floor);

  let left = capped - parts.reduce((acc, p) => acc + p, 0);

  const order = exact
    .map((val, idx) => ({ idx, frac: val - Math.floor(val) }))
    .sort((a, b) => b.frac - a.frac || a.idx - b.idx);

  for (const { idx } of order) {
    if (left <= 0) break;
    parts[idx]++;
    left--;
  }

  return parts;
}

export interface GstPaiseResult {
  taxablePaise: number;
  taxableRupees: number;
  gstRatePct: number;
  isInterstate: boolean;
  cgstPaise: number;
  cgstRupees: number;
  sgstPaise: number;
  sgstRupees: number;
  igstPaise: number;
  igstRupees: number;
  totalTaxPaise: number;
  totalTaxRupees: number;
  totalPaise: number;
  totalRupees: number;
}

/**
 * Computes Indian GST (CGST/SGST or IGST) in integer paise with Largest Remainder distribution.
 * Eliminates 1-paisa rounding discrepancies between CGST and SGST.
 */
export function computeGstPaise(
  taxablePaise: number,
  gstRatePct: number,
  isInterstate: boolean = false,
  isInclusive: boolean = false
): GstPaiseResult {
  const rate = Number(gstRatePct || 0);
  if (taxablePaise <= 0 || rate <= 0) {
    return {
      taxablePaise,
      taxableRupees: fromPaise(taxablePaise),
      gstRatePct: rate,
      isInterstate,
      cgstPaise: 0,
      cgstRupees: 0,
      sgstPaise: 0,
      sgstRupees: 0,
      igstPaise: 0,
      igstRupees: 0,
      totalTaxPaise: 0,
      totalTaxRupees: 0,
      totalPaise: taxablePaise,
      totalRupees: fromPaise(taxablePaise),
    };
  }

  let baseP: number;
  let totalTaxP: number;
  let totalP: number;

  if (isInclusive) {
    totalP = taxablePaise;
    baseP = Math.round(totalP / (1 + rate / 100));
    totalTaxP = totalP - baseP;
  } else {
    baseP = taxablePaise;
    totalTaxP = Math.round((baseP * rate) / 100);
    totalP = baseP + totalTaxP;
  }

  let cgstP = 0;
  let sgstP = 0;
  let igstP = 0;

  if (isInterstate) {
    igstP = totalTaxP;
  } else {
    // Equal 50/50 split of tax between CGST and SGST using allocatePaise
    const split = allocatePaise(totalTaxP, [1, 1]);
    cgstP = split[0];
    sgstP = split[1];
  }

  return {
    taxablePaise: baseP,
    taxableRupees: fromPaise(baseP),
    gstRatePct: rate,
    isInterstate,
    cgstPaise: cgstP,
    cgstRupees: fromPaise(cgstP),
    sgstPaise: sgstP,
    sgstRupees: fromPaise(sgstP),
    igstPaise: igstP,
    igstRupees: fromPaise(igstP),
    totalTaxPaise: totalTaxP,
    totalTaxRupees: fromPaise(totalTaxP),
    totalPaise: totalP,
    totalRupees: fromPaise(totalP),
  };
}

/**
 * Prorates an order-level discount across lines in integer paise without exceeding line values.
 */
export function prorateDiscountPaise(lineAmountsPaise: number[], discountPaise: number): number[] {
  const totalBase = lineAmountsPaise.reduce((a, b) => a + Math.max(0, b), 0);
  if (totalBase <= 0 || discountPaise <= 0) {
    return lineAmountsPaise.map(() => 0);
  }
  const capped = Math.min(discountPaise, totalBase);
  return allocatePaise(capped, lineAmountsPaise);
}

/**
 * Section 170 CGST Act Round-off computation.
 */
export function calculateSection170Roundoff(grossPaise: number): {
  grossPaise: number;
  grossRupees: number;
  netPayablePaise: number;
  netPayableRupees: number;
  roundoffPaise: number;
  roundoffRupees: number;
} {
  const netRupees = Math.round(grossPaise / 100);
  const netPayablePaise = netRupees * 100;
  const roundoffPaise = netPayablePaise - grossPaise;

  return {
    grossPaise,
    grossRupees: fromPaise(grossPaise),
    netPayablePaise,
    netPayableRupees: netRupees,
    roundoffPaise,
    roundoffRupees: fromPaise(roundoffPaise),
  };
}

/**
 * Formats rupees with Indian numbering (e.g. ₹1,23,456.78)
 */
export function formatRupees(amount: number, isPaise: boolean = false): string {
  const rupees = isPaise ? fromPaise(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees || 0);
}

