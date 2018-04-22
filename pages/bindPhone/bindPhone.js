var Request = require("../../requests/request.js");
var util = require('../../utils/util.js');
var app = getApp();

Page({
  data:{
    phone: null,
    code: null,
    delayTime: 0
  },
  phoneInput: function(e) {
    this.setData({
      phone: e.detail.value
    })
  },
  validate: function() {
    Request.requestBuildCode(this.data.phone, data => {
      if (data.state == "1") {
        // util.showToast('验证码已发送成功');
        startTimer.call(this);
      } else {
        util.showModal('提示', '验证码发送失败', null, '确定');
      }
    });
  },
  codeInput: function(e) {
    this.setData({
      code: e.detail.value
    })
  },
  formSubmit: function (e) {
    Request.requestBindPhone(this.data.phone, this.data.code, data => {
      if (data.state == "1") {
        app.globalData.state = 2;
        app.globalData.username = this.data.phone;
        util.backHome();
        setTimeout(() => { util.showToast('登录成功') }, 550);
      } else {
        util.showModal('提示', data.result||'请输入正确的验证码', null, '确定');
      }
    });
  },

  callCustomerService: function() {
    util.callCustomerService();
  }
})


var timer;
function startTimer() {
  this.setData({
    delayTime: 60
  });
  timer && clearInterval(timer);
  timer = setInterval(() => {
    this.setData({
      delayTime: this.data.delayTime - 1
    });
    if (this.data.delayTime <= 0) {
      clearInterval(timer);
    }
  }, 1000);
}