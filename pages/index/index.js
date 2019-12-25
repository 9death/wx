//index.js
//获取应用实例
const app = getApp()
const recorderManager = wx.getRecorderManager()
const innerAudioContext = wx.createInnerAudioContext()
const backgroundContext = wx.getBackgroundAudioManager()
const options = {
  duration: 10000,
  sampleRate: 8000,
  numberOfChannels: 1,
  encodeBitRate: 16000,
  format: 'mp3',
  frameSize: 50
}

var utils = require('../../utils/util.js')

var usrname = ''
var resultid = ''
var questionid = 0


Page({
  data: {
    userInfo: {},
    takingPhoto: false,
    hasUserInfo: false,
    hasKnown: false,
    recordIsStart: false,
    loading: false,
    isGuest: true,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    src: '',
    text: '',
    guestName: ''
  },

  onLoad: function() {

    this.camera = wx.createCameraContext()

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      });

    }
  },

  startCamera: function(e) {

    this.setData({
      takingPhoto: true,
      hasKnown: false
    })
    this.questionid = 0
    innerAudioContext.src = 'https://liuboyang.top/media/wx/welcome.mp3'
    innerAudioContext.play()

    setTimeout(this.nextWelcome, 9000)

    setTimeout(this.takePhoto, 2000)
  },

  stopCamera: function() {
    this.setData({
      takingPhoto: false,
      hasKnown: false
    })
    this.questionid = 0

  },

  nextWelcome: function() {
    if (!this.data.hasKnown) {
      innerAudioContext.src = 'https://liuboyang.top/media/wx/welcome2.mp3'
      innerAudioContext.play()
    }

  },

  takePhoto: function() {
    this.camera.takePhoto({
      quality: 'high',
      success: this.uploadFace,
      fail: res => {
        console.log(res)
      }

    })

  },

  uploadFace: function(res) {
    console.log('这是路径' + res.tempImagePath)
    wx.uploadFile({
      url: 'https://liuboyang.top/wx/uploadimage',
      filePath: res.tempImagePath,
      name: 'tmpImg',
      success: res => {
        this.resultid = res.data;
        this.waitFaceResult()
      },
      fail: res => {
        console.log('上传失败')
        console.log(res)
      }
    })
  },

  waitFaceResult: function() {
    console.log("等待获取脸部识别结果")
    setTimeout(this.getFaceResult, 1000)

  },

  getFaceResult: function() {
    wx.request({
      url: 'https://liuboyang.top/wx/getresult',
      method: 'POST',
      header: {
        "Content-type": "application/x-www-form-urlencoded"
      },
      data: {
        'id': this.resultid
      },
      success: res => {
        console.log('收到结果' + res.data)
        if (res.data.length == 4) {
          console.log('再次等待' + this.resultid)
          this.waitFaceResult()
        } else {
          // this.genVoice(res.data)
          console.log('获取到了结果')
          this.playVoice(res.data)
        }


      },
      fail: res => {
        console.log('失败了')
        console.log(res)
      }
    })
  },

  playVoice: function(data) {
    console.log(data)
    this.username = data.split('@')[0]
    // this.username='doudou'
    if (this.username != 'guest') {
      this.setData({
        isGuest: false
      })
    }
    var url = data.split('@')[1]
    innerAudioContext.src = url
    innerAudioContext.play()
    this.setData({
      hasKnown: true,
      takingPhoto: false
    })
    this.startGame()
  },

  startGame: function() {
    switch (this.username) {
      case 'doudou':
        {
          this.setData({
            src: 'https://liuboyang.top/media/peppa.gif',
            text: '猜猜这是谁？'
          })
        }
        break;
      case 'jiaojiao':
        {
          this.setData({
            src: 'https://liuboyang.top/media/wx/yingbang.jpg',
            text: '猜猜这是哪个国家的纸币？'
          })
        }
        break;
      case 'fengfeng':
        {
          this.setData({
            text: '听听这是什么歌曲的伴奏？'
          })
          backgroundContext.src = 'https://liuboyang.top/media/wx/guxiangdeyun.mp3'
          backgroundContext.play()
        }
        break;
      case 'huahua':
        this.setData({
          src: 'https://liuboyang.top/media/wx/sanpuyouhe.jpg',
          text: '猜猜这是哪个明星'
        })
        break;
      case 'shengke':
        this.startToPlayChristmas(3000)
        break;
    }
  },


  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  startRecord: function() {
    recorderManager.start(options)
    recorderManager.onStart(() => {
      this.setData({
        recordIsStart: true
      })
      console.log('recorder start')
    })
    recorderManager.onPause(() => {
      console.log('recorder pause')
    })
    recorderManager.onStop((res) => {
      this.setData({
        recordIsStart: false
      })
      console.log('recorder stop', res)
      const {
        tempFilePath
      } = res

      this.uploadSound(tempFilePath)

    })

  },
  stopRecord: function() {
    recorderManager.stop()
  },

  uploadSound: function(fiePath) {
    wx.uploadFile({
      url: 'https://liuboyang.top/wx/uploadsound',
      filePath: fiePath,
      name: 'sound',
      success: res => {
        this.resultid = res.data
        this.watieSoundResult()
      },
      fail: res => {
        console.log(res)
      }
    })
  },

  watieSoundResult: function() {
    console.log('成功上传语音')
    setTimeout(this.getSoundResult, 1000)
  },

  getSoundResult: function() {

    wx.request({
      url: 'https://liuboyang.top/wx/getresult',
      data: {
        'id': this.resultid
      },
      method: 'POST',
      header: {
        "Content-type": "application/x-www-form-urlencoded"
      },
      success: res => {

        if (res.data.length == 4) {
          console.log('再次等待' + this.resultid)
          this.watieSoundResult()
        } else {
          this.anaylsisAnswer(res.data)
          console.log(res.data)
        }


      },
      fail: res => {
        console.log('失败了')
        console.log(res)
      }
    })

  },

  anaylsisAnswer: function(answer) {

    if (this.questionid == 0) {


      switch (this.username) {
        case 'doudou':
          {
            if (answer.indexOf('peiqi') > -1) {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/doudouar.mp3'
              this.startToPlayChristmas(3000)
            } else {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/doudouaf.mp3'

            }
            innerAudioContext.play()

          }
          break;
        case 'jiaojiao':
          {
            console.log(answer.indexOf('yingbang'))
            if (answer.indexOf('yingbang') > -1) {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/jiaojiaoar.mp3'
              this.startToPlayChristmas(7000)


            } else {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/jiaojiaoaf.mp3'
            }
            innerAudioContext.play()

          }
          break;
        case 'fengfeng':
          {
            if (answer.indexOf('guxiangdeyun') > -1) {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/fengfengar.mp3'
              this.startToPlayChristmas(3000)

            } else {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/fengfengaf.mp3'
            }
            innerAudioContext.play()

          }
          break;
        case 'huahua':
          {
            console.log(answer.indexOf('sanpuyouhe'))
            if (answer.indexOf('sanpuyouhe') > -1) {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/huahuaar.mp3'
              this.startToPlayChristmas(3000)

            } else {
              innerAudioContext.src = 'https://liuboyang.top/media/wx/huahuaaf.mp3'
            }
            innerAudioContext.play()
          }
          break;
      }

    } else {

      console.log(answer.indexOf('shengdanlaoren'))
      if (answer.indexOf('shengdan') > -1) {
        innerAudioContext.src = 'https://liuboyang.top/media/wx/santar.mp3'

      } else {
        innerAudioContext.src = 'https://liuboyang.top/media/wx/santaf.mp3'
      }
      innerAudioContext.play()
      backgroundContext.src = 'https://liuboyang.top/media/wx/jinglebell.mp3'
      backgroundContext.play()

    }


  },

  onNameBtnClick: function() {
    if (this.data.guestName != '') {
      this.setData({
        loading: true
      })
      wx.request({
        url: 'https://liuboyang.top/wx/generatevoice',
        method: 'POST',
        header: {
          "Content-type": "application/x-www-form-urlencoded"
        },
        data: {
          saywords: '你好呀，' + this.data.guestName
        },
        success: res => {
          this.resultid = res.data;
          this.waiteVoiceResult()
        },
        fail: res => {

        }
      })
    }
  },

  waiteVoiceResult: function() {
    setTimeout(this.getVoiceResult, 500)
    console.log('再次等待')
  },

  getVoiceResult: function() {
    wx.request({
      url: 'https://liuboyang.top/wx/getresult',
      method: 'POST',
      header: {
        "Content-type": "application/x-www-form-urlencoded"
      },
      data: {
        'id': this.resultid
      },
      success: res => {
        if (res.data.length == 4) {
          console.log('再次等待' + this.resultid)
          this.waiteVoiceResult()
        } else {
          console.log('转换结果：' + res.data)
          innerAudioContext.src = res.data
          innerAudioContext.play()
          this.setData({
            loading: false,
            isGuest: false

          })

          setTimeout(this.recognizeSanta, 1500)
        }
      },
      fail: res => {
        console.log('失败了')
        console.log(res)
      }
    })
  },



  onNameInput: function(e) {
    this.setData({
      guestName: e.detail.value
    })

  },

  startToPlayChristmas: function(delay) {
    this.questionid += 1
    setTimeout(this.recognizeSanta, delay)

  },


  recognizeSanta: function() {
    this.setData({
      src: 'https://liuboyang.top/media/wx/santa.gif',
      text: '猜猜图片中的人是谁？'
    })
    innerAudioContext.src = 'https://liuboyang.top/media/wx/santaq.mp3'
    innerAudioContext.play()
  }



})