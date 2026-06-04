// All amounts are in kobo (integers). Divide by 100 for display only.

function formatCurrency(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kobo / 100)
}

export function formatNaira(kobo: number | null | undefined): string {
  const n = Number(kobo)
  if (!isFinite(n)) return '₦0'
  if (n % 100 === 0) return `₦${(n / 100).toLocaleString('en-NG')}`
  return formatCurrency(n)
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}
