/**
 * 排行榜管理器 - 负责管理游戏排行榜数据
 * 支持提交分数、获取排行榜、判断是否进入排行榜等功能
 */
import { StorageManager } from './StorageManager.js';

export class LeaderboardManager {
  constructor() {
    this.storageKey = 'leaderboard';
    this.storage = new StorageManager();
    this.maxEntries = 3;
    
    this.leaderboard = this.loadLeaderboard();
  }

  /**
   * 从存储加载排行榜数据
   * @returns {Array} 排行榜数组
   */
  loadLeaderboard() {
    const data = this.storage.load(this.storageKey, []);
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.filter(entry => {
      return entry && 
             typeof entry.score === 'number' && 
             typeof entry.nickname === 'string' &&
             entry.nickname.length >= 2 &&
             entry.nickname.length <= 12;
    }).slice(0, this.maxEntries);
  }

  /**
   * 保存排行榜数据到存储
   * @returns {boolean} 是否保存成功
   */
  saveLeaderboard() {
    return this.storage.save(this.storageKey, this.leaderboard);
  }

  /**
   * 提交新分数到排行榜
   * @param {number} score - 分数
   * @param {string} nickname - 昵称（2-12字符）
   * @returns {number} 新分数在排行榜中的排名（1-3），0表示未进入排行榜
   */
  submitScore(score, nickname) {
    if (typeof score !== 'number' || score < 0) {
      console.warn('[LeaderboardManager] 无效的分数:', score);
      return 0;
    }
    
    const trimmedNickname = this.validateNickname(nickname);
    if (!trimmedNickname) {
      console.warn('[LeaderboardManager] 无效的昵称:', nickname);
      return 0;
    }
    
    const rank = this.findRank(score);
    
    if (rank > 0 && rank <= this.maxEntries) {
      const newEntry = {
        score: score,
        nickname: trimmedNickname,
        timestamp: Date.now()
      };
      
      this.leaderboard.splice(rank - 1, 0, newEntry);
      
      if (this.leaderboard.length > this.maxEntries) {
        this.leaderboard = this.leaderboard.slice(0, this.maxEntries);
      }
      
      this.saveLeaderboard();
    }
    
    return rank;
  }

  /**
   * 验证昵称
   * @param {string} nickname - 昵称
   * @returns {string|null} 验证通过的昵称或null
   */
  validateNickname(nickname) {
    if (typeof nickname !== 'string') {
      return null;
    }
    
    const trimmed = nickname.trim();
    
    if (trimmed.length < 2 || trimmed.length > 12) {
      return null;
    }
    
    return trimmed;
  }

  /**
   * 查找分数在排行榜中的排名
   * @param {number} score - 要查询的分数
   * @returns {number} 排名（1-3），0表示未进入排行榜
   */
  findRank(score) {
    if (this.leaderboard.length < this.maxEntries) {
      return this.leaderboard.length + 1;
    }
    
    for (let i = 0; i < this.leaderboard.length; i++) {
      if (score > this.leaderboard[i].score) {
        return i + 1;
      }
    }
    
    return 0;
  }

  /**
   * 获取完整排行榜
   * @returns {Array} 排行榜数组（按分数降序）
   */
  getLeaderboard() {
    return [...this.leaderboard];
  }

  /**
   * 检查分数是否能够进入排行榜
   * @param {number} score - 要检查的分数
   * @returns {boolean} 是否能够进入排行榜
   */
  isHighScore(score) {
    if (typeof score !== 'number' || score < 0) {
      return false;
    }
    
    if (this.leaderboard.length < this.maxEntries) {
      return true;
    }
    
    return score > this.leaderboard[this.leaderboard.length - 1].score;
  }

  /**
   * 获取排行榜条目数量
   * @returns {number} 当前排行榜条目数
   */
  getEntryCount() {
    return this.leaderboard.length;
  }

  /**
   * 清空排行榜
   */
  clearLeaderboard() {
    this.leaderboard = [];
    this.storage.remove(this.storageKey);
  }
}
