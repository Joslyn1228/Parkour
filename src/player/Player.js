/**
 * 玩家角色类
 * 
 * 负责玩家的移动、跳跃、闪现技能和渲染
 * 包含状态管理和碰撞检测
 */
import { Collider } from '../engine/GameEngine.js';

export class Player {
  /**
   * 构造函数 - 初始化玩家
   * @param {number} x - 初始X坐标
   * @param {number} y - 初始Y坐标
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 48;
    this.entityType = 'player';
    
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 6;
    this.jumpForce = -12;
    this.gravity = 0.5;
    
    this.state = 'idle';
    this.states = ['idle', 'running', 'jumping', 'sliding', 'flashing'];
    
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 0.15;
    
    this.onGround = true;
    this.canDoubleJump = false;
    this.jumpCount = 0;
    
    this.flashCooldown = 0;
    this.flashCooldownMax = 4000;
    this.isFlashing = false;
    
    this.isInvincible = false;
    this.invincibleTimeLeft = 0;
    this.invincibleDuration = 2000;
    
    this.collider = new Collider(x, y, this.width, this.height);
    
    this.colors = {
      body: '#ff6b6b',
      head: '#ffeaa7',
      eyes: '#2d3436',
      shoes: '#2d3436'
    };
    
    this.onStateChange = null;
    
    // 滑行状态追踪变量
    this.slideKeyPressed = false;
    this.slideStartTime = null;
    this.slideDuration = 1000;
    this.isSliding = false;
  }

  /**
   * 设置玩家状态
   * @param {string} state - 新状态
   */
  setState(state) {
    if (this.states.includes(state) && this.state !== state) {
      const prevState = this.state;
      this.state = state;
      this.animationFrame = 0;
      
      if (prevState === 'sliding' && state !== 'sliding') {
        this.collider = new Collider(this.x, this.y, this.width, this.height);
        this.slideGravity = null;
      }
      
      if (state === 'sliding' && prevState !== 'sliding') {
        if (this.slideHeight) {
          this.collider = new Collider(this.x, this.y + this.height - this.slideHeight, this.width, this.slideHeight);
        }
      }
      
      if (typeof this.onStateChange === 'function') {
        this.onStateChange(state);
      }
    }
  }

  /**
   * 跳跃 - 支持二段跳和闪现
   * @returns {boolean} 是否成功跳跃/闪现
   */
  jump() {
    if (this.flashCooldown > 0) {
      this.jumpCount++;
    }
    
    // 跳跃时退出滑行状态
    if (this.isSliding) {
      this.endSlide();
    }
    
    if (this.onGround) {
      this.jumpCount = 1;
      this.velocityY = this.jumpForce;
      this.onGround = false;
      this.canDoubleJump = true;
      this.setState('jumping');
      return true;
    } else if (this.canDoubleJump) {
      this.jumpCount = 2;
      this.velocityY = this.jumpForce * 0.8;
      this.canDoubleJump = false;
      this.setState('jumping');
      return true;
    } else if (this.jumpCount >= 2 && this.flashCooldown <= 0 && !this.isFlashing) {
      this.flash();
      return true;
    }
    return false;
  }
  
  /**
   * 闪现技能 - 触发后获得无敌状态
   */
  flash() {
    // 闪现时退出滑行状态
    if (this.isSliding) {
      this.endSlide();
    }
    
    this.isFlashing = true;
    this.y = 400;
    this.velocityY = 0;
    this.onGround = true;
    this.canDoubleJump = false;
    this.jumpCount = 0;
    this.flashCooldown = this.flashCooldownMax;
    this.setState('flashing');
    
    this.activateInvincibility();
    
    setTimeout(() => {
      this.isFlashing = false;
      this.setState('idle');
    }, 200);
  }
  
  /**
   * 激活无敌状态
   */
  activateInvincibility() {
    this.isInvincible = true;
    this.invincibleTimeLeft = this.invincibleDuration;
  }
  
  /**
   * 检查是否处于无敌状态
   * @returns {boolean} 是否无敌
   */
  isInvincibleNow() {
    return this.isInvincible && this.invincibleTimeLeft > 0;
  }
  
  /**
   * 检查是否可以闪现
   * @returns {boolean} 是否可以闪现
   */
  canFlash() {
    return this.flashCooldown <= 0 && !this.onGround;
  }
  
  /**
   * 获取闪现冷却进度百分比
   * @returns {number} 冷却进度(0-1)
   */
  getFlashCooldownPercent() {
    return Math.max(0, 1 - (this.flashCooldown / this.flashCooldownMax));
  }

  /**
   * 滑行
   */
  slide() {
    if (!this.slideKeyPressed) {
      this.slideKeyPressed = true;
      this.slideStartTime = Date.now();
      this.isSliding = true;
      
      console.log(`[Player] 开始滑行 - 时间: ${this.slideStartTime}`);
      
      if (this.state !== 'sliding') {
        const prevState = this.state;
        this.setState('sliding');
        this.slideHeight = 24;
        this.collider = new Collider(this.x, this.y + this.height - this.slideHeight, this.width, this.slideHeight);
        
        if (prevState === 'jumping' || !this.onGround) {
          this.slideGravity = 1.8;
          this.velocityY = Math.max(this.velocityY, 4);
        }
      }
    }
  }
  
  /**
   * 结束滑行
   * @param {string} nextState - 转换到的下一个状态
   */
  endSlide(nextState = 'idle') {
    if (this.isSliding) {
      const slideEndTime = Date.now();
      const actualDuration = slideEndTime - (this.slideStartTime || slideEndTime);
      
      console.log(`[Player] 结束滑行 - 持续时间: ${actualDuration}ms, 切换到: ${nextState}`);
      
      this.isSliding = false;
      this.slideKeyPressed = false;
      this.slideStartTime = null;
      this.slideTimer = null;
      
      // 恢复碰撞体大小
      this.collider = new Collider(this.x, this.y, this.width, this.height);
      this.slideGravity = null;
      
      // 平滑过渡到目标状态
      if (this.state === 'sliding') {
        this.setState(nextState);
      }
    }
  }
  
  /**
   * 释放滑行键
   */
  releaseSlide() {
    console.log(`[Player] 释放滑行键 - 当前状态: ${this.state}, isSliding: ${this.isSliding}`);
    
    if (this.slideKeyPressed && this.onGround) {
      this.slideKeyPressed = false;
      // 如果已经在滑行且在地面，延迟结束以完成过渡动画
      if (this.isSliding && this.state === 'sliding') {
        setTimeout(() => {
          if (this.isSliding && this.onGround && this.state === 'sliding') {
            this.endSlide(this.velocityX !== 0 ? 'running' : 'idle');
          }
        }, 150);
      }
    }
  }

  /**
   * 向左移动
   */
  moveLeft() {
    this.velocityX = -this.speed;
    if (this.onGround && this.state === 'idle') {
      this.setState('running');
    }
  }

  /**
   * 向右移动
   */
  moveRight() {
    this.velocityX = this.speed;
    if (this.onGround && this.state === 'idle') {
      this.setState('running');
    }
  }

  /**
   * 停止移动
   */
  stopMoving() {
    this.velocityX = 0;
    if (this.onGround && this.state === 'running') {
      this.setState('idle');
    }
  }
  
  /**
   * 设置移动速度
   * @param {number} newSpeed - 新速度值
   */
  setSpeed(newSpeed) {
    this.speed = newSpeed;
  }

  /**
   * 更新玩家状态（每帧调用）
   * @param {number} deltaTime - 帧间隔时间（毫秒）
   */
  update(deltaTime) {
    const currentGravity = this.slideGravity || this.gravity;
    this.velocityY += currentGravity;
    
    if (this.flashCooldown > 0) {
      this.flashCooldown -= deltaTime;
      if (this.flashCooldown < 0) this.flashCooldown = 0;
    }
    
    if (this.isInvincible && this.invincibleTimeLeft > 0) {
      this.invincibleTimeLeft -= deltaTime;
      if (this.invincibleTimeLeft <= 0) {
        this.isInvincible = false;
        this.invincibleTimeLeft = 0;
      }
    }
    
    if (this.state === 'sliding' && this.onGround) {
      if (!this.slideTimer) {
        this.slideTimer = 0;
      }
      this.slideTimer += deltaTime;
      
      // 条件1: 滑行持续时间达到阈值（800ms）
      if (this.slideTimer >= this.slideDuration) {
        console.log(`[Player] 滑行超时结束 - 持续时间: ${this.slideTimer}ms`);
        this.endSlide(this.velocityX !== 0 ? 'running' : 'idle');
      }
      // 条件2: 释放按键后延迟结束
      else if (!this.slideKeyPressed && this.slideTimer >= 150) {
        console.log(`[Player] 按键释放结束滑行 - 持续时间: ${this.slideTimer}ms`);
        this.endSlide(this.velocityX !== 0 ? 'running' : 'idle');
      }
    } else {
      this.slideTimer = null;
    }
    
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    if (this.y >= 400) {
      this.y = 400;
      this.velocityY = 0;
      this.onGround = true;
      this.canDoubleJump = false;
      this.jumpCount = 0;
      if (this.state === 'jumping') {
        this.setState('idle');
      } else if (this.state === 'sliding') {
        this.slideTimer = 0;
      }
    }
    
    if (this.state === 'sliding' && this.slideHeight) {
      this.collider.update(this.x, this.y + this.height - this.slideHeight);
    } else {
      this.collider.update(this.x, this.y);
    }
    
    this.animationTimer += deltaTime;
    if (this.animationTimer >= 100) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }
  }

  /**
   * 渲染玩家
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    const renderX = this.x;
    const renderY = this.y;
    
    if (this.isInvincibleNow()) {
      const blink = Math.floor(Date.now() / 150) % 2 === 0;
      if (blink) {
        ctx.globalAlpha = 0.6;
        ctx.shadowColor = '#00b894';
        ctx.shadowBlur = 25;
      } else {
        ctx.globalAlpha = 1;
        ctx.shadowColor = '#00b894';
        ctx.shadowBlur = 10;
      }
    }
    
    switch (this.state) {
      case 'idle':
        this.renderIdle(ctx, renderX, renderY);
        break;
      case 'running':
        this.renderRunning(ctx, renderX, renderY);
        break;
      case 'jumping':
        this.renderJumping(ctx, renderX, renderY);
        break;
      case 'sliding':
        this.renderSliding(ctx, renderX, renderY);
        break;
      case 'flashing':
        this.renderFlashing(ctx, renderX, renderY);
        break;
    }
    
    this.renderFlashCooldown(ctx);
    
    ctx.restore();
  }
  
  /**
   * 渲染闪现冷却条
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  renderFlashCooldown(ctx) {
    if (this.flashCooldown <= 0) return;
    
    const barWidth = 50;
    const barHeight = 4;
    const barX = this.x + (this.width - barWidth) / 2;
    const barY = this.y + this.height + 8;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const cooldownPercent = this.getFlashCooldownPercent();
    const fillWidth = barWidth * cooldownPercent;
    
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#00b894');
    gradient.addColorStop(1, '#00cec9');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }
  
  /**
   * 渲染闪现状态
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  renderFlashing(ctx, x, y) {
    ctx.fillStyle = '#a29bfe';
    ctx.shadowColor = '#6c5ce7';
    ctx.shadowBlur = 30;
    
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染待机状态
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  renderIdle(ctx, x, y) {
    ctx.fillStyle = this.colors.head;
    ctx.fillRect(x + 8, y, 16, 16);
    
    ctx.fillStyle = this.colors.eyes;
    ctx.fillRect(x + 11, y + 5, 4, 4);
    ctx.fillRect(x + 17, y + 5, 4, 4);
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 6, y + 16, 20, 20);
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 6, y + 36, 8, 12);
    ctx.fillRect(x + 18, y + 36, 8, 12);
    
    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 4, y + 46, 12, 2);
    ctx.fillRect(x + 16, y + 46, 12, 2);
  }

  /**
   * 渲染跑步状态
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  renderRunning(ctx, x, y) {
    const frame = this.animationFrame;
    
    ctx.fillStyle = this.colors.head;
    ctx.fillRect(x + 8, y, 16, 16);
    
    ctx.fillStyle = this.colors.eyes;
    ctx.fillRect(x + 11, y + 5, 4, 4);
    ctx.fillRect(x + 17, y + 5, 4, 4);
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 6, y + 16, 20, 20);
    
    const legOffset = Math.sin(frame * Math.PI / 2) * 4;
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 6, y + 36 + legOffset, 8, 12);
    ctx.fillRect(x + 18, y + 36 - legOffset, 8, 12);
    
    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 4, y + 46 + legOffset, 12, 2);
    ctx.fillRect(x + 16, y + 46 - legOffset, 12, 2);
  }

  /**
   * 渲染跳跃状态
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  renderJumping(ctx, x, y) {
    ctx.fillStyle = this.colors.head;
    ctx.fillRect(x + 8, y, 16, 16);
    
    ctx.fillStyle = this.colors.eyes;
    ctx.fillRect(x + 11, y + 5, 4, 4);
    ctx.fillRect(x + 17, y + 5, 4, 4);
    
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(x + 6, y + 16, 20, 20);
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 8, y + 36, 6, 12);
    ctx.fillRect(x + 18, y + 36, 6, 12);
    
    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 6, y + 46, 10, 2);
    ctx.fillRect(x + 16, y + 46, 10, 2);
    
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect(x + 2, y + 40, 4, 8);
    ctx.fillRect(x + 26, y + 40, 4, 8);
  }

  /**
   * 渲染滑行状态
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  renderSliding(ctx, x, y) {
    if (!this.onGround) {
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur = 25;
      
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.5 - i * 0.09;
        ctx.fillStyle = i % 2 === 0 ? '#00cec9' : '#74b9ff';
        ctx.fillRect(x - 12 - i * 10, y + 28 + i * 3, 10, 10);
      }
      ctx.globalAlpha = 1;
      
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.4 - i * 0.1;
        ctx.fillStyle = '#fd79a8';
        ctx.fillRect(x - 8 - i * 6, y + 32 + i * 2, 6, 6);
      }
      ctx.globalAlpha = 1;
    }
    
    ctx.fillStyle = this.colors.head;
    ctx.fillRect(x + 12, y + 16, 16, 16);
    
    ctx.fillStyle = this.colors.eyes;
    ctx.fillRect(x + 15, y + 21, 4, 4);
    ctx.fillRect(x + 21, y + 21, 4, 4);
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 4, y + 28, 24, 16);
    
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 4, y + 42, 24, 6);
    
    ctx.fillStyle = this.colors.shoes;
    ctx.fillRect(x + 2, y + 46, 28, 2);
    
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(x + 26, y + 30, 4, 12);
    
    if (!this.onGround) {
      ctx.shadowBlur = 0;
    }
  }

  /**
   * 处理碰撞事件
   * @param {object} other - 碰撞对象
   */
  onCollision(other) {
    if (other.type === 'obstacle') {
      if (typeof this.onHit === 'function') {
        this.onHit(other);
      }
    }
  }
}