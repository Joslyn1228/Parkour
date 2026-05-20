/**
 * 雨滴粒子类
 */
class Raindrop {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.speed = 8 + Math.random() * 4;
    this.length = 10 + Math.random() * 10;
    this.opacity = 0.3 + Math.random() * 0.3;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  update() {
    this.x -= 2;
    this.y += this.speed;
    
    if (this.y > this.canvasHeight + this.length) {
      this.y = -this.length;
      this.x = Math.random() * this.canvasWidth;
    }
    
    if (this.x < -this.length) {
      this.x = this.canvasWidth + this.length;
      this.y = Math.random() * this.canvasHeight;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = `rgba(200, 200, 255, ${this.opacity})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    const angle = -15 * Math.PI / 180;
    const endX = this.x + Math.sin(angle) * this.length;
    const endY = this.y + Math.cos(angle) * this.length;
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.restore();
  }
}

/**
 * 雨滴粒子系统
 */
export class RainSystem {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.raindrops = [];
    this.raindropCount = 100;
    this.isActive = false;
    
    this.init();
  }

  init() {
    this.raindrops = [];
    for (let i = 0; i < this.raindropCount; i++) {
      this.raindrops.push(new Raindrop(this.canvasWidth, this.canvasHeight));
    }
  }

  setActive(active) {
    this.isActive = active;
    if (active) {
      this.init();
    }
  }

  update() {
    if (!this.isActive) return;
    
    for (const raindrop of this.raindrops) {
      raindrop.update();
    }
  }

  render(ctx) {
    if (!this.isActive) return;
    
    for (const raindrop of this.raindrops) {
      raindrop.draw(ctx);
    }
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    for (const raindrop of this.raindrops) {
      raindrop.canvasWidth = width;
      raindrop.canvasHeight = height;
    }
  }
}
