/**
 * 速度控制系统类
 * 
 * 负责管理游戏速度的动态变化，包括：
 * - 基础速度设置
 * - 加速度系统
 * - 临时速度加成
 * - 速度上限和下限限制
 */
export class SpeedControl {
  /**
   * 构造函数 - 初始化速度控制系统
   */
  constructor() {
    this.baseSpeed = 0.8;
    this.currentSpeed = 0.8;
    this.maxSpeed = 4;
    this.minSpeed = 0.5;
    
    this.acceleration = 0.0003;
    this.deceleration = 0.01;
    
    this.speedIncrementInterval = 15000;
    this.speedIncrementAmount = 0.1;
    
    this.lastIncrementTime = 0;
    this.lastFrameTime = 0;
    
    this.onSpeedChange = null;
    
    this.temporaryBoost = 0;
    this.temporaryBoostEndTime = 0;
    
    this.targetFPS = 60;
    this.maxDeltaTime = 100;
  }

  /**
   * 设置初始速度
   * @param {number} speed - 初始速度值
   */
  setInitialSpeed(speed) {
    if (speed >= this.minSpeed && speed <= this.maxSpeed) {
      this.baseSpeed = speed;
      this.currentSpeed = speed;
      this.notifySpeedChange();
    }
  }

  /**
   * 获取初始速度
   * @returns {number} 初始速度
   */
  getInitialSpeed() {
    return this.baseSpeed;
  }

  /**
   * 更新速度（每帧调用）
   * @param {number} currentTime - 当前游戏时间
   */
  update(currentTime) {
    if (this.lastFrameTime > 0) {
      const rawDeltaTime = currentTime - this.lastFrameTime;
      const deltaTime = Math.min(rawDeltaTime, this.maxDeltaTime);
      this.applyContinuousAcceleration(deltaTime);
    }
    this.lastFrameTime = currentTime;
    
    if (currentTime - this.lastIncrementTime >= this.speedIncrementInterval) {
      this.increaseSpeed();
      this.lastIncrementTime = currentTime;
    }
    
    this.checkTemporaryBoost();
  }

  /**
   * 应用持续加速度
   * @param {number} deltaTime - 帧间隔时间
   */
  applyContinuousAcceleration(deltaTime) {
    if (this.currentSpeed < this.maxSpeed) {
      const timeFactor = deltaTime / (1000 / this.targetFPS);
      const speedIncrease = this.acceleration * deltaTime * timeFactor;
      this.currentSpeed = Math.min(this.currentSpeed + speedIncrease, this.maxSpeed);
      console.log('[SpeedControl] applyContinuousAcceleration - deltaTime:', deltaTime, 'increase:', speedIncrease, 'currentSpeed:', this.currentSpeed);
      this.notifySpeedChange();
    }
  }

  /**
   * 增加速度（阶段性增量）
   */
  increaseSpeed() {
    if (this.currentSpeed < this.maxSpeed) {
      this.currentSpeed = Math.min(this.currentSpeed + this.speedIncrementAmount, this.maxSpeed);
      console.log('[SpeedControl] increaseSpeed - amount:', this.speedIncrementAmount, 'currentSpeed:', this.currentSpeed);
      this.notifySpeedChange();
    }
  }

  /**
   * 降低速度
   * @param {number} amount - 降低的速度值（默认1）
   */
  decreaseSpeed(amount = 1) {
    if (this.currentSpeed > this.minSpeed) {
      this.currentSpeed = Math.max(this.currentSpeed - amount, this.minSpeed);
      this.notifySpeedChange();
    }
  }

  /**
   * 重置速度为初始值
   */
  reset() {
    this.currentSpeed = this.baseSpeed;
    this.lastIncrementTime = 0;
    this.lastFrameTime = 0;
    this.removeTemporaryBoost();
    this.notifySpeedChange();
  }

  /**
   * 加速（一次性）
   */
  accelerate() {
    if (this.currentSpeed < this.maxSpeed) {
      this.currentSpeed += this.acceleration;
      this.notifySpeedChange();
    }
  }

  /**
   * 减速
   */
  decelerate() {
    if (this.currentSpeed > this.baseSpeed) {
      this.currentSpeed -= this.deceleration;
      if (this.currentSpeed < this.baseSpeed) {
        this.currentSpeed = this.baseSpeed;
      }
      this.notifySpeedChange();
    }
  }

  /**
   * 设置最大速度
   * @param {number} maxSpeed - 最大速度值
   */
  setMaxSpeed(maxSpeed) {
    this.maxSpeed = maxSpeed;
    if (this.currentSpeed > this.maxSpeed) {
      this.currentSpeed = this.maxSpeed;
      this.notifySpeedChange();
    }
  }

  /**
   * 设置最小速度
   * @param {number} minSpeed - 最小速度值
   */
  setMinSpeed(minSpeed) {
    this.minSpeed = minSpeed;
    if (this.currentSpeed < this.minSpeed) {
      this.currentSpeed = this.minSpeed;
      this.notifySpeedChange();
    }
  }

  /**
   * 设置速度增量间隔
   * @param {number} interval - 间隔时间（毫秒）
   */
  setSpeedIncrementInterval(interval) {
    this.speedIncrementInterval = interval;
  }

  /**
   * 设置速度增量大小
   * @param {number} amount - 增量值
   */
  setSpeedIncrementAmount(amount) {
    this.speedIncrementAmount = amount;
  }

  /**
   * 获取当前速度（包含临时加成）
   * @returns {number} 当前速度
   */
  getSpeed() {
    return this.currentSpeed * (1 + this.temporaryBoost);
  }
  
  /**
   * 添加临时速度加成
   * @param {number} multiplier - 加成倍数（如0.2表示+20%）
   * @param {number} duration - 持续时间（毫秒）
   */
  addTemporaryBoost(multiplier, duration) {
    this.temporaryBoost = multiplier;
    this.temporaryBoostEndTime = performance.now() + duration;
    this.notifySpeedChange();
  }
  
  /**
   * 移除临时速度加成
   */
  removeTemporaryBoost() {
    this.temporaryBoost = 0;
    this.temporaryBoostEndTime = 0;
    this.notifySpeedChange();
  }
  
  /**
   * 检查临时加成是否结束
   */
  checkTemporaryBoost() {
    if (this.temporaryBoost > 0 && performance.now() >= this.temporaryBoostEndTime) {
      this.removeTemporaryBoost();
    }
  }

  /**
   * 获取速度百分比（相对于最小/最大速度）
   * @returns {number} 速度百分比(0-100)
   */
  getSpeedPercentage() {
    return ((this.currentSpeed - this.minSpeed) / (this.maxSpeed - this.minSpeed)) * 100;
  }

  /**
   * 通知速度变化
   */
  notifySpeedChange() {
    if (typeof this.onSpeedChange === 'function') {
      this.onSpeedChange({
        current: this.currentSpeed,
        base: this.baseSpeed,
        max: this.maxSpeed,
        min: this.minSpeed,
        percentage: this.getSpeedPercentage()
      });
    }
  }
}

/**
 * 速度算法工具类 - 提供各种速度计算方法
 */
export class SpeedAlgorithm {
  /**
   * 计算速度（基于时间的动态速度计算）
   * @param {number} timeElapsed - 已流逝时间（毫秒）
   * @param {number} baseSpeed - 基础速度
   * @param {object} options - 可选参数
   * @returns {number} 计算后的速度
   */
  static calculateSpeed(timeElapsed, baseSpeed, options = {}) {
    const {
      maxSpeed = 20,
      accelerationRate = 0.01,
      incrementInterval = 5000,
      incrementAmount = 0.5
    } = options;
    
    const increments = Math.floor(timeElapsed / incrementInterval);
    const baseIncrease = increments * incrementAmount;
    
    const speed = baseSpeed + baseIncrease + (timeElapsed * accelerationRate);
    
    return Math.min(speed, maxSpeed);
  }

  /**
   * 缓出二次曲线插值
   * @param {number} t - 当前时间
   * @param {number} b - 起始值
   * @param {number} c - 变化量
   * @param {number} d - 总时间
   * @returns {number} 插值结果
   */
  static easeOutQuad(t, b, c, d) {
    t /= d;
    return -c * t * (t - 2) + b;
  }

  /**
   * 缓入缓出二次曲线插值
   * @param {number} t - 当前时间
   * @param {number} b - 起始值
   * @param {number} c - 变化量
   * @param {number} d - 总时间
   * @returns {number} 插值结果
   */
  static easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  /**
   * 线性插值
   * @param {number} start - 起始值
   * @param {number} end - 结束值
   * @param {number} t - 插值因子(0-1)
   * @returns {number} 插值结果
   */
  static lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * 限制值在范围内
   * @param {number} value - 要限制的值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的值
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}