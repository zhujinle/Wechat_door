var mqtt = require('../../utils/mqtt.min.js')
const crypto = require('../../utils/hex_hmac_sha1.js')
var client;

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
    img_url: "/img/door_a.png",
    password_input:"",
    key:"123456",
    login: false,
    button_clicking: false,
    iot_connect: false,
    connect_text: "未连接",
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
          that.doConnect()
        }
      }
    })
  },

  onLoad: function () {
    this.login()
  },
  doConnect() {
    var that = this;
    // 下面的信息要换成自己的阿里云三元组
    const deviceConfig = {
      productKey: "a1UlGaNaaa",
      deviceName: "Door_Console",
      deviceSecret: "YD0Oz4kO2PqdVLtqQ8unhr6LAKraaaaa",
      regionId: "cn-shanghai"
    };
    const options = this.initMqttOptions(deviceConfig);
    console.log(options)
    //替换productKey为你自己的产品的
    client = mqtt.connect('wxs://a1UlGaNaaa.iot-as-mqtt.cn-shanghai.aliyuncs.com', options)
    client.on('connect', function () {
      that.setData({
        connect_text: "连接服务器成功",
        iot_connect: true
      })

      //订阅主题，替换productKey和deviceName(这里的主题可能会不一样，具体请查看后台设备Topic列表或使用自定义主题)
      // client.subscribe('/a1UlGaNjWAO/Door_Console/user/message', function (err) {
      //   if (!err) {
      //     console.log('订阅成功！');
      //   }
      // })
    })
    //接收消息监听
    client.on('message', function (topic, message) {
      // message is Buffer
      console.log('收到消息：' + message.toString())
      //关闭连接 client.end()
    })
  },
  //IoT平台mqtt连接参数初始化
  initMqttOptions(deviceConfig) {

    const params = {
      productKey: deviceConfig.productKey,
      deviceName: deviceConfig.deviceName,
      timestamp: Date.now(),
      clientId: Math.random().toString(36).substr(2),
    }
    //CONNECT参数
    const options = {
      keepalive: 60, //60s
      clean: true, //cleanSession不保持持久会话
      protocolVersion: 4 //MQTT v3.1.1
    }
    //1.生成clientId，username，password
    options.password = this.signHmacSha1(params, deviceConfig.deviceSecret);
    options.clientId = `${params.clientId}|securemode=2,signmethod=hmacsha1,timestamp=${params.timestamp}|`;
    options.username = `${params.deviceName}&${params.productKey}`;

    return options;
  },

  command_opendoor(){
    if(!this.data.button_clicking && this.data.iot_connect){
      this.button_style()
      var connectText = '{ "method": "thing.service.DoorOpen"}'
      client.publish('/a1UlGaNjWAO/Door_Console/user/message', connectText, function (err){
        if (!err) {
          console.log('开门指令发送成功！');
        }
      })
    }
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

