import { DBLive } from '../../db/DBLive.js';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    navbar:['直播','搜索','篮球','足球'],
    currentTab:0
  },

  /*
  顶部导航栏
  */
  navbarTap: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.idx
    })
  },

  /*
  页面跳转
   */
  onTapToLive(event) {
    var liveId = event.currentTarget.dataset.liveId;
    console.log(liveId);
    wx.navigateTo({
      url: '../live/live?id=' + liveId,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var dbLive=new DBLive();
    this.setData({
      liveList:dbLive.getAllLiveData()
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  }
})