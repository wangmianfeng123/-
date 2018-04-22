const domain = "https://www.otosd.com";

const login = domain + "/customerSC/wechat/login.action";
const loginByToken = domain + "/customerSC/wechat/loginByToken.action";
const logout = domain + "/customerSC/wechat/logout.action";
const buildCode = domain + "/customerSC/wechat/buildCode.action";
const bindPhone = domain + "/customerSC/wechat/bindPhone.action";
const addressByCoord = domain + "/customerSC/wechat/addressByCoord.action";
const soonIndex = domain + "/customerSC/wechat/outRepair/soonIndex.action";
const wareList = domain + "/customerSC/wechat/outRepair/wareList.action";
const placeOrder = domain + "/customerSC/wechat/outRepair/placeOrder.action";
const process = domain + "/customerSC/wechat/outRepair/process.action";
const orderState = domain + "/customerSC/wechat/order/orderState.action";
const cancel = domain + "/customerSC/wechat/outRepair/cancel.action";
const orderSure = domain + "/customerSC/wechat/outRepair/orderSure.action";
const unifiedOrder =  domain + "/customerSC/wechat/order/unifiedOrder.action";
const payQuery = domain + "/customerSC/order/wechat/payQuery.action";
const scoring = domain + "/customerSC/wechat/outRepair/scoring.action";
const myOrder = domain + "/customerSC/wechat/outRepair/myOrder.action";


module.exports = {
  login: login,
  loginByToken: loginByToken,
  logout: logout,
  buildCode: buildCode,
  bindPhone: bindPhone,
  addressByCoord: addressByCoord,
  soonIndex: soonIndex,
  wareList: wareList,
  placeOrder: placeOrder,
  process: process,
  orderState: orderState,
  cancel: cancel,
  orderSure: orderSure,
  unifiedOrder: unifiedOrder,
  payQuery: payQuery,
  scoring: scoring,
  myOrder: myOrder
}