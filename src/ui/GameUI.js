export class GameUI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.elements = [];
    
    this.score = 0;
    this.highScore = 0;
    
    this.onStart = null;
    this.onRestart = null;
    this.onPause = null;
    this.onLeaderboardToggle = null;
    
    this.showLeaderboard = false;
    this.showGuide = false;
    this.guideCurrentPage = 0;
    this.guideTotalPages = 3;
    
    this.pixelFont = 'pixel';
    
    this.coffeeActive = false;
    this.coffeeTimeLeft = 0;
    this.appleNotifications = [];
    
    this.initElements();
  }

  initElements() {
    this.elements = {
      startScreen: null,
      gameHUD: null,
      pauseScreen: null,
      gameOverScreen: null,
      speedSlider: null
    };
  }

  renderStartScreen() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = '#ff6b6b';
    this.drawPixelText('PIXEL RUNNER', centerX, centerY - 100, 48);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('按 ENTER 开始游戏', centerX, centerY - 30, 24);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('← → 或 A D 移动', centerX, centerY + 30, 16);
    this.drawPixelText('空格 跳跃', centerX, centerY + 55, 16);
    this.drawPixelText('↓ 或 S 滑行', centerX, centerY + 80, 16);
    
    this.drawLeaderboardButton(centerX, centerY + 110);
    this.drawGuideButton(centerX, centerY + 150);
    
    if (this.showGuide) {
      this.renderGuideScreen();
    }
    
    this.ctx.restore();
  }

  drawGuideButton(x, y) {
    const buttonWidth = 160;
    const buttonHeight = 32;
    const buttonX = x - buttonWidth / 2;
    const buttonY = y;
    
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(buttonX + 4, buttonY + 4, buttonWidth - 8, buttonHeight - 8);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('图鉴与玩法', x, buttonY + buttonHeight / 2, 10);
  }

  renderGuideScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const guideWidth = Math.min(520, this.canvas.width - 40);
    const guideHeight = Math.min(620, this.canvas.height - 80);
    const guideX = (this.canvas.width - guideWidth) / 2;
    const guideY = (this.canvas.height - guideHeight) / 2;
    
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(guideX, guideY, guideWidth, guideHeight);
    
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(guideX + 6, guideY + 6, guideWidth - 12, guideHeight - 12);
    
    this.ctx.fillStyle = '#e94560';
    this.ctx.fillRect(guideX + 8, guideY + 8, guideWidth - 16, 45);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.ctx.font = 'bold 26px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('图鉴与玩法', this.canvas.width / 2, guideY + 30);
    
    const pageTitles = ['操作说明', '道具说明', '障碍物说明'];
    const pageColors = ['#00d9ff', '#00ff88', '#ff6b9d'];
    
    this.ctx.fillStyle = pageColors[this.guideCurrentPage];
    this.drawPixelText(pageTitles[this.guideCurrentPage], this.canvas.width / 2, guideY + 68, 18);
    
    const contentY = guideY + 95;
    const contentWidth = guideWidth - 24;
    const contentX = guideX + 12;
    
    if (this.guideCurrentPage === 0) {
      this.renderControlsPage(contentX, contentY, contentWidth);
    } else if (this.guideCurrentPage === 1) {
      this.renderItemsPage(contentX, contentY, contentWidth);
    } else if (this.guideCurrentPage === 2) {
      this.renderObstaclesPage(contentX, contentY, contentWidth);
    }
    
    this.drawGuideNavigation(guideX, guideY, guideWidth, guideHeight);
    
    this.ctx.fillStyle = '#636e72';
    this.drawPixelText('按 ESC 关闭', this.canvas.width / 2, guideY + guideHeight - 28, 12);
    
    this.ctx.restore();
  }

  renderControlsPage(x, y, width) {
    const controls = [
      { key: '空格/↑/W', action: '基础跳跃', desc: '单次按键实现普通跳跃', extra: '', color: '#00ff88' },
      { key: '空格/↑/W×2', action: '二段跳', desc: '连续两次按键实现二段跳', extra: '', color: '#00d9ff' },
      { key: '↓ / S', action: '滑行', desc: '蹲下躲避高空障碍物', extra: '', color: '#ffaa00' },
      { key: '空格/↑/W×3', action: '闪现', desc: '连续三次按键触发闪现', extra: '【2秒无敌效果，4秒冷却时间】', color: '#ff6b9d' }
    ];
    
    controls.forEach((control, index) => {
      const cardX = x + (index % 2) * (width / 2);
      const cardY = y + Math.floor(index / 2) * 100;
      
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(cardX, cardY, width / 2 - 8, 90);
      
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(cardX + 3, cardY + 3, width / 2 - 14, 84);
      
      this.ctx.fillStyle = control.color;
      this.ctx.fillRect(cardX + 4, cardY + 4, 4, 18);
      
      this.ctx.fillStyle = '#ffeaa7';
      this.drawPixelText(control.key, cardX + (width / 4), cardY + 24, 14);
      
      this.ctx.fillStyle = '#ffffff';
      this.drawPixelText(control.action, cardX + (width / 4), cardY + 46, 14);
      
      this.ctx.fillStyle = '#b2bec3';
      this.drawPixelText(control.desc, cardX + (width / 4), cardY + 66, 10);
      
      if (control.extra) {
        this.ctx.fillStyle = '#ff6b9d';
        this.drawPixelText(control.extra, cardX + (width / 4), cardY + 82, 9);
      }
    });
  }

  renderItemsPage(x, y, width) {
    const items = [
      { name: '苹果', color: '#E74C3C', desc: '获得30分', extra: '', icon: 'apple', accent: '#00ff88' },
      { name: '咖啡', color: '#8B4513', desc: '双倍得分+移动加速', extra: '【有效时间10秒】', icon: 'coffee', accent: '#ffaa00' }
    ];
    
    items.forEach((item, index) => {
      const cardX = x + index * (width / 2);
      const cardY = y;
      
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(cardX, cardY, width / 2 - 8, 130);
      
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(cardX + 3, cardY + 3, width / 2 - 14, 124);
      
      this.ctx.fillStyle = item.accent;
      this.ctx.fillRect(cardX + 4, cardY + 4, 4, 22);
      
      const iconX = cardX + (width / 4) - 18;
      const iconY = cardY + 20;
      const iconSize = 36;
      
      if (item.icon === 'apple') {
        this.drawGameAppleIcon(this.ctx, iconX, iconY, iconSize);
      } else {
        this.drawGameCoffeeIcon(this.ctx, iconX, iconY, iconSize);
      }
      
      this.ctx.fillStyle = '#ffffff';
      this.drawPixelText(item.name, cardX + (width / 4), cardY + 72, 16);
      
      this.ctx.fillStyle = '#b2bec3';
      this.drawPixelText(item.desc, cardX + (width / 4), cardY + 92, 11);
      
      if (item.extra) {
        this.ctx.fillStyle = '#ff6b9d';
        this.drawPixelText(item.extra, cardX + (width / 4), cardY + 108, 10);
      }
    });
  }

  renderObstaclesPage(x, y, width) {
    const obstacles = [
      { id: 'bird', name: '飞鸟', color: '#E17055', desc: '低空飞行障碍物，需滑行躲避', type: 'low' },
      { id: 'bat', name: '蝙蝠', color: '#2D3436', desc: '低空飞行障碍物，需滑行躲避', type: 'low' },
      { id: 'barrier', name: '障碍门', color: '#00CEC9', desc: '低空障碍，需滑行或二段跳', type: 'low' },
      { id: 'purple_block', name: '紫色方块', color: '#6C5CE7', desc: '可跳跃的浮动平台', type: 'low' },
      { id: 'cloud_obstacle', name: '云朵障碍', color: '#DFE6E9', desc: '中高空障碍物，需二段跳', type: 'high' },
      { id: 'butterfly', name: '蝴蝶', color: '#FD79A8', desc: '高空飞行障碍物，需二段跳', type: 'high' },
      { id: 'balloon', name: '气球', color: '#00B894', desc: '高空障碍物，需二段跳', type: 'high' }
    ];
    
    const typeColors = {
      ground: '#636e72',
      low: '#00d9ff',
      high: '#ff6b9d'
    };
    
    obstacles.forEach((obstacle, index) => {
      const cardX = x + (index % 2) * (width / 2);
      const cardY = y + Math.floor(index / 2) * 92;
      
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(cardX, cardY, width / 2 - 8, 86);
      
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(cardX + 3, cardY + 3, width / 2 - 14, 80);
      
      this.ctx.fillStyle = typeColors[obstacle.type];
      this.ctx.fillRect(cardX + 4, cardY + 4, 4, 20);
      
      const iconX = cardX + 16;
      const iconY = cardY + 16;
      const iconSize = 28;
      
      this.drawObstacleIcon(this.ctx, obstacle.id, obstacle.color, iconX, iconY, iconSize);
      
      this.ctx.fillStyle = '#ffffff';
      this.drawPixelText(obstacle.name, cardX + (width / 4), cardY + 24, 14);
      
      this.ctx.fillStyle = '#b2bec3';
      this.drawPixelText(obstacle.desc, cardX + (width / 4), cardY + 46, 10);
      
      this.ctx.fillStyle = typeColors[obstacle.type];
      const typeText = obstacle.type === 'ground' ? '地面' : obstacle.type === 'low' ? '低空' : '高空';
      this.drawPixelText(typeText, cardX + (width / 4), cardY + 66, 10);
    });
  }

  drawGameAppleIcon(ctx, x, y, size) {
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#27AE60';
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + 4);
    ctx.lineTo(x + size / 2 - 5, y);
    ctx.lineTo(x + size / 2 + 5, y);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x + size / 2 - 4, y + size / 2 - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGameCoffeeIcon(ctx, x, y, size) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 2, y + 6, size - 4, size - 6);
    
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(x + 4, y + 8, size - 8, size - 14);
    
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 3, y + 3, size - 6, 4);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 6, y, 2, 4);
    ctx.fillRect(x + size - 8, y, 2, 4);
  }

  drawObstacleIcon(ctx, id, color, x, y, size) {
    ctx.fillStyle = color;
    
    switch(id) {
      case 'crate':
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 2, y + 2, size - 4, 2);
        ctx.fillRect(x + 2, y + size - 4, size - 4, 2);
        ctx.fillRect(x + 2, y + 2, 2, size - 4);
        ctx.fillRect(x + size - 4, y + 2, 2, size - 4);
        break;
      case 'spike':
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x, y + size);
        ctx.closePath();
        ctx.fill();
        break;
      case 'bird':
        ctx.fillRect(x + 4, y + 4, 16, 6);
        ctx.fillStyle = '#D63031';
        ctx.beginPath();
        ctx.arc(x + 20, y + 7, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bat':
        ctx.fillStyle = '#2D3436';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 2, size / 2, size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'barrier':
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#00B894';
        ctx.fillRect(x + 2, y + 4, size - 4, 4);
        ctx.fillRect(x + 2, y + size / 2, size - 4, 4);
        break;
      case 'purple_block':
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#8E7CC3';
        ctx.fillRect(x + 2, y + 2, size - 4, 2);
        ctx.fillRect(x + 2, y + 2, 2, size - 4);
        break;
      case 'cloud_obstacle':
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
        ctx.arc(x + 14, y + 6, 7, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'butterfly':
        ctx.beginPath();
        ctx.ellipse(x + size / 2 - 5, y + 5, 5, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + size / 2 + 5, y + 5, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDCB6E';
        ctx.fillRect(x + size / 2 - 1, y + 4, 2, 6);
        break;
      case 'balloon':
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2 + 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + size / 2 - 4, y + size / 2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2D3436';
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + size - 2);
        ctx.lineTo(x + size / 2 - 4, y + size + 4);
        ctx.moveTo(x + size / 2, y + size - 2);
        ctx.lineTo(x + size / 2 + 4, y + size + 4);
        ctx.stroke();
        break;
      case 'floating_spike':
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        ctx.fillRect(x, y, size, size);
    }
  }

  drawGuideNavigation(x, y, width, height) {
    const navY = y + height - 52;
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText(`${this.guideCurrentPage + 1} / ${this.guideTotalPages}`, this.canvas.width / 2, navY, 16);
    
    const leftArrowX = x + 25;
    const rightArrowX = x + width - 35;
    
    const pageColors = ['#00d9ff', '#00ff88', '#ff6b9d'];
    const currentColor = pageColors[this.guideCurrentPage];
    
    this.ctx.fillStyle = this.guideCurrentPage > 0 ? currentColor : '#4a5568';
    this.drawArrow(this.ctx, leftArrowX, navY, 'left');
    
    this.ctx.fillStyle = this.guideCurrentPage < this.guideTotalPages - 1 ? currentColor : '#4a5568';
    this.drawArrow(this.ctx, rightArrowX, navY, 'right');
    
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(x + 60, navY - 12, width - 120, 24);
    
    this.ctx.fillStyle = '#0f3460';
    this.ctx.fillRect(x + 62, navY - 10, width - 124, 20);
    
    for (let i = 0; i < this.guideTotalPages; i++) {
      const dotX = x + width / 2 - 18 + i * 18;
      this.ctx.fillStyle = i === this.guideCurrentPage ? currentColor : '#4a5568';
      this.ctx.beginPath();
      this.ctx.arc(dotX, navY, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawArrow(ctx, x, y, direction) {
    ctx.beginPath();
    if (direction === 'left') {
      ctx.moveTo(x + 18, y - 10);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 18, y + 10);
    } else {
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 18, y);
      ctx.lineTo(x, y + 10);
    }
    ctx.closePath();
    ctx.fill();
  }

  

  renderGameHUD() {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 150, 80);
    
    this.ctx.fillStyle = '#ffeaa7';
    const scoreText = `分数: ${this.score}`;
    this.drawPixelText(scoreText, 85, 35, 16);
    
    if (this.coffeeActive) {
      const scoreWidth = this.ctx.measureText(scoreText).width;
      this.ctx.fillStyle = '#fdcb6e';
      this.ctx.font = 'bold 12px "Press Start 2P", monospace';
      this.ctx.fillText('×2', 85 + scoreWidth + 10, 32);
      this.ctx.font = '16px "Press Start 2P", monospace';
    }
    
    this.ctx.fillStyle = '#fd79a8';
    this.drawPixelText(`最高分: ${this.highScore}`, 85, 60, 12);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('P 暂停', 85, 85, 12);
    
    this.renderCoffeeEffect();
    this.renderAppleNotifications();
    
    this.ctx.restore();
  }
  
  renderCoffeeEffect() {
    if (!this.coffeeActive || this.coffeeTimeLeft <= 0) return;
    
    const iconX = this.canvas.width - 50;
    const iconY = 80;
    const iconSize = 32;
    
    const fadeDuration = 1000;
    const fadeAlpha = this.coffeeTimeLeft < fadeDuration ? this.coffeeTimeLeft / fadeDuration : 1;
    
    const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
    const finalAlpha = 0.8 * pulse * fadeAlpha;
    
    this.ctx.fillStyle = `rgba(253, 196, 110, ${finalAlpha})`;
    this.ctx.shadowColor = '#fdcb6e';
    this.ctx.shadowBlur = 10 * pulse * fadeAlpha;
    
    this.ctx.fillRect(iconX, iconY, iconSize, iconSize);
    
    this.ctx.fillStyle = `rgba(45, 52, 54, ${fadeAlpha})`;
    this.ctx.fillRect(iconX + 4, iconY + 8, 8, 16);
    this.ctx.fillRect(iconX + 20, iconY + 8, 8, 16);
    this.ctx.fillRect(iconX + 8, iconY + 20, 16, 8);
    
    this.ctx.shadowBlur = 0;
    
    const timeLeft = Math.ceil(this.coffeeTimeLeft / 1000);
    this.ctx.fillStyle = `rgba(253, 203, 110, ${fadeAlpha})`;
    this.drawPixelText(`${timeLeft}s`, iconX + iconSize / 2, iconY + iconSize + 15, 12);
  }
  
  renderAppleNotifications() {
    this.appleNotifications.forEach((notification, index) => {
      if (notification.alpha <= 0) return;
      
      this.ctx.save();
      this.ctx.globalAlpha = notification.alpha;
      this.ctx.fillStyle = '#00b894';
      this.ctx.font = 'bold 24px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`+${notification.score}`, this.canvas.width / 2, notification.y);
      this.ctx.restore();
    });
  }
  
  update(deltaTime) {
    if (isNaN(deltaTime) || deltaTime <= 0) return;
    
    if (this.coffeeActive) {
      this.coffeeTimeLeft -= deltaTime;
      if (this.coffeeTimeLeft <= 0) {
        this.coffeeActive = false;
        this.coffeeTimeLeft = 0;
      }
    }
    
    this.appleNotifications = this.appleNotifications.filter(notification => {
      notification.y -= 0.5;
      notification.alpha -= deltaTime / 1500;
      return notification.alpha > 0;
    });
  }
  
  startCoffeeEffect(duration = 5000) {
    this.coffeeActive = true;
    this.coffeeTimeLeft = duration;
  }
  
  stopCoffeeEffect() {
    this.coffeeActive = false;
    this.coffeeTimeLeft = 0;
  }
  
  addAppleNotification(score = 30) {
    this.appleNotifications.push({
      score: score,
      y: this.canvas.height / 2 - 50,
      alpha: 1
    });
  }

  renderPauseScreen() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('游戏暂停', centerX, centerY - 30, 32);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('按 P 继续', centerX, centerY + 10, 20);
    
    this.ctx.fillStyle = '#fd79a8';
    this.drawPixelText('按 ESC 返回菜单', centerX, centerY + 45, 16);
    
    this.ctx.restore();
  }

  renderGameOverScreen() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = '#ff6b6b';
    this.drawPixelText('游戏结束', centerX, centerY - 60, 40);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText(`最终分数: ${this.score}`, centerX, centerY - 10, 24);
    
    if (this.score >= this.highScore && this.score > 0) {
      this.ctx.fillStyle = '#fdcb6e';
      this.drawPixelText('🎉 新纪录! 🎉', centerX, centerY + 20, 20);
    } else {
      this.ctx.fillStyle = '#fd79a8';
      this.drawPixelText(`最高分: ${this.highScore}`, centerX, centerY + 25, 18);
    }
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('按 ENTER 重新开始', centerX, centerY + 70, 20);
    
    this.ctx.fillStyle = '#636e72';
    this.drawPixelText('按 ESC 返回菜单', centerX, centerY + 100, 16);
    
    this.ctx.restore();
  }

  drawLeaderboardButton(x, y) {
    const buttonWidth = 160;
    const buttonHeight = 32;
    const buttonX = x - buttonWidth / 2;
    const buttonY = y;
    
    this.ctx.fillStyle = this.showLeaderboard ? '#00b894' : '#636e72';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(buttonX + 4, buttonY + 4, buttonWidth - 8, buttonHeight - 8);
    
    this.ctx.fillStyle = '#ffeaa7';
    const buttonText = this.showLeaderboard ? '隐藏排行榜' : '显示排行榜';
    this.drawPixelText(buttonText, x, buttonY + buttonHeight / 2, 10);
  }
  
  drawPixelText(text, x, y, size) {
    this.ctx.font = `${size}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }

  setScore(score) {
    this.score = score;
  }

  setHighScore(highScore) {
    this.highScore = highScore;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  handleKeyDown(key) {
    if (this.showGuide) {
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        if (this.guideCurrentPage > 0) {
          this.guideCurrentPage--;
        }
        return;
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        if (this.guideCurrentPage < this.guideTotalPages - 1) {
          this.guideCurrentPage++;
        }
        return;
      }
    }
    
    if (key === 'Enter') {
      if (typeof this.onStart === 'function') {
        this.onStart();
      }
    } else if (key === 'p' || key === 'P') {
      if (typeof this.onPause === 'function') {
        this.onPause();
      }
    } else if (key === 'Escape') {
      if (this.showGuide) {
        this.showGuide = false;
      } else if (typeof this.onRestart === 'function') {
        this.onRestart();
      }
    }
  }

  handleMouseClick(x, y) {
    const centerX = this.canvas.width / 2;
    
    const leaderboardButtonY = this.canvas.height / 2 + 110;
    const guideButtonY = this.canvas.height / 2 + 150;
    
    const buttonWidth = 160;
    const buttonHeight = 32;
    const leaderboardButtonX = centerX - buttonWidth / 2;
    
    if (x >= leaderboardButtonX && x <= leaderboardButtonX + buttonWidth &&
        y >= leaderboardButtonY && y <= leaderboardButtonY + buttonHeight) {
      this.showLeaderboard = !this.showLeaderboard;
      if (typeof this.onLeaderboardToggle === 'function') {
        this.onLeaderboardToggle(this.showLeaderboard);
      }
    }
    
    if (x >= leaderboardButtonX && x <= leaderboardButtonX + buttonWidth &&
        y >= guideButtonY && y <= guideButtonY + buttonHeight) {
      this.showGuide = !this.showGuide;
      this.guideCurrentPage = 0;
    }
    
    if (this.showGuide) {
      const guideWidth = Math.min(500, this.canvas.width - 40);
      const guideHeight = Math.min(500, this.canvas.height - 80);
      const guideX = (this.canvas.width - guideWidth) / 2;
      const guideY = (this.canvas.height - guideHeight) / 2;
      const navY = guideY + guideHeight - 50;
      
      const leftArrowX = guideX + 20;
      const rightArrowX = guideX + guideWidth - 30;
      
      if (x >= leftArrowX && x <= leftArrowX + 15 && y >= navY - 8 && y <= navY + 8) {
        if (this.guideCurrentPage > 0) {
          this.guideCurrentPage--;
        }
      }
      
      if (x >= rightArrowX && x <= rightArrowX + 15 && y >= navY - 8 && y <= navY + 8) {
        if (this.guideCurrentPage < this.guideTotalPages - 1) {
          this.guideCurrentPage++;
        }
      }
    }
  }
  
  toggleLeaderboard() {
    this.showLeaderboard = !this.showLeaderboard;
    if (typeof this.onLeaderboardToggle === 'function') {
      this.onLeaderboardToggle(this.showLeaderboard);
    }
    return this.showLeaderboard;
  }
  
  getShowLeaderboard() {
    return this.showLeaderboard;
  }
}

export class PixelButton {
  constructor(x, y, width, height, text, onClick) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    this.hovered = false;
  }

  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    if (this.hovered) {
      ctx.fillStyle = '#ffeaa7';
    } else {
      ctx.fillStyle = '#ff6b6b';
    }
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
    
    if (this.hovered) {
      ctx.fillStyle = '#ffeaa7';
    } else {
      ctx.fillStyle = '#ff6b6b';
    }
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    
    ctx.restore();
  }

  checkHover(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
}