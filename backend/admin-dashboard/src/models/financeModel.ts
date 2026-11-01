import pool, { Queryable } from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface FinanceMonth {
  month: string;
  sales_ticket: number;
  sales_rental: number;
  p_stage: number;
  p_artist: number;
  p_maintenance: number;
  p_promo: number;
}

interface FinanceRow extends RowDataPacket, FinanceMonth {}

/** Rekap bulanan (juta rupiah), urut dari bulan terlama. */
export const listFinanceMonths = async () => {
  const [rows] = await pool.execute<FinanceRow[]>('SELECT * FROM finance_monthly ORDER BY month');
  return rows;
};

/** Total penjualan dalam rentang bulan "YYYY-MM"; `months` = 0 bila tidak ada data. */
export const revenueBetween = async (fromMonth: string, toMonth: string) => {
  const [[row]] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS months, SUM(sales_ticket) AS ticket, SUM(sales_rental) AS rental FROM finance_monthly WHERE month BETWEEN ? AND ?',
    [fromMonth, toMonth],
  );
  return { months: row.months as number, ticket: Number(row.ticket ?? 0), rental: Number(row.rental ?? 0) };
};

/** Tambahkan penjualan lunas ke rekap bulan pembukuannya. */
export const addMonthlySales = async (month: string, kind: 'ticket' | 'rental', millions: number, db: Queryable = pool) => {
  const column = kind === 'ticket' ? 'sales_ticket' : 'sales_rental';
  await db.execute('INSERT IGNORE INTO finance_monthly (month) VALUES (?)', [month]);
  await db.execute(`UPDATE finance_monthly SET ${column} = ROUND(${column} + ?, 3) WHERE month = ?`, [millions, month]);
};
