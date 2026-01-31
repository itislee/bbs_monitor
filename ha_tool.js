#!/usr/bin/env node

/**
 * Home Assistant Integration Tool for OpenClaw
 * 
 * This script provides a command-line interface to interact with Home Assistant
 * from within OpenClaw workflows.
 */

const HAManager = require('./ha_manager');
const fs = require('fs').promises;

// Load configuration from a file or environment
async function loadHAConfig() {
  try {
    // Try to load from a config file first
    const configPath = './ha_config.json';
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    // If config file doesn't exist, look for environment variables
    const url = process.env.HA_URL;
    const token = process.env.HA_TOKEN;
    
    if (url && token) {
      return { url, token };
    }
    
    throw new Error('HA configuration not found. Please create ha_config.json or set HA_URL and HA_TOKEN environment variables.');
  }
}

/**
 * Main function to handle different commands
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Home Assistant Integration Tool for OpenClaw

Usage:
  node ha_tool.js test                    - Test connection to HA
  node ha_tool.js entities                - Get all entities
  node ha_tool.js entity <entity_id>     - Get specific entity state
  node ha_tool.js call <domain> <service> [service_data] - Call a service
  node ha_tool.js sensor <entity_id>     - Get sensor data
  node ha_tool.js light <entity_id> [brightness] [color] [on/off] - Control light
  node ha_tool.js switch <entity_id> [on/off] - Control switch

Examples:
  node ha_tool.js test
  node ha_tool.js entities
  node ha_tool.js entity light.living_room
  node ha_tool.js call switch turn_on '{"entity_id":"switch.outdoor_light"}'
  node ha_tool.js sensor sensor.temperature
  node ha_tool.js light light.bedroom 80 red on
  node ha_tool.js switch switch.plug_1 off
    `);
    return;
  }
  
  const command = args[0];
  
  try {
    // Load HA configuration
    const config = await loadHAConfig();
    
    // Initialize HA manager
    const ha = new HAManager(config);
    
    // Execute command
    switch (command) {
      case 'test':
        await testConnection(ha);
        break;
        
      case 'entities':
        await getAllEntities(ha);
        break;
        
      case 'entity':
        if (args.length < 2) {
          console.error('Please provide an entity ID');
          return;
        }
        await getEntity(ha, args[1]);
        break;
        
      case 'call':
        if (args.length < 3) {
          console.error('Please provide domain and service');
          return;
        }
        const serviceData = args[3] ? JSON.parse(args[3]) : {};
        await callService(ha, args[1], args[2], serviceData);
        break;
        
      case 'sensor':
        if (args.length < 2) {
          console.error('Please provide a sensor entity ID');
          return;
        }
        await getSensorData(ha, args[1]);
        break;
        
      case 'light':
        if (args.length < 2) {
          console.error('Please provide a light entity ID');
          return;
        }
        const lightArgs = args.slice(1);
        await controlLight(ha, ...lightArgs);
        break;
        
      case 'switch':
        if (args.length < 2) {
          console.error('Please provide a switch entity ID');
          return;
        }
        const switchArgs = args.slice(1);
        await controlSwitch(ha, ...switchArgs);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Use "node ha_tool.js" for usage information');
    }
  } catch (error) {
    console.error('Error executing command:', error.message);
    process.exit(1);
  }
}

async function testConnection(ha) {
  console.log('Testing connection to Home Assistant...');
  const isConnected = await ha.testConnection();
  if (isConnected) {
    console.log('✓ Connected to Home Assistant successfully');
  } else {
    console.log('✗ Failed to connect to Home Assistant');
    process.exit(1);
  }
}

async function getAllEntities(ha) {
  console.log('Getting all entities from Home Assistant...');
  const entities = await ha.getAllEntities();
  
  console.log(`Found ${entities.length} entities:`);
  entities.forEach(entity => {
    console.log(`  ${entity.entity_id}: ${entity.state}`);
  });
}

async function getEntity(ha, entityId) {
  console.log(`Getting state for entity: ${entityId}`);
  const entity = await ha.getEntity(entityId);
  
  console.log(`Entity: ${entity.entity_id}`);
  console.log(`State: ${entity.state}`);
  console.log('Attributes:');
  Object.entries(entity.attributes).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
}

async function callService(ha, domain, service, serviceData) {
  console.log(`Calling service: ${domain}.${service}`);
  console.log('Service data:', JSON.stringify(serviceData, null, 2));
  
  const result = await ha.callService(domain, service, serviceData);
  console.log('Service called successfully');
  console.log('Result:', JSON.stringify(result, null, 2));
}

async function getSensorData(ha, sensorId) {
  console.log(`Getting sensor data for: ${sensorId}`);
  const sensorData = await ha.getSensorData(sensorId);
  
  console.log(`Sensor: ${sensorData.friendly_name || sensorId}`);
  console.log(`State: ${sensorData.state} ${sensorData.unit_of_measurement || ''}`);
  console.log(`Device Class: ${sensorData.device_class || 'N/A'}`);
}

async function controlLight(ha, entityId, brightness = null, color = null, turnOn = null) {
  console.log(`Controlling light: ${entityId}`);
  
  // Parse parameters
  let parsedBrightness = null;
  let parsedColor = null;
  let parsedTurnOn = null;
  
  if (brightness && !isNaN(parseInt(brightness))) {
    parsedBrightness = parseInt(brightness);
  }
  
  if (color && !color.match(/^(on|off)$/)) {
    parsedColor = color;
  }
  
  if (turnOn === 'on') parsedTurnOn = true;
  if (turnOn === 'off') parsedTurnOn = false;
  
  console.log(`Setting brightness: ${parsedBrightness}, color: ${parsedColor}, turnOn: ${parsedTurnOn}`);
  
  const result = await ha.controlLight(entityId, parsedBrightness, parsedColor, parsedTurnOn);
  console.log('Light controlled successfully');
  console.log('Result:', JSON.stringify(result, null, 2));
}

async function controlSwitch(ha, entityId, turnOn = null) {
  console.log(`Controlling switch: ${entityId}`);
  
  let parsedTurnOn = null;
  if (turnOn === 'on') parsedTurnOn = true;
  if (turnOn === 'off') parsedTurnOn = false;
  
  console.log(`Turning switch ${parsedTurnOn === null ? 'toggle' : (parsedTurnOn ? 'ON' : 'OFF')}`);
  
  const result = await ha.toggleSwitch(entityId, parsedTurnOn);
  console.log('Switch controlled successfully');
  console.log('Result:', JSON.stringify(result, null, 2));
}

// Run main function
main().catch(console.error);