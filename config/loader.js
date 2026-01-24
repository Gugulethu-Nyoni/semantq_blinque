//config/loader.js

import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Dynamically loads the server.config.js from the root of the project
 * using blinque.
 */
export async function loadAppConfig() {
  try {
    // process.cwd() points to the root of the application running the module
    const configPath = path.resolve(process.cwd(), 'semantqQL/server.config.js');
    const configUrl = pathToFileURL(configPath);
    
    const module = await import(configUrl);
    const config = module.default;

    if (!config) throw new Error("Config file found but export is empty.");

    return {
      environment: config.environment || 'development',
      shipping: {
        provider: config.packages?.shipping?.provider || 'courier_guy',
        config: config.packages?.shipping?.config || {},
        // Warehouse fallback logic
        warehouse: config.packages?.shipping?.warehouse || {
          city: "Johannesburg",
          postalCode: "2000",
          local_area: "CBD"
        }
      },
      gateways: {
        provider: config.packages?.gateways?.provider || 'yoco',
        config: config.packages?.gateways?.config || {}
      }
    };
  } catch (error) {
    console.error("Blinque Config Loader Error:", error.message);
    // Return a safe minimal config or null to force the app to handle it
    return null;
  }
}
