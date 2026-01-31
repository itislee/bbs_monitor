/**
 * Home Assistant Integration Usage Example for OpenClaw
 * 
 * This example demonstrates how to integrate Home Assistant with OpenClaw
 * for controlling smart home devices and retrieving sensor data.
 */

const HAManager = require('./ha_manager');

// Configuration - replace with your actual HA details
const haConfig = {
  url: 'http://your-ha-ip:8123',  // Replace with your HA IP and port
  token: 'your-long-lived-token'   // Replace with your access token
};

// Initialize HA manager
const ha = new HAManager(haConfig);

/**
 * Example function to demonstrate HA integration in OpenClaw
 */
async function demoHAIntegration() {
  console.log('Starting Home Assistant integration demo...\n');
  
  // Test connection
  const isConnected = await ha.testConnection();
  if (!isConnected) {
    console.error('Cannot connect to Home Assistant. Please check your configuration.');
    return;
  }
  
  console.log('\n--- Getting all entities ---');
  try {
    const entities = await ha.getAllEntities();
    console.log(`Found ${entities.length} entities in HA`);
    
    // Filter some common entity types
    const lights = entities.filter(e => e.entity_id.startsWith('light.'));
    const switches = entities.filter(e => e.entity_id.startsWith('switch.'));
    const sensors = entities.filter(e => e.entity_id.startsWith('sensor.'));
    
    console.log(`Lights: ${lights.length}`);
    console.log(`Switches: ${switches.length}`);
    console.log(`Sensors: ${sensors.length}`);
    
    // Show first few entities as examples
    console.log('\nFirst 5 entities:');
    entities.slice(0, 5).forEach(entity => {
      console.log(`- ${entity.entity_id}: ${entity.state}`);
    });
  } catch (error) {
    console.error('Error getting entities:', error.message);
  }
  
  console.log('\n--- Example operations ---');
  
  // Example: Get a specific sensor value
  try {
    // Find a temperature sensor if available
    const tempSensors = entities.filter(e => 
      e.entity_id.startsWith('sensor.') && 
      (e.entity_id.includes('temperature') || e.attributes.device_class === 'temperature')
    );
    
    if (tempSensors.length > 0) {
      const sensor = tempSensors[0];
      console.log(`\nGetting temperature from: ${sensor.entity_id}`);
      const tempData = await ha.getSensorData(sensor.entity_id);
      console.log(`Temperature: ${tempData.state} ${tempData.unit_of_measurement}`);
    } else {
      console.log('\nNo temperature sensors found');
    }
  } catch (error) {
    console.error('Error getting sensor data:', error.message);
  }
  
  // Example: Control a light (if available)
  try {
    const lights = entities.filter(e => e.entity_id.startsWith('light.'));
    if (lights.length > 0) {
      const light = lights[0];
      console.log(`\nFound light: ${light.entity_id} (state: ${light.state})`);
      
      // Note: We won't actually toggle it in this demo to avoid changing your setup
      console.log(`Would control light: ${light.entity_id}`);
      console.log('To actually control, uncomment the control code in the function');
      
      // Example of how to control:
      /*
      if (light.state === 'on') {
        console.log('Turning off the light...');
        await ha.controlLight(light.entity_id, null, null, false);
      } else {
        console.log('Turning on the light...');
        await ha.controlLight(light.entity_id, null, null, true);
      }
      */
    } else {
      console.log('\nNo lights found to control');
    }
  } catch (error) {
    console.error('Error controlling light:', error.message);
  }
  
  console.log('\n--- Demo completed ---');
}

/**
 * Function to create custom commands for OpenClaw
 * This can be integrated into your OpenClaw workflow
 */
function createHACommands() {
  return {
    // Command to get HA status
    getHAStatus: async () => {
      try {
        const entities = await ha.getAllEntities();
        const lights = entities.filter(e => e.entity_id.startsWith('light.'));
        const switches = entities.filter(e => e.entity_id.startsWith('switch.'));
        const sensors = entities.filter(e => e.entity_id.startsWith('sensor.'));
        
        return {
          connected: true,
          total_entities: entities.length,
          lights: lights.length,
          switches: switches.length,
          sensors: sensors.length
        };
      } catch (error) {
        return { connected: false, error: error.message };
      }
    },
    
    // Command to get specific entity state
    getEntityState: async (entityId) => {
      try {
        const entity = await ha.getEntity(entityId);
        return {
          entity_id: entity.entity_id,
          state: entity.state,
          attributes: entity.attributes
        };
      } catch (error) {
        return { error: error.message };
      }
    },
    
    // Command to toggle a switch
    toggleSwitch: async (switchEntityId) => {
      try {
        const currentState = await ha.getEntityState(switchEntityId);
        const result = await ha.toggleSwitch(switchEntityId);
        return {
          success: true,
          entity_id: switchEntityId,
          previous_state: currentState,
          new_state: currentState === 'on' ? 'off' : 'on'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    // Command to control a light
    controlLight: async (lightEntityId, brightness, color, turnOn) => {
      try {
        const result = await ha.controlLight(lightEntityId, brightness, color, turnOn);
        return {
          success: true,
          entity_id: lightEntityId,
          operation: turnOn !== undefined ? (turnOn ? 'turn_on' : 'turn_off') : 'adjust',
          brightness: brightness,
          color: color
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };
}

// Export the HA integration
module.exports = {
  HAManager,
  haConfig,
  demoHAIntegration,
  createHACommands
};

// Run demo if this script is executed directly
if (require.main === module) {
  demoHAIntegration().catch(console.error);
}