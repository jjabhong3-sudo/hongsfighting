// ============================================================
// 동선 데이터 (서울 화곡역 → 동남아시아 72개 도시)
// route.md 기반 50km/일 육로 이동 루트
// 국가별 이모지 마커 포함
// ============================================================

import { Waypoint } from '@/types/domain';

/**
 * 전체 경유지 배열 (72개 도시)
 * 11개 구간, 12개국 경유
 *
 * 구간:
 *  1) 대한민국 (서울→부산)         400km  | 🇰🇷
 *  2) 일본 (삿포로→후쿠오카)      2,000km | 🇯🇵
 *  3) 중국 구간1 (베이징→칭다오)    638km | 🇨🇳
 *  4) 중국 구간2 (칭다오→상하이)    699km | 🇨🇳
 *  5) 대만 (타이베이→가오슝)        346km | 🇹🇼
 *  6) 홍콩~마카오                    60km | 🇭🇰🇲🇴
 *  7) 마카오→하노이                 980km | 🇨🇳🇻🇳
 *  8) 베트남 종단 (하노이→호치민) 1,730km | 🇻🇳
 *  9) 동남아 구간1 (호치민→싱가포르) 1,771km | 🇻🇳🇰🇭🇹🇭🇲🇾🇸🇬
 * 10) 동남아 구간2 (싱가포르→방콕) 1,807km | 🇸🇬🇲🇾🇹🇭
 * 11) 태국~라오스 순환 (방콕→파타야) 2,063km | 🇹🇭🇱🇦
 *
 * 총 육로 이동 거리: 약 12,494km
 * 50km/일 기준: 약 250일
 */

export const WAYPOINTS: Waypoint[] = [
  // ===== 1) 대한민국 (서울→부산) 400km =====
  { name: '서울 화곡역', lat: 37.5415, lng: 126.8405, segmentType: 'land', distanceKmFromStart: 0, emoji: '🏁', country: '대한민국' },
  { name: '수원', lat: 37.2636, lng: 127.0286, segmentType: 'land', distanceKmFromStart: 50, emoji: '🏙️', country: '대한민국' },
  { name: '평택', lat: 36.9921, lng: 127.1127, segmentType: 'land', distanceKmFromStart: 100, emoji: '🏙️', country: '대한민국' },
  { name: '천안', lat: 36.8151, lng: 127.1139, segmentType: 'land', distanceKmFromStart: 150, emoji: '🏙️', country: '대한민국' },
  { name: '청주', lat: 36.6424, lng: 127.4890, segmentType: 'land', distanceKmFromStart: 200, emoji: '🏙️', country: '대한민국' },
  { name: '대전', lat: 36.3504, lng: 127.3845, segmentType: 'land', distanceKmFromStart: 250, emoji: '🏙️', country: '대한민국' },
  { name: '대구', lat: 35.8714, lng: 128.6014, segmentType: 'land', distanceKmFromStart: 300, emoji: '🏙️', country: '대한민국' },
  { name: '울산', lat: 35.5384, lng: 129.3114, segmentType: 'land', distanceKmFromStart: 350, emoji: '🏙️', country: '대한민국' },
  { name: '부산', lat: 35.1796, lng: 129.0756, segmentType: 'land', distanceKmFromStart: 400, emoji: '🚢', country: '대한민국' },

  // ===== 2) 일본 (삿포로→후쿠오카) 2,000km =====
  { name: '삿포로', lat: 43.0618, lng: 141.3545, segmentType: 'sea', distanceKmFromStart: 1500, emoji: '🗾', country: '일본' },
  { name: '하코다테', lat: 41.7687, lng: 140.7288, segmentType: 'land', distanceKmFromStart: 1650, emoji: '🗾', country: '일본' },
  { name: '아오모리', lat: 40.8222, lng: 140.7474, segmentType: 'land', distanceKmFromStart: 1750, emoji: '🗾', country: '일본' },
  { name: '센다이', lat: 38.2682, lng: 140.8694, segmentType: 'land', distanceKmFromStart: 1950, emoji: '🗾', country: '일본' },
  { name: '도쿄', lat: 35.6762, lng: 139.6503, segmentType: 'land', distanceKmFromStart: 2300, emoji: '🗼', country: '일본' },
  { name: '나고야', lat: 35.1815, lng: 136.9066, segmentType: 'land', distanceKmFromStart: 2600, emoji: '🗾', country: '일본' },
  { name: '오사카', lat: 34.6937, lng: 135.5023, segmentType: 'land', distanceKmFromStart: 2800, emoji: '🏯', country: '일본' },
  { name: '히로시마', lat: 34.3853, lng: 132.4553, segmentType: 'land', distanceKmFromStart: 3100, emoji: '🗾', country: '일본' },
  { name: '후쿠오카', lat: 33.5902, lng: 130.4017, segmentType: 'land', distanceKmFromStart: 3500, emoji: '🗾', country: '일본' },

  // ===== 3) 중국 구간1 (베이징→칭다오) 638km =====
  { name: '베이징', lat: 39.9042, lng: 116.4074, segmentType: 'sea', distanceKmFromStart: 4000, emoji: '🏮', country: '중국' },
  { name: '톈진', lat: 39.0842, lng: 117.2010, segmentType: 'land', distanceKmFromStart: 4120, emoji: '🏮', country: '중국' },
  { name: '칭저우', lat: 36.6976, lng: 118.4796, segmentType: 'land', distanceKmFromStart: 4250, emoji: '🏮', country: '중국' },
  { name: '웨이팡', lat: 36.7069, lng: 119.1618, segmentType: 'land', distanceKmFromStart: 4350, emoji: '🏮', country: '중국' },
  { name: '자오저우', lat: 36.2647, lng: 120.0331, segmentType: 'land', distanceKmFromStart: 4500, emoji: '🏮', country: '중국' },
  { name: '칭다오', lat: 36.0671, lng: 120.3826, segmentType: 'land', distanceKmFromStart: 4638, emoji: '🍺', country: '중국' },

  // ===== 4) 중국 구간2 (칭다오→상하이) 699km =====
  { name: '르자오', lat: 35.4164, lng: 119.5269, segmentType: 'land', distanceKmFromStart: 4738, emoji: '🏮', country: '중국' },
  { name: '롄윈강', lat: 34.5967, lng: 119.2216, segmentType: 'land', distanceKmFromStart: 4938, emoji: '🏮', country: '중국' },
  { name: '옌청', lat: 33.3490, lng: 120.1636, segmentType: 'land', distanceKmFromStart: 5088, emoji: '🏮', country: '중국' },
  { name: '난징', lat: 32.0603, lng: 118.7969, segmentType: 'land', distanceKmFromStart: 5238, emoji: '🏯', country: '중국' },
  { name: '상하이', lat: 31.2304, lng: 121.4737, segmentType: 'land', distanceKmFromStart: 5337, emoji: '🌃', country: '중국' },

  // ===== 5) 대만 (타이베이→가오슝) 346km =====
  { name: '타이베이', lat: 25.0330, lng: 121.5654, segmentType: 'sea', distanceKmFromStart: 5700, emoji: '🏯', country: '대만' },
  { name: '신주', lat: 24.8138, lng: 120.9675, segmentType: 'land', distanceKmFromStart: 5770, emoji: '🇹🇼', country: '대만' },
  { name: '타이중', lat: 24.1477, lng: 120.6736, segmentType: 'land', distanceKmFromStart: 5850, emoji: '🇹🇼', country: '대만' },
  { name: '자이', lat: 23.4801, lng: 120.4491, segmentType: 'land', distanceKmFromStart: 5930, emoji: '🇹🇼', country: '대만' },
  { name: '가오슝', lat: 22.6273, lng: 120.3014, segmentType: 'land', distanceKmFromStart: 6046, emoji: '🚢', country: '대만' },

  // ===== 6) 홍콩~마카오 60km =====
  { name: '홍콩', lat: 22.3193, lng: 114.1694, segmentType: 'sea', distanceKmFromStart: 6400, emoji: '🌆', country: '홍콩' },
  { name: '마카오', lat: 22.1987, lng: 113.5439, segmentType: 'land', distanceKmFromStart: 6460, emoji: '🎰', country: '마카오' },

  // ===== 7) 마카오→하노이 980km =====
  { name: '광저우', lat: 23.1291, lng: 113.2644, segmentType: 'land', distanceKmFromStart: 6600, emoji: '🏮', country: '중국' },
  { name: '우저우', lat: 23.4769, lng: 111.2791, segmentType: 'land', distanceKmFromStart: 6860, emoji: '🏮', country: '중국' },
  { name: '난닝', lat: 22.8170, lng: 108.3669, segmentType: 'land', distanceKmFromStart: 7160, emoji: '🏮', country: '중국' },
  { name: '랑선', lat: 21.8469, lng: 106.7570, segmentType: 'land', distanceKmFromStart: 7360, emoji: '🏔️', country: '베트남' },
  { name: '하노이', lat: 21.0278, lng: 105.8342, segmentType: 'land', distanceKmFromStart: 7440, emoji: '🏯', country: '베트남' },

  // ===== 8) 베트남 종단 (하노이→호치민) 1,730km =====
  { name: '타인호아', lat: 19.8067, lng: 105.7852, segmentType: 'land', distanceKmFromStart: 7590, emoji: '🇻🇳', country: '베트남' },
  { name: '빈', lat: 18.6796, lng: 105.6813, segmentType: 'land', distanceKmFromStart: 7790, emoji: '🇻🇳', country: '베트남' },
  { name: '빈오', lat: 18.3420, lng: 105.9048, segmentType: 'land', distanceKmFromStart: 7940, emoji: '🇻🇳', country: '베트남' },
  { name: '동허이', lat: 17.4689, lng: 106.6223, segmentType: 'land', distanceKmFromStart: 8090, emoji: '🇻🇳', country: '베트남' },
  { name: '후에', lat: 16.4637, lng: 107.5909, segmentType: 'land', distanceKmFromStart: 8240, emoji: '🏯', country: '베트남' },
  { name: '다낭', lat: 16.0544, lng: 108.2022, segmentType: 'land', distanceKmFromStart: 8390, emoji: '🏖️', country: '베트남' },
  { name: '꽝응아이', lat: 15.1205, lng: 108.7923, segmentType: 'land', distanceKmFromStart: 8540, emoji: '🇻🇳', country: '베트남' },
  { name: '꾸이년', lat: 13.7820, lng: 109.2197, segmentType: 'land', distanceKmFromStart: 8690, emoji: '🇻🇳', country: '베트남' },
  { name: '나트랑', lat: 12.2388, lng: 109.1967, segmentType: 'land', distanceKmFromStart: 8840, emoji: '🏖️', country: '베트남' },
  { name: '무이네', lat: 10.9333, lng: 108.2833, segmentType: 'land', distanceKmFromStart: 8990, emoji: '🏖️', country: '베트남' },
  { name: '호치민', lat: 10.8231, lng: 106.6297, segmentType: 'land', distanceKmFromStart: 9170, emoji: '🌆', country: '베트남' },

  // ===== 9) 동남아 구간1 (호치민→싱가포르) 1,771km =====
  { name: '프놈펜', lat: 11.5564, lng: 104.9282, segmentType: 'land', distanceKmFromStart: 9420, emoji: '🏯', country: '캄보디아' },
  { name: '시엠립', lat: 13.3671, lng: 103.8448, segmentType: 'land', distanceKmFromStart: 9620, emoji: '🏛️', country: '캄보디아' },
  { name: '방콕', lat: 13.7563, lng: 100.5018, segmentType: 'land', distanceKmFromStart: 9870, emoji: '🛕', country: '태국' },
  { name: '촘폰', lat: 10.4930, lng: 99.1800, segmentType: 'land', distanceKmFromStart: 10170, emoji: '🇹🇭', country: '태국' },
  { name: '핫야이', lat: 7.0084, lng: 100.4747, segmentType: 'land', distanceKmFromStart: 10370, emoji: '🇹🇭', country: '태국' },
  { name: '쿠알라룸푸르', lat: 3.1390, lng: 101.6869, segmentType: 'land', distanceKmFromStart: 10570, emoji: '🗼', country: '말레이시아' },
  { name: '싱가포르', lat: 1.3521, lng: 103.8198, segmentType: 'land', distanceKmFromStart: 10941, emoji: '🦁', country: '싱가포르' },

  // ===== 10) 동남아 구간2 (싱가포르→방콕) 1,807km =====
  { name: '쿠알라룸푸르', lat: 3.1390, lng: 101.6869, segmentType: 'land', distanceKmFromStart: 10941, emoji: '🗼', country: '말레이시아' },
  { name: '페낭', lat: 5.4164, lng: 100.3327, segmentType: 'land', distanceKmFromStart: 11291, emoji: '🏖️', country: '말레이시아' },
  { name: '핫야이', lat: 7.0084, lng: 100.4747, segmentType: 'land', distanceKmFromStart: 11641, emoji: '🇹🇭', country: '태국' },
  { name: '촘폰', lat: 10.4930, lng: 99.1800, segmentType: 'land', distanceKmFromStart: 11841, emoji: '🇹🇭', country: '태국' },
  { name: '방콕', lat: 13.7563, lng: 100.5018, segmentType: 'land', distanceKmFromStart: 12148, emoji: '🛕', country: '태국' },

  // ===== 11) 태국~라오스 순환 (방콕→파타야) 2,063km =====
  { name: '핏사눌록', lat: 16.8211, lng: 100.2659, segmentType: 'land', distanceKmFromStart: 12348, emoji: '🇹🇭', country: '태국' },
  { name: '람빵', lat: 18.2888, lng: 99.4909, segmentType: 'land', distanceKmFromStart: 12548, emoji: '🇹🇭', country: '태국' },
  { name: '치앙마이', lat: 18.7883, lng: 98.9853, segmentType: 'land', distanceKmFromStart: 12834, emoji: '🏔️', country: '태국' },
  { name: '루앙프라방', lat: 19.8856, lng: 102.1340, segmentType: 'land', distanceKmFromStart: 13009, emoji: '🏛️', country: '라오스' },
  { name: '비엔티안', lat: 17.9757, lng: 102.6331, segmentType: 'land', distanceKmFromStart: 13334, emoji: '🏛️', country: '라오스' },
  { name: '우돈타니', lat: 17.4138, lng: 102.7870, segmentType: 'land', distanceKmFromStart: 13648, emoji: '🇹🇭', country: '태국' },
  { name: '코라트', lat: 14.9799, lng: 102.0977, segmentType: 'land', distanceKmFromStart: 13948, emoji: '🇹🇭', country: '태국' },
  { name: '파타야', lat: 12.9236, lng: 100.8825, segmentType: 'land', distanceKmFromStart: 14211, emoji: '🏖️', country: '태국' },
];

/** 전체 경로 총 거리(km) */
export const TOTAL_DISTANCE_KM = WAYPOINTS[WAYPOINTS.length - 1].distanceKmFromStart;

/** 경유지 이름 목록 */
export const WAYPOINT_NAMES = WAYPOINTS.map((w) => w.name);

/** 국가별 구간 정보 */
export const COUNTRY_SEGMENTS = [
  { name: '🇰🇷 대한민국', startIndex: 0, endIndex: 8, color: '#3b82f6' },
  { name: '🇯🇵 일본', startIndex: 9, endIndex: 17, color: '#f59e0b' },
  { name: '🇨🇳 중국 (북부)', startIndex: 18, endIndex: 23, color: '#ef4444' },
  { name: '🇨🇳 중국 (동부)', startIndex: 24, endIndex: 28, color: '#dc2626' },
  { name: '🇹🇼 대만', startIndex: 29, endIndex: 33, color: '#8b5cf6' },
  { name: '🇭🇰 홍콩 / 🇲🇴 마카오', startIndex: 34, endIndex: 35, color: '#14b8a6' },
  { name: '🇨🇳→🇻🇳 중국~베트남', startIndex: 36, endIndex: 40, color: '#22c55e' },
  { name: '🇻🇳 베트남 종단', startIndex: 41, endIndex: 51, color: '#16a34a' },
  { name: '🇻🇳→🇸🇬 동남아 구간1', startIndex: 52, endIndex: 58, color: '#ec4899' },
  { name: '🇸🇬→🇹🇭 동남아 구간2', startIndex: 59, endIndex: 63, color: '#f97316' },
  { name: '🇹🇭🇱🇦 태국~라오스', startIndex: 64, endIndex: 71, color: '#1e293b' },
];
