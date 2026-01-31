# Home Assistant Integration for OpenClaw

This guide explains how to integrate your Home Assistant instance with OpenClaw to control smart home devices and retrieve sensor data.

## Prerequisites

1. A running Home Assistant instance
2. A Long-Lived Access Token from Home Assistant
3. Network connectivity between OpenClaw and Home Assistant

## Setup

### Step 1: Generate Access Token in Home Assistant

1. Log into your Home Assistant instance
2. Click on your user profile in the bottom left
3. Select "Profile"
4. Scroll down to "Long-Lived Access Tokens"
5. Click "CREATE TOKEN"
6. Give it a name (e.g., "OpenClaw Integration") and click OK
7. Copy the generated token (you won't see it again)

### Step 2: Configure the Integration

1. Edit the `ha_config.json` file:
   ```bash
   nano /Users/yaoli/.openclaw/workspace/ha_config.json
   ```

2. Replace the placeholder values:
   - `url`: Your Home Assistant URL (e.g., `http://192.168.1.100:8123`)
   - `token`: The Long-Lived Access Token you generated

### Step 3: Test the Connection

Run the test command:
```bash
node /Users/yaoli/.openclaw/workspace/ha_tool.js test
```

## Available Commands

### Basic Commands

- Test connection:
  ```bash
  node ha_tool.js test
  ```

- Get all entities:
  ```bash
  node ha_tool.js entities
  ```

- Get specific entity state:
  ```bash
  node ha_tool.js entity light.living_room
  ```

- Get sensor data:
  ```bash
  node ha_tool.js sensor sensor.temperature_outside
  ```

### Controlling Devices

- Control a light:
  ```bash
  # Turn on with 80% brightness
  node ha_tool.js light light.bedroom 80
  
  # Turn off
  node ha_tool.js light light.bedroom null null off
  
  # Turn on with specific color
  node ha_tool.js light light.living_room 100 red on
  ```

- Control a switch:
  ```bash
  # Toggle switch
  node ha_tool.js switch switch.outdoor_plug
  
  # Turn switch on
  node ha_tool.js switch switch.outdoor_plug on
  
  # Turn switch off
  node ha_tool.js switch switch.outdoor_plug off
  ```

- Call any service:
  ```bash
  node ha_tool.js call switch turn_on '{"entity_id":"switch.outdoor_light"}'
  ```

## Using in OpenClaw Workflows

You can incorporate HA commands into your OpenClaw workflows using the exec tool:

```javascript
// Example: Get temperature sensor value
const result = await exec({
  command: "node /Users/yaoli/.openclaw/workspace/ha_tool.js sensor sensor.temperature_living_room"
});

// Example: Turn on a light
await exec({
  command: "node /Users/yaoli/.openclaw/workspace/ha_tool.js light light.living_room null null on"
});
```

## Security Considerations

1. Keep your access token secure
2. Ensure your Home Assistant instance is protected from unauthorized access
3. Use strong passwords and enable 2FA where possible
4. Regularly rotate your access tokens

## Troubleshooting

- If you get connection errors, verify:
  - Your HA URL is correct and accessible
  - Your access token is valid
  - Your firewall/network allows the connection
  - Your HA instance is running

- Check Home Assistant logs for authentication errors
- Verify that your token has the necessary permissions