var util = require('../../utils/util.js');
var Request = require("../../requests/request.js");
var app = getApp();

var timer;

Page({
  data: {
    orderId: null,
    countdown: '05:00.00',
    progressDecimal: 1,
    showDialog: false
  },
  onLoad: function(option) {
    var orderTime = parseInt(option.orderTime);
    var timeDelta = parseInt(option.timeDelta); // 客户端与服务器的时间差（客户端 - 服务器）
    const totalTime = 300*1000;
    timer = setInterval(() => {
      var countdownTime = totalTime - (Date.now() - timeDelta - orderTime);
      if (countdownTime <= 0 && !this.data.showDialog) {
        this.setData({
          countdown: '00:00.00',
          progressDecimal: 0,
          showDialog: true
        });
        clearInterval(timer);
        return;
      }
      var minute = parseInt(countdownTime/60000);
	    var second = parseInt((countdownTime%60000)/1000);
	    var centisecond = parseInt((countdownTime%1000)/10);
      this.setData({
        orderId: app.globalData.orderId,
        countdown: util.formatNumber(minute)+':'+util.formatNumber(second)+'.'+util.formatNumber(centisecond),
        progressDecimal: countdownTime/totalTime
      });
    }, 30);
  },
  onShow: function() {
    var orderTempUrlData = app.globalData.orderTempUrlData;
    if (orderTempUrlData && Date.now() - orderTempUrlData.saveTime < 3000) {
      app.globalData.orderTempUrlData = null;
      wx.redirectTo({ url: orderTempUrlData.url });
    } else if (app.globalData.orderState > 0) {
      app.processOrder();
    }
  },
  onUnload: function() {
    clearInterval(timer);
  },
  cancelOrderTip: function() {
    wx.showModal({
      title: '取消订单',
      content: '是否取消订单?',
      confirmText: '取消',
      confirmColor: '#000000',
      cancelText: '确定',
      success: res => {
        if (!res.confirm) {
          this.cancelOrder();
        }
      }
    });
  },
  cancelOrder: function() {
    this.setData({
      showDialog: false
    });
    Request.requestCancel(app.globalData.orderId, null, data => {
      switch (data.state) {
        case '-1':
          util.backHomeTip('未找到该订单, 请重新下单!');
          break;
        case '1':
          app.globalData.orderId = null;
          clearInterval(timer);
          this.setData({
            countdown: '订单已取消',
          });
          setTimeout(() => { util.showToast('订单已取消', 1100, true) }, 400);
          setTimeout(() => { util.backHome() }, 1500);
          break;
        case '2':
        case '3':
        default:
          util.showModal('提示', '订单状态异常!', null, '刷新', res => {
            if (res.confirm) { app.processOrder(); }
          });
          break;
      }
    }, () => {
      util.showModal('提示', '取消订单失败, 请重试!', null, '确定');
    });
  },
  callCustomerService: function() {
    this.setData({
      showDialog: false
    });
    util.callCustomerService(function() {
      wx.navigateBack({
        delta: 1
      });
    });
  },

})