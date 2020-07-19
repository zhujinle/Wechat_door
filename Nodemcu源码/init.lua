
-- wifi config
station_cfg = {}
station_cfg.ssid = "gztedu"
station_cfg.pwd = "tedu12345"

-- topic
topic0 = "/a1UlGaNjWAO/Class_Door/user/message"

-- aliyun IOT config
ProductKey = "a1UlGaNjWAO"
DeviceName = "Class_Door"
DeviceSecret = "la4SrMo4OFivG9i3UYQ1kCoOgwznu5fX"

mqttAddress = ProductKey .. ".iot-as-mqtt.cn-shanghai.aliyuncs.com"
mqttPort = 1883
ClientID = DeviceName .. "|securemode=3,signmethod=hmacsha1|"
UserName = DeviceName .. "&" .. ProductKey
hmac_data = "clientId" .. DeviceName .. "deviceName" .. DeviceName .. "productKey" .. ProductKey
Password = crypto.toHex(crypto.hmac("sha1", hmac_data, DeviceSecret))

-- wifi connect
print('Setting up WIFI...')
wifi.setmode(wifi.STATION)
wifi.sta.config(station_cfg)

-- wifi eventmon
wifi.eventmon.register(wifi.eventmon.STA_CONNECTED, function(T)
    print("wifi connecting...")
end)

wifi.eventmon.register(wifi.eventmon.STA_GOT_IP, function(T)
    print("wifi connect:" .. wifi.sta.getip())
end)

wifi.eventmon.register(wifi.eventmon.STA_DISCONNECTED, function(T)
    print("wifi disconnect...")
end)

-- aliyun iot connect
MQTT_connect_Flag = 0
myMQTT = mqtt.Client(ClientID, 120, UserName, Password)

Connect_timer = tmr.create()
Connect_timer:alarm(1000, tmr.ALARM_SEMI, function()
    if myMQTT ~= nil then
        print("MQTT client connect...")
        myMQTT:connect(mqttAddress, mqttPort, 0, mqtt_connect, mqtt_disconnect)
        
        -- nodemcu led: light  Means connecting
        gpio.mode(4, gpio.OUTPUT)
        gpio.write(4, gpio.LOW)
    end
end)

function mqtt_connect(client)
    print("mqtt connect success")
    myMQTT = client
    MQTT_connect_Flag = 1
    client:subscribe(topic0, 0, function(client)
        print("subscribe success")
    end)
    Connect_timer:stop()

    -- nodemcu led: lighting-off
    -- Means MQTT Connection Complete
    gpio.write(4, gpio.HIGH)
end

function mqtt_disconnect(client, reason)
    print("mqtt connect Fail:" .. reason)
    MQTT_connect_Flag = 0
    Connect_timer:start()
end


-- mqtt client offline event
myMQTT:on("offline", function(client)
    print("mqtt client offline event")
    Connect_timer:start()
end)

-- mqtt client message event
myMQTT:on("message", function(client, topic, data)
    print(topic .. ":" .. data)
    t = sjson.decode(data)
    if t["method"] == "thing.service.DoorOpen" then
        DoorOpen()
    end
end)

-- Open the door for 3 seconds
function DoorOpen()
    pin = 3
    -- 20 - 130
    pwm.setup(pin, 50, 40)
    pwm.start(pin)
    print("start move position")
    tmr.create():alarm(3000, tmr.ALARM_SINGLE, function()
        print("recover position")
        pwm.setduty(pin, 120)
        pwm.stop(pin)
    end)
end


