var util = require('../../utils/util.js'); 

Page({
  data: {
    mechanicImg: null,
    mechanicName: null,
    mechanicScore: '5.0',
    orderTotal: '0',
    orderPrice: '0',
    goods: null,
    couponDiscount: null,
    orderScore: 0,
    cancelReason: null,
    scrollViewHeight: 'auto'
  },
  onLoad: function(option){
    var data = JSON.parse(option.data);
    this.setData({
      mechanicImg: data.mechanicImg,
      mechanicName: data.mechanicName,
      mechanicScore: data.mechanicScore,
      orderTotal: data.orderTotal||'0',
      orderPrice: data.orderPrice||'0',
      goods: data.goods,
      couponDiscount: data.couponDiscount||null,
      orderScore: data.orderScore||0,
      cancelReason: data.cancelReason||null
    });
    if (this.data.goods) {
      layoutScrollView.call(this, this.data.goods);
    }
  },


  callCustomerService: function() {
    util.callCustomerService();
  },
  backHome: function() {
    util.backHome();
  }
})



function layoutScrollView(goods) {
  wx.getSystemInfo({
    success: res => {
      var pixelRatio = res.windowWidth/750;
      var scrollViewMaxHeight = res.windowHeight/pixelRatio - 900;
      var scrollViewMinHeight = 0;
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