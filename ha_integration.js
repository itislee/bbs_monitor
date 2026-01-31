const axios = require('axios');

class HomeAssistantIntegration {
  constructor(haUrl, token) {
    this.haUrl = haUrl;
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // 获取所有实体状态
  async getAllStates() {
    try {
      const response = await axios.get(`${this.haUrl}/api/states`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting states:', error.message);
      return null;
    }
  }

  // 获取特定实体状态
  async getState(entityId) {
    try {
      const response = await axios.get(`${this.haUrl}/api/states/${entityId}`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting state for ${entityId}:`, error.message);
      return null;
    }
  }

  // 调用服务
  async callService(domain, service, serviceData = {}) {
    try {
      const response = await axios.post(
        `${this.haUrl}/api/services/${domain}/${service}`,
        serviceData,
        {
          headers: this.headers
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error calling service ${domain}.${service}:`, error.message);
      return null;
    }
  }

  // 获取配置信息
  async getConfig() {
    try {
      const response = await axios.get(`${this.haUrl}/api/config`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting config:', error.message);
      return null;
    }
  }
}

module.exports = HomeAssistantIntegration;