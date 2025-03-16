/**
 * 速度图表组件
 */

class SpeedChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }
    
    // 默认选项
    this.options = {
      maxDataPoints: 60, // 最多显示60个数据点
      maxSpeed: 125,     // 最大速度125MB/s
      ...options
    };
    
    // 数据
    this.data = {
      labels: [],
      datasets: [
        {
          label: '速度 (MB/s)',
          data: [],
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }
      ]
    };
    
    // 初始化图表
    this.init();
  }
  
  /**
   * 初始化图表
   */
  init() {
    // 创建Chart.js实例
    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0 // 禁用动画以提高性能
        },
        scales: {
          x: {
            display: false, // 不显示X轴
            grid: {
              display: false // 不显示X轴网格线
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: '速度 (MB/s)'
            },
            min: 0,
            max: this.options.maxSpeed,
            ticks: {
              stepSize: 25
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} MB/s`;
              }
            }
          }
        }
      }
    });
    
    // 初始化数据
    this.resetData();
  }
  
  /**
   * 重置数据
   */
  resetData() {
    const { maxDataPoints } = this.options;
    
    // 清空数据
    this.data.labels = Array(maxDataPoints).fill('');
    this.data.datasets[0].data = Array(maxDataPoints).fill(null);
    
    // 更新图表
    this.chart.update();
  }
  
  /**
   * 添加数据点
   * @param {number} speed - 速度值 (MB/s)
   * @param {string} type - 测试类型 ('upload' 或 'download')
   */
  addDataPoint(speed, type = null) {
    const { maxDataPoints } = this.options;
    
    // 更新数据集颜色
    if (type) {
      if (type === 'upload') {
        this.data.datasets[0].borderColor = '#28a745'; // 绿色
        this.data.datasets[0].backgroundColor = 'rgba(40, 167, 69, 0.1)';
      } else if (type === 'download') {
        this.data.datasets[0].borderColor = '#17a2b8'; // 青色
        this.data.datasets[0].backgroundColor = 'rgba(23, 162, 184, 0.1)';
      }
    }
    
    // 移除第一个数据点
    this.data.datasets[0].data.shift();
    
    // 添加新数据点
    this.data.datasets[0].data.push(speed);
    
    // 更新标签（仅保持空标签，不显示时间）
    this.data.labels.shift();
    this.data.labels.push('');
    
    // 更新图表
    this.chart.update();
  }
  
  /**
   * 更新图表类型
   * @param {string} type - 测试类型 ('upload' 或 'download')
   */
  updateType(type) {
    if (type === 'upload') {
      this.data.datasets[0].borderColor = '#28a745'; // 绿色
      this.data.datasets[0].backgroundColor = 'rgba(40, 167, 69, 0.1)';
    } else if (type === 'download') {
      this.data.datasets[0].borderColor = '#17a2b8'; // 青色
      this.data.datasets[0].backgroundColor = 'rgba(23, 162, 184, 0.1)';
    } else {
      this.data.datasets[0].borderColor = '#007bff'; // 蓝色
      this.data.datasets[0].backgroundColor = 'rgba(0, 123, 255, 0.1)';
    }
    
    // 更新图表
    this.chart.update();
  }
}
