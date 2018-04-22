var util = require('../../utils/util.js');
var Request = require("../../requests/request.js");
var app = getApp();

var windowWidth = 375;

Page({
  data: {
    state: 4,  // 4待评价订单，5已评价订单，6已取消订单
    mechanicImg: null,
    mechanicName: null,
    mechanicScore: '5.0',
    orderPrice: '0',
    orderScore: 0,
    cancelReason: null
  },
  onLoad: function(option) {
    var data = JSON.parse(option.data);
    this.setData({
      state: data.state,
      mechanicImg: data.mechanicImg,
      mechanicName: data.mechanicName,
      mechanicScore: data.mechanicScore,
      orderPrice: data.orderPrice||'0',
      orderScore: data.orderScore||0,
      cancelReason: data.cancelReason||null
    });
    wx.getSystemInfo({
      success: res => {
        windowWidth = res.windowWidth;
      }
    });
  },
  changeScore: function(event) {
    var totalWidth = 215, left = (windowWidth - totalWidth) / 2;
    var deltaX = event.changedTouches[0].pageX - left;
    var score = parseInt(deltaX / 43) + 1;
    score = score<1?1:(score>5?5:score);
    if (this.data.orderScore != score) {
      this.setData({
        orderScore: score
      });
    }
  },
  callCustomerService: function() {
    util.callCustomerService();
  },
  submitComment:function() {
    Request.requestScoring(app.globalData.orderId, this.data.orderScore, data => {
      switch (data.state) {
        case '-1':
          util.backHomeTip('未找到该订单, 请重新下单!');
          break;
        case '1':
          util.showToast('评价成功');
          this.setData({
            state: 5
          });
          break;
        case '-2':
        case '0':
        default:
          util.showModal('提示', '订单状态异常!', null, '刷新', res => {
            if (res.confirm) { app.processOrder(); }
          });
          break;
      }
    });
  },
  backHome: function() {
    util.backHome();
  }
  
})