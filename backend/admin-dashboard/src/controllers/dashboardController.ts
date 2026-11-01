import { Request, Response } from 'express';
import { config } from '../config/env';
import { PURCHASE_CATEGORIES } from '../db/seeders/data';
import { iso, MONTH_NAMES, MONTH_SHORT, parsePeriod, Period, round1 } from '../lib/format';
import { badRequest, nowIso, queryText } from '../lib/http';
import { canView, ModuleKey } from '../lib/roles';
import { pendingCommunitiesQueue } from '../models/communityModel';
import { eventMetrics } from '../models/eventModel';
import { listFinanceMonths, revenueBetween } from '../models/financeModel';
import { paymentQueues } from '../models/orderModel';
import { pendingRentalsQueue, rentalMetrics } from '../models/rentalModel';
import { pendingUsersQueue } from '../models/userModel';

/** Periode sebelumnya: bulan sebelumnya atau tahun sebelumnya. */
function previousKey(key: string) {
  if (/^\d{4}$/.test(key)) return String(Number(key) - 1);
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

async function metrics(period: Period) {
  const { events, tickets } = await eventMetrics(period.from, period.to);
  const rentals = await rentalMetrics(period.from, period.to);
  const revenue = await revenueBetween(period.from.slice(0, 7), period.to.slice(0, 7));
  return {
    events,
    tickets,
    rentals,
    revenue: revenue.months
      ? { ticket: round1(revenue.ticket), rental: round1(revenue.rental), total: round1(revenue.ticket + revenue.rental) }
      : null,
  };
}

/** Ringkasan dashboard per periode (?period=2026-10 atau 2026), disaring sesuai peran. */
export const getSummary = async (req: Request, res: Response) => {
  const key = queryText(req.query.period) || config.today.slice(0, 7);
  const period = parsePeriod(key);
  if (!period) throw badRequest('Periode harus berformat YYYY-MM atau YYYY.');
  const prev = parsePeriod(previousKey(key))!;

  const payments = await paymentQueues();
  const rentals = await pendingRentalsQueue();
  const communities = await pendingCommunitiesQueue();
  const staff = await pendingUsersQueue();

  // Antrean & nilai pendapatan hanya untuk modul yang boleh dilihat peran ini.
  const role = res.locals.user.role_key;
  const seesPayments = canView(role, 'payments');
  const queues: { key: string; module: ModuleKey; count: number; oldestAt?: string }[] = [
    { key: 'payments', module: 'payments', count: payments.pending.count, oldestAt: payments.pending.oldest },
    { key: 'rentals', module: 'rentals', count: rentals.count, oldestAt: iso(rentals.oldest) },
    { key: 'communities', module: 'info', count: communities.count, oldestAt: iso(communities.oldest) },
    { key: 'staff', module: 'admin', count: staff.count, oldestAt: iso(staff.oldest) },
  ];
  const tasks = queues.filter((t) => canView(role, t.module)).map(({ module: _module, ...t }) => t);
  type Metrics = Awaited<ReturnType<typeof metrics>>;
  const withoutRevenue = (m: Metrics) => (seesPayments ? m : { ...m, revenue: null });
  const oldest = tasks.map((t) => t.oldestAt).filter(Boolean).sort()[0];

  const months = (await listFinanceMonths()).map((r) => r.month).reverse();
  const years = [...new Set(months.map((m) => m.slice(0, 4)))];

  res.json({
    today: config.today,
    generatedAt: nowIso(),
    period: { key: period.key, label: period.label },
    previous: { key: prev.key, label: prev.label },
    metrics: withoutRevenue(await metrics(period)),
    previousMetrics: withoutRevenue(await metrics(prev)),
    tasks,
    tasksTotal: tasks.reduce((n, t) => n + t.count, 0),
    oldestPendingAt: oldest ?? null,
    waitingPayments: seesPayments ? payments.waiting : 0,
    periods: [...months.map((m) => ({ key: m, label: parsePeriod(m)!.label })), ...years.map((y) => ({ key: y, label: `Tahun ${y}` }))],
  });
};

/** Rekap keuangan bulanan (grafik penjualan & pembelian). */
export const getFinanceMonthly = async (_req: Request, res: Response) => {
  const rows = await listFinanceMonths();
  res.json({
    categories: PURCHASE_CATEGORIES,
    months: rows.map((r) => {
      const [y, m] = r.month.split('-').map(Number);
      const purchases = [r.p_stage, r.p_artist, r.p_maintenance, r.p_promo].map(round1);
      return {
        month: MONTH_SHORT[m - 1],
        key: r.month,
        label: `${MONTH_NAMES[m - 1]} ${y}`,
        sales: { tiket: round1(r.sales_ticket), sewa: round1(r.sales_rental) },
        purchases,
        penjualan: round1(r.sales_ticket + r.sales_rental),
        pembelian: round1(purchases.reduce((a, b) => a + b, 0)),
      };
    }),
  });
};
