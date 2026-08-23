import {
  dinero,
  add,
  multiply,
  allocate,
  toSnapshot,
  XAF,
  type Dinero,
} from "dinero.js";

export type Money = Dinero<number>;

/**
 * Create a Dinero object for XAF currency (exponent = 0).
 */
export function createMoney(amount: number | string = 0): Money {
  const numericAmount = Math.round(
    typeof amount === "string" ? parseFloat(amount) || 0 : amount
  );
  return dinero({ amount: numericAmount, currency: XAF });
}

/**
 * Convert a Dinero object to standard integer number for storage/display.
 */
export function moneyToNumber(d: Money): number {
  return toSnapshot(d).amount;
}

/**
 * Add two or more money amounts together safely.
 */
export function addMoney(first: Money, ...rest: Money[]): Money {
  return rest.reduce((acc, curr) => add(acc, curr), first);
}

/**
 * Multiply money by a quantity or factor.
 */
export function multiplyMoney(d: Money, factor: number): Money {
  return multiply(d, Math.round(factor));
}

/**
 * Split a total amount into exact installments with zero loss to rounding.
 * e.g. 100,000 XAF into 3 installments -> [33334, 33333, 33333]
 */
export function allocateInstallments(
  totalAmount: number | Money,
  installmentCount: number
): number[] {
  if (installmentCount <= 1) {
    const total = typeof totalAmount === "number" ? totalAmount : moneyToNumber(totalAmount);
    return [Math.max(0, total)];
  }

  const d = typeof totalAmount === "number" ? createMoney(totalAmount) : totalAmount;
  const ratios = Array.from({ length: installmentCount }, () => 1);
  const allocated = allocate(d, ratios);

  return allocated.map((item) => toSnapshot(item).amount);
}
