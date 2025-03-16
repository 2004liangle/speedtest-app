/**
 * 测速功能
 */

class SpeedTest {
  constructor() {
    this.isRunning = false;
    this.testType = null;
    this.testId = null;
    this.startTime = null;
    this.endTime = null;
    this.uploadResult = null;
    this.downloadResult = null;
    this.currentSpeed = 0;
    this.progress = 0;
    this.eventHandlers = {};
    
    // 上传测试状态
    this.uploadState = {
      chunkId: 0,
      bytesSent: 0,
      lastUpdateTime: 0,
      buffer: null
    };
    
    // 下载测试状态
    this.downloadState = {
      chunkId: 0,
      bytesReceived: 0,
      lastUpdateTime: 0
    };
    
    // 绑定Socket.io事件
    this.bindSocketEvents();
  }
  
  /**
   * 绑定Socket.io事件
   */
  bindSocketEvents() {
    // 上传开始
    socketClient.on('upload_start', (data) => {
      this.handleUploadStart(data);
    });
    
    // 上传确认
    socketClient.on('upload_ack', (data) => {
      this.handleUploadAck(data);
    });
    
    // 下载开始
    socketClient.on('download_start', (data) => {
      this.handleDownloadStart(data);
    });
    
    // 下载数据
    socketClient.on('download_data', (data) => {
      this.handleDownloadData(data);
    });
    
    // 测试进度
    socketClient.on('test_progress', (data) => {
      this.handleTestProgress(data);
    });
    
    // 测试结果
    socketClient.on('test_result', (data) => {
      this.handleTestResult(data);
    });
  }
  
  /**
   * 开始测试
   * @param {string} type - 测试类型 ('upload', 'download', 'both')
   */
  startTest(type) {
    if (this.isRunning) {
      this.stopTest();
    }
    
    this.isRunning = true;
    this.testType = type;
    this.startTime = Date.now();
    this.endTime = null;
    this.uploadResult = null;
    this.downloadResult = null;
    this.currentSpeed = 0;
    this.progress = 0;
    
    // 重置测试状态
    this.resetTestState();
    
    // 触发测试开始事件
    this.triggerEvent('test_start', { type });
    
    // 发送测试请求
    socketClient.startTest(type);
  }
  
  /**
   * 停止测试
   */
  stopTest() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.endTime = Date.now();
    
    // 触发测试停止事件
    this.triggerEvent('test_stop', {
      type: this.testType,
      duration: this.endTime - this.startTime
    });
    
    // 重置测试状态
    this.resetTestState();
  }
  
  /**
   * 重置测试状态
   */
  resetTestState() {
    // 重置上传状态
    this.uploadState = {
      chunkId: 0,
      bytesSent: 0,
      lastUpdateTime: 0,
      buffer: null
    };
    
    // 重置下载状态
    this.downloadState = {
      chunkId: 0,
      bytesReceived: 0,
      lastUpdateTime: 0
    };
  }
  
  /**
   * 处理上传开始
   * @param {Object} data - 上传开始数据
   */
  handleUploadStart(data) {
    console.log('上传测试开始:', data);
    
    this.testId = data.testId;
    this.uploadState.lastUpdateTime = Date.now();
    
    // 触发上传开始事件
    this.triggerEvent('upload_start', data);
    
    // 生成测试数据
    this.generateTestData();
    
    // 开始发送数据
    this.sendNextChunk();
  }
  
  /**
   * 生成测试数据
   */
  generateTestData() {
    // 生成1MB的测试数据
    const chunkSize = 1024 * 1024; // 1MB
    this.uploadState.buffer = new ArrayBuffer(chunkSize);
    
    // 填充随机数据
    const view = new Uint8Array(this.uploadState.buffer);
    for (let i = 0; i < chunkSize; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
  }
  
  /**
   * 发送下一个数据块
   */
  sendNextChunk() {
    if (!this.isRunning || !this.uploadState.buffer) return;
    
    // 增加块ID
    this.uploadState.chunkId++;
    
    // 发送数据
    socketClient.sendUploadData(
      this.testId,
      this.uploadState.chunkId,
      this.uploadState.buffer
    );
    
    // 更新发送字节数
    this.uploadState.bytesSent += this.uploadState.buffer.byteLength;
  }
  
  /**
   * 处理上传确认
   * @param {Object} data - 上传确认数据
   */
  handleUploadAck(data) {
    if (!this.isRunning || data.testId !== this.testId) return;
    
    // 计算速度
    const now = Date.now();
    const timeDiff = now - this.uploadState.lastUpdateTime;
    
    if (timeDiff > 0) {
      const bytesPerMs = this.uploadState.buffer.byteLength / timeDiff;
      const mbPerSec = (bytesPerMs * 1000) / (1024 * 1024);
      
      this.currentSpeed = mbPerSec;
      
      // 触发速度更新事件
      this.triggerEvent('speed_update', {
        type: 'upload',
        speed: mbPerSec
      });
    }
    
    this.uploadState.lastUpdateTime = now;
    
    // 继续发送下一个块
    this.sendNextChunk();
  }
  
  /**
   * 处理下载开始
   * @param {Object} data - 下载开始数据
   */
  handleDownloadStart(data) {
    console.log('下载测试开始:', data);
    
    this.testId = data.testId;
    this.downloadState.lastUpdateTime = Date.now();
    
    // 触发下载开始事件
    this.triggerEvent('download_start', data);
  }
  
  /**
   * 处理下载数据
   * @param {Object} data - 下载数据
   */
  handleDownloadData(data) {
    try {
      if (!this.isRunning) {
        console.log('收到下载数据，但测试未运行');
        return;
      }
      
      if (!data || !data.testId) {
        console.error('下载数据缺少testId:', data);
        return;
      }
      
      if (data.testId !== this.testId) {
        console.log('收到不匹配的testId:', data.testId, '当前testId:', this.testId);
        return;
      }
      
      // 确保data.data存在
      if (!data.data) {
        console.error('下载数据缺少data字段:', data);
        
        // 尝试发送确认以继续测试
        if (data.chunkId) {
          socketClient.sendDownloadAck(this.testId, data.chunkId);
        }
        return;
      }
      
      // 处理ArrayBuffer类型的数据
      let dataLength = 0;
      if (data.data instanceof ArrayBuffer) {
        dataLength = data.data.byteLength;
      } else if (typeof data.data.length === 'number') {
        dataLength = data.data.length;
      } else {
        console.warn('下载数据格式不标准，尝试继续处理:', data);
        dataLength = 0; // 假设长度为0，继续处理
      }
      
      // 更新接收字节数
      this.downloadState.bytesReceived += dataLength;
      this.downloadState.chunkId = data.chunkId;
      
      // 计算速度
      const now = Date.now();
      const timeDiff = now - this.downloadState.lastUpdateTime;
      
      if (timeDiff > 0 && dataLength > 0) {
        const bytesPerMs = dataLength / timeDiff;
        const mbPerSec = (bytesPerMs * 1000) / (1024 * 1024);
        
        // 确保速度值是有效的
        if (isNaN(mbPerSec) || !isFinite(mbPerSec)) {
          console.warn('计算出无效的速度值:', mbPerSec, '使用0代替');
          this.currentSpeed = 0;
        } else {
          this.currentSpeed = mbPerSec;
        }
        
        // 触发速度更新事件
        this.triggerEvent('speed_update', {
          type: 'download',
          speed: this.currentSpeed
        });
      }
      
      this.downloadState.lastUpdateTime = now;
      
      // 发送确认
      socketClient.sendDownloadAck(this.testId, data.chunkId);
    } catch (error) {
      console.error('处理下载数据时出错:', error);
      
      // 尝试发送确认以继续测试
      if (data && data.testId && data.chunkId) {
        socketClient.sendDownloadAck(data.testId, data.chunkId);
      }
    }
  }
  
  /**
   * 处理测试进度
   * @param {Object} data - 测试进度数据
   */
  handleTestProgress(data) {
    if (!this.isRunning || data.testId !== this.testId) return;
    
    this.progress = data.progress;
    this.currentSpeed = data.currentSpeed;
    
    // 触发进度更新事件
    this.triggerEvent('progress_update', {
      type: data.type,
      progress: data.progress,
      speed: data.currentSpeed
    });
  }
  
  /**
   * 处理测试结果
   * @param {Object} data - 测试结果数据
   */
  handleTestResult(data) {
    if (data.testId !== this.testId) return;
    
    console.log('测试结果:', data);
    
    // 存储结果
    if (data.type === 'upload') {
      this.uploadResult = data.result;
      
      // 如果是"both"类型测试，上传完成后自动开始下载测试
      if (this.testType === 'both' && !this.downloadResult) {
        console.log('上传测试完成，自动开始下载测试');
        
        // 短暂延迟后开始下载测试
        setTimeout(() => {
          // 重置测试状态
          this.resetTestState();
          
          // 触发下载开始事件（通知UI）
          this.triggerEvent('download_prepare', {});
          
          // 发送下载测试请求
          socketClient.startTest('download');
        }, 1000);
        
        return; // 不触发测试完成事件，等待下载测试完成
      }
    } else if (data.type === 'download') {
      this.downloadResult = data.result;
    }
    
    // 如果是单独的测试，或者两个测试都完成了，则结束测试
    if (this.testType === data.type || 
        (this.testType === 'both' && this.uploadResult && this.downloadResult)) {
      this.isRunning = false;
      this.endTime = Date.now();
      
      // 触发测试完成事件
      this.triggerEvent('test_complete', {
        type: this.testType,
        uploadResult: this.uploadResult,
        downloadResult: this.downloadResult,
        duration: this.endTime - this.startTime
      });
    }
  }
  
  /**
   * 添加事件处理器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(handler);
  }
  
  /**
   * 移除事件处理器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  off(event, handler) {
    if (!this.eventHandlers[event]) return;
    
    if (handler) {
      // 移除特定处理器
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    } else {
      // 移除所有处理器
      this.eventHandlers[event] = [];
    }
  }
  
  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {Object} data - 事件数据
   */
  triggerEvent(event, data) {
    if (!this.eventHandlers[event]) return;
    
    for (const handler of this.eventHandlers[event]) {
      handler(data);
    }
  }
  
  /**
   * 检查测试是否正在运行
   * @returns {boolean} - 是否正在运行
   */
  isTestRunning() {
    return this.isRunning;
  }
  
  /**
   * 获取当前速度
   * @returns {number} - 当前速度（MB/s）
   */
  getCurrentSpeed() {
    return this.currentSpeed;
  }
  
  /**
   * 获取测试进度
   * @returns {number} - 测试进度（0-100）
   */
  getProgress() {
    return this.progress;
  }
  
  /**
   * 获取测试结果
   * @returns {Object} - 测试结果
   */
  getResults() {
    return {
      upload: this.uploadResult,
      download: this.downloadResult
    };
  }
}
