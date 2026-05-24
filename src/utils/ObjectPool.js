/**
 * 对象池管理器类
 * 
 * 实现对象池化管理，避免频繁创建和销毁对象
 * 适用于Collider、粒子等需要频繁创建的对象
 */
export class ObjectPool {
  /**
   * 构造函数
   * @param {function} createFunc - 创建对象的工厂函数
   * @param {number} initialSize - 初始池大小
   * @param {number} maxSize - 最大池大小
   */
  constructor(createFunc, initialSize = 10, maxSize = 100) {
    this.createFunc = createFunc;
    this.maxSize = maxSize;
    this.pool = [];
    
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFunc());
    }
  }
  
  /**
   * 获取一个对象
   * @returns {object} 从池中获取的对象
   */
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFunc();
  }
  
  /**
   * 释放对象回池中
   * @param {object} obj - 要释放的对象
   */
  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }
  
  /**
   * 清空对象池
   */
  clear() {
    this.pool = [];
  }
  
  /**
   * 获取当前池大小
   * @returns {number} 当前池大小
   */
  getSize() {
    return this.pool.length;
  }
}

/**
 * 全局对象池管理器
 * 
 * 管理所有类型的对象池
 */
export class PoolManager {
  constructor() {
    this.pools = new Map();
  }
  
  /**
   * 注册对象池
   * @param {string} type - 对象类型标识
   * @param {ObjectPool} pool - 对象池实例
   */
  registerPool(type, pool) {
    this.pools.set(type, pool);
  }
  
  /**
   * 获取对象池
   * @param {string} type - 对象类型标识
   * @returns {ObjectPool|null} 对象池实例
   */
  getPool(type) {
    return this.pools.get(type) || null;
  }
  
  /**
   * 从指定类型的池中获取对象
   * @param {string} type - 对象类型标识
   * @returns {object|null} 获取的对象
   */
  acquire(type) {
    const pool = this.getPool(type);
    return pool ? pool.acquire() : null;
  }
  
  /**
   * 释放对象回指定类型的池中
   * @param {string} type - 对象类型标识
   * @param {object} obj - 要释放的对象
   */
  release(type, obj) {
    const pool = this.getPool(type);
    if (pool) {
      pool.release(obj);
    }
  }
  
  /**
   * 清空所有对象池
   */
  clearAll() {
    this.pools.forEach(pool => pool.clear());
  }
  
  /**
   * 获取所有池的统计信息
   * @returns {object} 统计信息对象
   */
  getStats() {
    const stats = {};
    this.pools.forEach((pool, type) => {
      stats[type] = pool.getSize();
    });
    return stats;
  }
}

// 创建全局池管理器实例
export const globalPoolManager = new PoolManager();
