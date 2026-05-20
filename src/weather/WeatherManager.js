import { RainSystem } from './WeatherEffects.js';

/**
 * 天气管理器
 * 管理天气状态的开启/关闭、随机触发天气
 */
export class WeatherManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    this.rainSystem = new RainSystem(canvasWidth, canvasHeight);
    
    this.isRaining = false;
    this.rainStartTime = 0;
    this.rainDuration = 0;
    this.rainTriggerScore = 5000;
    this.rainProbability = 0.3;
    this.minDuration = 5000;
    this.maxDuration = 10000;
    
    this.lastCheckScore = 0;
  }

  update(deltaTime, score) {
    if (score >= this.rainTriggerScore && score - this.lastCheckScore >= this.rainTriggerScore) {
      this.lastCheckScore = score;
      
      if (!this.isRaining && Math.random() < this.rainProbability) {
        this.startRain();
      }
    }
    
    if (this.isRaining) {
      this.rainSystem.update();
      
      const currentTime = performance.now();
      if (currentTime - this.rainStartTime >= this.rainDuration) {
        this.stopRain();
      }
    }
  }

  startRain() {
    if (this.isRaining) return;
    
    this.isRaining = true;
    this.rainStartTime = performance.now();
    this.rainDuration = this.minDuration + Math.random() * (this.maxDuration - this.minDuration);
    
    this.rainSystem.setActive(true);
    console.log(`[Weather] Rain started - duration: ${(this.rainDuration / 1000).toFixed(1)}s`);
  }

  stopRain() {
    if (!this.isRaining) return;
    
    this.isRaining = false;
    this.rainSystem.setActive(false);
    console.log('[Weather] Rain stopped');
  }

  render(ctx) {
    this.rainSystem.render(ctx);
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.rainSystem.resize(width, height);
  }
}
