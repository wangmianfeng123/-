var Request = require("requests/request.js");
var util = require("utils/util.js");

// 全局定时器，用于检查订单状态，在小程序进入前台时开启，每10秒触发一次，进入后台时关闭
// 触发时，只有当小程序当前打开的页面中，存在等待接单、上门维修、确认支付页面，才会检查订单状态
// 使用全局定时器，保证自始至终有且只有一个定时器在运行，当有需要定时检查订单状态的页面存在时，一定能起作用
var orderStateTimer;
// 小程序第一次打开会onShow两次，所以第一次登录操作放在onLaunch中，之后每次重新打开小程序都在onShow中检查登录状态
var showTimes = 0;

App({
  globalData:{
    state: 0,  // 0未绑定session_token，1未绑定手机，2登录成功
    username: null,  // 用户绑定的手机号
    nowDate: new Date(),  // 当前服务器时间，初始设为本地时间，在调用登login或soonIndex接口后更新
    orderId: null,  // 当前订单id，未被接单时是长字符串UUID，被接单后更新为短数字编号id，都可用于处理全部订单状态
    orderState: -2,  // 当前订单状态，用于轮询订单状态是否改变，-2代表未记录
    orderUnifiedData: null,  // 上一次记录的订单预支付参数，包含orderId和saveTime，使用时需验证orderId和saveTime(保存超过10秒则不可用)
    orderTempUrlData: null  // 处理订单后，有时如看商品信息时，要navigateBack业务页面（第二层级）再redirectTo，但back动画时还处于上面的层级，故保存处理后生成的的URL信息，在业务页面onShow时进行跳转，包含saveTime(用于验证时效性，保存超过3秒不可用)
  },
  onLaunch: function() {
    this.loginByToken();
  },
  onShow: function() {
    // 首次打开小程序的onShow中不检查登录状态
    ++ showTimes > 2 && this.globalData.state == 0 && this.loginByToken();
    this.startOrderStateTimer();
  },
  onHide: function() {
    this.endOrderStateTimer();
  },
  // 使用本地token登录
  loginByToken: function() {
    try {
      var session_token = wx.getStorageSync('session_token');
      console.log(session_token);
      this.globalData.state = 0;
      if (session_token) {
        if (session_token.date - Date.now() > 2160000000) {
          //25*24*60*60*1000 = 2160000000 
          try {
            wx.removeStorageSync('session_token');
          } catch (e) {}
          console.log("session_token过期，执行login登录");
          this.login();
        } else {
          Request.requestLoginByToken(session_token.token, data => {
            this.globalData.nowDate = new Date(data.nowDate);
            switch (data.state) {
              case '0':
                try {
                  wx.removeStorageSync('session_token');
                } catch (e) {}
                console.log("session_token token 后台不存在，执行login登录");
                this.login();
                break;
              case '1':
                console.log("登录成功 loginByToken");
                this.globalData.state = 2;
                this.globalData.username = data.username;
                soonIndex.call(this);
                break;
              case '2':
                // 未绑定手机号
                this.globalData.state = 1;
                // wx.navigateTo({ url: '/pages/bindPhone/bindPhone' });
                break;
              default:
                console.log('loginByToken接口状态异常！state=' + data.state);
                this.loginFail();
                return;
            }
            Request.setSessionid(data.sessionid);
          }, () => {
            this.loginFail();
          });
        }
      } else {
        console.log("session_token缓存不存在，执行login登录");
        this.login();
      }
    } catch (e) {
      console.log("session_token获取缓存失败，执行login登录");
      this.login();
    }
  },
  // 基础登录
  // login: function() {
  //   this.globalData.state = 0;
  //   wx.login({
  //     success: res => {
  //       console.log(res.code);
  //       if (res.code) {
  //         Request.requestLogin(res.code, data => {
  //           this.globalData.nowDate = new Date(data.nowDate);
  //           switch (data.state) {
  //             case '0':
  //               // 未绑定手机号
  //               this.globalData.state = 1;
  //               // wx.navigateTo({ url: '/pages/bindPhone/bindPhone' });
  //               break;
  //             case '1':
  //               console.log("登录成功 login");
  //               this.globalData.state = 2;
  //               this.globalData.username = data.username;
  //               soonIndex.call(this);
  //               break;
  //             default:
  //               console.log('login接口状态异常！state=' + data.state);
  //               this.loginFail();
  //               return;
  //           }
  //           Request.setSessionid(data.sessionid);
  //           wx.setStorageSync('session_token', { date: Date.now(), token: data.token });
  //         }, () => {
  //           this.loginFail();
  //         });
  //       } else {
  //         console.log('获取用户登录态失败！' + res.errMsg);
  //         this.loginFail();
  //       }
  //     },
  //     fail: function() {
  //       console.log('微信登录失败！');
  //       this.loginFail();
  //     }
  //   });
  // },
  // 登录失败
  // loginFail: function(msg) {
  //   util.showModal('提示', msg||'微信登录失败', null, '重试', (res) => {
  //     if (res.confirm) {
  //       this.login();
  //     }
  //   });
  // },
 
  // 处理未知状态的订单
  // callByTimer 如果是定时器发起的处理，处理完后，重置定时器，保证它的实时性，否则可能有0~10s的空隙期
  // doIfDiff 原则上订单状态不可能倒退，也不允许处理倒退的情况，但一旦发生时，定时器每次检查都是订单状态已变化却无法处理。为了避免这种死循环，当发生状态冲突时，重新发起一次特殊的处理请求（doIfDiff=true），此次请求返回的订单状态只要和当前保存的订单状态不一致，就必须要进行处理。
  processOrder: function(callByTimer, doIfDiff) {
    Request.requestProcess(this.globalData.orderId, data => {
      var processAble = false;
      if (data.orderId == this.globalData.orderId) {
        var theState = getOrderStateIndex(data.state), nowState = getOrderStateIndex(this.globalData.orderState);
        if ((doIfDiff && theState != nowState) || theState > nowState ) {
          this.globalData.orderId = data.orderId;
          this.globalData.orderState = data.state;
          processAble = true;
        } else if (!doIfDiff) {
          this.processOrder(false, true);
        }
      } 
      if (!processAble) {
        callByTimer && setTimeout(() => {this.startOrderStateTimer()}, 2000);
        return;
      }
      var url, msg;
      switch (data.state) {
        case '0':
          if (data.if_overtime == 0) {
            var timeDelta = Date.now() - parseInt(data.nowTime);
            url = '../reserve/reserve?orderTime='+data.orderTime+'&timeDelta='+timeDelta;
          } else {
            msg = '订单等待接单已超时, 请重新下单!';
            Request.requestCancel(this.globalData.orderId, null, data => {
              switch (data.state) {
                case '-1':
                case '1':
                  console.log('订单取消成功');
                  this.globalData.orderId = null;
                  break;
                default:
                  console.log('订单取消失败');
              }
            });
          }
          break;
        case '1':
        case '2':
          url = '../received/received?data='+JSON.stringify(data);
          break;
        case '7':
        case '3':
          url = '../orderSure/orderSure?data='+JSON.stringify(data);
          break;
        case '4':
        case '5':
        case '6':
          url = '../finish/finish?data='+JSON.stringify(data);
          break;
        case '-1':
          msg = '未找到该订单, 请重新下单!';
          break;
        default:
          msg = '订单状态异常, 请重新下单!';
      }
      if (url) {
        util.jumpToDoingOrder(url);
      } else if (msg) {
        util.backHomeTip(msg);
      }
    });
  },

  toFinishOrder: function(orderId) {
    Request.requestFinishOrder(orderId, data => {
      switch (data.state) {
        case '4':
          this.globalData.orderId = orderId;
          util.jumpToDoingOrder('../finish/finish?data='+JSON.stringify(data));
          break;
        case '5':
        case '6':
          wx.navigateTo({ url: '../finishDetail/finishDetail?data='+JSON.stringify(data) });
          break;
        case '-1':
          util.backHomeTip('未找到该订单');
          break;
        default:
          util.backHomeTip('订单状态异常');
      }
    });
  },

  orderState: function(callByTimer) {
    if (this.globalData.orderId) {
      Request.requestOrderState(this.globalData.orderId, this.globalData.orderState, data => {
        if (isNaN(this.globalData.orderId) || data.orderId == this.globalData.orderId) {
          switch (data.state) {
            case '-1':
              var pages = getCurrentPages();
              pages.length > 1 && wx.navigateBack({ delta: pages.length-1 });
              util.showModal('提示', '未找到该订单, 请重新下单!', null, '确定');
              break;
            case '0':
              console.log("订单状态未改变");
              break;
            case '1':
              console.log("订单状态改变");
              this.globalData.orderId = data.orderId;
              this.processOrder(callByTimer);
              break;
          }
        }
      });
    }
  },


  // 开启订单状态轮询
  startOrderStateTimer: function() {
    this.orderStateForTimer();  // 立即触发一次订单状态查询
    orderStateTimer && clearInterval(orderStateTimer);
    orderStateTimer = setInterval(() => {
      this.orderStateForTimer();
    }, 10000);

  },

  orderStateForTimer: function() {
    var pages = getCurrentPages();
    for (var i=0, len=pages.length; i<len; i++) {
      var pageName = pages[i].__route__;
      if (pageName.indexOf('reserve') != -1 || pageName.indexOf('received') != -1 || pageName.indexOf('orderSure') != -1) {
        console.log("存在等待接单、上门维修、确认支付页面，检查订单状态");
        this.orderState(true);
        break;
      }
    }
  },

  // 关闭订单状态轮询
  endOrderStateTimer: function() {
    if (orderStateTimer) {
      clearInterval(orderStateTimer);
      orderStateTimer = null;
    }
  }
})


function soonIndex() {
  // 在登录成功后立即获取未完成订单，可能返回1007，所以延迟10毫秒
  setTimeout(() => {
    Request.requestSoonIndex(data => {
      if (data.orderId && data.orderId != "") {
        util.hasUnfinishedOrder(data.orderId);
      }
    });
  }, 10);
}

// 订单流程中订单状态的顺序：-1 不存在，0 待接单，1 已被接，2 开始维修，7 待确认，3 待支付，4 待评价，5 已完成，6 已取消
var orderStateArray = [-1, 0, 1, 2, 7, 3, 4, 5, 6];  // 订单不存在时为-1
// 获取订单状态在订单流程中的位置
function getOrderStateIndex(state) {
  for (var i=0, len=orderStateArray.length; i<len; i++) {
    if (orderStateArray[i] == state) {
      return i;
    }
  }
  return -1; 
}


