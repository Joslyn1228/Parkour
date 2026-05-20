export class GameUI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.elements = [];
    
    this.score = 0;
    this.highScore = 0;
    this.speed = 5;
    this.difficulty = 1;
    
    this.obstacleSpeedMultiplier = 1.0;
    
    this.onStart = null;
    this.onRestart = null;
    this.onSpeedChange = null;
    this.onPause = null;
    this.onObstacleSpeedChange = null;
    this.onResetDefaults = null;
    this.onLeaderboardToggle = null;
    
    this.showLeaderboard = true;
    
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
    
    this.drawSpeedControl(centerX, centerY + 110);
    this.drawObstacleSpeedSlider(centerX, centerY + 165);
    this.drawLeaderboardButton(centerX, centerY + 220);
    this.drawResetButton(centerX, centerY + 275);
    
    this.ctx.restore();
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
    
    this.ctx.fillStyle = '#00b894';
    const speedText = `速度: ${Math.floor(this.speed * 10)}`;
    this.drawPixelText(speedText, 85, 85, 12);
    
    this.ctx.fillStyle = '#e17055';
    const difficultyText = `难度: ${this.difficulty}`;
    this.drawPixelText(difficultyText, this.canvas.width - 85, 35, 16);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('P 暂停', this.canvas.width - 60, 60, 12);
    
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

  drawSpeedControl(x, y) {
    const sliderWidth = 200;
    const sliderHeight = 16;
    const sliderX = x - sliderWidth / 2;
    const sliderY = y;
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);
    
    this.ctx.fillStyle = '#00b894';
    const fillWidth = ((this.speed - 2) / 18) * sliderWidth;
    this.ctx.fillRect(sliderX, sliderY, fillWidth, sliderHeight);
    
    this.ctx.fillStyle = '#ffeaa7';
    const thumbX = sliderX + fillWidth - 8;
    this.ctx.fillRect(thumbX, sliderY - 4, 16, sliderHeight + 8);
    
    this.ctx.fillStyle = '#636e72';
    this.drawPixelText('初始速度', x, sliderY - 20, 14);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('慢', sliderX - 25, sliderY + 5, 12);
    
    this.ctx.fillStyle = '#ff6b6b';
    this.drawPixelText('快', sliderX + sliderWidth + 10, sliderY + 5, 12);
  }
  
  drawObstacleSpeedSlider(x, y) {
    const sliderWidth = 180;
    const sliderHeight = 16;
    const sliderX = x - sliderWidth / 2;
    const sliderY = y;
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);
    
    this.ctx.fillStyle = '#fd79a8';
    const fillWidth = ((this.obstacleSpeedMultiplier - 0.5) / 1.5) * sliderWidth;
    this.ctx.fillRect(sliderX, sliderY, fillWidth, sliderHeight);
    
    this.ctx.fillStyle = '#ffeaa7';
    const thumbX = sliderX + fillWidth - 8;
    this.ctx.fillRect(thumbX, sliderY - 4, 16, sliderHeight + 8);
    
    this.ctx.fillStyle = '#636e72';
    this.drawPixelText('障碍物速度', x, sliderY - 18, 14);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('0.5x', sliderX - 35, sliderY + 5, 10);
    
    this.ctx.fillStyle = '#ff6b6b';
    this.drawPixelText('2.0x', sliderX + sliderWidth + 12, sliderY + 5, 10);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText(`${this.obstacleSpeedMultiplier.toFixed(1)}x`, x, sliderY + 22, 12);
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
  
  drawResetButton(x, y) {
    const buttonWidth = 120;
    const buttonHeight = 32;
    const buttonX = x - buttonWidth / 2;
    const buttonY = y;
    
    this.ctx.fillStyle = '#636e72';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(buttonX + 4, buttonY + 4, buttonWidth - 8, buttonHeight - 8);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('重置默认', x, buttonY + buttonHeight / 2, 12);
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

  setSpeed(speed) {
    this.speed = speed;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
  
  setObstacleSpeedMultiplier(multiplier) {
    this.obstacleSpeedMultiplier = Math.max(0.5, Math.min(2.0, multiplier));
  }
  
  getObstacleSpeedMultiplier() {
    return this.obstacleSpeedMultiplier;
  }
  
  resetToDefaults() {
    this.speed = 5;
    this.obstacleSpeedMultiplier = 1.0;
    if (typeof this.onResetDefaults === 'function') {
      this.onResetDefaults();
    }
  }

  handleKeyDown(key) {
    if (key === 'Enter') {
      if (typeof this.onStart === 'function') {
        this.onStart();
      }
    } else if (key === 'p' || key === 'P') {
      if (typeof this.onPause === 'function') {
        this.onPause();
      }
    } else if (key === 'Escape') {
      if (typeof this.onRestart === 'function') {
        this.onRestart();
      }
    }
  }

  handleMouseClick(x, y) {
    const centerX = this.canvas.width / 2;
    const sliderWidth = 180;
    const sliderHeight = 16;
    
    const mainSliderY = this.canvas.height / 2 + 110;
    const obstacleSliderY = this.canvas.height / 2 + 165;
    const leaderboardButtonY = this.canvas.height / 2 + 220;
    const buttonY = this.canvas.height / 2 + 275;
    
    const sliderX = centerX - sliderWidth / 2;
    
    if (x >= sliderX && x <= sliderX + sliderWidth &&
        y >= mainSliderY && y <= mainSliderY + sliderHeight) {
      const newSpeed = 2 + ((x - sliderX) / sliderWidth) * 18;
      this.speed = newSpeed;
      if (typeof this.onSpeedChange === 'function') {
        this.onSpeedChange(newSpeed);
      }
    }
    
    if (x >= sliderX && x <= sliderX + sliderWidth &&
        y >= obstacleSliderY && y <= obstacleSliderY + sliderHeight) {
      const newMultiplier = 0.5 + ((x - sliderX) / sliderWidth) * 1.5;
      this.obstacleSpeedMultiplier = newMultiplier;
      if (typeof this.onObstacleSpeedChange === 'function') {
        this.onObstacleSpeedChange(newMultiplier);
      }
    }
    
    const leaderboardButtonWidth = 160;
    const leaderboardButtonHeight = 32;
    const leaderboardButtonX = centerX - leaderboardButtonWidth / 2;
    
    if (x >= leaderboardButtonX && x <= leaderboardButtonX + leaderboardButtonWidth &&
        y >= leaderboardButtonY && y <= leaderboardButtonY + leaderboardButtonHeight) {
      this.showLeaderboard = !this.showLeaderboard;
      if (typeof this.onLeaderboardToggle === 'function') {
        this.onLeaderboardToggle(this.showLeaderboard);
      }
    }
    
    const buttonWidth = 120;
    const buttonHeight = 32;
    const buttonX = centerX - buttonWidth / 2;
    
    if (x >= buttonX && x <= buttonX + buttonWidth &&
        y >= buttonY && y <= buttonY + buttonHeight) {
      this.resetToDefaults();
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