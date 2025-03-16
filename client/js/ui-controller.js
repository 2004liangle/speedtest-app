/**
 * UI控制器
 */

class UIController {
  constructor() {
    // DOM元素
    this.elements = {
      // 连接区域
      serverAddress: document.getElementById('serverAddress'),
      connectBtn: document.getElementById('connectBtn'),
      connectionIndicator: document.getElementById('connectionIndicator'),
      connectionStatus: document.getElementById('connectionStatus'),
      
      // 测试控制
      startTestBtn: document.getElementById('startTestBtn'),
      stopTestBtn: document.getElementById('stopTestBtn'),
      testTypeRadios: document.getElementsByName('testType'),
      
      // 测试状态
      testStatus: document.getElementById('testStatus'),
      testTime: document.getElementById('testTime'),
      currentSpeed: document.getElementById('currentSpeed'),
      
      // 测试结果
      uploadResult: document.getElementById('uploadResult'),
      downloadResult: document.getElementById('downloadResult'),
      resultDetails: document.getElementById('resultDetails')
    };
    
    // 测试计时器
    this.testTimer = null;
    this.testStartTime = null;
    
    // 速度更新计时器
    this.speedUpdateTimer = null;
    
    // 绑定事件
    this.bindEvents();
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 连接按钮
    this.elements.connectBtn.addEventListener('click', () => {
      this.handleConnectClick();
    });
    
    // 服务器地址输入框回车键
    this.elements.serverAddress.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleConnectClick();
      }
    });
    
    // 开始测试按钮
    this.elements.startTestBtn.addEventListener('click', () => {
      this.handleStartTestClick();
    });
    
    // 停止测试按钮
    this.elements.stopTestBtn.addEventListener('click', () => {
      this.handleStopTestClick();
    });
    
    // 测速事件
    speedTest.on('test_start', (data) => {
      this.handleTestStart(data);
    });
    
    speedTest.on('upload_start', (data) => {
      this.handleUploadStart(data);
    });
    
    speedTest.on('download_start', (data) => {
      this.handleDownloadStart(data);
    });
    
    speedTest.on('download_prepare', (data) => {
      this.handleDownloadPrepare(data);
    });
    
    speedTest.on('progress_update', (data) => {
      this.handleProgressUpdate(data);
    });
    
    speedTest.on('speed_update', (data) => {
      this.handleSpeedUpdate(data);
    });
    
    speedTest.on('test_complete', (data) => {
      this.handleTestComplete(data);
    });
    
    // Socket连接事件
    socketClient.on('register', (data) => {
      this.updateConnectionStatus('connected');
    });
    
    socketClient.on('disconnect', (data) => {
      this.updateConnectionStatus('disconnected');
    });
  }
  
  /**
   * 处理连接按钮点击
   */
  handleConnectClick() {
    let serverAddress = this.elements.serverAddress.value.trim();
    
    if (!serverAddress) {
      alert('请输入服务器地址');
      return;
    }
    
    // 格式化服务器地址
    serverAddress = this.formatServerAddress(serverAddress);
    
    // 更新输入框显示完整地址
    this.elements.serverAddress.value = serverAddress;
    
    // 更新连接状态
    this.updateConnectionStatus('connecting');
    
    // 连接到服务器
    socketClient.connect(serverAddress)
      .then(() => {
        // 连接成功，状态更新由register事件处理
      })
      .catch((error) => {
        console.error('连接失败:', error);
        this.updateConnectionStatus('disconnected');
        alert(`连接失败: ${error.message || '未知错误'}`);
      });
  }
  
  /**
   * 格式化服务器地址
   * @param {string} address - 用户输入的地址
   * @returns {string} - 格式化后的完整地址
   */
  formatServerAddress(address) {
    // 默认端口
    const defaultPort = '3000';
    
    // 如果已经是完整URL，直接返回
    if (address.startsWith('http://') || address.startsWith('https://')) {
      // 检查是否包含端口
      if (!/:(\d+)$/.test(address.split('/')[2])) {
        // 没有端口，添加默认端口
        const parts = address.split('//');
        const hostPart = parts[1].split('/')[0];
        return `${parts[0]}//${hostPart}:${defaultPort}${parts[1].substring(hostPart.length)}`;
      }
      return address;
    }
    
    // 检查是否只有IP或主机名
    if (!address.includes(':')) {
      // 没有端口，添加默认端口
      address = `${address}:${defaultPort}`;
    }
    
    // 添加协议
    if (!address.includes('://')) {
      address = `http://${address}`;
    }
    
    return address;
  }
  
  /**
   * 更新连接状态
   * @param {string} status - 连接状态 ('disconnected', 'connecting', 'connected')
   */
  updateConnectionStatus(status) {
    const { connectionIndicator, connectionStatus, startTestBtn } = this.elements;
    
    // 移除所有状态类
    connectionIndicator.classList.remove('connected', 'connecting');
    
    // 更新状态文本和类
    switch (status) {
      case 'connected':
        connectionStatus.textContent = '已连接';
        connectionIndicator.classList.add('connected');
        startTestBtn.disabled = false;
        break;
        
      case 'connecting':
        connectionStatus.textContent = '连接中...';
        connectionIndicator.classList.add('connecting');
        startTestBtn.disabled = true;
        break;
        
      case 'disconnected':
      default:
        connectionStatus.textContent = '未连接';
        startTestBtn.disabled = true;
        break;
    }
  }
  
  /**
   * 处理开始测试按钮点击
   */
  handleStartTestClick() {
    // 获取测试类型
    let testType = 'both';
    for (const radio of this.elements.testTypeRadios) {
      if (radio.checked) {
        testType = radio.value;
        break;
      }
    }
    
    // 更新UI
    this.elements.startTestBtn.disabled = true;
    this.elements.stopTestBtn.disabled = false;
    
    // 重置结果
    this.resetResults();
    
    // 开始测试
    speedTest.startTest(testType);
  }
  
  /**
   * 处理停止测试按钮点击
   */
  handleStopTestClick() {
    // 停止测试
    speedTest.stopTest();
    
    // 更新UI
    this.elements.startTestBtn.disabled = false;
    this.elements.stopTestBtn.disabled = true;
    
    // 停止计时器
    this.stopTestTimer();
    this.stopSpeedUpdateTimer();
    
    // 更新状态
    this.elements.testStatus.textContent = '已停止';
  }
  
  /**
   * 处理测试开始
   * @param {Object} data - 测试开始数据
   */
  handleTestStart(data) {
    // 更新状态
    this.elements.testStatus.textContent = '准备测试...';
    
    // 重置UI
    testProgress.reset();
    speedGauge.updateValue(0);
    speedChart.resetData();
    
    // 开始计时
    this.startTestTimer();
  }
  
  /**
   * 处理上传测试开始
   * @param {Object} data - 上传测试开始数据
   */
  handleUploadStart(data) {
    // 更新状态
    this.elements.testStatus.textContent = '上传测试中...';
    
    // 更新进度条类型
    testProgress.update(0, 'upload');
    
    // 更新图表类型
    speedChart.updateType('upload');
  }
  
  /**
   * 处理下载测试开始
   * @param {Object} data - 下载测试开始数据
   */
  handleDownloadStart(data) {
    // 更新状态
    this.elements.testStatus.textContent = '下载测试中...';
    
    // 更新进度条类型
    testProgress.update(0, 'download');
    
    // 更新图表类型
    speedChart.updateType('download');
  }
  
  /**
   * 处理下载准备
   * @param {Object} data - 下载准备数据
   */
  handleDownloadPrepare(data) {
    // 更新状态
    this.elements.testStatus.textContent = '准备下载测试...';
    
    // 重置进度条，但保持类型不变
    testProgress.update(0, 'download');
    
    // 重置速度显示
    this.updateSpeedDisplay(0);
  }
  
  /**
   * 处理进度更新
   * @param {Object} data - 进度更新数据
   */
  handleProgressUpdate(data) {
    // 更新进度条
    testProgress.update(data.progress, data.type);
    
    // 更新速度显示
    this.updateSpeedDisplay(data.speed);
    
    // 更新图表
    speedChart.addDataPoint(data.speed, data.type);
  }
  
  /**
   * 处理速度更新
   * @param {Object} data - 速度更新数据
   */
  handleSpeedUpdate(data) {
    // 更新速度显示
    this.updateSpeedDisplay(data.speed);
    
    // 更新图表
    speedChart.addDataPoint(data.speed, data.type);
  }
  
  /**
   * 处理测试完成
   * @param {Object} data - 测试完成数据
   */
  handleTestComplete(data) {
    // 停止计时器
    this.stopTestTimer();
    this.stopSpeedUpdateTimer();
    
    // 更新状态
    this.elements.testStatus.textContent = '测试完成';
    
    // 更新UI
    this.elements.startTestBtn.disabled = false;
    this.elements.stopTestBtn.disabled = true;
    
    // 更新结果
    this.updateResults(data);
  }
  
  /**
   * 开始测试计时器
   */
  startTestTimer() {
    // 重置计时
    this.testStartTime = Date.now();
    this.elements.testTime.textContent = '00:00';
    
    // 启动计时器
    this.testTimer = setInterval(() => {
      const elapsed = Date.now() - this.testStartTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
      this.elements.testTime.textContent = formattedTime;
    }, 1000);
  }
  
  /**
   * 停止测试计时器
   */
  stopTestTimer() {
    if (this.testTimer) {
      clearInterval(this.testTimer);
      this.testTimer = null;
    }
  }
  
  /**
   * 开始速度更新计时器
   */
  startSpeedUpdateTimer() {
    // 停止现有计时器
    this.stopSpeedUpdateTimer();
    
    // 启动新计时器
    this.speedUpdateTimer = setInterval(() => {
      // 获取当前速度
      const currentSpeed = speedTest.getCurrentSpeed();
      
      // 更新速度显示
      this.updateSpeedDisplay(currentSpeed);
    }, 200);
  }
  
  /**
   * 停止速度更新计时器
   */
  stopSpeedUpdateTimer() {
    if (this.speedUpdateTimer) {
      clearInterval(this.speedUpdateTimer);
      this.speedUpdateTimer = null;
    }
  }
  
  /**
   * 更新速度显示
   * @param {number} speed - 速度值 (MB/s)
   */
  updateSpeedDisplay(speed) {
    // 检查速度值是否有效
    if (isNaN(speed) || !isFinite(speed)) {
      console.warn('收到无效的速度值:', speed);
      speed = 0;
    }
    
    // 更新数字显示
    this.elements.currentSpeed.textContent = `${speed.toFixed(2)} MB/s`;
    
    // 更新仪表盘
    speedGauge.updateValue(speed);
  }
  
  /**
   * 重置结果
   */
  resetResults() {
    this.elements.uploadResult.textContent = '-- MB/s';
    this.elements.downloadResult.textContent = '-- MB/s';
    this.elements.resultDetails.innerHTML = '<p>测试中...</p>';
  }
  
  /**
   * 更新结果
   * @param {Object} data - 测试结果数据
   */
  updateResults(data) {
    const { uploadResult, downloadResult } = data;
    
    // 更新上传结果
    if (uploadResult) {
      this.elements.uploadResult.textContent = `${uploadResult.averageSpeed.toFixed(2)} MB/s`;
    }
    
    // 更新下载结果
    if (downloadResult) {
      this.elements.downloadResult.textContent = `${downloadResult.averageSpeed.toFixed(2)} MB/s`;
    }
    
    // 更新详细结果
    this.displayResultDetails(data);
  }
  
  /**
   * 显示测试结果详情
   * @param {Object} results - 测试结果
   */
  displayResultDetails(results) {
    const { uploadResult, downloadResult } = results;
    
    let detailsHtml = '<ul class="result-details-list">';
    
    // 添加上传结果
    if (uploadResult) {
      detailsHtml += `
        <li>上传速度: ${uploadResult.averageSpeed.toFixed(2)} MB/s</li>
        <li>上传最大速度: ${uploadResult.maxSpeed.toFixed(2)} MB/s</li>
        <li>上传最小速度: ${uploadResult.minSpeed.toFixed(2)} MB/s</li>
      `;
    }
    
    // 添加下载结果
    if (downloadResult) {
      detailsHtml += `
        <li>下载速度: ${downloadResult.averageSpeed.toFixed(2)} MB/s</li>
        <li>下载最大速度: ${downloadResult.maxSpeed.toFixed(2)} MB/s</li>
        <li>下载最小速度: ${downloadResult.minSpeed.toFixed(2)} MB/s</li>
      `;
    }
    
    detailsHtml += `<li>测试完成时间: ${new Date().toLocaleString()}</li>`;
    detailsHtml += '</ul>';
    
    this.elements.resultDetails.innerHTML = detailsHtml;
  }
}
