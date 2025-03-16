/**
 * 进度条组件
 */

class ProgressBar {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    if (!this.element) {
      console.error(`Progress bar element with id "${elementId}" not found`);
      return;
    }
    
    this.progress = 0;
    this.type = null;
  }
  
  /**
   * 更新进度
   * @param {number} progress - 进度值（0-100）
   * @param {string} type - 测试类型 ('upload' 或 'download')
   */
  update(progress, type = null) {
    // 限制进度值在0-100之间
    this.progress = Math.max(0, Math.min(100, progress));
    
    // 更新类型
    if (type && this.type !== type) {
      this.type = type;
      
      // 移除所有类型类
      this.element.classList.remove('upload', 'download');
      
      // 添加当前类型类
      if (type === 'upload' || type === 'download') {
        this.element.classList.add(type);
      }
    }
    
    // 更新进度条宽度
    this.element.style.width = `${this.progress}%`;
    
    // 更新文本
    this.element.textContent = `${Math.round(this.progress)}%`;
    
    // 更新ARIA属性
    this.element.setAttribute('aria-valuenow', this.progress);
  }
  
  /**
   * 重置进度条
   */
  reset() {
    this.update(0);
    this.type = null;
    this.element.classList.remove('upload', 'download');
  }
}
