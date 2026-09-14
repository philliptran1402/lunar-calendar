/**
 * Da ngon ngu. Core tra ve ten tieng Viet + INDEX/ID on dinh;
 * lop nay dich theo index/id, KHONG so khop chuoi tieng Viet.
 */
export type Lang = 'vi' | 'en';

export const LANGS: Array<{ code: Lang; label: string; flag: string }> = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

type Dict = Record<string, string>;

const UI: Record<Lang, Dict> = {
  vi: {
    'app.today': 'hôm nay',
    'app.todayIs': 'hôm nay',
    'app.calendar': 'lịch',
    'app.terminal': 'terminal',
    'panel.month': 'lịch tháng',
    'panel.monthNote': 'âm lịch hiển thị màu tím',
    'panel.day': 'chi tiết ngày',
    'panel.convert': 'chuyển đổi',
    'panel.days': 'ngày',
    'label.lunar': 'âm lịch',
    'label.solarMonth': 'tháng',
    'label.year': 'năm',
    'label.leap': 'nhuận',
    'label.monthLen': 'tháng {n} ngày',
    'row.canChiDay': 'CAN CHI NGÀY',
    'row.canChiMonth': 'CAN CHI THÁNG',
    'row.solarTerm': 'TIẾT KHÍ',
    'row.truc': 'TRỰC',
    'row.julian': 'JULIAN DAY',
    'term.start': '← bắt đầu',
    'quality.good': 'hoàng đạo',
    'quality.bad': 'hắc đạo',
    'panel.luckyHours': 'giờ hoàng đạo',
    'conv.day': 'NGÀY',
    'conv.month': 'THÁNG',
    'conv.year': 'NĂM',
    'conv.leapMonth': 'tháng nhuận',
    'conv.s2l': 'dương → âm',
    'conv.l2s': 'âm → dương',
    'conv.solar': 'dương lịch',
    'conv.lunar': 'âm lịch',
    'conv.view': 'xem trên lịch →',
    'conv.needAll': 'Nhập đủ ngày / tháng / năm',
    'conv.noLeap': 'Năm {y} âm lịch không có tháng {m} nhuận',
    'conv.invalid': 'Ngày không hợp lệ',
    'action.copyJson': 'copy JSON',
    'action.copied': '✓ đã chép',
    'action.reset': 'reset',
    'key.day': 'ngày',
    'key.week': 'tuần',
    'key.month': 'tháng',
    'key.today': 'hôm nay',
    'key.terminal': 'terminal',
    'foot.engine': 'thuật toán Hồ Ngọc Đức · múi giờ GMT+7',
    'a11y.prevMonth': 'Tháng trước',
    'a11y.nextMonth': 'Tháng sau',
    'a11y.theme': 'Chọn màu',
    'a11y.lang': 'Ngôn ngữ',
    'month.label': 'Tháng {m}',
    'install.text': 'Cài lên máy để dùng offline',
    'install.action': 'Cài đặt',
    'install.ios': 'Cài offline: bấm Chia sẻ → Thêm vào MH chính',
    'install.dismiss': 'Bỏ qua',
    'offline.badge': 'offline',
  },
  en: {
    'app.today': 'today',
    'app.todayIs': 'today',
    'app.calendar': 'calendar',
    'app.terminal': 'terminal',
    'panel.month': 'month view',
    'panel.monthNote': 'lunar dates in purple',
    'panel.day': 'day details',
    'panel.convert': 'converter',
    'panel.days': 'days',
    'label.lunar': 'lunar',
    'label.solarMonth': 'month',
    'label.year': 'year',
    'label.leap': 'leap',
    'label.monthLen': '{n}-day month',
    'row.canChiDay': 'DAY PILLAR',
    'row.canChiMonth': 'MONTH PILLAR',
    'row.solarTerm': 'SOLAR TERM',
    'row.truc': 'DAY OFFICER',
    'row.julian': 'JULIAN DAY',
    'term.start': '← starts',
    'quality.good': 'auspicious',
    'quality.bad': 'inauspicious',
    'panel.luckyHours': 'auspicious hours',
    'conv.day': 'DAY',
    'conv.month': 'MONTH',
    'conv.year': 'YEAR',
    'conv.leapMonth': 'leap month',
    'conv.s2l': 'solar → lunar',
    'conv.l2s': 'lunar → solar',
    'conv.solar': 'solar',
    'conv.lunar': 'lunar',
    'conv.view': 'show on calendar →',
    'conv.needAll': 'Enter day / month / year',
    'conv.noLeap': 'Lunar year {y} has no leap month {m}',
    'conv.invalid': 'Invalid date',
    'action.copyJson': 'copy JSON',
    'action.copied': '✓ copied',
    'action.reset': 'reset',
    'key.day': 'day',
    'key.week': 'week',
    'key.month': 'month',
    'key.today': 'today',
    'key.terminal': 'terminal',
    'foot.engine': 'Hồ Ngọc Đức algorithm · GMT+7',
    'a11y.prevMonth': 'Previous month',
    'a11y.nextMonth': 'Next month',
    'a11y.theme': 'Color theme',
    'a11y.lang': 'Language',
    'month.label': '',
    'install.text': 'Install for offline use',
    'install.action': 'Install',
    'install.ios': 'Offline: tap Share → Add to Home Screen',
    'install.dismiss': 'Dismiss',
    'offline.badge': 'offline',
  },
};

/** 0 = Chu Nhat */
const WEEKDAYS: Record<Lang, string[]> = {
  vi: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
/** Tuan bat dau Thu Hai (chuan VN) */
const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

/** 0 = Xuan phan */
const SOLAR_TERMS_EN = [
  'Vernal Equinox', 'Clear & Bright', 'Grain Rain', 'Start of Summer', 'Grain Full', 'Grain in Ear',
  'Summer Solstice', 'Minor Heat', 'Major Heat', 'Start of Autumn', 'End of Heat', 'White Dew',
  'Autumn Equinox', 'Cold Dew', 'Frost Descent', 'Start of Winter', 'Minor Snow', 'Major Snow',
  'Winter Solstice', 'Minor Cold', 'Major Cold', 'Start of Spring', 'Rain Water', 'Awakening of Insects',
];

/** 0 = Ty (chuot) */
const ZODIAC_EN = ['Rat', 'Ox', 'Tiger', 'Cat', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

const HOLIDAYS_EN: Dict = {
  'solar-1-1': "New Year's Day",
  'solar-9-1': 'Students Day',
  'solar-3-2': 'Communist Party Founding',
  'solar-14-2': "Valentine's Day",
  'solar-27-2': "Doctors' Day",
  'solar-8-3': "International Women's Day",
  'solar-26-3': 'Youth Union Founding',
  'solar-21-4': 'Book & Reading Culture Day',
  'solar-30-4': 'Reunification Day',
  'solar-1-5': 'International Labour Day',
  'solar-7-5': 'Điện Biên Phủ Victory',
  'solar-19-5': "Hồ Chí Minh's Birthday",
  'solar-1-6': "International Children's Day",
  'solar-28-6': 'Vietnamese Family Day',
  'solar-27-7': 'War Invalids & Martyrs Day',
  'solar-19-8': 'August Revolution',
  'solar-2-9': 'National Day',
  'solar-10-10': 'Liberation of the Capital',
  'solar-20-10': "Vietnamese Women's Day",
  'solar-20-11': "Teachers' Day",
  'solar-22-12': "People's Army Day",
  'solar-24-12': 'Christmas Eve',
  'solar-25-12': 'Christmas',
  'lunar-1-1': 'Lunar New Year (Tết)',
  'lunar-2-1': 'Tết — Day 2',
  'lunar-3-1': 'Tết — Day 3',
  'lunar-15-1': 'Lantern Festival',
  'lunar-3-3': 'Cold Food Festival',
  'lunar-10-3': 'Hùng Kings Commemoration',
  'lunar-15-4': "Buddha's Birthday",
  'lunar-5-5': 'Mid-year Festival (Đoan Ngọ)',
  'lunar-15-7': 'Ghost Festival (Vu Lan)',
  'lunar-15-8': 'Mid-Autumn Festival',
  'lunar-9-9': 'Double Ninth Festival',
  'lunar-23-12': 'Kitchen Gods Day',
  'lunar-eve': "New Year's Eve (Giao thừa)",
};

export function makeT(lang: Lang) {
  const t = (key: string, vars?: Record<string, string | number>): string => {
    let s = UI[lang][key] ?? UI.vi[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
  return {
    lang,
    t,
    weekday: (i: number) => WEEKDAYS[lang][i] ?? '',
    weekdayShort: (i: number) => WEEKDAYS_SHORT[lang][i] ?? '',
    /** Tiet khi: tieng Viet giu nguyen ten goc, tieng Anh dich nghia */
    solarTerm: (i: number, viName: string) => (lang === 'en' ? (SOLAR_TERMS_EN[i] ?? viName) : viName),
    zodiac: (i: number, viName: string) => (lang === 'en' ? (ZODIAC_EN[i] ?? viName) : viName),
    holiday: (id: string, viName: string) => (lang === 'en' ? (HOLIDAYS_EN[id] ?? viName) : viName),
    /** "Tháng 9" / "September" */
    monthName: (m: number, y: number) =>
      lang === 'en'
        ? new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' })
        : `Tháng ${m}`,
  };
}

export type T = ReturnType<typeof makeT>;
