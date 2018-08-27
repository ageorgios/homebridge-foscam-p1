var Service, Characteristic;
var parseString = require('xml2js').parseString;
var http = require('http');

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-foscam-p1", "FoscamP1", FoscamP1Accessory);
}

function FoscamP1Accessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"];
  this.description = config["description"];
  this.hostname = config["hostname"] || "foscam";
  this.port = config["port"] || "88";
  this.username = config["username"] || "admin";
  this.password = config["password"] || "root";

  this.service1 = new Service.HumiditySensor(this.name);
  this.service1
    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
    .on('get', this.getState1.bind(this));
    
  this.service2 = new Service.Switch(this.name);
  this.service2
    .getCharacteristic(Characteristic.On)
    .on('get', this.getState2.bind(this))
    .on('set', this.setState2.bind(this));
  
  this.service3 = new Service.TemperatureSensor(this.name);
  this.service3
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getState3.bind(this));

  this.log("Foscam P1 Initialized")
}

FoscamP1Accessory.prototype.getState1 = function(callback) {
  var that = this
  xmlToJson("http://" + this.hostname + ":" + this.port +"/cgi-bin/CGIProxy.fcgi?cmd=getHumidityState&usr="+this.username+"&pwd="+this.password, function(err, data) {
    if (err) return callback(err);
    that.log("Foscam Humidity: " + JSON.stringify(data));
    callback(null, parseFloat(data.CGI_Result.humidity[0]))
  })
}

FoscamP1Accessory.prototype.getState2 = function(callback) {
  var that = this
  xmlToJson("http://" + this.hostname + ":" + this.port +"/cgi-bin/CGIProxy.fcgi?cmd=getNightLightState&usr="+this.username+"&pwd="+this.password, function(err, data) {
    if (err) return callback(err);
    that.log("Foscam NightLight Get State: " + JSON.stringify(data));
    callback(null, parseFloat(data.CGI_Result.state[0]))
  })
}

FoscamP1Accessory.prototype.setState2 = function(toggle, callback) {
  var newstate = 0
  if (toggle) newstate = 1
  var that = this
  xmlToJson("http://" + this.hostname + ":" + this.port +"/cgi-bin/CGIProxy.fcgi?cmd=setNightLightState&state="+newstate+"&usr="+this.username+"&pwd="+this.password, function(err, data) {
    if (err) return callback(err);
    that.log("Foscam NightLight Set State " + newstate + ": " + JSON.stringify(data));
    callback()
  })
}

FoscamP1Accessory.prototype.getState3 = function(callback) {
  var that = this
  xmlToJson("http://" + this.hostname + ":" + this.port +"/cgi-bin/CGIProxy.fcgi?cmd=getTemperatureState&usr="+this.username+"&pwd="+this.password, function(err, data) {
    if (err) return callback(err);
    that.log("Foscam Temperature: " + JSON.stringify(data));
    callback(null, parseFloat(data.CGI_Result.degree[0]))
  })
}

FoscamP1Accessory.prototype.getServices = function() {
  return [this.service1, this.service2, this.service3];
}

function xmlToJson(url, callback) {
  var req = http.get(url, function(res) {
    var xml = '';
    res.on('data', function(chunk) {
      xml += chunk;
    });
    res.on('error', function(e) {
      callback(e, null);
    }); 
    res.on('timeout', function(e) {
      callback(e, null);
    }); 
    res.on('end', function() {
      parseString(xml, function(err, result) {
        if (err) return callback(err, null);
        callback(null, result);
      });
    });
  });
}
