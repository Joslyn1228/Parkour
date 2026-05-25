/**
 * 存储管理器 - 负责localStorage的封装和管理
 * 提供数据存储、读取和异常处理功能
 */
export class StorageManager {
  constructor() {
    this.prefix = 'pixelRunner_';
    this.maxRetries = 3;
  }

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

/**
 * 排行榜管理器 - 负责管理游戏排行榜数据
 */
export class LeaderboardManager {
  constructor() {
    this.storageKey = 'leaderboard';
    this.storage = new StorageManager();
    this.maxEntries = 10;
    this.apiBase = '/api';
    this.socket = null;
    
    this.leaderboard = this.loadLeaderboard();
    
    this.onLeaderboardUpdate = null;
    
    this.connectWebSocket();
    this.setupLocalStorageListener();
    this.setupVisibilityChangeListener();
    // 在开发环境中全局暴露以便调试（只为开发/排查用）
    try {
      const hostname = (window && window.location && window.location.hostname) ? window.location.hostname : '';
      const isDevHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
      if (isDevHost) {
        window.leaderboardManager = this;
      }
    } catch (e) {
      // 非浏览器环境或访问受限时忽略
    }
  }
  
  connectWebSocket() {
    if (typeof io !== 'undefined') {
      this.socket = io();
      try {
        const hostname = (window && window.location && window.location.hostname) ? window.location.hostname : '';
        const isDevHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
        if (isDevHost) { window.leaderboardSocket = this.socket; }
      } catch (e) {}
      
      this.socket.on('connect', () => {
        console.log('[LeaderboardManager] WebSocket 连接成功');
        this.fetchLeaderboard();
      });
      
      this.socket.on('leaderboardUpdate', (data) => {
        console.log('[LeaderboardManager] 收到排行榜更新:', data);
        this.leaderboard = data;
        this.saveLeaderboard();
        
        if (typeof this.onLeaderboardUpdate === 'function') {
          this.onLeaderboardUpdate(this.leaderboard);
        }
      });
      
      this.socket.on('disconnect', () => {
        console.log('[LeaderboardManager] WebSocket 连接断开');
      });
      
      this.socket.on('connect_error', (error) => {
        console.warn('[LeaderboardManager] WebSocket 连接失败:', error.message);
      });
      
      this.socket.on('reconnect_attempt', (attempt) => {
        console.log('[LeaderboardManager] 重连尝试:', attempt);
      });

      this.socket.on('reconnect_failed', () => {
        console.warn('[LeaderboardManager] 重连失败');
      });
    } else {
      console.warn('[LeaderboardManager] Socket.IO 客户端未加载');
    }
  }
  
  setupLocalStorageListener() {
    const self = this;
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        console.log('[LeaderboardManager] 检测到 localStorage 变化');
        try {
          const data = JSON.parse(event.newValue);
          if (Array.isArray(data)) {
            self.leaderboard = data;
            
            if (typeof self.onLeaderboardUpdate === 'function') {
              self.onLeaderboardUpdate(self.leaderboard);
            }
          }
        } catch (error) {
          console.warn('[LeaderboardManager] 解析 localStorage 数据失败:', error);
        }
      }
    });
  }
  
  setupVisibilityChangeListener() {
    const self = this;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('[LeaderboardManager] 页面变为可见，刷新排行榜数据');
        self.fetchLeaderboard();
      }
    });
    
    window.addEventListener('focus', () => {
      console.log('[LeaderboardManager] 窗口获得焦点，刷新排行榜数据');
      self.fetchLeaderboard();
    });
  }

  loadLeaderboard() {
    const data = this.storage.load(this.storageKey, []);
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    const validEntries = data.filter(entry => {
      return entry && 
             typeof entry.score === 'number' && 
             typeof entry.nickname === 'string' &&
             entry.nickname.length >= 2 &&
             entry.nickname.length <= 12;
    });
    
    const seen = new Map();
    for (const entry of validEntries) {
      const existing = seen.get(entry.nickname);
      if (!existing || entry.score > existing.score) {
        seen.set(entry.nickname, entry);
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timestamp - b.timestamp;
    }).slice(0, this.maxEntries);
  }

  saveLeaderboard() {
    return this.storage.save(this.storageKey, this.leaderboard);
  }
  
  async fetchLeaderboard() {
    try {
      const response = await fetch(`${this.apiBase}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        this.leaderboard = data;
        this.saveLeaderboard();
        
        if (typeof this.onLeaderboardUpdate === 'function') {
          this.onLeaderboardUpdate(this.leaderboard);
        }
        
        return data;
      }
    } catch (error) {
      console.warn('[LeaderboardManager] 获取服务器排行榜失败:', error.message);
    }
    return this.leaderboard;
  }
  
  async submitScoreToServer(score, nickname) {
    try {
      const response = await fetch(`${this.apiBase}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nickname, score })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.leaderboard = data.leaderboard;
        this.saveLeaderboard();
        
        if (typeof this.onLeaderboardUpdate === 'function') {
          this.onLeaderboardUpdate(this.leaderboard);
        }
        
        return data.rank;
      }
    } catch (error) {
      console.warn('[LeaderboardManager] 提交分数到服务器失败:', error.message);
    }
    return 0;
  }

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
    
    const existingIndex = this.leaderboard.findIndex(
      entry => entry.nickname === trimmedNickname
    );
    
    if (existingIndex !== -1) {
      if (score > this.leaderboard[existingIndex].score) {
        this.leaderboard[existingIndex].score = score;
        this.leaderboard[existingIndex].timestamp = Date.now();
        this.leaderboard.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return a.timestamp - b.timestamp;
        });
        this.saveLeaderboard();
        return this.findRank(score);
      } else {
        return existingIndex + 1;
      }
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

  findRank(score) {
    for (let i = 0; i < this.leaderboard.length; i++) {
      if (score > this.leaderboard[i].score) {
        return i + 1;
      } else if (score === this.leaderboard[i].score) {
        return i + 1;
      }
    }
    
    if (this.leaderboard.length < this.maxEntries) {
      return this.leaderboard.length + 1;
    }
    
    return 0;
  }

  getLeaderboard() {
    return [...this.leaderboard];
  }

  isHighScore(score) {
    if (typeof score !== 'number' || score < 0) {
      return false;
    }
    
    if (this.leaderboard.length < this.maxEntries) {
      return true;
    }
    
    return score > this.leaderboard[this.leaderboard.length - 1].score;
  }

  getEntryCount() {
    return this.leaderboard.length;
  }

  clearLeaderboard() {
    this.leaderboard = [];
    this.storage.remove(this.storageKey);
  }
}

/**
 * 游戏状态管理器 - 负责管理游戏的核心状态和分数系统
 * 
 * 主要功能：
 * - 管理游戏生命周期状态（菜单、游戏中、暂停、结束）
 * - 处理分数计算和累加逻辑
 * - 管理最高分的存储和加载
 * - 提供状态变更的回调通知机制
 * - 排行榜数据管理
 */
export class GameState {
  /**
   * 当前应用版本号 - 用于检测旧数据并清理
   */
  static APP_VERSION = '1.0.0';
  
  /**
   * 构造函数 - 初始化游戏状态
   */
  constructor() {
    this.state = 'menu';
    this.states = ['menu', 'playing', 'paused', 'gameover'];
    
    this.score = 0;
    
    this.scoreMultiplier = 1;
    
    this.gameTime = 0;
    this.startTime = 0;
    this.scoreAccumulator = 0;
    
    this.onStateChange = null;
    this.onScoreChange = null;
    this.onGameOver = null;
    
    this.checkAndCleanOldData();
    
    this.leaderboardManager = new LeaderboardManager();
    
    this.highScore = this.loadHighScore();
    
    this.playerNickname = this.loadNickname();
    
    this.currentRank = 0;
    
    this.setupLocalStorageSync();
    
    this.saveAppVersion();
  }
  
  /**
   * 检查并清理旧数据
   * 当应用版本变更时，清除可能存在的旧测试数据
   */
  checkAndCleanOldData() {
    try {
      const storedVersion = localStorage.getItem('pixelRunner_appVersion');
      
      if (storedVersion !== GameState.APP_VERSION) {
        console.log('[GameState] 检测到版本变更，清理旧数据...');
        
        const storageManager = new StorageManager();
        const clearedCount = storageManager.clearAllAppData();
        
        console.log(`[GameState] 已清除 ${clearedCount} 条旧数据`);
      }
    } catch (error) {
      console.warn('[GameState] 检查版本失败:', error.message);
    }
  }
  
  /**
   * 保存当前应用版本
   */
  saveAppVersion() {
    try {
      localStorage.setItem('pixelRunner_appVersion', GameState.APP_VERSION);
    } catch (error) {
      console.warn('[GameState] 保存版本失败:', error.message);
    }
  }
  
  setupLocalStorageSync() {
    const self = this;
    
    window.addEventListener('storage', (event) => {
      if (event.key === 'pixelRunner_highScore' && event.newValue) {
        console.log('[GameState] 检测到最高分变化');
        self.highScore = parseInt(event.newValue, 10) || 0;
        
        if (typeof self.onScoreChange === 'function') {
          self.onScoreChange(self.score);
        }
      } else if (event.key === 'pixelRunner_playerNickname' && event.newValue) {
        console.log('[GameState] 检测到昵称变化');
        const nickname = event.newValue.trim();
        if (nickname.length >= 2 && nickname.length <= 12) {
          self.playerNickname = nickname;
        }
      }
    });
  }

  /**
   * 从本地存储加载最高分
   * @returns {number} 存储的最高分，若无则返回0
   */
  loadHighScore() {
    const saved = localStorage.getItem('pixelRunner_highScore');
    return saved ? parseInt(saved, 10) : 0;
  }
  
  /**
   * 从本地存储加载玩家昵称
   * @returns {string|null} 存储的昵称，若无则返回null
   */
  loadNickname() {
    try {
      const saved = localStorage.getItem('pixelRunner_playerNickname');
      if (saved) {
        const nickname = saved.trim();
        if (nickname.length >= 2 && nickname.length <= 12) {
          return nickname;
        }
      }
    } catch (error) {
      console.warn('[GameState] 加载昵称失败:', error.message);
    }
    return null;
  }
  
  /**
   * 保存玩家昵称到本地存储
   * @param {string} nickname - 昵称
   */
  saveNickname(nickname) {
    try {
      const trimmedNickname = nickname.trim();
      if (trimmedNickname.length >= 2 && trimmedNickname.length <= 12) {
        this.playerNickname = trimmedNickname;
        localStorage.setItem('pixelRunner_playerNickname', trimmedNickname);
        return true;
      }
    } catch (error) {
      console.warn('[GameState] 保存昵称失败:', error.message);
    }
    return false;
  }
  
  /**
   * 获取玩家昵称
   * @returns {string|null} 玩家昵称
   */
  getNickname() {
    return this.playerNickname;
  }

  /**
   * 保存最高分到本地存储
   * 仅当当前分数超过已保存的最高分才保存
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pixelRunner_highScore', this.highScore.toString());
    }
  }
  
  /**
   * 重置最高分到0
   */
  resetHighScore() {
    this.highScore = 0;
    localStorage.setItem('pixelRunner_highScore', '0');
    if (typeof this.onScoreChange === 'function') {
      this.onScoreChange(this.score);
    }
  }

  /**
   * 设置游戏状态
   * @param {string} newState - 新的游戏状态（menu/playing/paused/gameover）
   */
  setState(newState) {
    // 验证状态合法性且状态确实发生变化
    if (this.states.includes(newState) && this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      
      // 触发状态变更回调
      if (typeof this.onStateChange === 'function') {
        this.onStateChange(newState, oldState);
      }
      
      // 根据新状态执行相应操作
      if (newState === 'playing') {
        this.start();
      } else if (newState === 'gameover') {
        this.end();
      }
    }
  }

  /**
   * 开始游戏 - 初始化游戏数据
   */
  start() {
    this.score = 0;                // 重置分数
    this.gameTime = 0;             // 重置游戏时间
    this.startTime = performance.now();  // 记录开始时间戳
    this.scoreMultiplier = 1;      // 重置分数倍率
    this.scoreAccumulator = 0;     // 重置分数累加器
  }

  /**
   * 结束游戏 - 保存分数并触发结束回调
   */
  end() {
    const originalHighScore = this.highScore;
    this.saveHighScore();          // 保存最高分
    
    // 触发游戏结束回调，传递游戏数据
    if (typeof this.onGameOver === 'function') {
      this.onGameOver({
        score: this.score,
        highScore: originalHighScore,
        gameTime: this.gameTime
      });
    }
  }

  /**
   * 暂停游戏
   */
  pause() {
    if (this.state === 'playing') {
      this.setState('paused');
    }
  }

  /**
   * 继续游戏
   */
  resume() {
    if (this.state === 'paused') {
      this.setState('playing');
      // 恢复游戏时间，保持计时连续性
      this.startTime = performance.now() - this.gameTime;
    }
  }

  /**
   * 返回菜单
   */
  restart() {
    this.setState('menu');
  }

  /**
   * 更新游戏状态（每帧调用）
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   */
  update(deltaTime) {
    if (this.state === 'playing') {
      this.gameTime += deltaTime;  // 更新游戏时间
      this.updateScore(deltaTime); // 更新分数
    }
  }

  /**
   * 更新分数 - 实现稳定的1分/秒获取速率
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   * 
   * 实现原理：
   * - 使用累加器模式累积时间
   * - 每1000毫秒（1秒）增加1分
   * - 乘以当前分数倍率
   * - 只有实际加分时才触发回调，优化性能
   */
  updateScore(deltaTime) {
    // 确保输入有效
    if (isNaN(deltaTime) || deltaTime <= 0) return;
    
    this.scoreAccumulator += deltaTime;
    
    // 确保分数倍率有效
    if (isNaN(this.scoreMultiplier) || this.scoreMultiplier <= 0) {
      this.scoreMultiplier = 1;
    }
    
    // 确保分数本身有效
    if (isNaN(this.score)) {
      this.score = 0;
    }
    
    // 计算应增加的分数（每1000ms加1分）
    const pointsToAdd = Math.floor(this.scoreAccumulator / 1000);
    if (pointsToAdd > 0) {
      const actualPoints = pointsToAdd * this.scoreMultiplier;
      if (!isNaN(actualPoints)) {
        this.score += actualPoints;
      }
      this.scoreAccumulator -= pointsToAdd * 1000;
      
      // 确保分数有效
      if (isNaN(this.score)) {
        this.score = 0;
      }
      
      // 触发分数变更回调
      if (typeof this.onScoreChange === 'function') {
        this.onScoreChange(this.score);
      }
    }
  }

  /**
   * 直接添加分数（用于道具奖励等）
   * @param {number} points - 要添加的分数
   */
  addScore(points) {
    this.score += points;
    if (typeof this.onScoreChange === 'function') {
      this.onScoreChange(this.score);
    }
  }

  /**
   * 设置分数倍率
   * @param {number} multiplier - 倍率值（如2表示分数×2）
   */
  setScoreMultiplier(multiplier) {
    this.scoreMultiplier = multiplier;
  }

  /**
   * 获取当前游戏状态
   * @returns {string} 当前状态
   */
  getState() {
    return this.state;
  }

  /**
   * 获取当前分数
   * @returns {number} 当前分数
   */
  getScore() {
    return this.score;
  }

  /**
   * 获取最高分
   * @returns {number} 最高分
   */
  getHighScore() {
    return this.highScore;
  }

  /**
   * 获取游戏运行时间
   * @returns {number} 游戏时间（毫秒）
   */
  getGameTime() {
    return this.gameTime;
  }

  /**
   * 判断是否正在游戏中
   * @returns {boolean} 是否在游戏中
   */
  isPlaying() {
    return this.state === 'playing';
  }

  /**
   * 判断是否处于暂停状态
   * @returns {boolean} 是否暂停
   */
  isPaused() {
    return this.state === 'paused';
  }

  /**
   * 判断是否游戏结束
   * @returns {boolean} 是否结束
   */
  isGameOver() {
    return this.state === 'gameover';
  }

  /**
   * 判断是否在菜单界面
   * @returns {boolean} 是否在菜单
   */
  isMenu() {
    return this.state === 'menu';
  }

  checkLeaderboardScore(score) {
    return this.leaderboardManager.isHighScore(score);
  }

  submitToLeaderboard(score, nickname) {
    return this.leaderboardManager.submitScore(score, nickname);
  }

  getLeaderboard() {
    return this.leaderboardManager.getLeaderboard();
  }

  setCurrentRank(rank) {
    this.currentRank = rank;
  }

  getCurrentRank() {
    return this.currentRank;
  }

  checkAndShowNicknameInput(score) {
    if (this.leaderboardManager.isHighScore(score)) {
      return true;
    }
    return false;
  }
}

/**
 * 分数管理器（备用）- 支持连击系统的分数管理
 * 
 * 功能特性：
 * - 连击计数和倍率系统
 * - 最高连击记录
 * - 分数更新回调通知
 */
export class ScoreManager {
  /**
   * 构造函数 - 初始化分数管理器
   */
  constructor() {
    this.score = 0;                // 当前分数
    this.combo = 0;                // 当前连击数
    this.maxCombo = 0;             // 最高连击记录
    this.multipliers = [1, 1.5, 2, 3, 5];  // 连击倍率表
    
    // 回调函数
    this.onScoreUpdate = null;     // 分数更新回调
    this.onComboUpdate = null;     // 连击更新回调
  }

  /**
   * 添加分数（考虑连击倍率）
   * @param {number} points - 基础分数
   */
  addPoints(points) {
    // 根据当前连击数获取倍率
    const multiplier = this.multipliers[Math.min(this.combo, this.multipliers.length - 1)];
    const actualPoints = Math.floor(points * multiplier);
    
    this.score += actualPoints;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    
    // 触发分数更新回调
    if (typeof this.onScoreUpdate === 'function') {
      this.onScoreUpdate({
        score: this.score,
        points: actualPoints,
        multiplier
      });
    }
    
    // 触发连击更新回调
    if (typeof this.onComboUpdate === 'function') {
      this.onComboUpdate(this.combo);
    }
  }

  /**
   * 重置连击计数
   */
  resetCombo() {
    this.combo = 0;
    if (typeof this.onComboUpdate === 'function') {
      this.onComboUpdate(0);
    }
  }

  /**
   * 重置所有数据
   */
  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
  }

  /**
   * 获取当前倍率
   * @returns {number} 当前倍率
   */
  getMultiplier() {
    return this.multipliers[Math.min(this.combo, this.multipliers.length - 1)];
  }

  /**
   * 获取当前分数
   * @returns {number} 当前分数
   */
  getScore() {
    return this.score;
  }

  /**
   * 获取当前连击数
   * @returns {number} 当前连击数
   */
  getCombo() {
    return this.combo;
  }

  /**
   * 获取最高连击记录
   * @returns {number} 最高连击数
   */
  getMaxCombo() {
    return this.maxCombo;
  }
}