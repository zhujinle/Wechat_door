# Wechat_door
# Fork自Gitee，正在修改中
---
这个项目开始自2020年7月，现在已经被魔改成wzu宿舍某生活用品相关的小程序，使用的是微信小程序配合巴法云开关电磁阀，使用 `http` 协议进行通讯，具备指纹认证（iPhone为人脸）进入主界面的功能，能够显示当前电磁阀链接状态与开关状态。同时程序具备12小时不关闸自动封禁用户功能，有效防止继电器烧坏。
### 可以说是与源项目相关的只有这个看着还不错的界面了。。使用时请修改巴法云相关的id与token，需要相关的接线图请私聊。
#### 介绍
微信小程序远程控制宿舍远程开门项目。使用微信小程序WXS连接阿里云物联网，通过nodemcu控制继电器接通模拟按键输入实现开门功能

#### 软件架构
两份源码：
- init.lua: Nodemcu Lua源码，需要烧录进esp8266 lua芯片，用于连接wifi、连接阿里云物联网平台。用于控制继电器开关。
- iot-wechat: 微信小程序源码，连接阿里云物联网平台，发送开门请求


#### 使用说明

配合博客食用
项目的博客文章：https://blog.csdn.net/koevas/category_9612796.html

![在自己的宿舍实现的效果](https://images.gitee.com/uploads/images/2020/0420/113143_a9f14b7f_7368456.jpeg "TIM截图20200420113132.jpg")

![项目的思维导图](https://images.gitee.com/uploads/images/2020/0420/113354_042bb8c2_7368456.png "项目的思维导图.png")

![大致流程](https://images.gitee.com/uploads/images/2020/0420/113414_20dc5892_7368456.png "未命名文件.png")

![小程序主界面](https://images.gitee.com/uploads/images/2020/0420/113433_4df29db4_7368456.jpeg "小程序主界面.jpg")
