import { DBLive } from '../../db/DBLive.js';
var util = require('../../util/util.js')
var app = getApp();
// pages/live/live.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    useKeyboardFlag: true,
    keyboardInputValue: '',
    sendMoreMsgFlag: false,
    chooseFiles: [],
    deleteIndex: -1,
    currentAudio: '',
    hostList: []
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var liveId = options.id;
    this.dbLive = new DBLive(liveId);
    this.liveData = this.dbLive.getLiveItemById();
    // 绑定评论数据
    this.setData({
      live: this.liveData,
      comments: this.getDataByTime(this.liveData.data.comments),
      hostList: this.getDataByTime(this.liveData.data.hostList)
    });
  },

  // 将时间戳转换成可阅读格式
  getDataByTime(itemData) {
    itemData.sort(this.compareWithTime); //按时间降序
    var len = itemData.length,
      data1;
    for (var i = 0; i < len; i++) {

      data1 = itemData[i];
      data1.create_time = util.getDiffTime(data1.create_time, true);
    }
    return itemData;
  },
  //sort函数的compare
  compareWithTime(value1, value2) {
    var flag = parseFloat(value1.create_time) - parseFloat(value2.create_time);
    if (flag < 0) {
      return 1;
    } else if (flag > 0) {
      return -1
    } else {
      return 0;
    }
  },

  /**
   * 点赞 献花 的函数
   */
 
  onUpTap: function (event) {
    var newData = this.dbLive.up();
    console.log(newData);
    this.setData({
      'live.data.upStatus': newData.upStatus,
      'live.data.upNum': newData.upNum
    })
  },
  /**
   * 输入框的函数
   */
  //预览图片
  previewImg: function (event) {
    //获取评论序号
    var commentIdx = event.currentTarget.dataset.commentIdx,
      //获取图片在图片数组中的序号
      imgIdx = event.currentTarget.dataset.imgIdx,
      //获取评论的全部图片
      imgs = this.data.comments[commentIdx].content.img;
    wx.previewImage({
      current: imgs[imgIdx], // 当前显示图片的http链接
      urls: imgs // 需要预览的图片http链接列表
    })
  },

  //切换语音和键盘输入
  switchInputType: function (event) {
    this.setData({
      useKeyboardFlag: !this.data.useKeyboardFlag
    })
  },


  // 获取用户输入
  bindCommentInput: function (event) {
    var val = event.detail.value;
    this.data.keyboardInputValue = val;
  },

  
  // 提交用户评论
  submitComment: function (event) {
    var imgs = this.data.chooseFiles;
    var data = this.liveData.data;
    var newData = {
      username: data.anchorName,
      avatar: data.avatar,
      create_time: new Date().getTime() / 1000,
      content: {
        txt: this.data.keyboardInputValue,
        img: imgs
      },
    };
    if (!newData.content.txt && imgs.length === 0) {
      return;
    }
    //保存新评论到缓存数据库中
    if (data.liveId == data.liveRoomId) {
      this.dbLive.newLiveContent(newData);
    }
    else {
      this.dbLive.newComment(newData);
    }
    //显示操作结果
    this.showCommitSuccessToast();
    //重新渲染并绑定所有评论
    this.bindCommentData();
    //恢复初始状态
    this.resetAllDefaultStatus();
  },


  //评论成功
  showCommitSuccessToast: function () {
    //显示操作结果
    wx.showToast({
      title: "评论成功",
      duration: 1000,
      icon: "success"
    })
  },

  bindCommentData:function(){
    console.log(this.data)
    this.dbLive = new DBLive(this.data.live.data.liveId);
    this.liveData = this.dbLive.getLiveItemById();
    // 绑定评论数据
    this.setData({
      live: this.liveData,
      comments: this.getDataByTime(this.liveData.data.comments),
      hostList: this.getDataByTime(this.liveData.data.hostList)
    });
  },
  //将所有相关的按钮状态，输入状态都回到初始化状态
  resetAllDefaultStatus: function () {
    //清空评论框
    this.setData({
      keyboardInputValue: '',
      chooseFiles: [],
      sendMoreMsgFlag: false
    });
  },


  //显示 选择照片、拍照等按钮
  sendMoreMsg: function () {
    this.setData({
      sendMoreMsgFlag: !this.data.sendMoreMsgFlag
    })
  },



  //选择本地照片与拍照
  chooseImage: function (event) {
    // 已选择图片数组
    var imgArr = this.data.chooseFiles;
    //只能上传3张照片，包括拍照
    var leftCount = 3 - imgArr.length;
    if (leftCount <= 0) {
      return;
    }
    var sourceType = [event.currentTarget.dataset.category],
      that = this;
    console.log(leftCount)
    wx.chooseImage({
      count: leftCount,
      sourceType: sourceType,
      success: function (res) {
        // 可以分次选择图片，但总数不能超过3张
        console.log(res)
        that.setData({
          chooseFiles: imgArr.concat(res.tempFilePaths)
        });
      }
    })
  },


  //删除已经选择的图片
  deleteImage: function (event) {
    var index = event.currentTarget.dataset.idx,
      that = this;
    that.setData({
      deleteIndex: index
    });
    that.data.chooseFiles.splice(index, 1);
    setTimeout(function () {
      that.setData({
        deleteIndex: -1,
        chooseFiles: that.data.chooseFiles
      });
    }, 500)
  },

  //开始录音
  recordStart: function () {
    var that = this;
    this.setData({
      recodingClass: 'recoding'
    });
    this.startTime = new Date();
    wx.startRecord({
      success: function (res) {
        console.log('success');
        var diff = (that.endTime - that.startTime) / 1000;
        diff = Math.ceil(diff);

        //发送录音
        that.submitVoiceComment({ url: res.tempFilePath, timeLen: diff });
      },
      fail: function (res) {
        console.log('fail');
        console.log(res);
      },
      complete: function (res) {
        console.log('complete');
        console.log(res);
      }
    });
  },

  //结束录音
  recordEnd: function () {
    this.setData({
      recodingClass: ''
    });
    this.endTime = new Date();
    wx.stopRecord();
  },

  //提交录音 
  submitVoiceComment: function (audio) {
    var newData = {
      username: "青石",
      avatar: "/images/avatar/avatar-3.png",
      create_time: new Date().getTime() / 1000,
      content: {
        txt: '',
        img: [],
        audio: audio
      },
    };

    //保存新评论到缓存数据库中
    this.dbPost.newComment(newData);

    //显示操作结果
    this.showCommitSuccessToast();

    //重新渲染并绑定所有评论
    this.bindCommentData();
  },

  playAudio: function (event) {
    var url = event.currentTarget.dataset.url,
      that = this;

    //暂停当前录音
    if (url == this.data.currentAudio) {
      wx.pauseVoice();
      this.data.currentAudio = ''
    }

    //播放录音
    else {
      this.data.currentAudio = url;
      wx.playVoice({
        filePath: url,
        complete: function () {
          //只有当录音播放完后才会执行
          that.data.currentAudio = '';
          console.log('complete')
        },
        success: function () {
          console.log('success')
        },
        fail: function () {
          console.log('fail')
        }
      });
    }
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