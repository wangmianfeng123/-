var Request = require("../../requests/request.js");
var util = require('../../utils/util.js');
var index = require('../index/index.js');

var pixelRatio = 0.5;
var headerAnimation = wx.createAnimation({ duration: 300, timingFunction: 'ease-out' });
var headerSearchWrapAnimation = wx.createAnimation({ duration: 300, timingFunction: 'ease-out' });
var headerSearchAnimation = wx.createAnimation({ duration: 300, timingFunction: 'ease-out' });
var contentSearchAnimation = wx.createAnimation({ duration: 250, timingFunction: 'ease-out' });

Page({
  data: {
    inSearch: false,
    categories: [],
    categoryIndex: null,
    categoryId: null,
    searchKeyword: '',
    searchResult: null,
    goodType: null
  },
  onLoad: function(options) {
    wx.getSystemInfo({
      success: function(res) {
        pixelRatio = res.windowWidth/750;
      }
    });
    this.setData({
      goodType: options.goodType
    });
    wareList.call(this, options.cityId, options.orderId, options.goodType);
  },
  switchCategory: function(event) {
    var switchId = event.currentTarget.dataset.id;
    for (var i=0,len=this.data.categories.length; i<len; i++) {
      if (this.data.categories[i].categoryId == switchId) {
        this.setData({
          categoryIndex: i,
          categoryId: switchId
        });
        break;
      }
    }
  },
  openSearch: function() {
    openSearch.call(this);
  },
  searchInput: function(e) {
    var keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
      searchResult: getSearchResult(this.data.categories, keyword)
    });
  },
  searchClear: function() {
    this.setData({
      searchKeyword: '',
      searchResult: null
    });
  },
  closeSearch: function() {
    closeSearch.call(this);
  },

  placeOrder: function() {
    index.placeOrder();
  }
})

// 请求商品数据
function wareList(cityId, orderId, goodType) {
  Request.requestWareList(cityId, orderId, data => {
    if (data.state == 1) {
      var categoryIndex = 0;
      if (goodType) {
        var categoryIdArray = [];
        if (goodType == "1") {
          categoryIdArray = util.getCityById(cityId).batteryIdArray;
        } else if (goodType == "2") {
          categoryIdArray = util.getCityById(cityId).tyreIdArray;
        }
        var result = data.result, categories = [];
        for (var i=0; i<result.length; i++) {
          if (contains(categoryIdArray, result[i].categoryId)) {
            result[i].categoryId == categoryIdArray[0] && (categoryIndex = categories.length);
            categories.push(result[i]);
          }
        }
        data.result = categories;
      }
      this.setData({
        categories: data.result,
        categoryIndex: categoryIndex,
        categoryId: data.result[categoryIndex].categoryId
      });
    } else if (data.flag == 0) {
      wareListFail('您所在地区暂未开通, 敬请期待!');
    } else {
      wareListFail();
    }
  }, () => {
    wareListFail();
  });
}

function wareListFail(msg) {
  util.showModal('提示', msg||'查询商品信息失败', null, '确定', (res) => {
    if (res.confirm) {
      wx.navigateBack({ delta: 1 });
    }
  });
}

// 搜索相关
function openSearch() {
  if (!this.data.inSearch) {
    this.setData({
      headerAnimation: headerAnimation.backgroundColor('white').step().export(),
      headerSearchWrapAnimation: headerSearchWrapAnimation.backgroundColor('#e8e8e8').width('calc(100% - 192rpx)').step().export(),
      headerSearchAnimation: headerSearchAnimation.translateX(0).step().export(),
      contentSearchAnimation: contentSearchAnimation.translateY(0).opacity(1).step().export()
    });
    setTimeout(() => {
      this.setData({
        inSearch: true
      });
    }, 300);
  }
}

function closeSearch() {
  if (this.data.inSearch) {
    this.setData({
      searchKeyword: '',
      searchResult: null,
      headerAnimation: headerAnimation.backgroundColor('#eaeaea').step().export(),
      headerSearchWrapAnimation: headerSearchWrapAnimation.backgroundColor('white').width('calc(100% - 96rpx)').step().export(),
      headerSearchAnimation: headerSearchAnimation.translateX(144*pixelRatio+'px').step().export(),
      contentSearchAnimation: contentSearchAnimation.translateY('-100%').opacity(0).step().export()
    });
    setTimeout(() => {
      this.setData({
        inSearch: false
      });
    }, 300);
  }
}

function getSearchResult(categories, keyword) {
  var searchResult = null;
  if (keyword.length > 0) {
    searchResult = new Array();
    var firstArray = new Array(); // 完全匹配
    var secondArray = new Array(); // 包含匹配
    var thirdArray = new Array(); // 类别完全匹配
    var forthArray = new Array(); // 类别包含匹配
    var fifthArray = new Array(); // 包含尾字匹配
    var sixthArray = new Array(); // 包含单字匹配（除尾字）
    var seventhArray = new Array(); // 类别包含尾字匹配
    var eighthArray = new Array(); // 类别包含单字匹配（除尾字）
    for (var i=0,iLen=categories.length; i<iLen; i++) {
      var category = categories[i];
      var goods = category.goods;
      if (category.categoryName == keyword) {
        thirdArray = thirdArray.concat(goods);
      } else if (category.categoryName.indexOf(keyword) != -1) {
        forthArray = forthArray.concat(goods);
      } else if (category.categoryName.indexOf(keyword[keyword.length-1]) != -1) {
        seventhArray = seventhArray.concat(goods);
      } else {
        for (var k=0,kLen=keyword.length-1; k<kLen; k++) {
          if (category.categoryName.indexOf(keyword[k]) != -1) {
            eighthArray = eighthArray.concat(goods);
            break;
          }
        }
      }
      for (var j=0,jLen=goods.length; j<jLen; j++) {
        var good = goods[j];
        if (good.goodsName == keyword) {
          firstArray.push(good);
        } else if (good.goodsName.indexOf(keyword) != -1){
          secondArray.push(good);
        } else if (good.goodsName.indexOf(keyword[keyword.length-1]) != -1){
          fifthArray.push(good);
        } else {
          for (var k=0,kLen=keyword.length-1; k<kLen; k++) {
            if (good.goodsName.indexOf(keyword[k]) != -1) {
              sixthArray.push(good);
              break;
            }
          }
        }
      }
    }
    searchResult = searchResult.concat(firstArray);
    if (searchResult.length < 20) {
      searchResult = searchResult.concat(secondArray);
      if (searchResult.length < 20) {
        searchResult = concatGoodsArrayExcludeSame(searchResult, thirdArray);
        if (searchResult.length < 20) {
          searchResult = concatGoodsArrayExcludeSame(searchResult, forthArray);
          if (searchResult.length < 20) {
            searchResult = searchResult.concat(fifthArray);
            if (searchResult.length < 20) {
              searchResult = searchResult.concat(sixthArray);
              if (searchResult.length < 20) {
                searchResult = concatGoodsArrayExcludeSame(searchResult, seventhArray);
                if (searchResult.length < 20) {
                  searchResult = concatGoodsArrayExcludeSame(searchResult, eighthArray);
                }
              }
            }
          }
        }
      }
    }
  }
  return searchResult;
}

function concatGoodsArrayExcludeSame(array1, array2) {
  for (var i=0,iLen=array2.length; i<iLen; i++) {
    var alreadyExist = false, good = array2[i];
    for (var j=0,jLen=array1.length; j<jLen; j++) {
      if (good.goodsId == array1[j].goodsId) {
        alreadyExist = true;
        break;
      }
    }
    if (!alreadyExist) {
      array1.push(good);
    }
  }
  return array1;
}

function contains(arr, obj) {
  var i = arr.length;
  while (i--) {
    if (arr[i] == obj) {
      return true;
    }
  }
  return false;
}