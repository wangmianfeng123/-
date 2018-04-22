var util = require('../../utils/util.js'); 
var Request = require("../../requests/request.js");
var app = getApp();

Page({
  data: {
    orderId: null,
    goods: [],
    orderTotal: 0,
    couponDiscount: null,
    orderPrice: 0,
    scrollViewHeight: 'auto'
  },
  onLoad: function(options){
    var data = JSON.parse(options.data);
    this.setData({
      orderId: app.globalData.orderId,
      goods: data.goods,
      orderTotal: data.orderTotal,
      couponDiscount: data.couponDiscount,
      orderPrice: data.orderPrice
    })
    layoutScrollView.call(this, data.goods);
  },
  onShow: function() {
    var orderTempUrlData = app.globalData.orderTempUrlData;
    if (orderTempUrlData && Date.now() - orderTempUrlData.saveTime < 3000) {
      app.globalData.orderTempUrlData = null;
      wx.redirectTo({ url: orderTempUrlData.url });
    } else if (app.globalData.orderState != 7 && app.globalData.orderState != 3) {
      app.processOrder();
    }
  },
  callCustomerService: function() {
    util.callCustomerService();
  },
  sureOrder: function() {
    if (app.globalData.orderState == 7) {
      Request.requestOrderSure(app.globalData.orderId, data => {
        switch (data.state) {
          case '-1':
            util.backHomeTip('未找到该订单, 请重新下单!');
            break;
          case '1':
            app.globalData.orderState = 3;
            unifiedOrder();
            break;
          case '-2':
          case '0':
          default:
            util.showModal('提示', '订单状态异常!', null, '刷新', res => {
              if (res.confirm) { app.processOrder(); }
            });
            break;
        }
      }, () => {
        util.showModal('提示', '确认订单失败, 请重试!', null, '确定');
      });
    } else {
      unifiedOrder();
    }
  }
})


function unifiedOrder() {
  var orderUnifiedData = app.globalData.orderUnifiedData;
  if (orderUnifiedData && orderUnifiedData.orderId == app.globalData.orderId && Date.now() - orderUnifiedData.saveTime < 10000) {
    wxPayment(orderUnifiedData);
  } else {
    app.globalData.orderUnifiedData = null;
    Request.requestUnifiedOrder(app.globalData.orderId, data => {
      if (data.state == 1) {
        data.orderId = app.globalData.orderId;
        data.saveTime = Date.now();
        app.globalData.orderUnifiedData = data;
        wxPayment(data);
      } else if (data.state == 0) {
        if (data.error == 0) { 
          util.showModal('提示', '确认订单失败, 请重试!', null, '确定'); 
        } else if (data.error == 2) {
          util.backHomeTip('未找到该订单, 请重新下单!');
        } else {
          util.showModal('提示', '订单状态异常!', null, '刷新', res => {
            if (res.confirm) { app.processOrder(); }
          });
        }
      } 
    }, () => {
      util.showModal('提示', '确认订单失败, 请重试!', null, '确定');
    });
  }
}

function wxPayment(data) {
  wx.requestPayment({
    'timeStamp': data.timeStamp,
    'nonceStr': data.nonceStr,
    'package': data._package,
    'signType': data.signType,
    'paySign': data.paySign,
    'success': res => {
      payQuery(data.billId, 1);
    },
    'fail': res => {
      util.showModal('提示', '支付失败!', null, '确定');
    }
  });
}

function payQuery(billId, times) {
  util.showLoadingToast('支付结果确认中');
  Request.requestPayQuery(billId, data => {
    switch (data.state) {
      case '0':
        util.backHomeTip('未找到该订单, 请重新下单!');
        break;
      case '1':
        // 已支付
        app.processOrder();
        break;
      case '2':
        if (times > 10) {
          util.hideToast();
          util.showModal('提示', '支付结果查询失败, 请稍后重试!', null, '确定');
        } else {
          setTimeout(() => {
            payQuery(billId, times+1);
          }, 3000);
        }
        break;
      default:
        util.showModal('提示', '订单状态异常!', null, '刷新', res => {
          if (res.confirm) { app.processOrder(); }
        });
        break;
    }
  });
}


function layoutScrollView(goods) {
  wx.getSystemInfo({
    success: res => {
      var pixelRatio = res.windowWidth/750;
      var scrollViewMaxHeight = res.windowHeight/pixelRatio - 830;
      var scrollViewMinHeight = scrollViewMaxHeight * 2 / 5;
      var scrollViewHeight = 0;
      for (var i=0,iLen=goods.length; i<iLen; i++) {
        var good = goods[i];
        scrollViewHeight += good.goodsName.length<=10 ? 38 : 76;
        scrollViewHeight += good.goodsMaterialPrice ? 40 : 0;
        scrollViewHeight += good.goodsServicePrice ? 40 : 0;
        scrollViewHeight += i<iLen-1 ? 26 : 0;
      }
      var height = Math.min(scrollViewMaxHeight, Math.max(scrollViewMinHeight, scrollViewHeight));
      if (scrollViewHeight != height) {
        this.setData({
          scrollViewHeight: height+'rpx'
        });
      }
    }
  });
}