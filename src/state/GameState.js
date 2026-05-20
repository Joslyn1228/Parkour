/**
 * 游戏状态管理器 - 负责管理游戏的核心状态和分数系统
 * 
 * 主要功能：
 * - 管理游戏生命周期状态（菜单、游戏中、暂停、结束）
 * - 处理分数计算和累加逻辑
 * - 管理最高分的存储和加载
 * - 提供状态变更的回调通知机制
 */
export class GameState {
  /**
   * 构造函数 - 初始化游戏状态
   */
  constructor() {
    this.state = 'menu';           // 当前游戏状态
    this.states = ['menu', 'playing', 'paused', 'gameover'];  // 所有合法状态
    
    this.score = 0;                // 当前分数
    
    localStorage.setItem('pixelRunner_highScore', '0');
    this.highScore = 0;
    
    this.scoreMultiplier = 1;      // 分数倍率（受道具影响）
    
    this.gameTime = 0;             // 游戏运行时间（毫秒）
    this.startTime = 0;            // 游戏开始时间戳
    this.scoreAccumulator = 0;     // 分数累加器（用于精确计时）
    
    // 回调函数 - 用于通知外部状态变更
    this.onStateChange = null;     // 状态变更回调
    this.onScoreChange = null;     // 分数变更回调
    this.onGameOver = null;        // 游戏结束回调
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
    this.saveHighScore();          // 保存最高分
    
    // 触发游戏结束回调，传递游戏数据
    if (typeof this.onGameOver === 'function') {
      this.onGameOver({
        score: this.score,
        highScore: this.highScore,
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