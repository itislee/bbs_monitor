const HomeAssistantIntegration = require('./ha_integration');

// 请替换为您的HA地址和访问令牌
const HA_URL = 'http://your-ha-ip:8123';  // 例如：http://192.168.1.100:8123
const HA_TOKEN = 'your-long-lived-token';  // 您生成的访问令牌

async function testHAIntegration() {
  const ha = new HomeAssistantIntegration(HA_URL, HA_TOKEN);

  console.log('Testing Home Assistant integration...\n');

  // 测试获取配置
  console.log('1. Getting HA configuration...');
  const config = await ha.getConfig();
  if (config) {
    console.log('HA Version:', config.version);
    console.log('Location Name:', config.location_name);
    console.log('Unit System:', config.unit_system);
  } else {
    console.log('Failed to get configuration. Please check your URL and token.');
    return;
  }

  console.log('\n2. Getting all entity states...');
  const states = await ha.getAllStates();
  if (states) {
    console.log(`Found ${states.length} entities in your HA instance.`);
    
    // 显示一些常见的实体类型
    const lights = states.filter(entity => entity.entity_id.startsWith('light.'));
    const switches = states.filter(entity => entity.entity_id.startsWith('switch.'));
    const sensors = states.filter(entity => entity.entity_id.startsWith('sensor.'));
    
    console.log(`Lights: ${lights.length}`);
    console.log(`Switches: ${switches.length}`);
    console.log(`Sensors: ${sensors.length}`);
  }

  console.log('\n3. Example: Getting a specific entity state...');
  // 这里您可以替换为您实际的实体ID
  const exampleEntity = states && states.length > 0 ? states[0].entity_id : null;
  if (exampleEntity) {
    console.log(`Getting state for: ${exampleEntity}`);
    const entityState = await ha.getState(exampleEntity);
    if (entityState) {
      console.log('State:', entityState.state);
      console.log('Attributes:', JSON.stringify(entityState.attributes, null, 2));
    }
  }
  
  console.log('\nTest completed. Replace the HA_URL and HA_TOKEN with your actual values.');
}

// 运行测试
testHAIntegration().catch(console.error);