// HuyDeBug Spa - Mock data (sẽ thay bằng API thật sau)
// Author: HuyDeBug

export const services = [
  {
    id: 'svc-01',
    name: 'Liệu trình Detox Vàng 24K',
    category: 'Chăm sóc da',
    duration: 90,
    price: 2_490_000,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    description:
      'Liệu trình thải độc kết hợp tinh chất vàng 24K giúp da căng bóng, săn chắc và rạng rỡ tức thì.',
    highlights: ['Tinh chất vàng 24K', 'Mặt nạ collagen tươi', 'Massage thải độc bạch huyết'],
  },
  {
    id: 'svc-02',
    name: 'Massage Đá Nóng Hoàng Gia',
    category: 'Massage',
    duration: 75,
    price: 1_690_000,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    description:
      'Massage trị liệu với đá nóng núi lửa, tinh dầu thảo mộc giúp tan biến mọi căng thẳng.',
    highlights: ['Đá núi lửa Bali', 'Tinh dầu hữu cơ', 'KTV chứng chỉ quốc tế'],
  },
  {
    id: 'svc-03',
    name: 'Tắm Trắng Sữa Ngọc Trai',
    category: 'Body',
    duration: 60,
    price: 1_290_000,
    image: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800&q=80',
    description:
      'Tẩy tế bào chết toàn thân, đắp mặt nạ ngọc trai cho làn da trắng mịn tự nhiên.',
    highlights: ['Bột ngọc trai nguyên chất', 'Sữa dê hữu cơ', 'Phòng VIP riêng tư'],
  },
  {
    id: 'svc-04',
    name: 'Chăm sóc tóc Keratin Cao Cấp',
    category: 'Tóc',
    duration: 120,
    price: 1_890_000,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    description:
      'Phục hồi tóc hư tổn bằng keratin nhập khẩu Ý, trả lại mái tóc óng mượt đầy sức sống.',
    highlights: ['Keratin nhập khẩu Ý', 'Hấp dầu nhiệt sâu', 'Tư vấn 1-1'],
  },
  {
    id: 'svc-05',
    name: 'Trị mụn chuyên sâu Aqua',
    category: 'Chăm sóc da',
    duration: 80,
    price: 1_590_000,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
    description:
      'Công nghệ Aqua Peel kết hợp ánh sáng sinh học giúp đánh bay mụn, làm dịu da nhạy cảm.',
    highlights: ['Aqua Peel', 'Ánh sáng sinh học', 'Không đau, không nghỉ dưỡng'],
  },
  {
    id: 'svc-06',
    name: 'Spa Cặp Đôi Romance',
    category: 'Cặp đôi',
    duration: 100,
    price: 3_290_000,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    description:
      'Trải nghiệm spa lãng mạn cùng người thương trong phòng riêng với nến, hoa hồng và rượu vang.',
    highlights: ['Phòng đôi sang trọng', 'Tặng rượu vang Pháp', 'Massage đồng bộ 4 tay'],
  },
]

export const initialBookings = [
  {
    id: 'BK-1042',
    customerName: 'Nguyễn Mai Linh',
    phone: '0903 112 234',
    email: 'mailinh@example.com',
    serviceId: 'svc-01',
    date: '2026-04-29',
    time: '10:00',
    status: 'confirmed',
    note: 'Khách yêu cầu phòng yên tĩnh.',
  },
  {
    id: 'BK-1043',
    customerName: 'Trần Quốc Bảo',
    phone: '0911 555 778',
    email: 'qbao@example.com',
    serviceId: 'svc-02',
    date: '2026-04-29',
    time: '14:30',
    status: 'pending',
    note: '',
  },
  {
    id: 'BK-1044',
    customerName: 'Lê Hồng Ngọc',
    phone: '0987 224 119',
    email: 'lhn@example.com',
    serviceId: 'svc-06',
    date: '2026-04-30',
    time: '18:00',
    status: 'confirmed',
    note: 'Kỉ niệm 1 năm — chuẩn bị hoa hồng.',
  },
  {
    id: 'BK-1045',
    customerName: 'Phạm Thanh Hà',
    phone: '0978 661 002',
    email: 'phamha@example.com',
    serviceId: 'svc-03',
    date: '2026-05-01',
    time: '09:00',
    status: 'cancelled',
    note: 'Khách báo bận.',
  },
  {
    id: 'BK-1046',
    customerName: 'Đỗ Khánh An',
    phone: '0933 008 776',
    email: 'khanhan@example.com',
    serviceId: 'svc-04',
    date: '2026-05-02',
    time: '15:00',
    status: 'pending',
    note: '',
  },
]

export const customers = [
  { id: 'C-001', name: 'Nguyễn Mai Linh', phone: '0903 112 234', visits: 12, totalSpend: 18_900_000, tier: 'Bạch kim' },
  { id: 'C-002', name: 'Trần Quốc Bảo', phone: '0911 555 778', visits: 4, totalSpend: 5_400_000, tier: 'Vàng' },
  { id: 'C-003', name: 'Lê Hồng Ngọc', phone: '0987 224 119', visits: 8, totalSpend: 12_300_000, tier: 'Vàng' },
  { id: 'C-004', name: 'Phạm Thanh Hà', phone: '0978 661 002', visits: 2, totalSpend: 2_580_000, tier: 'Bạc' },
  { id: 'C-005', name: 'Đỗ Khánh An', phone: '0933 008 776', visits: 6, totalSpend: 9_400_000, tier: 'Vàng' },
  { id: 'C-006', name: 'Hoàng Yến Nhi', phone: '0905 776 221', visits: 15, totalSpend: 24_700_000, tier: 'Bạch kim' },
]

export const testimonials = [
  {
    id: 't1',
    name: 'Mỹ Anh',
    role: 'Khách hàng VIP',
    quote:
      'Không gian sang trọng, kỹ thuật viên cực kì chuyên nghiệp. Mỗi lần đến HuyDeBug Spa là một lần thư giãn đẳng cấp.',
    rating: 5,
  },
  {
    id: 't2',
    name: 'Quang Vinh',
    role: 'Doanh nhân',
    quote:
      'Massage đá nóng ở đây xứng tầm 5 sao. Sau buổi trị liệu là cảm giác cơ thể nhẹ tênh, đầu óc minh mẫn hẳn.',
    rating: 5,
  },
  {
    id: 't3',
    name: 'Thu Hà',
    role: 'Stylist',
    quote: 'Da mình cải thiện rõ chỉ sau 3 buổi liệu trình Detox Vàng. Đáng đồng tiền bát gạo!',
    rating: 5,
  },
]

export const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
