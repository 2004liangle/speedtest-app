/**
 * 速度计算工具
 */

// 字节到MB的转换常量
const BYTES_TO_MB = 1048576; // 1MB = 1048576字节

/**
 * 计算传输速度（MB/s）
 * @param {number} bytes - 传输的字节数
 * @param {number} milliseconds - 传输所用的毫秒数
 * @returns {number} - 速度，单位为MB/s
 */
function calculateSpeed(bytes, milliseconds) {
  if (milliseconds === 0) return 0;
  
  // 转换为MB/s: (bytes / BYTES_TO_MB) / (milliseconds / 1000)
  return (bytes / BYTES_TO_MB) / (milliseconds / 1000);
}

/**
 * 创建一个滑动窗口速度计算器
 * @param {number} windowSize - 滑动窗口大小（数据点数量）
 * @returns {Object} - 滑动窗口速度计算器对象
 */
function createSlidingWindowCalculator(windowSize = 10) {
  const dataPoints = [];
  let totalBytes = 0;
  let totalTime = 0;
  
  return {
    /**
     * 添加一个数据点
     * @param {number} bytes - 传输的字节数
     * @param {number} milliseconds - 传输所用的毫秒数
     */
    addDataPoint(bytes, milliseconds) {
      // 添加新数据点
      dataPoints.push({ bytes, milliseconds });
      totalBytes += bytes;
      totalTime += milliseconds;
      
      // 如果超出窗口大小，移除最旧的数据点
      if (dataPoints.length > windowSize) {
        const removed = dataPoints.shift();
        totalBytes -= removed.bytes;
        totalTime -= removed.milliseconds;
      }
    },
    
    /**
     * 获取当前平均速度
     * @returns {number} - 平均速度，单位为MB/s
     */
    getAverageSpeed() {
      return calculateSpeed(totalBytes, totalTime);
    },
    
    /**
     * 重置计算器
     */
    reset() {
      dataPoints.length = 0;
      totalBytes = 0;
      totalTime = 0;
    }
  };
}

module.exports = {
  calculateSpeed,
  createSlidingWindowCalculator
};
