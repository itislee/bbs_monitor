/**
 * Home Assistant Manager for OpenClaw
 * Provides integration between OpenClaw and Home Assistant
 */

const axios = require('axios');

class HAManager {
  constructor(config) {
    this.config = config;
    this.haUrl = config.url;
    this.token = config.token;
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
    this.entities = new Map(); // 缓存实体状态
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.haUrl}/api/config`, {
        headers: this.headers
      });
      console.log('Connected to Home Assistant successfully');
      console.log(`HA Version: ${response.data.version}`);
      console.log(`Location: ${response.data.location_name}`);
      return true;
    } catch (error) {
      console.error('Failed to connect to Home Assistant:', error.message);
      return false;
    }
  }

  /**
   * 获取所有实体状态
   */
  async getAllEntities() {
    try {
      const response = await axios.get(`${this.haUrl}/api/states`, {
        headers: this.headers
      });
      
      // 更新缓存
      this.entities.clear();
      response.data.forEach(entity => {
        this.entities.set(entity.entity_id, entity);
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting entities:', error.message);
      throw error;
    }
  }

  /**
   * 获取特定实体状态
   */
  async getEntity(entityId) {
    try {
      const response = await axios.get(`${this.haUrl}/api/states/${entityId}`, {
        headers: this.headers
      });
      
      // 更新缓存
      this.entities.set(entityId, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error getting entity ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * 调用HA服务
   */
  async callService(domain, service, serviceData = {}) {
    try {
      const response = await axios.post(
        `${this.haUrl}/api/services/${domain}/${service}`,
        serviceData,
        {
          headers: this.headers
        }
      );
      
      console.log(`Service ${domain}.${service} called successfully`);
      return response.data;
    } catch (error) {
      console.error(`Error calling service ${domain}.${service}:`, error.message);
      throw error;
    }
  }

  /**
   * 获取实体的属性
   */
  async getEntityAttributes(entityId) {
    try {
      const entity = await this.getEntity(entityId);
      return entity.attributes;
    } catch (error) {
      console.error(`Error getting attributes for ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * 获取实体的当前状态
   */
  async getEntityState(entityId) {
    try {
      const entity = await this.getEntity(entityId);
      return entity.state;
    } catch (error) {
      console.error(`Error getting state for ${entityId}:`, error.message);
      throw error;
    }
  }

  /**
   * 打开/关闭开关
   */
  async toggleSwitch(switchEntityId, turnOn = null) {
    const currentState = await this.getEntityState(switchEntityId);
    let service;
    
    if (turnOn === null) {
      // 自动切换状态
      service = currentState === 'on' ? 'turn_off' : 'turn_on';
    } else if (turnOn) {
      service = 'turn_on';
    } else {
      service = 'turn_off';
    }
    
    return await this.callService('switch', service, {
      entity_id: switchEntityId
    });
  }

  /**
   * 控制灯光
   */
  async controlLight(lightEntityId, brightness = null, color = null, turnOn = null) {
    const service = turnOn === false ? 'turn_off' : 'turn_on';
    const serviceData = { entity_id: lightEntityId };
    
    if (brightness !== null) {
      serviceData.brightness_pct = brightness;
    }
    
    if (color !== null) {
      serviceData.color_name = color;
    }
    
    return await this.callService('light', service, serviceData);
  }

  /**
   * 获取传感器数据
   */
  async getSensorData(sensorEntityId) {
    try {
      const entity = await this.getEntity(sensorEntityId);
      return {
        state: entity.state,
        unit_of_measurement: entity.attributes.unit_of_measurement,
        friendly_name: entity.attributes.friendly_name,
        device_class: entity.attributes.device_class
      };
    } catch (error) {
      console.error(`Error getting sensor data for ${sensorEntityId}:`, error.message);
      throw error;
    }
  }

  /**
   * 获取区域信息
   */
  async getAreas() {
    try {
      const response = await axios.get(`${this.haUrl}/api/areas`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting areas:', error.message);
      throw error;
    }
  }

  /**
   * 获取设备信息
   */
  async getDevices() {
    try {
      const response = await axios.get(`${this.haUrl}/api/devices`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting devices:', error.message);
      throw error;
    }
  }
}

// 导出模块
module.exports = HAManager;

// 如果直接运行此脚本，进行测试
if (require.main === module) {
  console.log("HA Manager module loaded. To use it:");
  console.log("const HAManager = require('./ha_manager');");
  console.log("const ha = new HAManager({ url: 'http://...', token: '...' });");
}