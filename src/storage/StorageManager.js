/**
 * 存储管理器 - 负责localStorage的封装和管理
 * 提供数据存储、读取和异常处理功能
 */
export class StorageManager {
  constructor() {
    this.prefix = 'pixelRunner_';
    this.maxRetries = 3;
  }

  /**
   * 保存数据到localStorage
   * @param {string} key - 存储键名
   * @param {any} data - 要存储的数据
   * @returns {boolean} 是否保存成功
   */
  save(key, data) {
    const fullKey = this.prefix + key;
    
    try {
      const jsonString = JSON.stringify(data);
      
      localStorage.setItem(fullKey, jsonString);
      return true;
    } catch (error) {
      console.warn('[StorageManager] 保存失败:', error.message);
      
      if (error.name === 'QuotaExceededError' || 
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        this.cleanupOldData();
        
        try {
          const jsonString = JSON.stringify(data);
          localStorage.setItem(fullKey, jsonString);
          return true;
        } catch (retryError) {
          console.error('[StorageManager] 重试保存失败:', retryError.message);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * 从localStorage读取数据
   * @param {string} key - 存储键名
   * @param {any} defaultValue - 默认值（读取失败时返回）
   * @returns {any} 读取的数据或默认值
   */
  load(key, defaultValue = null) {
    const fullKey = this.prefix + key;
    
    try {
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return defaultValue;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.warn('[StorageManager] 读取失败:', error.message);
      return defaultValue;
    }
  }

  /**
   * 删除指定键名的数据
   * @param {string} key - 存储键名
   */
  remove(key) {
    const fullKey = this.prefix + key;
    
    try {
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('[StorageManager] 删除失败:', error.message);
      return false;
    }
  }

  /**
   * 清理旧的存储数据
   * 当存储空间满时调用，清理非关键数据
   */
  cleanupOldData() {
    const keysToClean = [
      'coffeeRemaining',
      'coffeeActive',
      'tempGameData'
    ];
    
    keysToClean.forEach(key => {
      try {
        const fullKey = this.prefix + key;
        if (localStorage.getItem(fullKey) !== null) {
          localStorage.removeItem(fullKey);
          console.log('[StorageManager] 清理旧数据:', key);
        }
      } catch (error) {
        console.warn('[StorageManager] 清理数据失败:', key);
      }
    });
  }

  /**
   * 检查存储是否可用
   * @returns {boolean} localStorage是否可用
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('[StorageManager] localStorage不可用:', error.message);
      return false;
    }
  }

  /**
   * 清除所有应用相关的数据
   * 用于重置游戏状态或清理旧数据
   */
  clearAllAppData() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('[StorageManager] 已清除数据:', key);
      });
      
      return keysToRemove.length;
    } catch (error) {
      console.error('[StorageManager] 清除数据失败:', error.message);
      return 0;
    }
  }
}
