/**
 * 服务端配置文件
 */

module.exports = {
  // 服务器配置
  server: {
    port: 3000,
    host: '0.0.0.0', // 监听所有网络接口
  },
  
  // 测速配置
  speedTest: {
    // 上传测试持续时间（毫秒）
    uploadTestDuration: 10000,
    
    // 下载测试持续时间（毫秒）
    downloadTestDuration: 10000,
    
    // 数据块大小（字节）- 1MB
    chunkSize: 1048576,
    
    // 最大速度（MB/s）- 用于仪表盘显示
    maxSpeed: 125,
    
    // 测速更新间隔（毫秒）
    updateInterval: 100,
    
    // 测试数据生成方法: 'zero', 'random'
    dataGenerationMethod: 'zero'
  },
  
  // 客户端配置
  client: {
    // 客户端文件路径（相对于服务器根目录）
    path: '../client',
    
    // 自动托管客户端网页
    autoHost: true
  },
  
  // 日志配置
  logging: {
    level: 'info',
    filename: 'speedtest-server.log'
  }
};
