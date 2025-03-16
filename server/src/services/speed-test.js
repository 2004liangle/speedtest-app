/**
 * 测速服务
 */

const { EventEmitter } = require('events');
const config = require('../config/config');
const logger = require('../utils/logger');
const { calculateSpeed, createSlidingWindowCalculator } = require('../utils/speed-calculator');
const { createChunkGenerator } = require('./data-generator');
const clientManager = require('./client-manager');

class SpeedTest extends EventEmitter {
  constructor() {
    super();
    
    // 存储活跃测试
    this.activeTests = new Map();
  }
  
  /**
   * 开始上传测试（客户端 -> 服务端）
   * @param {Object} socket - Socket.io连接
   * @param {string} testId - 测试ID
   */
  startUploadTest(socket, testId) {
    const socketId = socket.id;
    const client = clientManager.getClient(socketId);
    
    if (!client) {
      logger.error(`无法开始上传测试: 客户端不存在 (${socketId})`);
      return;
    }
    
    logger.info(`开始上传测试: ${socketId} (${client.info.ip}), testId: ${testId}`);
    clientManager.updateClientStatus(socketId, 'testing-upload');
    
    // 创建测试状态对象
    const testState = {
      id: testId,
      type: 'upload',
      startTime: Date.now(),
      endTime: null,
      bytesReceived: 0,
      chunks: 0,
      lastUpdateTime: Date.now(),
      calculator: createSlidingWindowCalculator(),
      intervalId: null,
      results: {
        averageSpeed: 0,
        maxSpeed: 0,
        minSpeed: Infinity,
        duration: 0
      }
    };
    
    this.activeTests.set(testId, testState);
    
    // 设置超时，确保测试最终会结束
    const testTimeout = setTimeout(() => {
      this.endUploadTest(socket, testId);
    }, config.speedTest.uploadTestDuration + 5000); // 额外5秒容错
    
    testState.testTimeout = testTimeout;
    
    // 设置定期更新
    testState.intervalId = setInterval(() => {
      this.updateTestProgress(socket, testState);
    }, config.speedTest.updateInterval);
    
    // 通知客户端开始发送数据
    socket.emit('upload_start', { testId });
    
    // 处理上传数据
    socket.on('upload_data', (data) => {
      if (!this.activeTests.has(testId)) return;
      
      const test = this.activeTests.get(testId);
      const now = Date.now();
      const chunkSize = data.data.length;
      
      // 更新测试状态
      test.bytesReceived += chunkSize;
      test.chunks++;
      
      // 计算这个块的速度
      const timeDiff = now - test.lastUpdateTime;
      if (timeDiff > 0) {
        const speed = calculateSpeed(chunkSize, timeDiff);
        test.calculator.addDataPoint(chunkSize, timeDiff);
        
        // 更新最大/最小速度
        test.results.maxSpeed = Math.max(test.results.maxSpeed, speed);
        test.results.minSpeed = Math.min(test.results.minSpeed, speed);
      }
      
      test.lastUpdateTime = now;
      
      // 确认接收
      socket.emit('upload_ack', { 
        testId, 
        chunkId: data.chunkId,
        receivedAt: now
      });
      
      // 检查是否应该结束测试
      if (now - test.startTime >= config.speedTest.uploadTestDuration) {
        this.endUploadTest(socket, testId);
      }
    });
  }
  
  /**
   * 结束上传测试
   * @param {Object} socket - Socket.io连接
   * @param {string} testId - 测试ID
   */
  endUploadTest(socket, testId) {
    if (!this.activeTests.has(testId)) return;
    
    const test = this.activeTests.get(testId);
    const socketId = socket.id;
    const client = clientManager.getClient(socketId);
    
    if (!client) {
      logger.error(`无法结束上传测试: 客户端不存在 (${socketId})`);
      return;
    }
    
    // 清理定时器
    clearInterval(test.intervalId);
    clearTimeout(test.testTimeout);
    
    // 计算最终结果
    test.endTime = Date.now();
    test.results.duration = test.endTime - test.startTime;
    test.results.averageSpeed = calculateSpeed(test.bytesReceived, test.results.duration);
    
    // 如果没有记录到最小速度，设为0
    if (test.results.minSpeed === Infinity) {
      test.results.minSpeed = 0;
    }
    
    logger.info(`上传测试完成: ${socketId} (${client.info.ip}), testId: ${testId}, 平均速度: ${test.results.averageSpeed.toFixed(2)} MB/s`);
    
    // 存储测试结果
    clientManager.storeTestResult(socketId, 'upload', test.results);
    
    // 通知客户端测试结束
    socket.emit('test_result', {
      testId,
      type: 'upload',
      result: test.results
    });
    
    // 更新客户端状态
    clientManager.updateClientStatus(socketId, 'connected');
    
    // 移除测试状态
    this.activeTests.delete(testId);
    
    // 移除事件监听器
    socket.removeAllListeners('upload_data');
  }
  
  /**
   * 开始下载测试（服务端 -> 客户端）
   * @param {Object} socket - Socket.io连接
   * @param {string} testId - 测试ID
   */
  startDownloadTest(socket, testId) {
    const socketId = socket.id;
    const client = clientManager.getClient(socketId);
    
    if (!client) {
      logger.error(`无法开始下载测试: 客户端不存在 (${socketId})`);
      return;
    }
    
    logger.info(`开始下载测试: ${socketId} (${client.info.ip}), testId: ${testId}`);
    clientManager.updateClientStatus(socketId, 'testing-download');
    
    // 计算测试数据大小 - 假设125MB/s的最大速度，10秒测试，需要约1.25GB数据
    // 但我们不需要一次性生成所有数据，而是按需生成
    const estimatedTotalBytes = config.speedTest.maxSpeed * 1048576 * (config.speedTest.downloadTestDuration / 1000) * 1.5;
    
    // 创建数据块生成器
    const chunkGenerator = createChunkGenerator(
      estimatedTotalBytes,
      config.speedTest.chunkSize
    );
    
    // 创建测试状态对象
    const testState = {
      id: testId,
      type: 'download',
      startTime: Date.now(),
      endTime: null,
      bytesSent: 0,
      chunks: 0,
      lastUpdateTime: Date.now(),
      calculator: createSlidingWindowCalculator(),
      chunkGenerator,
      intervalId: null,
      sendingChunk: false,
      results: {
        averageSpeed: 0,
        maxSpeed: 0,
        minSpeed: Infinity,
        duration: 0
      }
    };
    
    this.activeTests.set(testId, testState);
    
    // 设置超时，确保测试最终会结束
    const testTimeout = setTimeout(() => {
      this.endDownloadTest(socket, testId);
    }, config.speedTest.downloadTestDuration + 5000); // 额外5秒容错
    
    testState.testTimeout = testTimeout;
    
    // 设置定期更新
    testState.intervalId = setInterval(() => {
      this.updateTestProgress(socket, testState);
    }, config.speedTest.updateInterval);
    
    // 通知客户端开始接收数据
    socket.emit('download_start', { testId });
    
    // 处理下载确认
    socket.on('download_ack', (data) => {
      if (!this.activeTests.has(testId)) return;
      
      const test = this.activeTests.get(testId);
      const now = Date.now();
      
      // 计算这个块的速度
      const timeDiff = now - test.lastUpdateTime;
      if (timeDiff > 0) {
        const speed = calculateSpeed(config.speedTest.chunkSize, timeDiff);
        test.calculator.addDataPoint(config.speedTest.chunkSize, timeDiff);
        
        // 更新最大/最小速度
        test.results.maxSpeed = Math.max(test.results.maxSpeed, speed);
        test.results.minSpeed = Math.min(test.results.minSpeed, speed);
      }
      
      test.lastUpdateTime = now;
      test.sendingChunk = false;
      
      // 检查是否应该结束测试
      if (now - test.startTime >= config.speedTest.downloadTestDuration) {
        this.endDownloadTest(socket, testId);
      } else {
        // 继续发送下一个块
        this.sendNextChunk(socket, test);
      }
    });
    
    // 开始发送第一个块
    this.sendNextChunk(socket, testState);
  }
  
  /**
   * 发送下一个数据块
   * @param {Object} socket - Socket.io连接
   * @param {Object} test - 测试状态对象
   */
  sendNextChunk(socket, test) {
    if (test.sendingChunk) return;
    
    test.sendingChunk = true;
    
    // 获取下一个数据块
    const chunk = test.chunkGenerator.getNextChunk();
    if (!chunk) {
      this.endDownloadTest(socket, test.id);
      return;
    }
    
    // 更新测试状态
    test.bytesSent += chunk.length;
    test.chunks++;
    
    // 发送数据块
    socket.emit('download_data', {
      testId: test.id,
      chunkId: test.chunks,
      data: chunk
    });
  }
  
  /**
   * 结束下载测试
   * @param {Object} socket - Socket.io连接
   * @param {string} testId - 测试ID
   */
  endDownloadTest(socket, testId) {
    if (!this.activeTests.has(testId)) return;
    
    const test = this.activeTests.get(testId);
    const socketId = socket.id;
    const client = clientManager.getClient(socketId);
    
    if (!client) {
      logger.error(`无法结束下载测试: 客户端不存在 (${socketId})`);
      return;
    }
    
    // 清理定时器
    clearInterval(test.intervalId);
    clearTimeout(test.testTimeout);
    
    // 计算最终结果
    test.endTime = Date.now();
    test.results.duration = test.endTime - test.startTime;
    test.results.averageSpeed = calculateSpeed(test.bytesSent, test.results.duration);
    
    // 如果没有记录到最小速度，设为0
    if (test.results.minSpeed === Infinity) {
      test.results.minSpeed = 0;
    }
    
    logger.info(`下载测试完成: ${socketId} (${client.info.ip}), testId: ${testId}, 平均速度: ${test.results.averageSpeed.toFixed(2)} MB/s`);
    
    // 存储测试结果
    clientManager.storeTestResult(socketId, 'download', test.results);
    
    // 通知客户端测试结束
    socket.emit('test_result', {
      testId,
      type: 'download',
      result: test.results
    });
    
    // 更新客户端状态
    clientManager.updateClientStatus(socketId, 'connected');
    
    // 移除测试状态
    this.activeTests.delete(testId);
    
    // 移除事件监听器
    socket.removeAllListeners('download_ack');
  }
  
  /**
   * 更新测试进度
   * @param {Object} socket - Socket.io连接
   * @param {Object} test - 测试状态对象
   */
  updateTestProgress(socket, test) {
    const now = Date.now();
    const elapsed = now - test.startTime;
    const progress = Math.min(100, (elapsed / (test.type === 'upload' ? config.speedTest.uploadTestDuration : config.speedTest.downloadTestDuration)) * 100);
    
    // 计算当前速度
    const currentSpeed = test.calculator.getAverageSpeed();
    
    // 发送进度更新
    socket.emit('test_progress', {
      testId: test.id,
      type: test.type,
      progress,
      currentSpeed,
      bytesTransferred: test.type === 'upload' ? test.bytesReceived : test.bytesSent
    });
  }
}

// 创建单例实例
const speedTest = new SpeedTest();

module.exports = speedTest;
