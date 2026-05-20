/**
 * 游戏场景类
 * 
 * 负责渲染游戏背景、地面和视差效果
 * 包含星星、云朵、山脉和地面砖块的渲染
 */
export class GameScene {
  /**
   * 构造函数 - 初始化游戏场景
   * @param {number} gameWidth - 游戏宽度
   * @param {number} gameHeight - 游戏高度
   */
  constructor(gameWidth, gameHeight) {
    this.width = gameWidth;
    this.height = gameHeight;
    
    this.layers = {
      background: [],
      midground: [],
      foreground: []
    };
    
    this.parallaxOffset = 0;
    
    this.groundY = this.height - 64;
    
    this.stars = [];
    this.clouds = [];
    this.groundBlocks = [];
    
    this.initBackground();
    this.initGround();
  }

  /**
   * 初始化背景元素（星星和云朵）
   */
  initBackground() {
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.groundY - 100),
        size: Math.random() * 2 + 1,
        brightness: Math.random()
      });
    }
    
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * 100 + 20,
        width: Math.random() * 80 + 60,
        height: Math.random() * 20 + 15,
        speed: Math.random() * 0.3 + 0.1
      });
    }
  }

  /**
   * 初始化地面砖块
   */
  initGround() {
    const blockWidth = 32;
    const blocksCount = Math.ceil(this.width / blockWidth) + 2;
    
    for (let i = 0; i < blocksCount; i++) {
      this.groundBlocks.push({
        x: i * blockWidth,
        type: Math.random() > 0.9 ? 'grass' : 'dirt'
      });
    }
  }

  /**
   * 更新场景（每帧调用）
   * @param {number} speed - 当前游戏速度
   */
  update(speed) {
    this.parallaxOffset += speed * 0.3;
    
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.width + Math.random() * 100;
        cloud.y = Math.random() * 100 + 20;
      }
    });
    
    this.groundBlocks.forEach(block => {
      block.x -= speed;
      if (block.x + 32 < 0) {
        block.x = this.width;
        block.type = Math.random() > 0.9 ? 'grass' : 'dirt';
      }
    });
  }

  /**
   * 渲染场景
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    this.renderBackground(ctx);
    this.renderMidground(ctx);
    this.renderForeground(ctx);
  }

  /**
   * 渲染背景层（星空）
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#1a1a3a');
    gradient.addColorStop(1, '#2a2a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.groundY);
    
    this.stars.forEach(star => {
      const twinkle = Math.sin(Date.now() / 500 + star.x) * 0.5 + 0.5;
      const alpha = star.brightness * twinkle;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }

  /**
   * 渲染中层（云朵和山脉）
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderMidground(ctx) {
    this.clouds.forEach(cloud => {
      const offsetX = cloud.x - this.parallaxOffset * 0.2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(offsetX + cloud.width * 0.2, cloud.y + cloud.height * 0.5, cloud.height * 0.5, 0, Math.PI * 2);
      ctx.arc(offsetX + cloud.width * 0.5, cloud.y + cloud.height * 0.3, cloud.height * 0.6, 0, Math.PI * 2);
      ctx.arc(offsetX + cloud.width * 0.8, cloud.y + cloud.height * 0.5, cloud.height * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    const mountainX = (this.width * 0.3 - this.parallaxOffset * 0.1) % (this.width * 1.5) - this.width * 0.25;
    this.renderMountain(ctx, mountainX, this.groundY - 150, 200, '#3a3a5a');
    
    const mountainX2 = (this.width * 1.2 - this.parallaxOffset * 0.08) % (this.width * 1.5) - this.width * 0.25;
    this.renderMountain(ctx, mountainX2, this.groundY - 100, 150, '#4a4a6a');
  }

  /**
   * 渲染山脉
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {string} color - 颜色
   */
  renderMountain(ctx, x, y, width, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + 100);
    ctx.lineTo(x + width * 0.5, y - 80);
    ctx.lineTo(x + width, y + 100);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 渲染前景层（地面）
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderForeground(ctx) {
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(0, this.groundY + 32, this.width, 32);
    
    this.groundBlocks.forEach(block => {
      if (block.type === 'grass') {
        this.renderGrassBlock(ctx, block.x);
      } else {
        this.renderDirtBlock(ctx, block.x);
      }
    });
  }

  /**
   * 渲染草地砖块
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   */
  renderGrassBlock(ctx, x) {
    ctx.fillStyle = '#4a7c4a';
    ctx.fillRect(x, this.groundY, 32, 32);
    
    ctx.fillStyle = '#5a8c5a';
    ctx.fillRect(x + 4, this.groundY, 24, 4);
    
    ctx.fillStyle = '#3a6c3a';
    ctx.fillRect(x + 8, this.groundY - 4, 4, 4);
    ctx.fillRect(x + 20, this.groundY - 6, 4, 6);
    ctx.fillRect(x + 14, this.groundY - 3, 4, 3);
  }

  /**
   * 渲染泥土砖块
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   */
  renderDirtBlock(ctx, x) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, this.groundY, 32, 32);
    
    ctx.fillStyle = '#654321';
    ctx.fillRect(x + 4, this.groundY + 4, 4, 4);
    ctx.fillRect(x + 24, this.groundY + 24, 4, 4);
    ctx.fillRect(x + 12, this.groundY + 16, 8, 4);
  }

  /**
   * 添加层元素
   * @param {string} type - 层类型（background/midground/foreground）
   * @param {object} element - 要添加的元素
   */
  addLayer(type, element) {
    if (this.layers[type]) {
      this.layers[type].push(element);
    }
  }

  /**
   * 移除层元素
   * @param {string} type - 层类型
   * @param {object} element - 要移除的元素
   */
  removeLayer(type, element) {
    if (this.layers[type]) {
      const index = this.layers[type].indexOf(element);
      if (index !== -1) {
        this.layers[type].splice(index, 1);
      }
    }
  }

  /**
   * 获取地面Y坐标
   * @returns {number} 地面Y坐标
   */
  getGroundY() {
    return this.groundY;
  }

  /**
   * 重置场景
   */
  reset() {
    this.parallaxOffset = 0;
    this.initBackground();
    this.initGround();
  }
}