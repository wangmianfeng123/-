
var Request = require("../../requests/request.js");
var app = getApp();


Page({
  data: {
    unfinishList: null,
    finishList: null
  },
  onLoad: function(options) {
    Request.requestMyOrder(data => {
        this.setData({
          unfinishList: data.unfinishList,
          finishList: data.finishList
        });
    });
  },

  toUnfinishOrder: function(event) {
    var orderId = event.currentTarget.dataset.id;
    app.globalData.orderId = orderId;
    app.processOrder();
  },

  toFinishOrder: function(event) {
    var orderId = event.currentTarget.dataset.id;
    app.toFinishOrder(orderId);
  }
})