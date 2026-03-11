// Shipping fee calculation for Tei Store
// Simple city-based logic: same city = free, different city = flat fee

/** Default inter-city shipping fee (XAF). Can be overridden via Setting model. */
export const DEFAULT_INTER_CITY_FEE = 2500

/**
 * Calculate shipping fee based on customer city vs fulfilling branch city.
 * Same city = free pickup/delivery. Different city = flat inter-city fee.
 */
export function calculateShippingFee(
  customerCity: string,
  branchCity: string,
  interCityFee: number = DEFAULT_INTER_CITY_FEE,
): number {
  if (normalize(customerCity) === normalize(branchCity)) return 0
  return interCityFee
}

function normalize(city: string): string {
  return city.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/**
 * Calculate total shipping for a multi-branch order.
 * Groups items by fulfillment branch, charges per unique inter-city branch.
 */
export function calculateOrderShipping(
  customerCity: string,
  branchCities: string[],
  interCityFee: number = DEFAULT_INTER_CITY_FEE,
): number {
  const uniqueBranches = [...new Set(branchCities.map(normalize))]
  const normalizedCustomer = normalize(customerCity)
  return uniqueBranches.reduce(
    (total, bc) => total + (bc === normalizedCustomer ? 0 : interCityFee),
    0,
  )
}
