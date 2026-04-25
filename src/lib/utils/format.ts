// ============================================================
// 숫자 포맷 유틸리티
// ============================================================

/**
 * 숫자에 천단위 콤마 추가
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 문자열에서 숫자만 추출
 */
export function extractNumber(str: string): string {
  return str.replace(/[^0-9]/g, '');
}

/**
 * 입력값을 천단위 콤마가 있는 문자열로 변환
 */
export function formatInputNumber(value: string): string {
  const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
  return num.toLocaleString('ko-KR');
}

/**
 * 콤마가 포함된 문자열을 숫자로 변환
 */
export function parseFormattedNumber(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, '')) || 0;
}
