/**
 * 游戏引擎核心类
 * 
 * 负责游戏循环、渲染管理、碰撞检测和实体管理
 * 提供帧率控制和deltaTime计算
 */
export class GameEngine {
  /**
   * 构造函数 - 初始化游戏引擎
   * @param {string} canvasId - 画布元素的ID
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 60;
    this.frameInterval = 1000 / this.fps;
    
    this.maxDeltaTime = 100;
    this.accumulatedTime = 0;
    
    this.entities = [];
    this.renderLayers = [];
    this.colliders = [];
    
    this.obstacleSpeedMultiplier = 1.0;
    this.itemSpeedMultiplier = 1.0;
    
    this.onUpdate = null;
    this.onRender = null;
    this.onCollision = null;
  }

  /**
   * 设置画布尺寸
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * 设置帧率
   * @param {number} fps - 帧率值
   */
  setFPS(fps) {
    this.fps = fps;
    this.frameInterval = 1000 / fps;
  }
  
  /**
   * 设置障碍物速度倍数
   * @param {number} multiplier - 速度倍数（0.5-2.0）
   */
  setObstacleSpeedMultiplier(multiplier) {
    this.obstacleSpeedMultiplier = Math.max(0.5, Math.min(2.0, multiplier));
  }
  
  /**
   * 获取障碍物速度倍数
   * @returns {number} 当前障碍物速度倍数
   */
  getObstacleSpeedMultiplier() {
    return this.obstacleSpeedMultiplier;
  }
  
  /**
   * 设置道具速度倍数
   * @param {number} multiplier - 速度倍数（0.5-2.0）
   */
  setItemSpeedMultiplier(multiplier) {
    this.itemSpeedMultiplier = Math.max(0.5, Math.min(2.0, multiplier));
  }
  
  /**
   * 获取道具速度倍数
   * @returns {number} 当前道具速度倍数
   */
  getItemSpeedMultiplier() {
    return this.itemSpeedMultiplier;
  }
  
  /**
   * 重置速度倍数为默认值
   */
  resetSpeedMultipliers() {
    this.obstacleSpeedMultiplier = 1.0;
    this.itemSpeedMultiplier = 1.0;
  }

  /**
   * 添加实体到引擎
   * @param {object} entity - 游戏实体
   */
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
      if (entity.collider && entity.hasCollider !== false) {
        this.colliders.push(entity);
      }
    }
  }
  
  /**
   * 添加道具到引擎（与addEntity类似但用于道具）
   * @param {object} item - 道具实体
   */
  addItem(item) {
    if (!this.entities.includes(item)) {
      this.entities.push(item);
      if (item.collider) {
        this.colliders.push(item);
      }
    }
  }

  /**
   * 从引擎中移除实体
   * @param {object} entity - 要移除的实体
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      const colliderIndex = this.colliders.indexOf(entity);
      if (colliderIndex !== -1) {
        this.colliders.splice(colliderIndex, 1);
      }
    }
  }

  /**
   * 添加渲染层
   * @param {object} layer - 渲染层对象
   */
  addRenderLayer(layer) {
    if (!this.renderLayers.includes(layer)) {
      this.renderLayers.push(layer);
      this.renderLayers.sort((a, b) => a.zIndex - b.zIndex);
    }
  }

  /**
   * 移除渲染层
   * @param {object} layer - 要移除的渲染层
   */
  removeRenderLayer(layer) {
    const index = this.renderLayers.indexOf(layer);
    if (index !== -1) {
      this.renderLayers.splice(index, 1);
    }
  }

  /**
   * 启动游戏引擎
   */
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * 停止游戏引擎
   */
  stop() {
    this.running = false;
  }

  /**
   * 暂停游戏
   */
  pause() {
    this.paused = true;
  }

  /**
   * 恢复游戏
   */
  resume() {
    this.paused = false;
    this.lastTime = performance.now();
  }

  /**
   * 游戏主循环
   */
  gameLoop() {
    if (!this.running) return;
    
    const currentTime = performance.now();
    let frameDelta = currentTime - this.lastTime;
    
    if (frameDelta > this.maxDeltaTime) {
      frameDelta = this.maxDeltaTime;
    }
    
    this.lastTime = currentTime;
    this.accumulatedTime += frameDelta;
    
    while (this.accumulatedTime >= this.frameInterval) {
      this.deltaTime = this.frameInterval;
      this.accumulatedTime -= this.frameInterval;
      
      if (!this.paused) {
        this.update();
        this.detectCollisions();
      }
    }
    
    this.render();
    
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * 更新所有实体
   */
  update() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.deltaTime);
    }
    
    this.entities.forEach(entity => {
      if (typeof entity.update === 'function') {
        entity.update(this.deltaTime);
      }
    });
  }

  /**
   * 渲染游戏画面
   */
  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.renderLayers.forEach(layer => {
      if (typeof layer.render === 'function') {
        layer.render(this.ctx);
      }
    });
    
    this.entities.forEach(entity => {
      if (typeof entity.render === 'function') {
        entity.render(this.ctx);
      }
    });
    
    if (typeof this.onRender === 'function') {
      this.onRender(this.ctx);
    }
  }

  /**
   * 检测碰撞
   */
  detectCollisions() {
    for (let i = 0; i < this.colliders.length; i++) {
      for (let j = i + 1; j < this.colliders.length; j++) {
        const a = this.colliders[i];
        const b = this.colliders[j];
        
        if ((a.entityType === 'player' && typeof a.isInvincibleNow === 'function' && a.isInvincibleNow()) ||
            (b.entityType === 'player' && typeof b.isInvincibleNow === 'function' && b.isInvincibleNow())) {
          continue;
        }
        
        const collision = this.checkCollision(a, b);
        if (collision) {
          if (typeof this.onCollision === 'function') {
            this.onCollision(a, b);
          }
          if (typeof a.onCollision === 'function') {
            a.onCollision(b);
          }
          if (typeof b.onCollision === 'function') {
            b.onCollision(a);
          }
        }
      }
    }
  }

  /**
   * 检查两个实体是否碰撞（AABB碰撞检测）
   * @param {object} a - 实体A
   * @param {object} b - 实体B
   * @returns {boolean} 是否碰撞
   */
  checkCollision(a, b) {
    const colliderA = a.collider;
    const colliderB = b.collider;
    
    return (
      colliderA.x < colliderB.x + colliderB.width &&
      colliderA.x + colliderA.width > colliderB.x &&
      colliderA.y < colliderB.y + colliderB.height &&
      colliderA.y + colliderA.height > colliderB.y
    );
  }

  /**
   * 清空所有实体和渲染层
   */
  clear() {
    this.entities = [];
    this.renderLayers = [];
    this.colliders = [];
  }
}

/**
 * 渲染层类 - 用于管理分层渲染
 */
export class RenderLayer {
  /**
   * 构造函数
   * @param {number} zIndex - 层级索引，值越大越靠上层
   */
  constructor(zIndex = 0) {
    this.zIndex = zIndex;
    this.elements = [];
  }

  /**
   * 添加渲染元素
   * @param {object} element - 渲染元素
   */
  addElement(element) {
    this.elements.push(element);
  }

  /**
   * 移除渲染元素
   * @param {object} element - 要移除的元素
   */
  removeElement(element) {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.elements.splice(index, 1);
    }
  }

  /**
   * 渲染此层的所有元素
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    this.elements.forEach(element => {
      if (typeof element.render === 'function') {
        element.render(ctx);
      }
    });
  }
}

/**
 * 碰撞体类 - 用于检测碰撞
 */
export class Collider {
  /**
   * 构造函数
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * 更新碰撞体位置
   * @param {number} x - 新X坐标
   * @param {number} y - 新Y坐标
   */
  update(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置碰撞体大小
   * @param {number} width - 新宽度
   * @param {number} height - 新高度
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }
}