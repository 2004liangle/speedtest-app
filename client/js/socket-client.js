/**
 * Socket.io客户端
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.serverAddress = '';
    this.clientId = null;
    this.eventHandlers = {};
  }
  
  /**
   * 连接到服务器
   * @param {string} serverAddress - 服务器地址
   * @returns {Promise} - 连接结果Promise
   */
  connect(serverAddress) {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        this.disconnect();
      }
      
      this.serverAddress = serverAddress;
      
      try {
        // 创建Socket.io连接
        this.socket = io(serverAddress, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 5000
        });
        
        // 连接事件
        this.socket.on('connect', () => {
          console.log('已连接到服务器');
          this.connected = true;
          
          // 注册客户端
          this.register();
          
          resolve();
        });
        
        // 连接错误
        this.socket.on('connect_error', (error) => {
          console.error('连接错误:', error);
          reject(error);
        });
        
        // 断开连接
        this.socket.on('disconnect', (reason) => {
          console.log('与服务器断开连接:', reason);
          this.connected = false;
          
          // 触发断开连接事件
          this.triggerEvent('disconnect', { reason });
        });
        
        // 注册确认
        this.socket.on('register_ack', (data) => {
          console.log('注册确认:', data);
          this.clientId = data.clientId;
          
          // 触发注册事件
          this.triggerEvent('register', data);
        });
        
        // 测试进度
        this.socket.on('test_progress', (data) => {
          // 触发测试进度事件
          this.triggerEvent('test_progress', data);
        });
        
        // 测试结果
        this.socket.on('test_result', (data) => {
          // 触发测试结果事件
          this.triggerEvent('test_result', data);
        });
        
        // 上传开始
        this.socket.on('upload_start', (data) => {
          // 触发上传开始事件
          this.triggerEvent('upload_start', data);
        });
        
        // 上传确认
        this.socket.on('upload_ack', (data) => {
          // 触发上传确认事件
          this.triggerEvent('upload_ack', data);
        });
        
        // 下载开始
        this.socket.on('download_start', (data) => {
          // 触发下载开始事件
          this.triggerEvent('download_start', data);
        });
        
        // 下载数据
        this.socket.on('download_data', (data) => {
          // 确保数据格式正确
          if (!data) {
            console.error('收到无效的下载数据:', data);
            return;
          }
          
          if (!data.testId || !data.chunkId) {
            console.error('下载数据缺少必要字段:', data);
            return;
          }
          
          // 检查data字段
          if (!data.data) {
            console.error('下载数据缺少data字段:', data);
            // 尝试发送确认以继续测试
            this.sendDownloadAck(data.testId, data.chunkId);
            return;
          }
          
          // 触发下载数据事件
          this.triggerEvent('download_data', data);
        });
        
        // 错误
        this.socket.on('error', (data) => {
          console.error('服务器错误:', data);
          
          // 触发错误事件
          this.triggerEvent('error', data);
        });
      } catch (error) {
        console.error('创建Socket连接失败:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.clientId = null;
    }
  }
  
  /**
   * 注册客户端
   */
  register() {
    if (!this.connected || !this.socket) return;
    
    // 获取客户端信息
    const clientInfo = {
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString(),
      // 不再提示用户输入用户名
      computerName: this.getComputerName()
    };
    
    this.socket.emit('register', clientInfo);
  }
  
  /**
   * 尝试获取电脑名称
   * @returns {string} - 电脑名称
   */
  getComputerName() {
    // 由于浏览器安全限制，无法直接获取操作系统的计算机名
    // 可以尝试从一些环境变量或其他方式推断
    
    // 尝试从userAgent中提取信息
    const ua = navigator.userAgent;
    let computerInfo = '';
    
    // 检测设备类型
    let deviceType = '未知设备';
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)) {
      if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        deviceType = '平板';
      } else {
        deviceType = '手机';
      }
    } else {
      deviceType = '电脑';
    }
    
    // 检测操作系统
    let osInfo = '未知系统';
    if (ua.indexOf('Windows') !== -1) {
      const match = ua.match(/Windows NT (\d+\.\d+)/);
      let version = match ? match[1] : '';
      
      // 转换Windows NT版本号为常见名称
      switch (version) {
        case '10.0': osInfo = 'Windows 10/11'; break;
        case '6.3': osInfo = 'Windows 8.1'; break;
        case '6.2': osInfo = 'Windows 8'; break;
        case '6.1': osInfo = 'Windows 7'; break;
        case '6.0': osInfo = 'Windows Vista'; break;
        case '5.2': osInfo = 'Windows XP x64'; break;
        case '5.1': osInfo = 'Windows XP'; break;
        default: osInfo = `Windows (NT ${version})`;
      }
    } else if (ua.indexOf('Mac') !== -1) {
      osInfo = 'macOS';
      const match = ua.match(/Mac OS X ([0-9_]+)/);
      if (match) {
        osInfo += ` ${match[1].replace(/_/g, '.')}`;
      }
    } else if (ua.indexOf('Linux') !== -1) {
      osInfo = 'Linux';
      if (ua.indexOf('Android') !== -1) {
        const match = ua.match(/Android (\d+(\.\d+)*)/);
        osInfo = match ? `Android ${match[1]}` : 'Android';
      }
    } else if (ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1 || ua.indexOf('iPod') !== -1) {
      osInfo = 'iOS';
      const match = ua.match(/OS (\d+(_\d+)*)/);
      if (match) {
        osInfo += ` ${match[1].replace(/_/g, '.')}`;
      }
    }
    
    // 添加浏览器信息
    let browserInfo = '未知浏览器';
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1 && ua.indexOf('OPR') === -1) {
      const match = ua.match(/Chrome\/(\d+\.\d+)/);
      browserInfo = match ? `Chrome ${match[1]}` : 'Chrome';
    } else if (ua.indexOf('Firefox') !== -1) {
      const match = ua.match(/Firefox\/(\d+\.\d+)/);
      browserInfo = match ? `Firefox ${match[1]}` : 'Firefox';
    } else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) {
      const match = ua.match(/Safari\/(\d+\.\d+)/);
      browserInfo = match ? `Safari ${match[1]}` : 'Safari';
    } else if (ua.indexOf('Edg') !== -1) {
      const match = ua.match(/Edg\/(\d+\.\d+)/);
      browserInfo = match ? `Edge ${match[1]}` : 'Edge';
    } else if (ua.indexOf('OPR') !== -1) {
      const match = ua.match(/OPR\/(\d+\.\d+)/);
      browserInfo = match ? `Opera ${match[1]}` : 'Opera';
    } else if (ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident') !== -1) {
      const match = ua.match(/MSIE (\d+\.\d+)/);
      browserInfo = match ? `IE ${match[1]}` : 'IE';
      if (ua.indexOf('Trident') !== -1 && !match) {
        browserInfo = 'IE 11';
      }
    }
    
    // 组合信息
    computerInfo = `${deviceType} - ${osInfo} - ${browserInfo}`;
    
    // 添加屏幕分辨率
    computerInfo += ` (${window.screen.width}x${window.screen.height})`;
    
    return computerInfo;
  }
  
  /**
   * 开始测试
   * @param {string} type - 测试类型 ('upload', 'download', 'both')
   */
  startTest(type) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('test_start', { type });
  }
  
  /**
   * 发送上传数据
   * @param {string} testId - 测试ID
   * @param {number} chunkId - 数据块ID
   * @param {ArrayBuffer} data - 数据
   */
  sendUploadData(testId, chunkId, data) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('upload_data', {
      testId,
      chunkId,
      data
    });
  }
  
  /**
   * 发送下载确认
   * @param {string} testId - 测试ID
   * @param {number} chunkId - 数据块ID
   */
  sendDownloadAck(testId, chunkId) {
    if (!this.connected || !this.socket) return;
    
    this.socket.emit('download_ack', {
      testId,
      chunkId,
      receivedAt: Date.now()
    });
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
   * 检查是否已连接
   * @returns {boolean} - 是否已连接
   */
  isConnected() {
    return this.connected;
  }
}

// 移除全局变量声明，由app.js统一管理
