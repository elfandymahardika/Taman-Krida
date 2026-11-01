// Rekap penjualan & pembelian bulanan diambil dari GET /api/finance/monthly (dalam juta rupiah).
// Penjualan bertambah otomatis setiap kali pembayaran diverifikasi lunas.

export function round(n: number) {
  return Math.round(n * 10) / 10
}

/** 42.6 → "Rp42,6 jt" */
export function formatJuta(n: number) {
  return `Rp${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
}
