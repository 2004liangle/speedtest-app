/**
 * 速度仪表盘组件
 */

class SpeedGauge {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    
    // 默认选项
    this.options = {
      minValue: 0,
      maxValue: 125, // 最大125MB/s
      currentValue: 0,
      colorRanges: [
        { min: 0, max: 30, color: '#dc3545' },    // 红色 (0-30MB/s)
        { min: 30, max: 60, color: '#ffc107' },   // 黄色 (30-60MB/s)
        { min: 60, max: 125, color: '#28a745' }   // 绿色 (60-125MB/s)
      ],
      ...options
    };
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化仪表盘
   */
  init() {
    // 设置画布大小
    this.resize();
    
    // 绘制仪表盘
    this.draw();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.resize();
      this.draw();
    });
  }
  
  /**
   * 调整画布大小
   */
  resize() {
    const container = this.canvas.parentElement;
    const size = Math.min(container.clientWidth, 300);
    
    this.canvas.width = size;
    this.canvas.height = size;
    
    // 计算仪表盘参数
    this.radius = size * 0.8 / 2;
    this.centerX = size / 2;
    this.centerY = size / 2;
  }
  
  /**
   * 绘制仪表盘
   */
  draw() {
    const ctx = this.ctx;
    const { minValue, maxValue, currentValue } = this.options;
    
    // 清除画布
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制外圈
    this.drawOuterRing();
    
    // 绘制刻度
    this.drawTicks();
    
    // 绘制颜色区域
    this.drawColorRanges();
    
    // 绘制当前值指针
    this.drawNeedle(currentValue);
    
    // 绘制中心圆
    this.drawCenterCircle();
  }
  
  /**
   * 绘制外圈
   */
  drawOuterRing() {
    const ctx = this.ctx;
    
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  /**
   * 绘制刻度
   */
  drawTicks() {
    const ctx = this.ctx;
    const { minValue, maxValue } = this.options;
    
    // 大刻度数量
    const majorTicks = 5;
    // 每个大刻度之间的小刻度数量
    const minorTicks = 4;
    
    // 绘制大刻度和标签
    for (let i = 0; i <= majorTicks; i++) {
      const value = minValue + (maxValue - minValue) * (i / majorTicks);
      const angle = this.valueToAngle(value);
      
      const outerX = this.centerX + (this.radius - 2) * Math.cos(angle);
      const outerY = this.centerY + (this.radius - 2) * Math.sin(angle);
      const innerX = this.centerX + (this.radius - 10) * Math.cos(angle);
      const innerY = this.centerY + (this.radius - 10) * Math.sin(angle);
      
      // 绘制刻度线
      ctx.beginPath();
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制标签
      const labelX = this.centerX + (this.radius - 25) * Math.cos(angle);
      const labelY = this.centerY + (this.radius - 25) * Math.sin(angle);
      
      ctx.font = '10px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(value), labelX, labelY);
    }
    
    // 绘制小刻度
    for (let i = 0; i < majorTicks * minorTicks; i++) {
      // 跳过大刻度位置
      if (i % minorTicks === 0) continue;
      
      const value = minValue + (maxValue - minValue) * (i / (majorTicks * minorTicks));
      const angle = this.valueToAngle(value);
      
      const outerX = this.centerX + (this.radius - 2) * Math.cos(angle);
      const outerY = this.centerY + (this.radius - 2) * Math.sin(angle);
      const innerX = this.centerX + (this.radius - 6) * Math.cos(angle);
      const innerY = this.centerY + (this.radius - 6) * Math.sin(angle);
      
      // 绘制刻度线
      ctx.beginPath();
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  /**
   * 绘制颜色区域
   */
  drawColorRanges() {
    const ctx = this.ctx;
    const { minValue, maxValue, colorRanges } = this.options;
    
    for (const range of colorRanges) {
      const startAngle = this.valueToAngle(range.min);
      const endAngle = this.valueToAngle(range.max);
      
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.radius - 15, startAngle, endAngle);
      ctx.lineWidth = 10;
      ctx.strokeStyle = range.color;
      ctx.stroke();
    }
  }
  
  /**
   * 绘制指针
   * @param {number} value - 当前值
   */
  drawNeedle(value) {
    const ctx = this.ctx;
    const { minValue, maxValue } = this.options;
    
    // 检查值是否为有效数字
    if (isNaN(value) || !isFinite(value)) {
      value = 0; // 如果值无效，使用0
    }
    
    // 限制值在范围内
    const clampedValue = Math.max(minValue, Math.min(maxValue, value));
    
    // 计算角度
    const angle = this.valueToAngle(clampedValue);
    
    // 指针长度
    const needleLength = this.radius - 20;
    
    // 指针宽度
    const needleWidth = 5;
    
    // 计算指针端点
    const tipX = this.centerX + needleLength * Math.cos(angle);
    const tipY = this.centerY + needleLength * Math.sin(angle);
    
    // 计算指针两侧的点
    const leftX = this.centerX + needleWidth * Math.cos(angle + Math.PI / 2);
    const leftY = this.centerY + needleWidth * Math.sin(angle + Math.PI / 2);
    const rightX = this.centerX + needleWidth * Math.cos(angle - Math.PI / 2);
    const rightY = this.centerY + needleWidth * Math.sin(angle - Math.PI / 2);
    
    // 绘制指针
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    
    // 检查坐标是否有效
    if (isNaN(tipX) || !isFinite(tipX) || 
        isNaN(tipY) || !isFinite(tipY) ||
        isNaN(this.centerX) || !isFinite(this.centerX) ||
        isNaN(this.centerY) || !isFinite(this.centerY)) {
      // 如果坐标无效，使用简单的填充而不是渐变
      ctx.fillStyle = '#666';
    } else {
      // 指针渐变
      try {
        const gradient = ctx.createLinearGradient(this.centerX, this.centerY, tipX, tipY);
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#333');
        ctx.fillStyle = gradient;
      } catch (e) {
        console.error('创建渐变失败:', e);
        ctx.fillStyle = '#666'; // 失败时使用简单的填充
      }
    }
    
    ctx.fill();
    
    // 指针边框
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  /**
   * 绘制中心圆
   */
  drawCenterCircle() {
    const ctx = this.ctx;
    
    // 外圈
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ccc';
    ctx.fill();
    
    // 内圈
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  
  /**
   * 将值转换为角度
   * @param {number} value - 值
   * @returns {number} - 角度（弧度）
   */
  valueToAngle(value) {
    const { minValue, maxValue } = this.options;
    
    // 将值映射到 -135° 到 135° 的范围（弧度）
    const minAngle = -3 * Math.PI / 4; // -135°
    const maxAngle = 3 * Math.PI / 4;  // 135°
    
    return minAngle + (maxAngle - minAngle) * (value - minValue) / (maxValue - minValue);
  }
  
  /**
   * 更新值
   * @param {number} value - 新值
   */
  updateValue(value) {
    if (value < this.options.minValue) {
      value = this.options.minValue;
    } else if (value > this.options.maxValue) {
      value = this.options.maxValue;
    }
    
    this.options.currentValue = value;
    this.draw();
  }
}

// 移除全局变量声明和事件监听器，由app.js统一管理
