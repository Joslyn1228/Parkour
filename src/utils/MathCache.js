/**
 * 数学计算缓存工具类
 * 
 * 缓存常用数学计算结果，避免每帧重复计算
 */
export class MathCache {
  static PI = Math.PI;
  static PI2 = Math.PI * 2;
  static PI_HALF = Math.PI / 2;
  static PI_QUARTER = Math.PI / 4;
  
  static DEG_TO_RAD = Math.PI / 180;
  static RAD_TO_DEG = 180 / Math.PI;
  
  static SIN_CACHE = new Map();
  static COS_CACHE = new Map();
  
  static TWO_PI = Math.PI * 2;
  
  /**
   * 获取正弦值（带缓存）
   * @param {number} angle - 角度（弧度）
   * @returns {number} 正弦值
   */
  static sin(angle) {
    const key = Math.round(angle * 1000);
    if (!this.SIN_CACHE.has(key)) {
      this.SIN_CACHE.set(key, Math.sin(angle));
    }
    return this.SIN_CACHE.get(key);
  }
  
  /**
   * 获取余弦值（带缓存）
   * @param {number} angle - 角度（弧度）
   * @returns {number} 余弦值
   */
  static cos(angle) {
    const key = Math.round(angle * 1000);
    if (!this.COS_CACHE.has(key)) {
      this.COS_CACHE.set(key, Math.cos(angle));
    }
    return this.COS_CACHE.get(key);
  }
  
  /**
   * 计算两点之间的距离（优化版本）
   * @param {number} x1 - 点1的X坐标
   * @param {number} y1 - 点1的Y坐标
   * @param {number} x2 - 点2的X坐标
   * @param {number} y2 - 点2的Y坐标
   * @returns {number} 距离的平方（避免开方运算）
   */
  static distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }
  
  /**
   * 计算两点之间的实际距离
   * @param {number} x1 - 点1的X坐标
   * @param {number} y1 - 点1的Y坐标
   * @param {number} x2 - 点2的X坐标
   * @param {number} y2 - 点2的Y坐标
   * @returns {number} 距离
   */
  static distance(x1, y1, x2, y2) {
    return Math.sqrt(this.distanceSquared(x1, y1, x2, y2));
  }
  
  /**
   * 限制数值在指定范围内
   * @param {number} value - 输入值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的值
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * 线性插值
   * @param {number} start - 起始值
   * @param {number} end - 结束值
   * @param {number} t - 插值因子（0-1）
   * @returns {number} 插值结果
   */
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }
  
  /**
   * 清空缓存
   */
  static clearCache() {
    this.SIN_CACHE.clear();
    this.COS_CACHE.clear();
  }
}
