var util = require('../../utils/util.js');
var Request = require("../../requests/request.js");
var app = getApp();

Page({
  data: {
    orderId: null,
    mechanicImg: null,
    mechanicName: null,
    mechanicScore: '5.0',
    mechanicPhone: null,
    distance: '未知',
    cancelReason: [],
    underRepair: false
  },
  onLoad: function(option) {
    var data = JSON.parse(option.data);
    this.setData({
      orderId: app.globalData.orderId,
      mechanicImg: data.mechanicImg,
      mechanicName: data.mechanicName,
      mechanicScore: data.mechanicScore,
      mechanicPhone: data.mechanicPhone,
      distance: data.distance,
      cancelReason: data.cancelReason,
      underRepair: data.state != 1
    })
  },
  onShow: function() {
    var orderTempUrlData = app.globalData.orderTempUrlData;
    if (orderTempUrlData && Date.now() - orderTempUrlData.saveTime < 3000) {
      app.globalData.orderTempUrlData = null;
      wx.redirectTo({ url: orderTempUrlData.url });
    } else if ((!this.data.underRepair && app.globalData.orderState == 2) || app.globalData.orderState > 2) {
      app.processOrder();
    }
  },
  callMechanic: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.mechanicPhone
    });
  },
  callCustomerService: function() {
    util.callCustomerService();
  },
  cancelOrder: function(e) {
    Request.requestCancel(app.globalData.orderId, this.data.cancelReason[e.detail.value].id, data => {
      switch (data.state) {
        case '-1':
          util.backHomeTip('未找到该订单, 请重新下单!');
          break;
        case '1':
          app.processOrder();
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
  }

})