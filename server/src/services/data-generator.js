/**
 * 测试数据生成器
 */

const config = require('../config/config');

/**
 * 生成指定大小的测试数据
 * @param {number} size - 数据大小（字节）
 * @param {string} method - 数据生成方法 ('zero' 或 'random')
 * @returns {Buffer} - 生成的数据缓冲区
 */
function generateTestData(size, method = config.speedTest.dataGenerationMethod) {
  // 创建指定大小的缓冲区
  const buffer = Buffer.alloc(size);
  
  // 根据指定方法填充数据
  if (method === 'random') {
    // 使用随机数据填充（CPU密集型操作，不推荐用于大数据量）
    for (let i = 0; i < size; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  } else {
    // 默认使用零填充（更高效）
    buffer.fill(0);
  }
  
  return buffer;
}

/**
 * 创建数据块生成器
 * @param {number} totalSize - 总数据大小（字节）
 * @param {number} chunkSize - 数据块大小（字节）
 * @param {string} method - 数据生成方法
 * @returns {Object} - 数据块生成器对象
 */
function createChunkGenerator(totalSize, chunkSize = config.speedTest.chunkSize, method = config.speedTest.dataGenerationMethod) {
  // 预生成一个数据块，所有块都使用相同的数据
  const chunkData = generateTestData(chunkSize, method);
  let bytesGenerated = 0;
  
  return {
    /**
     * 获取下一个数据块
     * @returns {Buffer|null} - 数据块或null（如果已生成完所有数据）
     */
    getNextChunk() {
      if (bytesGenerated >= totalSize) {
        return null;
      }
      
      // 计算剩余字节数
      const remaining = totalSize - bytesGenerated;
      
      // 如果剩余字节数小于块大小，返回剩余大小的块
      if (remaining < chunkSize) {
        bytesGenerated += remaining;
        return chunkData.slice(0, remaining);
      }
      
      // 否则返回完整大小的块
      bytesGenerated += chunkSize;
      return chunkData;
    },
    
    /**
     * 重置生成器
     */
    reset() {
      bytesGenerated = 0;
    },
    
    /**
     * 获取已生成的字节数
     * @returns {number} - 已生成的字节数
     */
    getBytesGenerated() {
      return bytesGenerated;
    },
    
    /**
     * 获取总数据大小
     * @returns {number} - 总数据大小（字节）
     */
    getTotalSize() {
      return totalSize;
    }
  };
}

module.exports = {
  generateTestData,
  createChunkGenerator
};
