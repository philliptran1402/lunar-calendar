import type { LunarDate } from '../calendar/lunisolar.js';

export interface Holiday {
  /** Khoa on dinh de dich sang ngon ngu khac (UI khong so khop chuoi tieng Viet). */
  id: string;
  name: string;
  /** 'solar' = theo duong lich, 'lunar' = theo am lich */
  kind: 'solar' | 'lunar';
  /** Ngay nghi chinh thuc theo Bo luat Lao dong VN */
  publicHoliday?: boolean;
}

/** Le theo duong lich: 'dd/mm' */
const SOLAR_HOLIDAYS: Record<string, Holiday> = {
  '1/1': { id: 'solar-1-1', name: 'Tết Dương lịch', kind: 'solar', publicHoliday: true },
  '9/1': { id: 'solar-9-1', name: 'Ngày Học sinh – Sinh viên', kind: 'solar' },
  '3/2': { id: 'solar-3-2', name: 'Thành lập Đảng CSVN', kind: 'solar' },
  '14/2': { id: 'solar-14-2', name: 'Lễ tình nhân', kind: 'solar' },
  '27/2': { id: 'solar-27-2', name: 'Thầy thuốc Việt Nam', kind: 'solar' },
  '8/3': { id: 'solar-8-3', name: 'Quốc tế Phụ nữ', kind: 'solar' },
  '26/3': { id: 'solar-26-3', name: 'Thành lập Đoàn TNCS', kind: 'solar' },
  '21/4': { id: 'solar-21-4', name: 'Sách và Văn hoá đọc', kind: 'solar' },
  '30/4': { id: 'solar-30-4', name: 'Giải phóng miền Nam', kind: 'solar', publicHoliday: true },
  '1/5': { id: 'solar-1-5', name: 'Quốc tế Lao động', kind: 'solar', publicHoliday: true },
  '7/5': { id: 'solar-7-5', name: 'Chiến thắng Điện Biên Phủ', kind: 'solar' },
  '19/5': { id: 'solar-19-5', name: 'Sinh nhật Chủ tịch Hồ Chí Minh', kind: 'solar' },
  '1/6': { id: 'solar-1-6', name: 'Quốc tế Thiếu nhi', kind: 'solar' },
  '28/6': { id: 'solar-28-6', name: 'Gia đình Việt Nam', kind: 'solar' },
  '27/7': { id: 'solar-27-7', name: 'Thương binh Liệt sĩ', kind: 'solar' },
  '19/8': { id: 'solar-19-8', name: 'Cách mạng Tháng Tám', kind: 'solar' },
  '2/9': { id: 'solar-2-9', name: 'Quốc khánh', kind: 'solar', publicHoliday: true },
  '10/10': { id: 'solar-10-10', name: 'Giải phóng Thủ đô', kind: 'solar' },
  '20/10': { id: 'solar-20-10', name: 'Phụ nữ Việt Nam', kind: 'solar' },
  '20/11': { id: 'solar-20-11', name: 'Nhà giáo Việt Nam', kind: 'solar' },
  '22/12': { id: 'solar-22-12', name: 'Quân đội Nhân dân Việt Nam', kind: 'solar' },
  '24/12': { id: 'solar-24-12', name: 'Đêm Giáng sinh', kind: 'solar' },
  '25/12': { id: 'solar-25-12', name: 'Giáng sinh', kind: 'solar' },
};

/** Le theo am lich: 'dd/mm' */
const LUNAR_HOLIDAYS: Record<string, Holiday> = {
  '1/1': { id: 'lunar-1-1', name: 'Tết Nguyên Đán', kind: 'lunar', publicHoliday: true },
  '2/1': { id: 'lunar-2-1', name: 'Mùng 2 Tết', kind: 'lunar', publicHoliday: true },
  '3/1': { id: 'lunar-3-1', name: 'Mùng 3 Tết', kind: 'lunar', publicHoliday: true },
  '15/1': { id: 'lunar-15-1', name: 'Tết Nguyên Tiêu (Rằm tháng Giêng)', kind: 'lunar' },
  '3/3': { id: 'lunar-3-3', name: 'Tết Hàn Thực', kind: 'lunar' },
  '10/3': { id: 'lunar-10-3', name: 'Giỗ Tổ Hùng Vương', kind: 'lunar', publicHoliday: true },
  '15/4': { id: 'lunar-15-4', name: 'Lễ Phật Đản', kind: 'lunar' },
  '5/5': { id: 'lunar-5-5', name: 'Tết Đoan Ngọ', kind: 'lunar' },
  '15/7': { id: 'lunar-15-7', name: 'Lễ Vu Lan (Rằm tháng Bảy)', kind: 'lunar' },
  '15/8': { id: 'lunar-15-8', name: 'Tết Trung Thu', kind: 'lunar' },
  '9/9': { id: 'lunar-9-9', name: 'Tết Trùng Cửu', kind: 'lunar' },
  '23/12': { id: 'lunar-23-12', name: 'Ông Công Ông Táo', kind: 'lunar' },
};

/**
 * Ngay le cua mot ngay. Ghep ca duong lich va am lich.
 * Giao thua = ngay cuoi cung cua thang Chap (29 hoac 30 tuy nam).
 */
export function holidaysOf(
  solar: { day: number; month: number },
  lunar: LunarDate,
  lastDayOfLunarMonth?: number,
): Holiday[] {
  const out: Holiday[] = [];
  const s = SOLAR_HOLIDAYS[`${solar.day}/${solar.month}`];
  if (s) out.push(s);
  if (!lunar.leap) {
    const l = LUNAR_HOLIDAYS[`${lunar.day}/${lunar.month}`];
    if (l) out.push(l);
    if (lunar.month === 12 && lastDayOfLunarMonth && lunar.day === lastDayOfLunarMonth) {
      out.push({ id: 'lunar-eve', name: 'Giao thừa (Tất niên)', kind: 'lunar', publicHoliday: true });
    }
  }
  return out;
}
