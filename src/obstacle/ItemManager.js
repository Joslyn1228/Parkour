/**
 * 道具管理器类
 * 
 * 负责管理游戏中的道具系统，包括：
 * - 道具类型注册
 * - 道具生成和收集
 * - 道具效果管理
 */
import { Collider } from '../engine/GameEngine.js';

/**
 * 道具类 - 单个道具实体
 */
export class Item {
  /**
   * 构造函数 - 创建道具
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {object} type - 道具类型配置
   */
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.typeId = type.id;
    this.width = type.width;
    this.height = type.height;
    this.color = type.color;
    this.entityType = 'item';
    
    this.collider = new Collider(x, y, this.width, this.height);
    
    this.effect = type.effect;
    this.duration = type.duration || 0;
    this.scoreAmount = type.scoreAmount || 0;
    
    this.velocityY = 0;
    this.onGround = (y % 100 < 5);
  }
  
  /**
   * 更新道具位置
   * @param {number} speed - 移动速度
   */
  update() {
  }
  
  /**
   * 渲染道具
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    if (this.typeId === 'coffee') {
      this.renderCoffee(ctx);
    } else if (this.typeId === 'apple') {
      this.renderApple(ctx);
    }
    
    ctx.restore();
  }
  
  /**
   * 渲染咖啡道具
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderCoffee(ctx) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x + 4, this.y + 8, this.width - 8, this.height - 8);
    
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(this.x + 8, this.y + 12, this.width - 16, this.height - 20);
    
    ctx.fillStyle = '#FFF';
    ctx.fillRect(this.x + 6, this.y + 4, this.width - 12, 6);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x + 10, this.y, 2, 6);
    ctx.fillRect(this.x + 18, this.y, 2, 6);
  }
  
  /**
   * 渲染苹果道具
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderApple(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#27AE60';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + 4);
    ctx.lineTo(this.x + this.width / 2 - 6, this.y);
    ctx.lineTo(this.x + this.width / 2 + 6, this.y);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 - 4, this.y + this.height / 2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 道具管理器类
 */
export class ItemManager {
  /**
   * 构造函数 - 初始化道具管理器
   * @param {number} gameWidth - 游戏宽度
   * @param {number} gameHeight - 游戏高度
   */
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.groundY = gameHeight - 112;
    
    this.items = [];
    this.itemTypes = {};
    
    this.lastSpawnTime = 0;
    this.spawnInterval = 6000;
    
    this.onItemCollect = null;
    
    this.registerDefaultTypes();
  }
  
  /**
   * 注册默认道具类型
   */
  registerDefaultTypes() {
    this.registerItemType({
      id: 'coffee',
      name: '咖啡',
      width: 28,
      height: 28,
      color: '#8B4513',
      effect: 'speed_and_score',
      duration: 10000
    });
    
    this.registerItemType({
      id: 'apple',
      name: '苹果',
      width: 28,
      height: 28,
      color: '#E74C3C',
      effect: 'score_bonus',
      duration: 0,
      scoreAmount: 30
    });
  }
  
  /**
   * 注册道具类型
   * @param {object} type - 道具类型配置
   */
  registerItemType(type) {
    this.itemTypes[type.id] = type;
  }
  
  /**
   * 获取道具类型
   * @param {string} typeId - 类型ID
   * @returns {object} 道具类型配置
   */
  getItemType(typeId) {
    return this.itemTypes[typeId];
  }
  
  /**
   * 生成道具
   * @param {string|null} typeId - 指定类型ID（可选）
   * @returns {object} 生成的道具
   */
  spawnItem(typeId = null) {
    const types = Object.keys(this.itemTypes);
    const selectedTypeId = typeId || types[Math.floor(Math.random() * types.length)];
    const type = this.getItemType(selectedTypeId);
    
    const doubleJumpMaxHeight = 250;
    const groundLevel = 0;
    const lowRange = [0, -32, -55, -80];
    const midRange = [-100, -120, -140, -160];
    const highRange = [-180, -200, -220, -240];
    
    let heightLevels;
    const rand = Math.random();
    if (rand < 0.5) {
      heightLevels = lowRange;
    } else if (rand < 0.8) {
      heightLevels = midRange;
    } else {
      heightLevels = highRange;
    }
    
    const yOffset = heightLevels[Math.floor(Math.random() * heightLevels.length)];
    
    const minX = 150;
    const maxX = this.gameWidth * 0.66;
    const randomX = minX + Math.random() * (maxX - minX);
    
    const item = new Item(
      randomX,
      this.groundY + yOffset,
      type
    );
    
    this.items.push(item);
    console.log('[ItemManager] Spawned item:', typeId, 'at y:', item.y, 'yOffset:', yOffset);
    
    if (typeof this.onItemSpawn === 'function') {
      this.onItemSpawn(item);
    }
    
    return item;
  }
  
  /**
   * 更新道具（每帧调用）
   * @param {number} currentTime - 当前游戏时间
   * @param {number} speed - 当前游戏速度
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   */
  update(currentTime, speed = 1.5, deltaTime = 16.67) {
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
    
    const minDistance = 180 + speed * 8;
    const hasEnoughSpace = this.hasEnoughSpace(minDistance);
    const maxItemsOnScreen = 3;
    const itemsOnScreen = this.getItemsOnScreen();
    
    if (timeSinceLastSpawn >= this.spawnInterval && hasEnoughSpace && itemsOnScreen < maxItemsOnScreen) {
      this.spawnItem();
      this.lastSpawnTime = currentTime;
    }
    
    const targetFPS = 60;
    const timeFactor = deltaTime / (1000 / targetFPS);
    const itemSpeed = speed * 0.005 * timeFactor;
    
    this.items = this.items.filter(item => {
      item.x -= itemSpeed;
      if (item.collider) {
        item.collider.update(item.x, item.y);
      }
      
      if (item.x + item.width < 0) {
        return false;
      }
      return true;
    });
  }

  /**
   * 检查是否有足够空间生成新道具
   * @param {number} minDistance - 最小距离
   * @returns {boolean} 是否有足够空间
   */
  hasEnoughSpace(minDistance) {
    if (this.items.length === 0) return true;
    
    const sortedItems = [...this.items].sort((a, b) => b.x - a.x);
    const nearestItem = sortedItems[0];
    
    return this.gameWidth - nearestItem.x >= minDistance;
  }

  /**
   * 获取当前屏幕上的道具数量
   * @returns {number} 屏幕上的道具数量
   */
  getItemsOnScreen() {
    return this.items.filter(i => i.x < this.gameWidth && i.x + i.width > 0).length;
  }
  
  /**
   * 渲染所有道具
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    this.items.forEach(item => {
      item.render(ctx);
    });
  }
  
  /**
   * 重置道具管理器
   */
  reset() {
    this.items = [];
    this.lastSpawnTime = 0;
  }
  
  /**
   * 获取所有道具
   * @returns {object[]} 道具数组
   */
  getItems() {
    return this.items;
  }
  
  /**
   * 收集道具
   * @param {object} item - 要收集的道具
   */
  collectItem(item) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      
      if (typeof this.onItemCollect === 'function') {
        this.onItemCollect(item);
      }
    }
  }
}