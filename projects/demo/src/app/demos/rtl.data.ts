/** Deterministic Arabic/Hebrew ledger data for the right-to-left demo. */
import { rand } from '../lib/random';

const MERCHANTS_AR = [
  'سوق الخضار',
  'مقهى الياسمين',
  'صيدلية النور',
  'محطة الوقود',
  'مكتبة القلم',
  'مطعم البحر',
  'متجر الإلكترونيات',
  'نادي الرياضة',
];
const MERCHANTS_HE = [
  'שוק הכרמל',
  'בית קפה יסמין',
  'בית מרקחת אור',
  'תחנת דלק',
  'חנות ספרים',
  'מסעדת הים',
];
const CITY_AR = ['الرياض', 'دبي', 'عمّان', 'القاهرة', 'بيروت'];
const CITY_HE = ['תל אביב', 'חיפה', 'ירושלים'];

const STATES = [
  { cls: 'rtl-pill--ok', ar: 'مكتمل', he: 'הושלם' },
  { cls: 'rtl-pill--wait', ar: 'قيد المعالجة', he: 'בעיבוד' },
  { cls: 'rtl-pill--bad', ar: 'مرفوض', he: 'נדחה' },
];

export type Script = 'ar' | 'he';

export interface Txn {
  merchant: string;
  city: string;
  state: (typeof STATES)[number];
  label: string;
  amount: number;
  balance: number;
  ref: string;
  hue: number;
}

export function txnFor(index: number, script: Script): Txn {
  const merchants = script === 'ar' ? MERCHANTS_AR : MERCHANTS_HE;
  const cities = script === 'ar' ? CITY_AR : CITY_HE;
  const state = STATES[Math.floor(rand(index, 13) * STATES.length)];
  const amount = Math.round((rand(index, 5) * 900 + 8) * 100) / 100;
  return {
    merchant: merchants[Math.floor(rand(index, 3) * merchants.length)],
    city: cities[Math.floor(rand(index, 7) * cities.length)],
    state,
    label: script === 'ar' ? state.ar : state.he,
    amount: rand(index, 17) > 0.82 ? amount : -amount,
    balance: Math.round(rand(index, 19) * 90_000) / 10,
    ref: `TX-${(index + 1).toString().padStart(8, '0')}`,
    hue: [188, 262, 152, 28, 350, 210][Math.floor(rand(index, 23) * 6)],
  };
}
