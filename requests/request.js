var Url = require("url.js");
var util = require('../utils/util.js');

const header = { 'content-type': 'application/x-www-form-urlencoded' };

function setSessionid(sessionid) {
    header.Cookie = sessionid ? 'JSESSIONID=' + sessionid : '';
}

function checkWxLogin() {
  var app = getApp(), state = app.globalData.state;
  if (state == 0) {
    app.loginFail();
    return false;
  }
  return true;
}

function checkBindPhone() {
  var app = getApp(), state = app.globalData.state;
  if (state == 0) {
    app.loginFail();
    return false;
  } else if (state == 1) {
    wx.navigateTo({ url: '../bindPhone/bindPhone' });
    return false;
  }
  return true;
}

function process1007() {
  var app = getApp(), state = app.globalData.state;
  if (state == 0 || state >= 2) {
    app.loginFail('微信登录失效');
  } else if (state == 1) {
    wx.navigateTo({ url: '../bindPhone/bindPhone' });
  }
}

function request(url, data, successCb, errorCb, completeCb) {
  util.showLoadingToast();
  var _successCb = function(res) {
    util.hideToast();
    typeof successCb == "function" && successCb(res);
  };
  var _errorCb = function() {
    util.showLoadingToast('网络请求失败~', 2000, false);
    typeof errorCb == "function" && errorCb();
  };
  requestSilently(url, data, _successCb, _errorCb, completeCb);
}

function requestSilently(url, data, successCb, errorCb, completeCb) {
  console.log('REQUEST ' + url + '    PARAMS ' + JSON.stringify(data));
  wx.request({
    url: url,
    header: header,
    method: 'POST',
    data: data||{},
    success: function (res) {
      console.log('RESPONSE ' + JSON.stringify(res));
      if (res.statusCode == 200) {
        ((res.data.state == 1007 && process1007()) || (typeof successCb == "function" && successCb(res.data)));
      } else {
        console.log("请求失败，状态码 = " + res.statusCode);
        typeof errorCb == "function" && errorCb();
      }
    },
    error: function () {
      console.log('请求发生错误');
      typeof errorCb == "function" && errorCb();
    },
    complete: function () {
      typeof completeCb == "function" && completeCb();
    }
  });
}





function requestLogin(code, successCb, errorCb, completeCb) {
  var data = { code: code };
  request(Url.login, data, successCb, errorCb, completeCb);
}

function requestLoginByToken(token, successCb, errorCb, completeCb) {
  var data = { token: token };
  request(Url.loginByToken, data, successCb, errorCb, completeCb);
}

function requestBuildCode(username, successCb, errorCb, completeCb) {
  var data = { username: username };
  checkWxLogin() && request(Url.buildCode, data, successCb, errorCb, completeCb);
}

function requestBindPhone(username, verifyCode, successCb, errorCb, completeCb) {
  var data = { username: username, verifyCode: verifyCode };
  checkWxLogin() && request(Url.bindPhone, data, successCb, errorCb, completeCb);
}

function requestLogout(successCb, errorCb, completeCb) {
  if (getApp().globalData.state >= 2) {
    requestSilently(Url.logout, null, successCb, errorCb, completeCb);
  }
}

function requestAddressByCoord(lng, lat, successCb, errorCb, completeCb) {
  var data = { lng: lng, lat: lat };
  request(Url.addressByCoord, data, successCb, errorCb, completeCb);
}

function requestSoonIndex(successCb, errorCb, completeCb) {
  if (getApp().globalData.state >= 2) {
    requestSilently(Url.soonIndex, null, successCb, errorCb, completeCb);
  }
}

function requestWareList(cityId, orderId, successCb, errorCb, completeCb) {
  var data = {};
  (orderId && (data.orderId = orderId)) || (cityId && (data.cityId = cityId));
  request(Url.wareList, data, successCb, errorCb, completeCb);
}

function requestPlaceOrder(cityId, lng, lat, address, reserveDate, successCb, errorCb, completeCb) {
  var data = { cityId: cityId, lng: lng, lat: lat, address: address };
  reserveDate && (data.reserveDate = reserveDate);
  checkBindPhone() && request(Url.placeOrder, data, successCb, errorCb, completeCb);
}

function requestProcess(orderId, successCb, errorCb, completeCb) {
  var data = { orderId: orderId };
  checkBindPhone() && request(Url.process, data, successCb, errorCb, completeCb);
}

function requestOrderState(orderId, state, successCb, errorCb, completeCb) {
  var data = { orderId: orderId, state: state };
  checkBindPhone() && requestSilently(Url.orderState, data, successCb, errorCb, completeCb);
}

function requestCancel(orderId, orderCancelReasonId, successCb, errorCb, completeCb) {
  var data = { orderId: orderId };
  orderCancelReasonId && (data.orderCancelReasonId = orderCancelReasonId);
  checkBindPhone() && request(Url.cancel, data, successCb, errorCb, completeCb);
}

function requestOrderSure(orderId, successCb, errorCb, completeCb) {
  var data = { orderId: orderId };
  checkBindPhone() && request(Url.orderSure, data, successCb, errorCb, completeCb);
}

function requestUnifiedOrder(orderId, successCb, errorCb, completeCb) {
  var data = { orderId: orderId };
  checkBindPhone() && request(Url.unifiedOrder, data, successCb, errorCb, completeCb);
}

function requestPayQuery(billId, successCb, errorCb, completeCb) {
  var data = { billId: billId };
  requestSilently(Url.payQuery, data, successCb, errorCb, completeCb);
}

function requestScoring(id, score, successCb, errorCb, completeCb) {
  var data = { id: id, score: score };
  checkBindPhone() && request(Url.scoring, data, successCb, errorCb, completeCb);
}

function requestMyOrder(successCb, errorCb, completeCb) {
  checkBindPhone() && request(Url.myOrder, null, successCb, errorCb, completeCb);
}

function requestFinishOrder(orderId, successCb, errorCb, completeCb) {
  var data = { orderId: orderId, fromy: 'list' };
  checkBindPhone() && request(Url.process, data, successCb, errorCb, completeCb);
}




module.exports = {
  setSessionid: setSessionid,
  checkBindPhone: checkBindPhone,
  requestLogin: requestLogin,
  requestLoginByToken: requestLoginByToken,
  requestBuildCode: requestBuildCode,
  requestBindPhone: requestBindPhone,
  requestLogout: requestLogout,
  requestAddressByCoord: requestAddressByCoord,
  requestSoonIndex: requestSoonIndex,
  requestWareList: requestWareList,
  requestPlaceOrder: requestPlaceOrder,
  requestProcess: requestProcess,
  requestOrderState: requestOrderState,
  requestCancel: requestCancel,
  requestOrderSure: requestOrderSure,
  requestUnifiedOrder: requestUnifiedOrder,
  requestPayQuery: requestPayQuery,
  requestScoring: requestScoring,
  requestMyOrder: requestMyOrder,
  requestFinishOrder: requestFinishOrder
}