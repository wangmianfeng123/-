const cityArray = [
  {province:"7", id:"412", code:"0371", name:"河南省郑州市", phone:"400-0328-166", batteryIdArray:[18], tyreIdArray:[76,77,78]},
  {province:"15", id:"1213", code:"0571", name:"浙江省杭州市", phone:"400-0328-166", batteryIdArray:[12], tyreIdArray:[14,13]},
  {province:"15", id:"1255", code:"0575", name:"浙江省绍兴市", phone:"0575-89188364", batteryIdArray:[89], tyreIdArray:[93,94]}
];

function getCityById(id) {
  for (var i=0, len=cityArray.length; i<len; i++) {
    if (cityArray[i].id == id) {
      return cityArray[i];
    }
  }
  return null;
}

function getCityByCode(code) {
  for (var i=0, len=cityArray.length; i<len; i++) {
    if (cityArray[i].code == code) {
      return cityArray[i];
    }
  }
  return null;
}

function getCityByAddress(address) {
  for (var i=0, len=cityArray.length; i<len; i++) {
    if (address.indexOf(cityArray[i].name) != -1) {
      return cityArray[i];
    }
  }
  return null;
}

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function showModal(title, content, cancelText, confirmText, successCb) {
  wx.showModal({
    title: title||'提示',
    content: content,
    showCancel: !!cancelText,
    cancelText: cancelText||'取消',
    confirmText: confirmText||'确定',
    success: successCb
  });
}

function hasUnfinishedOrder(orderId) {
  wx.showModal({
    title: '订单恢复',
    content: '您当前有一个正在进行的订单',
    cancelText: '我知道了',
    cancelColor: '#585964',
    confirmText: '立即进入',
    confirmColor: '#ff6300',
    success: function(res) {
      if (res.confirm) {
        var app = getApp();
        app.globalData.orderId = orderId;
        app.processOrder();
      }
    }
  });
}

var index;
function callCustomerService(callback) {
  wx.showModal({
    title: '联系客服',
    content: '是否拨打客服电话?\n客服工作时间: 09:00-21:00',
    confirmText: '拨打',
    confirmColor: '#ff6300',
    success: function(res) {
      typeof callback == "function" && callback();
      if (res.confirm) {
        index || (index = require('../pages/index/index.js'));
        var city = getCityById(index.getCityId());
        var phone = city ? city.phone : '400-0328-166';
        wx.makePhoneCall({
          phoneNumber: phone
        });
      }
    }
  });
}

function showToast(title, duration, mask) {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: duration||2000,
    mask: mask||false
  });
}

function showLoadingToast(title, duration, mask) {
  wx.showToast({
    title: title||'加载中',
    icon: 'loading',
    duration: duration||10000,
    mask: mask||true
  });
}

function hideToast() {
  wx.hideToast();
}

function backHome() {
  var pages = getCurrentPages();
  pages.length > 1 && wx.navigateBack({ delta: pages.length-1 });
}

function backHomeTip(msg) {
  showModal('提示', msg, null, '确定', res => {
    if (res.confirm) {
      backHome();
    }
  });
}

function effectiveFunction(func) {
  var effective = { lastTime: 0 };
  effective.func = function() {
    if (Date.now() - effective.lastTime > 1500) {
      func.apply(this, arguments);
      effective.lastTime = Date.now();
    }
  };
  return effective.func;
}

function jumpToDoingOrder(url) {
  // 要保证第一层级是首页，进行中的订单页面永远只能在第二层级，更高层级可能是商品列表等
  var pages = getCurrentPages();
  if (pages.length <= 1) {
    wx.navigateTo({ url: url });
  } else if (pages.length == 2) {
    wx.redirectTo({ url: url });
  } else {
    wx.navigateBack({ delta: pages.length-2 });
    getApp().globalData.orderTempUrlData = { url: url, saveTime: Date.now() }
  }
}


module.exports = {
  getCityById: getCityById,
  getCityByCode: getCityByCode,
  getCityByAddress: getCityByAddress,
  formatTime: formatTime,
  formatNumber: formatNumber,
  showModal: showModal,
  hasUnfinishedOrder: hasUnfinishedOrder,
  callCustomerService: callCustomerService,
  showToast: showToast,
  showLoadingToast: showLoadingToast,
  hideToast: hideToast,
  backHome: backHome,
  backHomeTip: backHomeTip,
  effectiveFunction: effectiveFunction,
  jumpToDoingOrder: jumpToDoingOrder
}
