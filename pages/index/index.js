var util = require('../../utils/util.js');
var Request = require("../../requests/request.js");
var app = getApp();

var indexPage;
var year, date, hour, minute;
var timeChangeable = false;

Page({
  data: {
    username: null,
    cityId: null,
    lng: -1,
    lat: -1,
    address: null,
    reserveDate: null,
    reserveDateShow: null,
    dateArray: [0, 1],
    hourArray: [],
    minuteArray: [],
    timeValue: [0, 0, 0],
    time_hidden: true,
    menu_hidden: true
  },
  onLoad: function() {
    indexPage = this;
    // 自动定位
    wx.getLocation({
      success: res => {
        Request.requestAddressByCoord(res.longitude, res.latitude, data => {
          if (data.state == 1) {
            this.setData({
              lng: res.longitude,
              lat: res.latitude,
              address: data.address,
              cityId: getCityIdByCitycode(data.citycode)
            });
          }
        });
      }
    });
  },
  onShow: function() {
    app.globalData.orderId = null;
    app.globalData.orderState = -2;
    soonIndex();
  },

  modifyLocation: function() {
    wx.chooseLocation({
      success: res => {
        console.log(res);
        this.setData({
          lng: res.longitude,
          lat: res.latitude,
          address: res.name || res.address
        });
        var cityId = getCityIdByAddress(res.address);
        if (cityId) {
          this.setData({
            cityId: cityId
          });
        } else {
          Request.requestAddressByCoord(res.longitude, res.latitude, data => {
            if (data.state == 1) {
              this.setData({
                cityId: getCityIdByCitycode(data.citycode)
              });
            }
          });
        }
      }
    });
  },

  openTime: function() {
    timeChangeable = true;
    this.setData({
      timeValue: this.data.timeValue
    });
    openTime.call(this);
  },
  closeTime: function() {
    timeChangeable = false;
    closeTime.call(this);
  },
  sureTime: function() {
    this.closeTime();
    var h = this.data.hourArray[this.data.timeValue[1]];
    if (h == -1) {
      this.setData({
        reserveDate: null,
        reserveDateShow: null
      });
    } else {
      var d = this.data.dateArray[this.data.timeValue[0]];
      var m = this.data.minuteArray[this.data.timeValue[2]];
      var tempDate = new Date();
      tempDate.setDate(date+d);
      this.setData({
        reserveDate: tempDate.getFullYear()+"-"+(tempDate.getMonth()+1)+"-"+tempDate.getDate()+" "+h+":"+m+":00",
        reserveDateShow: (tempDate.getMonth()+1)+"月"+tempDate.getDate()+"日"+"  "+(h<10?'0'+h:h)+":"+(m==0?'00':m)
      });
    }
  },
  onTimeChange: function(e) {
    if (timeChangeable) {
      const val = e.detail.value;
      if (this.data.timeValue[0] != val[0]) {
        this.onDateChange(this.data.dateArray[val[0]]);
        val[1] = 0;
        this.onHourChange(this.data.dateArray[val[0]], this.data.hourArray[val[1]]);
        val[2] = 0;
      } else if (this.data.timeValue[1] != val[1]) {
        this.onHourChange(this.data.dateArray[val[0]], this.data.hourArray[val[1]]);
        val[2] = 0;
      }
      this.setData({
        timeValue: val
      });
    }
  },
  onDateChange: function(d) {
    var hourArray = [];
    if (d == 0) {
      hourArray.push(-1);
      //当分钟等于0时，时钟可选 现在、h-23
      //当分钟大于0时，时钟可选 现在、(h+1)-23
      minute == 0 && hourArray.push(hour);
      for (var i=hour+1; i<24; i++) {
        hourArray.push(i);
      }
    } else {
      for (var i=0; i<24; i++) {
        hourArray.push(i);
      }
    }
    this.setData({
      hourArray: hourArray
    });
  },
  onHourChange: function(d, h) {
    var minuteArray = [];
    if (h != -1) {
      if (d == 0  &&  (h==hour || (h==hour+1&&minute>30))){
        minuteArray.push(30);
      } else {
        minuteArray.push(0, 30);
      }
    }
    this.setData({
      minuteArray: minuteArray
    });
  },

  batteryService: function() {
    toWareList.call(this, 1);
  },

  tyreService: function() {
    toWareList.call(this, 2);
  },

  placeOrder: function() {
    placeOrder();
  },

  callCustomerService: function() {
    util.callCustomerService();
  },

  toWareList: function() {
    toWareList.call(this);
  },

  openMenu: function() {
    if (Request.checkBindPhone()) {
      var username = app.globalData.username.substring(0, 3) + "****" + app.globalData.username.substring(7, 11);
      this.setData({
        username: username
      });
      openMenu.call(this);
    }
  },
  closeMenu: function() {
    closeMenu.call(this);
  },

  myOrder: function() {
    closeMenu.call(this);
    wx.navigateTo({ url: '../orderList/orderList' });
  },

  logout: function() {
    if (app.globalData.state == 0) {
      app.loginFail();
    } else if (app.globalData.state == 1) {
      wx.showModal({
        title: '未登录',
        content: '您暂未登录',
        cancelText: '取消',
        confirmText: '登录',
        confirmColor: '#000000',
        success: function(res) {
          if (res.confirm) {
            closeMenu.call(this);
            wx.navigateTo({ url: '../bindPhone/bindPhone' });
          }
        }
      });
    } else {
      wx.showModal({
        title: '退出登录',
        content: '确定要退出吗?',
        cancelText: '确定',
        confirmText: '取消',
        confirmColor: '#000000',
        success: res => {
          if (!res.confirm) {
            closeMenu.call(this);
            logout();
          }
        }
      });
    }
  },
})


function placeOrder() {
  var thisData = indexPage.data;
  if (!thisData.cityId) {
    util.showModal('暂无服务', '您所在地区暂未开通服务', null, '知道了');
    return;
  }
  Request.requestPlaceOrder(thisData.cityId, thisData.lng, thisData.lat, thisData.address, thisData.reserveDate, data => {
    if (data.state == 1) {
      app.globalData.orderId = data.orderId;
      app.globalData.orderState = 0;
      var orderTime = Date.now(), timeDelta = 0;
      var url = '../reserve/reserve?orderTime='+orderTime+'&timeDelta='+timeDelta
      util.jumpToDoingOrder(url);
    } else if (data.state == 0) {
      if (data.error == 5) {
        soonIndex();
      } else {
        var errMsg = data.error==1 ? '请重新选择您的地址' : (data.error==2 ? '您所在地区暂未开通, 敬请期待!' : '程序下单异常, 请重试');
        util.showModal('下单失败', errMsg, null, '确定');
      }
    } else {
      util.showModal('下单失败', '程序下单异常, 请重试', null, '确定');
    }
  });
}

function soonIndex() {
  if (app.globalData.state >= 2) {
    Request.requestSoonIndex(data => {
      if (data.orderId && data.orderId != "") {
        util.hasUnfinishedOrder(data.orderId);
      }
      app.globalData.nowDate = new Date(data.nowDate);
      updateTime();
    });
  } else {
    updateTime();
  }
}

function logout() {
  wx.navigateTo({ url: '../bindPhone/bindPhone' });
  Request.requestLogout(data => {
    switch (data.state) {
      case '1':
        console.log('退出登录成功');
        app.globalData.state = 1;
        break;
      default:
        console.log('退出登录失败');
    }
  });
}

function getCityIdByCitycode(citycode) {
  var city = util.getCityByCode(citycode);
  return city ? city.id : null;
}

function getCityIdByAddress(address) {
  var city = util.getCityByAddress(address);
  return city ? city.id : null;
}

var toWareList = util.effectiveFunction(function(goodType) {
  if (this.data.address) {
    if (this.data.cityId) {
      var url =  '../wareList/wareList?cityId=' + this.data.cityId;
      goodType && (url += "&goodType=" + goodType);
      wx.navigateTo({ url: url });
    } else {
      util.showModal('暂无服务', '您所在地区暂未开通服务', null, '知道了');
    }
  } else {
    util.showModal('提示', '请先选择您的地址', null, '确定');
  }
});

function updateTime() {
  var nowDate = app.globalData.nowDate;
  console.log(nowDate);
  year = nowDate.getFullYear();
  date = nowDate.getDate();
  hour = nowDate.getHours();
  minute = nowDate.getMinutes();
  indexPage.onDateChange(indexPage.data.dateArray[indexPage.data.timeValue[0]]);
  indexPage.onHourChange(indexPage.data.dateArray[indexPage.data.timeValue[0]], indexPage.data.hourArray[indexPage.data.timeValue[1]]);
}

var time_bg_animation = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' });
var time_container_open_animation = wx.createAnimation({ duration: 0 });
var time_container_close_animation = wx.createAnimation({ duration: 200, timingFunction: 'ease-out' });
function openTime() {
  this.setData({
    time_hidden: false
  });
  setTimeout(() => {
    this.setData({
      time_bg_animation: time_bg_animation.opacity(0.65).step().export(),
      time_container_animation: time_container_open_animation.translateY(0).step().export()
    });
  }, 10);
}
function closeTime() {
  this.setData({
    time_bg_animation: time_bg_animation.opacity(0).step().export(),
    time_container_animation: time_container_close_animation.translateY('100%').step().export()
  });
  setTimeout(() => {
    this.setData({
      time_hidden: true
    });
  }, 300);
}


var menu_bg_animation = wx.createAnimation({ duration: 300, timingFunction: 'ease-out' });
var menu_container_animation = wx.createAnimation({ duration: 300, timingFunction: 'ease-out' });
function openMenu() {
  this.setData({
    menu_hidden: false
  });
  setTimeout(() => {
    this.setData({
      menu_bg_animation: menu_bg_animation.opacity(0.65).step().export(),
      menu_container_animation: menu_container_animation.translateX(0).step().export()
    });
  }, 10);
}
function closeMenu() {
  this.setData({
    menu_bg_animation: menu_bg_animation.opacity(0).step().export(),
    menu_container_animation: menu_container_animation.translateX('-100%').step().export()
  });
  setTimeout(() => {
    this.setData({
      menu_hidden: true
    });
  }, 300);
}


function getCityId() {
  return indexPage.data.cityId;
}

module.exports = {
  placeOrder: placeOrder,
  getCityId: getCityId
}