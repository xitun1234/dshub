export interface DefaultStation {
  name: string
  region: string
  aliases: string[]
}

export const DEFAULT_STATIONS: DefaultStation[] = [
  // MN (Miền Nam)
  { name: 'TP.HCM', region: 'MN', aliases: ['tphcm', 'hcm', 'tp'] },
  { name: 'Long An', region: 'MN', aliases: ['la', 'longan'] },
  { name: 'Bình Phước', region: 'MN', aliases: ['bp', 'binhphuoc'] },
  { name: 'Hậu Giang', region: 'MN', aliases: ['hg', 'haugiang'] },
  { name: 'Bến Tre', region: 'MN', aliases: ['bt', 'bentre', 'btre'] },
  { name: 'Vũng Tàu', region: 'MN', aliases: ['vt', 'vungtau', 'vtau'] },
  { name: 'Bạc Liêu', region: 'MN', aliases: ['bl', 'baclieu', 'blieu'] },
  { name: 'Đồng Nai', region: 'MN', aliases: ['dn', 'dongnai'] },
  { name: 'Cần Thơ', region: 'MN', aliases: ['ct', 'cantho'] },
  { name: 'Sóc Trăng', region: 'MN', aliases: ['st', 'soctrang'] },
  { name: 'Tây Ninh', region: 'MN', aliases: ['tn', 'tayninh'] },
  { name: 'An Giang', region: 'MN', aliases: ['ag', 'angiang'] },
  { name: 'Bình Thuận', region: 'MN', aliases: ['bt', 'bth', 'binhthuan'] },
  { name: 'Vĩnh Long', region: 'MN', aliases: ['vl', 'vinhlong'] },
  { name: 'Bình Dương', region: 'MN', aliases: ['bd', 'binhduong'] },
  { name: 'Trà Vinh', region: 'MN', aliases: ['tv', 'travinh'] },
  { name: 'Đồng Tháp', region: 'MN', aliases: ['dt', 'dongthap'] },
  { name: 'Cà Mau', region: 'MN', aliases: ['cm', 'camau'] },
  { name: 'Tiền Giang', region: 'MN', aliases: ['tg', 'tiengiang'] },
  { name: 'Kiên Giang', region: 'MN', aliases: ['kg', 'kiengiang'] },
  { name: 'Đà Lạt', region: 'MN', aliases: ['dl', 'dalat'] },

  // MT (Miền Trung)
  { name: 'Thừa Thiên Huế', region: 'MT', aliases: ['tth', 'hue', 'hu'] },
  { name: 'Phú Yên', region: 'MT', aliases: ['py', 'phuyen'] },
  { name: 'Đắk Lắk', region: 'MT', aliases: ['dl', 'dlk', 'daklak', 'dak'] },
  { name: 'Quảng Nam', region: 'MT', aliases: ['qn', 'qnm', 'quangnam', 'qnam'] },
  { name: 'Đà Nẵng', region: 'MT', aliases: ['dn', 'dnang', 'danang'] },
  { name: 'Khánh Hòa', region: 'MT', aliases: ['kh', 'khanhhoa'] },
  { name: 'Bình Định', region: 'MT', aliases: ['bd', 'bdi', 'binhdinh'] },
  { name: 'Quảng Trị', region: 'MT', aliases: ['qt', 'quangtri'] },
  { name: 'Quảng Bình', region: 'MT', aliases: ['qb', 'quangbinh'] },
  { name: 'Gia Lai', region: 'MT', aliases: ['gl', 'gialai'] },
  { name: 'Ninh Thuận', region: 'MT', aliases: ['nt', 'ninhthuan'] },
  { name: 'Quảng Ngãi', region: 'MT', aliases: ['qng', 'quangngai'] },
  { name: 'Đắk Nông', region: 'MT', aliases: ['dno', 'daknong'] },
  { name: 'Kon Tum', region: 'MT', aliases: ['kt', 'kontum'] },

  // MB (Miền Bắc)
  { name: 'Hà Nội', region: 'MB', aliases: ['hn', 'hanoi'] },
  { name: 'Thái Bình', region: 'MB', aliases: ['tb', 'thaibinh'] },
  { name: 'Bắc Ninh', region: 'MB', aliases: ['bn', 'bacninh'] },
  { name: 'Hải Phòng', region: 'MB', aliases: ['hp', 'haiphong'] },
  { name: 'Nam Định', region: 'MB', aliases: ['nd', 'namdinh'] },
  { name: 'Quảng Ninh', region: 'MB', aliases: ['qn', 'quangninh'] },

  // CHUNG (Multi-stations / Phím tắt đài chung)
  { name: '2 Đài', region: 'CHUNG', aliases: ['2dai', '2d', '2đ', '2đài'] },
  { name: '3 Đài', region: 'CHUNG', aliases: ['3dai', '3d', '3đ', '3đài'] },
  { name: '4 Đài', region: 'CHUNG', aliases: ['4dai', '4d', '4đ', '4đài'] }
]
