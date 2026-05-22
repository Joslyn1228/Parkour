/**
 * 障碍物管理器类
 * 
 * 负责管理游戏中的障碍物，包括：
 * - 障碍物类型注册
 * - 障碍物生成和销毁
 * - 难度系统
 * - 碰撞体管理
 */
import { Collider } from '../engine/GameEngine.js';

export class ObstacleManager {
  /**
   * 构造函数 - 初始化障碍物管理器
   * @param {number} gameWidth - 游戏宽度
   * @param {number} gameHeight - 游戏高度
   */
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.obstacles = [];
    this.obstacleTypes = [];
    
    this.spawnInterval = 2000;
    this.minSpawnInterval = 800;
    this.lastSpawnTime = -1000;
    
    this.difficulty = 1;
    this.difficultyIncreaseInterval = 10000;
    this.lastDifficultyTime = 0;
    
    this.onObstacleSpawn = null;
    this.onObstacleRemove = null;
    this.onDifficultyChange = null;
    
    this.registerDefaultTypes();
    
    console.log('[ObstacleManager] Initialized with gameWidth:', gameWidth, 'gameHeight:', gameHeight);
    console.log('[ObstacleManager] Obstacle types registered:', this.obstacleTypes.length);
  }

  /**
   * 注册默认障碍物类型
   */
  registerDefaultTypes() {
    this.registerObstacleType({
      id: 'bird',
      name: '飞鸟',
      width: 32,
      height: 24,
      color: '#E17055',
      yOffset: -50,
      isJumpable: false,
      isSlidable: true,
      speedMultiplier: 1.0
    });
    
    this.registerObstacleType({
      id: 'barrier',
      name: '障碍门',
      width: 48,
      height: 48,
      color: '#00CEC9',
      yOffset: -48,
      isJumpable: false,
      isSlidable: true,
      speedMultiplier: 1.0
    });
    
    this.registerObstacleType({
      id: 'bat',
      name: '蝙蝠',
      width: 36,
      height: 20,
      color: '#2D3436',
      yOffset: -55,
      isJumpable: false,
      isSlidable: true,
      speedMultiplier: 1.0
    });
    
    this.registerObstacleType({
      id: 'purple_block',
      name: '紫色方块',
      width: 48,
      height: 32,
      color: '#6C5CE7',
      yOffset: -32,
      isJumpable: true,
      isSlidable: false,
      speedMultiplier: 1.0
    });
    
    this.registerObstacleType({
      id: 'cloud_obstacle',
      name: '云朵障碍',
      width: 44,
      height: 24,
      color: '#DFE6E9',
      yOffset: -60,
      isJumpable: false,
      isSlidable: true,
      speedMultiplier: 0.9
    });
    
    this.registerObstacleType({
      id: 'butterfly',
      name: '蝴蝶',
      width: 28,
      height: 20,
      color: '#FD79A8',
      yOffset: -150,
      isJumpable: false,
      isSlidable: true,
      hasVerticalMovement: true,
      verticalAmplitude: 30,
      verticalFrequency: 2,
      speedMultiplier: 0.7
    });
    
    this.registerObstacleType({
      id: 'balloon',
      name: '气球',
      width: 24,
      height: 32,
      color: '#00B894',
      yOffset: -180,
      isJumpable: false,
      isSlidable: true,
      hasVerticalMovement: true,
      verticalAmplitude: 40,
      verticalFrequency: 1.5,
      speedMultiplier: 0.6
    });
    
    this.registerObstacleType({
      id: 'floating_spike',
      name: '浮动尖刺',
      width: 28,
      height: 24,
      color: '#E17055',
      yOffset: -120,
      isJumpable: false,
      isSlidable: false,
      hasVerticalMovement: true,
      verticalAmplitude: 25,
      verticalFrequency: 2.5,
      speedMultiplier: 0.75
    });
  }

  /**
   * 注册障碍物类型
   * @param {object} type - 障碍物类型配置
   */
  registerObstacleType(type) {
    if (!this.obstacleTypes.find(t => t.id === type.id)) {
      this.obstacleTypes.push(type);
    }
  }

  /**
   * 获取障碍物类型
   * @param {string} typeId - 类型ID
   * @returns {object|null} 障碍物类型配置
   */
  getObstacleType(typeId) {
    return this.obstacleTypes.find(t => t.id === typeId);
  }

  /**
   * 生成障碍物
   * @param {string|null} typeId - 指定类型ID（可选）
   * @returns {object|null} 生成的障碍物
   */
  spawnObstacle(typeId = null) {
    const availableTypes = this.getAvailableTypes();
    console.log('[ObstacleManager] Available types:', availableTypes);
    
    const selectedTypeId = typeId || availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const type = this.getObstacleType(selectedTypeId);
    
    if (!type) {
      console.log('[ObstacleManager] No obstacle type found for:', selectedTypeId);
      return null;
    }
    
    const obstacle = new Obstacle(
      this.gameWidth,
      this.gameHeight - 64 + type.yOffset,
      type.width,
      type.height,
      type
    );
    
    this.obstacles.push(obstacle);
    console.log('[ObstacleManager] Spawned obstacle:', type.id, 'at position:', obstacle.x, obstacle.y);
    
    if (typeof this.onObstacleSpawn === 'function') {
      this.onObstacleSpawn(obstacle);
    }
    
    return obstacle;
  }

  /**
   * 获取当前难度下可用的障碍物类型
   * @returns {string[]} 可用类型ID数组
   */
  getAvailableTypes() {
    const available = [];
    
    if (this.difficulty >= 1) available.push('bird');
    if (this.difficulty >= 2) available.push('bat');
    if (this.difficulty >= 2) available.push('purple_block');
    if (this.difficulty >= 3) available.push('barrier');
    if (this.difficulty >= 4) available.push('cloud_obstacle');
    
    if (this.difficulty >= 3) {
      if (Math.random() < 0.3) available.push('butterfly');
    }
    if (this.difficulty >= 4) {
      if (Math.random() < 0.25) available.push('balloon');
    }
    if (this.difficulty >= 5) {
      if (Math.random() < 0.2) available.push('floating_spike');
    }
    
    return available.length > 0 ? available : ['bird'];
  }

  /**
   * 更新障碍物（每帧调用）
   * @param {number} currentTime - 当前游戏时间
   * @param {number} speed - 当前游戏速度
   * @param {number} speedMultiplier - 速度倍数
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   */
  update(currentTime, speed, speedMultiplier = 1.0, deltaTime = 16.67) {
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
    
    const minDistance = 120 + speed * 10;
    const hasEnoughSpace = this.hasEnoughSpace(minDistance);
    
    if (timeSinceLastSpawn >= this.spawnInterval && hasEnoughSpace) {
      this.spawnObstacle();
      this.lastSpawnTime = currentTime;
    }
    
    if (currentTime - this.lastDifficultyTime >= this.difficultyIncreaseInterval) {
      this.increaseDifficulty();
      this.lastDifficultyTime = currentTime;
    }
    
    const targetFPS = 60;
    const timeFactor = deltaTime / (1000 / targetFPS);
    const obstacleSpeed = speed * 0.005 * speedMultiplier * timeFactor;
    
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.update(obstacleSpeed);
      
      if (obstacle.x + obstacle.width < 0) {
        if (typeof this.onObstacleRemove === 'function') {
          this.onObstacleRemove(obstacle);
        }
        return false;
      }
      return true;
    });
  }

  /**
   * 检查是否有足够空间生成新障碍物
   * @param {number} minDistance - 最小距离
   * @returns {boolean} 是否有足够空间
   */
  hasEnoughSpace(minDistance) {
    if (this.obstacles.length === 0) return true;
    
    const sortedObstacles = [...this.obstacles].sort((a, b) => b.x - a.x);
    const nearestObstacle = sortedObstacles[0];
    
    return this.gameWidth - nearestObstacle.x >= minDistance;
  }

  /**
   * 获取当前屏幕上的障碍物数量
   * @returns {number} 屏幕上的障碍物数量
   */
  getObstaclesOnScreen() {
    return this.obstacles.filter(o => o.x < this.gameWidth && o.x + o.width > 0).length;
  }

  /**
   * 增加难度
   */
  increaseDifficulty() {
    if (this.difficulty < 5) {
      this.difficulty++;
      this.spawnInterval = Math.max(
        this.minSpawnInterval,
        this.spawnInterval - 200
      );
      
      if (typeof this.onDifficultyChange === 'function') {
        this.onDifficultyChange(this.difficulty);
      }
    }
  }

  /**
   * 渲染所有障碍物
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    this.obstacles.forEach(obstacle => {
      obstacle.render(ctx);
    });
  }

  /**
   * 移除障碍物
   * @param {object} obstacle - 要移除的障碍物
   */
  removeObstacle(obstacle) {
    const index = this.obstacles.indexOf(obstacle);
    if (index !== -1) {
      this.obstacles.splice(index, 1);
      if (typeof this.onObstacleRemove === 'function') {
        this.onObstacleRemove(obstacle);
      }
    }
  }

  /**
   * 清空所有障碍物并重置难度
   */
  clear() {
    this.obstacles = [];
    this.difficulty = 1;
    this.lastSpawnTime = -1000;
    this.lastDifficultyTime = 0;
    this.spawnInterval = 2000;
  }

  /**
   * 获取所有障碍物
   * @returns {object[]} 障碍物数组副本
   */
  getObstacles() {
    return [...this.obstacles];
  }

  /**
   * 获取当前难度
   * @returns {number} 当前难度等级
   */
  getDifficulty() {
    return this.difficulty;
  }
}

/**
 * 障碍物类 - 单个障碍物实体
 */
export class Obstacle {
  /**
   * 构造函数 - 创建障碍物
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {object} type - 类型配置
   */
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.typeId = type.id;
    this.entityType = 'obstacle';
    
    if (type.hasCollider !== false) {
      this.collider = new Collider(x, y, width, height);
    } else {
      this.collider = null;
    }
    
    this.color = type.color;
    this.isJumpable = type.isJumpable;
    this.isSlidable = type.isSlidable;
    this.isPlatform = type.isPlatform || false;
    this.hasCollider = type.hasCollider !== false;
    
    this.hasVerticalMovement = type.hasVerticalMovement || false;
    this.verticalAmplitude = type.verticalAmplitude || 20;
    this.verticalFrequency = type.verticalFrequency || 2;
    this.speedMultiplier = type.speedMultiplier || 1.0;
    this.spawnTime = Date.now();
  }

  /**
   * 更新障碍物位置
   * @param {number} speed - 移动速度
   */
  update(speed) {
    this.x -= speed * this.speedMultiplier;
    
    if (this.hasVerticalMovement) {
      const elapsed = (Date.now() - this.spawnTime) / 1000;
      const verticalOffset = Math.sin(elapsed * this.verticalFrequency * Math.PI * 2) * this.verticalAmplitude;
      this.y = this.baseY + verticalOffset;
    }
    
    if (this.collider) {
      this.collider.update(this.x, this.y);
    }
  }

  /**
   * 渲染障碍物
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    switch (this.typeId) {
      case 'crate':
        this.renderCrate(ctx);
        break;
      case 'spike':
        this.renderSpike(ctx);
        break;
      case 'bird':
        this.renderBird(ctx);
        break;
      case 'barrier':
        this.renderBarrier(ctx);
        break;
      case 'bat':
        this.renderBat(ctx);
        break;
      case 'purple_block':
        this.renderPurpleBlock(ctx);
        break;
      case 'cloud_obstacle':
        this.renderCloud(ctx);
        break;
      case 'butterfly':
        this.renderButterfly(ctx);
        break;
      case 'balloon':
        this.renderBalloon(ctx);
        break;
      case 'floating_spike':
        this.renderFloatingSpike(ctx);
        break;
      default:
        this.renderDefault(ctx);
    }
    
    ctx.restore();
  }

  /**
   * 渲染木箱
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderCrate(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#654321';
    ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, 4);
    ctx.fillRect(this.x + 4, this.y + this.height - 8, this.width - 8, 4);
    ctx.fillRect(this.x + 4, this.y + 4, 4, this.height - 8);
    ctx.fillRect(this.x + this.width - 8, this.y + 4, 4, this.height - 8);
    
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(this.x + 8, this.y + 8, this.width - 16, this.height - 16);
  }

  /**
   * 渲染尖刺
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderSpike(ctx) {
    ctx.fillStyle = this.color;
    
    const spikeWidth = this.width / 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + i * spikeWidth, this.y + this.height);
      ctx.lineTo(this.x + i * spikeWidth + spikeWidth / 2, this.y);
      ctx.lineTo(this.x + (i + 1) * spikeWidth, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(this.x, this.y + this.height - 2, this.width, 2);
  }

  /**
   * 渲染飞鸟
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderBird(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x + 8, this.y + 8, 16, 8);
    
    ctx.fillStyle = '#D63031';
    ctx.beginPath();
    ctx.arc(this.x + 24, this.y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2D3436';
    ctx.beginPath();
    ctx.arc(this.x + 26, this.y + 11, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = this.color;
    const wingOffset = Math.sin(Date.now() / 200) * 4;
    ctx.fillRect(this.x, this.y + 10, 12, 4);
    ctx.fillRect(this.x + 4 + wingOffset, this.y + 6, 8, 4);
  }

  /**
   * 渲染障碍门
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderBarrier(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#00B894';
    ctx.fillRect(this.x + 2, this.y + 8, this.width - 4, 8);
    ctx.fillRect(this.x + 2, this.y + 24, this.width - 4, 8);
    ctx.fillRect(this.x + 2, this.y + 48, this.width - 4, 8);
    
    ctx.fillStyle = '#FFF';
    ctx.fillRect(this.x + 4, this.y + 10, 2, 4);
    ctx.fillRect(this.x + 4, this.y + 26, 2, 4);
    ctx.fillRect(this.x + 4, this.y + 50, 2, 4);
  }

  /**
   * 渲染蝙蝠
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderBat(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const wingFlap = Math.sin(Date.now() / 150) * 8;
    ctx.fillStyle = '#636E72';
    ctx.beginPath();
    ctx.moveTo(this.x + 8, this.y + this.height / 2);
    ctx.lineTo(this.x - 8 + wingFlap, this.y - 10);
    ctx.lineTo(this.x + 4, this.y + this.height / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(this.x + this.width - 8, this.y + this.height / 2);
    ctx.lineTo(this.x + this.width + 8 + wingFlap, this.y - 10);
    ctx.lineTo(this.x + this.width - 4, this.y + this.height / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 - 3, this.y + this.height / 2 - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 + 3, this.y + this.height / 2 - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染紫色方块
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderPurpleBlock(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#A29BFE';
    ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
    
    ctx.fillStyle = '#8E7CC3';
    ctx.fillRect(this.x + 8, this.y + 8, this.width - 16, this.height - 16);
  }

  /**
   * 渲染云朵障碍
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderCloud(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x + 12, this.y + 12, 10, 0, Math.PI * 2);
    ctx.arc(this.x + 22, this.y + 8, 12, 0, Math.PI * 2);
    ctx.arc(this.x + 32, this.y + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#B2BEC3';
    ctx.beginPath();
    ctx.arc(this.x + 16, this.y + 10, 6, 0, Math.PI * 2);
    ctx.arc(this.x + 26, this.y + 8, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染蝴蝶
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderButterfly(ctx) {
    const wingFlap = Math.sin(Date.now() / 150) * 3;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2 - 8 + wingFlap, this.y + 6, 8, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2 + 8 - wingFlap, this.y + 6, 8, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2 - 6 + wingFlap, this.y + 14, 6, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2 + 6 - wingFlap, this.y + 14, 6, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FDCB6E';
    ctx.fillRect(this.x + this.width / 2 - 2, this.y + 4, 4, 10);
    
    ctx.fillStyle = '#2D3436';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + 4);
    ctx.lineTo(this.x + this.width / 2 - 6, this.y);
    ctx.moveTo(this.x + this.width / 2, this.y + 4);
    ctx.lineTo(this.x + this.width / 2 + 6, this.y);
    ctx.stroke();
  }

  /**
   * 渲染气球
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderBalloon(ctx) {
    const sway = Math.sin(Date.now() / 500) * 2;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 + sway, this.y + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2 - 4 + sway, this.y + 22);
    ctx.lineTo(this.x + this.width / 2 + sway, this.y + 28);
    ctx.lineTo(this.x + this.width / 2 + 4 + sway, this.y + 22);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 - 3 + sway, this.y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#636E72';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2 + sway, this.y + 28);
    ctx.lineTo(this.x + this.width / 2 + sway + 6, this.y + this.height);
    ctx.stroke();
  }

  /**
   * 渲染浮动尖刺
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderFloatingSpike(ctx) {
    ctx.fillStyle = this.color;
    
    const spikeWidth = this.width / 4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + i * spikeWidth, this.y + this.height);
      ctx.lineTo(this.x + i * spikeWidth + spikeWidth / 2, this.y);
      ctx.lineTo(this.x + (i + 1) * spikeWidth, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.fillStyle = '#B2BEC3';
    ctx.fillRect(this.x + 2, this.y + this.height - 4, this.width - 4, 4);
    
    ctx.fillStyle = '#74B9FF';
    ctx.shadowColor = '#74B9FF';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x, this.y + this.height - 2, this.width, 2);
    ctx.shadowBlur = 0;
  }

  /**
   * 渲染默认障碍物（矩形）
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderDefault(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  /**
   * 处理碰撞事件
   * @param {object} other - 碰撞对象
   */
  onCollision(other) {
    if (other.type === 'player') {
      if (typeof this.onHit === 'function') {
        this.onHit(other);
      }
    }
  }
}