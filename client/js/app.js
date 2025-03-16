/**
 * 速度测试应用程序入口文件
 */

// 全局变量
let socketClient;
let speedTest;
let speedGauge;
let speedChart;
let testProgress;
let uiController;

/**
 * 初始化应用程序
 */
function initApp() {
  // 初始化Socket客户端
  socketClient = new SocketClient();
  
  // 初始化速度测试
  speedTest = new SpeedTest();
  
  // 初始化UI组件
  speedGauge = new SpeedGauge('speedGauge');
  speedChart = new SpeedChart('speedChart');
  testProgress = new ProgressBar('testProgress');
  
  // 初始化UI控制器
  uiController = new UIController();
  
  console.log('速度测试应用程序已初始化');
  
  // 自动连接到服务器
  autoConnectToServer();
}

/**
 * 自动连接到服务器
 */
function autoConnectToServer() {
  // 获取当前URL的主机名和端口
  const currentHost = window.location.hostname;
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
  
  // 构建服务器地址
  const serverAddress = `${protocol}${currentHost}:${currentPort}`;
  
  console.log(`尝试自动连接到服务器: ${serverAddress}`);
  
  // 设置服务器地址输入框
  const serverAddressInput = document.getElementById('serverAddress');
  if (serverAddressInput) {
    serverAddressInput.value = serverAddress;
  }
  
  // 延迟1秒后连接，确保UI已完全加载
  setTimeout(() => {
    // 如果UI控制器已初始化，使用它的连接方法
    if (uiController) {
      uiController.handleConnectClick();
    } else {
      // 直接使用Socket客户端连接
      socketClient.connect(serverAddress)
        .then(() => {
          console.log('自动连接成功');
        })
        .catch(error => {
          console.error('自动连接失败:', error);
        });
    }
  }, 1000);
}

// 在文档加载完成后初始化应用程序
document.addEventListener('DOMContentLoaded', initApp); 