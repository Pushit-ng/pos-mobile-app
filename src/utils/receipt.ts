import { formatNaira } from './format-currency'

export interface ReceiptLineItem {
  name: string
  unitName: string
  qty: number
  lineTotal: number // kobo
}

export interface ReceiptData {
  invoiceId: string
  items: ReceiptLineItem[]
  subtotal: number    // kobo
  vatAmount: number   // kobo
  total: number       // kobo
  paymentMethod: string
  createdAt?: string
  companyName?: string
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length)
}

function padLeft(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : ' '.repeat(len - str.length) + str
}

function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins  = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${getMonthName(d.getMonth())} ${year}, ${hours}:${mins}`
}

function getMonthName(m: number): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return months[m] ?? ''
}

/**
 * Builds a plain-text receipt suitable for WhatsApp sharing.
 * All monetary values are in kobo.
 */
export function buildWhatsAppReceipt(invoice: ReceiptData): string {
  const LINE_WIDTH = 32
  const divider = '-'.repeat(LINE_WIDTH)

  const header = [
    `${invoice.companyName ?? 'POS Choice'} — INVOICE`,
    '='.repeat(LINE_WIDTH),
    invoice.invoiceId,
    formatDate(invoice.createdAt),
    '',
  ].join('\n')

  const itemLines = invoice.items.map((item) => {
    const label = `${item.name} (${item.unitName}) x${item.qty}`
    const price = formatNaira(item.lineTotal)
    const padded = padRight(label, LINE_WIDTH - price.length - 1)
    return `${padded} ${price}`
  })

  const summary = [
    divider,
    `${padRight('Subtotal:', 18)}${padLeft(formatNaira(invoice.subtotal), LINE_WIDTH - 18)}`,
    `${padRight('VAT:', 18)}${padLeft(formatNaira(invoice.vatAmount), LINE_WIDTH - 18)}`,
    `${padRight('TOTAL:', 18)}${padLeft(formatNaira(invoice.total), LINE_WIDTH - 18)}`,
    '',
    `Payment: ${invoice.paymentMethod}`,
    'Thank you for your business!',
  ].join('\n')

  return [header, ...itemLines, summary].join('\n')
}
