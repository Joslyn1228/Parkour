/**
 * 性能监控工具类
 * 
 * 用于监控游戏帧率、内存使用和性能指标
 */
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.fpsHistory = [];
    this.maxFpsHistory = 60;
    
    this.minFPS = Infinity;
    this.maxFPS = 0;
    
    this.updateTimes = [];
    this.renderTimes = [];
    this.collisionTimes = [];
    
    this.enabled = true;
  }
  
  /**
   * 更新帧率统计
   */
  update() {
    if (!this.enabled) return;
    
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;
    
    if (elapsed >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / elapsed);
      this.fpsHistory.push(this.fps);
      
      if (this.fpsHistory.length > this.maxFpsHistory) {
        this.fpsHistory.shift();
      }
      
      this.minFPS = Math.min(this.minFPS, this.fps);
      this.maxFPS = Math.max(this.maxFPS, this.fps);
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
  
  /**
   * 记录更新时间
   * @param {number} time - 耗时（毫秒）
   */
  recordUpdateTime(time) {
    this.updateTimes.push(time);
    if (this.updateTimes.length > 60) this.updateTimes.shift();
  }
  
  /**
   * 记录渲染时间
   * @param {number} time - 耗时（毫秒）
   */
  recordRenderTime(time) {
    this.renderTimes.push(time);
    if (this.renderTimes.length > 60) this.renderTimes.shift();
  }
  
  /**
   * 记录碰撞检测时间
   * @param {number} time - 耗时（毫秒）
   */
  recordCollisionTime(time) {
    this.collisionTimes.push(time);
    if (this.collisionTimes.length > 60) this.collisionTimes.shift();
  }
  
  /**
   * 获取平均更新时间
   * @returns {number} 平均耗时（毫秒）
   */
  getAvgUpdateTime() {
    if (this.updateTimes.length === 0) return 0;
    return this.updateTimes.reduce((a, b) => a + b, 0) / this.updateTimes.length;
  }
  
  /**
   * 获取平均渲染时间
   * @returns {number} 平均耗时（毫秒）
   */
  getAvgRenderTime() {
    if (this.renderTimes.length === 0) return 0;
    return this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
  }
  
  /**
   * 获取平均碰撞检测时间
   * @returns {number} 平均耗时（毫秒）
   */
  getAvgCollisionTime() {
    if (this.collisionTimes.length === 0) return 0;
    return this.collisionTimes.reduce((a, b) => a + b, 0) / this.collisionTimes.length;
  }
  
  /**
   * 获取平均帧率
   * @returns {number} 平均帧率
   */
  getAvgFPS() {
    if (this.fpsHistory.length === 0) return 0;
    return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
  }
  
  /**
   * 获取帧率波动
   * @returns {number} 帧率标准差
   */
  getFPSVariance() {
    if (this.fpsHistory.length < 2) return 0;
    const avg = this.getAvgFPS();
    const variance = this.fpsHistory.reduce((sum, fps) => sum + Math.pow(fps - avg, 2), 0) / this.fpsHistory.length;
    return Math.round(Math.sqrt(variance));
  }
  
  /**
   * 获取性能报告
   * @returns {object} 性能报告对象
   */
  getReport() {
    return {
      currentFPS: this.fps,
      avgFPS: this.getAvgFPS(),
      minFPS: this.minFPS === Infinity ? 0 : this.minFPS,
      maxFPS: this.maxFPS,
      fpsVariance: this.getFPSVariance(),
      avgUpdateTime: this.getAvgUpdateTime().toFixed(2),
      avgRenderTime: this.getAvgRenderTime().toFixed(2),
      avgCollisionTime: this.getAvgCollisionTime().toFixed(2),
      frameCount: this.frameCount
    };
  }
  
  /**
   * 渲染性能监控UI
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   */
  render(ctx, x = 10, y = 10) {
    if (!this.enabled) return;
    
    ctx.save();
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const report = this.getReport();
    const fpsColor = report.currentFPS >= 50 ? '#00ff88' : report.currentFPS >= 30 ? '#ffaa00' : '#ff4444';
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 200, 130);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText('=== 性能监控 ===', x + 8, y + 18);
    
    ctx.fillStyle = fpsColor;
    ctx.fillText(`FPS: ${report.currentFPS} (${report.avgFPS})`, x + 8, y + 38);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`最小FPS: ${report.minFPS}`, x + 8, y + 54);
    ctx.fillText(`最大FPS: ${report.maxFPS}`, x + 8, y + 70);
    ctx.fillText(`波动: ±${report.fpsVariance}`, x + 8, y + 86);
    
    ctx.fillStyle = '#74b9ff';
    ctx.fillText(`更新: ${report.avgUpdateTime}ms`, x + 8, y + 102);
    ctx.fillText(`渲染: ${report.avgRenderTime}ms`, x + 8, y + 118);
    ctx.fillText(`碰撞: ${report.avgCollisionTime}ms`, x + 8, y + 134);
    
    this.renderFPSGraph(ctx, x, y + 145);
    
    ctx.restore();
  }
  
  /**
   * 渲染帧率图表
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   */
  renderFPSGraph(ctx, x, y) {
    if (this.fpsHistory.length < 2) return;
    
    const graphWidth = 200;
    const graphHeight = 40;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, graphWidth, graphHeight);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
      const lineY = y + (graphHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + graphWidth, lineY);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px monospace';
      ctx.fillText(`${60 - i * 15}`, x - 25, lineY + 4);
    }
    
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const step = graphWidth / this.fpsHistory.length;
    
    this.fpsHistory.forEach((fps, index) => {
      const px = x + index * step;
      const py = y + graphHeight - (fps / 60) * graphHeight;
      
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    
    ctx.stroke();
    
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(x + graphWidth - 2, y + graphHeight - 15, 2, 15);
  }
  
  /**
   * 重置统计数据
   */
  reset() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.fpsHistory = [];
    this.minFPS = Infinity;
    this.maxFPS = 0;
    this.updateTimes = [];
    this.renderTimes = [];
    this.collisionTimes = [];
  }
  
  /**
   * 启用/禁用监控
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.reset();
    }
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();
