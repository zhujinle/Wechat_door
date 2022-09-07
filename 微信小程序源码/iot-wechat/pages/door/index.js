var mqtt = require('../../utils/mqtt.min.js')
const crypto = require('../../utils/hex_hmac_sha1.js')
var util = require('../../utils/util.js');
var client;

const app = getApp()
/*
项目说明：
此源码博客地址：https://blog.csdn.net/Koevas/article/details/103684222
小程序的通行密码是123456，可以更改为自己的密码
正式发布小程序时，请在 项目配置 - socket合法域名  填上自己的阿里云连接
例如：wxs://a1UlGaNaaa.iot-as-mqtt.cn-shanghai.aliyuncs.com  (要改为自己的!!)
如果未修改阿里云三元组，项目里的三元组是连不上，而且会有提示xxx不在合法域名中
*/

Page({
  data: {
    uid: '400d9c25791748d39b73e0085299921b',
    topic: "washing006",
    img_url: "/img/door_a.png",
    password_input:"",
    key:"20220311",
    login: false,
    login2: false,
    ifban: false,
    button_clicking: false,
    iot_connect: false,
    connect_text: "未连接",
    nickName:"",
    powerstatus:"未知"
  },

  inputPwd:function(e){
    this.setData({
      password_input: e.detail.value
    })
  },

  confirmPwd:function(){
    var pwd = this.data.password_input;
    var that = this
    if(pwd != this.data.key){
      wx.showToast({
        title: '密码错误',
        icon: 'none',
        duration: 2000
      })
    }else{
      wx.showToast({
        title: '验证通过',
        icon: 'success',
        duration: 2000
      })
      wx.setStorage({
        key: "password",
        data: pwd,
      })
      this.login()
    }
  },

  login:function(){
    var that = this
    wx.getStorage({
      key: 'password',
      success(res) {
        console.log(res)
        var pwd = res.data
        if (pwd == that.data.key) {
          that.setData({
            login: true
          })
          that.load()
        }
      }
    })
  },

  login2:function(){
    var that = this
    wx.getUserProfile({
      desc: '用于完善信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
          login2:true
        })
        console.log(res.userInfo)
        //开始判断时间差，并决定是否封禁
        //先判断是否开着
        wx.request({
          url: 'https://api.bemfa.com/api/device/v1/data/1/', //get接口，详见巴法云接入文档
          data: {
            uid: that.data.uid,
            topic: that.data.topic,
          },
          header: {
            'content-type': "application/x-www-form-urlencoded"
          },
          success (res) {
            console.log(res.data)
            if(res.data.msg === "on"){//开着
              //开始判断是否是这个用户
                wx.request({
                  url: 'https://api.bemfa.com/api/device/v1/data/1/', //get接口，详见巴法云接入文档
                  data: {
                    uid: that.data.uid,
                    topic: "status",
                  },
                  header: {
                    'content-type': "application/x-www-form-urlencoded"
                  },
                  success (res) {
                    console.log(res.data)
                    if(res.data.msg == that.data.userInfo.nickName){//是这个用户
                      //开始判断是否大于12h小于29h
                      console.log(Date.parse(new Date())-Date.parse(res.data.time))
                      if(Date.parse(new Date())-Date.parse(res.data.time)>=43200000 && Date.parse(new Date())-Date.parse(res.data.time)<=104400000)//12h到29h
                      //if(Date.parse(new Date())-Date.parse(res.data.time)>=60000 && Date.parse(new Date())-Date.parse(res.data.time)<=120000 )//1min到2min，测试用
                      {
                        //ban的时间存入本地存储
                        wx.setStorage({
                          key: "bantime",
                          data: res.data.time,
                        })
                        //设置已经被ban
                        that.setData({
                        ifban:true,
                        bantime: res.data.time,
                      })
                      }
                    }
                    else{
                      that.setData({
                        ifban: false,
                      })
                      wx.getStorage({
                        key: 'bantime',
                        success(res) {
                          var bantime1 = res.data
                          if(Date.parse(new Date())-Date.parse(bantime1)>=43200000 && Date.parse(new Date())-Date.parse(bantime1)<=104400000)//12h到29h
                              //if(Date.parse(new Date())-Date.parse(bantime1)>=60000 && Date.parse(new Date())-Date.parse(bantime1)<=120000 )//1min到2min，测试用
                              {
                                //设置已经被ban
                                that.setData({
                                ifban:true,
                                bantime: bantime1,
                              })
                              }
                        }
                      })
                    }
                    console.log(that.data.powerstatus)
                  }
                })
                    
                  }
            else if(res.data.msg == "off"){
              that.setData({
                ifban: false
              })
              wx.getStorage({
                key: 'bantime',
                success(res) {
                  var bantime1 = res.data
                  if(Date.parse(new Date())-Date.parse(bantime1)>=43200000 && Date.parse(new Date())-Date.parse(bantime1)<=104400000)//12h到29h
                      //if(Date.parse(new Date())-Date.parse(bantime1)>=60000 && Date.parse(new Date())-Date.parse(bantime1)<=120000 )//1min到2min，测试用
                      {
                        //设置已经被ban
                        that.setData({
                        ifban:true,
                        bantime: bantime1,
                      })
                      }
                }
              })
            }
          }
        })
        //请求询问设备开关/状态
        wx.request({
          url: 'https://api.bemfa.com/api/device/v1/data/1/', //get接口，详见巴法云接入文档
          data: {
            uid: that.data.uid,
            topic: that.data.topic,
          },
          header: {
            'content-type': "application/x-www-form-urlencoded"
          },
          success (res) {
            if(res.data.msg === "on"){
              that.setData({
                powerstatus:"状态：打开"
              })
            }
            if(res.data.msg === "off"){
              that.setData({
                powerstatus:"状态：关闭"
              })
            }
          }
        })
        that.load()
      }
    })
    
  },

  onLoad: function () {
    this.login()
    this.login2()
  },
  
  command_open(){
     //当点击打开按钮，更新开关状态为打开
     var that = this
     that.setData({
       powerstatus:"开启"
     })
     var time = util.formatTime(new Date());
     wx.reportAnalytics('enterpage', {
      id: '',
      time: time,
      do: '开',
    });
      //发送记录
      wx.request({
        url: 'https://api.bemfa.com/api/device/v1/data/1/', //api接口，详见接入文档
        method:"POST",
        data: {
          uid: that.data.uid,
          topic: "status",
          msg:that.data.userInfo.nickName
        },
        header: {
          'content-type': "application/x-www-form-urlencoded"
        }})
         //控制接口
         wx.request({
          url: 'https://api.bemfa.com/api/device/v1/data/1/', //api接口，详见接入文档
          method:"POST",
          data: {  //请求字段，详见巴法云接入文档，http接口
            uid: that.data.uid,
            topic: that.data.topic,
            msg:"on"   //发送消息为on的消息
          },
          header: {
            'content-type': "application/x-www-form-urlencoded"
          },
          success (res) {
            wx.showToast({
              title:'已发送打开信号',
              icon:'success',
              duration:1000
            })
          }
        })
        wx.exitMiniProgram({success: (res) => {}})
  },

  command_close(){
    //当点击关闭按钮，更新开关状态为关闭
    var that = this
    that.setData({
      powerstatus:"关闭"
    })
    var time = util.formatTime(new Date());
     wx.reportAnalytics('enterpage', {
      id: '',
      time: time,
      do: '关',
    });
    
        //控制接口
        wx.request({
          url: 'https://api.bemfa.com/api/device/v1/data/1/', //api接口，详见接入文档
          method:"POST",
          data: {
            uid: that.data.uid,
            topic: that.data.topic,
            msg:"off"
          },
          header: {
            'content-type': "application/x-www-form-urlencoded"
          },
          success (res) {
            wx.showToast({
              title:'已发送关闭信号',
              icon:'success',
              duration:1000
            })
          }
        })
      wx.exitMiniProgram({success: (res) => {}})
 },

  button_style(){
    var that = this
    this.setData({
      img_url: "/img/door_b.png",
      button_clicking: true
    })
    setTimeout(function(){
      that.setData({
        img_url: "/img/door_a.png",
        button_clicking: false
      })
    }, 2000)
  },

  load () {
    var that = this

    //请求设备状态
    //设备断开不会立即显示离线，由于网络情况的复杂性，离线1分钟左右才判断真离线
    wx.request({
      url: 'https://api.bemfa.com/api/device/v1/status/', //状态api接口，详见巴法云接入文档
      data: {
        uid: that.data.uid,
        topic: that.data.topic,
      },
      header: {
        'content-type': "application/x-www-form-urlencoded"
      },
      success (res) {
        if(res.data.status === "online"){
          that.setData({
            device_status:"在线",
            connect_text: "连接服务器成功",
            iot_connect: true
          })
        }else{
          that.setData({
            device_status:"离线",
            connect_text: "设备掉线",
            iot_connect: false
          })
        }
      }
    })

          //请求询问设备开关/状态
          wx.request({
            url: 'https://api.bemfa.com/api/device/v1/data/1/', //get接口，详见巴法云接入文档
            data: {
              uid: that.data.uid,
              topic: that.data.topic,
            },
            header: {
              'content-type': "application/x-www-form-urlencoded"
            },
            success (res) {
              if(res.data.msg === "on"){
                that.setData({
                  powerstatus:"状态：打开"
                })
              }
              if(res.data.msg === "off"){
                that.setData({
                  powerstatus:"状态：关闭"
                })
              }
            }
          })


    //设置定时器，每五秒请求一下设备状态
    setInterval(function () {
      console.log("定时请求设备状态,默认10秒");
      wx.request({
        url: 'https://api.bemfa.com/api/device/v1/status/',  //get 设备状态接口，详见巴法云接入文档
        data: {
          uid: that.data.uid,
          topic: that.data.topic,
        },
        header: {
          'content-type': "application/x-www-form-urlencoded"
        },
        success (res) {
          if(res.data.status === "online"){
            that.setData({
              device_status:"在线",
              connect_text: "连接服务器成功",
              iot_connect: true,
            })
          }else{
            that.setData({
              device_status:"离线",
              connect_text: "设备掉线",
              iot_connect: false,
            })
          }
        }
      })

      //请求询问设备开关/状态
      wx.request({
        url: 'https://api.bemfa.com/api/device/v1/data/1/', //get接口，详见巴法云接入文档
        data: {
          uid: that.data.uid,
          topic: that.data.topic,
        },
        header: {
          'content-type': "application/x-www-form-urlencoded"
        },
        success (res) {
          if(res.data.msg === "on"){
            that.setData({
              powerstatus:"状态：打开"
            })
          }
          if(res.data.msg === "on"){
            that.setData({
              powerstatus:"状态：关闭"
            })
          }
        }
      })

    }, 10000)
  },

  /*
    生成基于HmacSha1的password
    参考文档：https://help.aliyun.com/document_detail/73742.html?#h2-url-1
  */
  signHmacSha1(params, deviceSecret) {

    let keys = Object.keys(params).sort();
    // 按字典序排序
    keys = keys.sort();
    const list = [];
    keys.map((key) => {
      list.push(`${key}${params[key]}`);
    });
    const contentStr = list.join('');
    return crypto.hex_hmac_sha1(deviceSecret, contentStr);
  }
})

