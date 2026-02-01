# Blinque ⚡️

**Blinque** is a zero-touch logistics and payment engine designed specifically for the semantq Commerce ecosystem. It abstracts the complexity of shipping rate calculations and payment gateway handshakes into a single, configurable module that works as a seamless plug and play for semantq Commerce and any semantqQL backend. 

### Core Philosophy

Blinque operates on a **Provider Pattern**. This means the internal logic of your application never changes, regardless of whether you are shipping with The Courier Guy or Aramex, or processing payments via Yoco or Paystack. You simply update your credentials in the central config.

### Automated Integration

Because this is a native `semantq-module`, if you are implementing Blinque within semantqQL you do not need to import it into your `server.js`. The **SemantqQL Module Loader** will:

1. Detect the module in your `packages/` or `node_modules/` folder.
2. Automatically mount the shipping and payment routes.
3. Inject the configuration from `server.config.js`.

### Configuration Guide

Developers only need to manage the `packages` section of the semantqQL `server.config.js` file.

### 1. The config: `semantqQL/server.config.js`

```javascript
// semantqQL/server.config.js
export default {
  database: {
    adapter: 'mysql',
    config: {
      host: process.env.DB_MYSQL_HOST || 'localhost',
      port: process.env.DB_MYSQL_PORT ? parseInt(process.env.DB_MYSQL_PORT) : 3306,
      user: process.env.DB_MYSQL_USER || 'root',
      password: process.env.DB_MYSQL_PASSWORD || 'my-secret-pw',
      database: process.env.DB_MYSQL_NAME || 'botaniq',
      connectionLimit: process.env.DB_MYSQL_POOL_LIMIT || 10,
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3003,
  },
  
  // BLINQUE LOGISTICS CONFIGURATION
  // You only need to touch this section to configure provider details
  packages: {
    autoMount: true,
    shipping: {
      provider: process.env.SHIPPING_PROVIDER || 'courier_guy',
      config: {
        apiKey: process.env.TCG_API_KEY || 'your-tvc-key',
        accountNumber: process.env.TCG_ACCOUNT || 'ACC001',
        baseUrl: process.env.TCG_URL || 'https://api.thecourierguy.co.za/v1'
      },
      warehouse: {
        city: 'Johannesburg',
        postalCode: '2000',
        local_area: 'Selby' // Critical for TCG suburb matching
      }
    },
    gateways: {
      provider: process.env.PAYMENT_PROVIDER || 'yoco',
      config: {
        secretKey: process.env.YOCO_SECRET_KEY || 'sk_test_...'
      }
    }
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'uploadthing',
    uploadthing: {
      token: process.env.UPLOADTHING_TOKEN || 'sk_live_...',
      appId: process.env.UPLOADTHING_APP_ID || 'your-app-id',
    },
    // ... other storage providers
  },
  
  email: {
    driver: process.env.EMAIL_DRIVER || 'resend',
    resend_api_key: process.env.RESEND_API_KEY || 're_...',
    email_from: process.env.EMAIL_FROM || 'noreply@sender.formiquejs.com',
  },

  brand: {
    name: process.env.BRAND_NAME || 'BrandName',
    frontend_base_url: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  },

  allowedOrigins: [
    process.env.FRONTEND_BASE_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean),

  environment: process.env.NODE_ENV || 'development',
};

```

#### Shipping Setup

To enable shipping quotes, ensure your warehouse details are accurate. Shipping providers like **The Courier Guy** require specific `local_area` (suburb) and `postalCode` strings to calculate distance-based rates.

#### Payment Setup

The module is pre-wired for **Yoco**. By switching the `provider` string and providing the API Secret Key, the checkout routes will automatically pivot to the selected gateway.


### Available API Endpoints

Once the module is auto-loaded, the following routes become available under the `/{module-name}` prefix:

| Action | Endpoint | Description |
| --- | --- | --- |
| **Get Quote** | `POST /shipping/quote` | Accepts address and products; returns **signed** carrier rates. |
| **Pay** | `POST /payment/create-session` | Initiates a gateway checkout session (e.g., Yoco). |
| **Verify** | `GET /payment/verify/:id` | Confirms transaction status with the provider. |
| **Create Order** | `POST /shipping/order` | **Final Step:** Verifies quote signature and books the actual courier waybill. |

### Implementation Note for Developers

The **Create Order** route is the most critical for security. It requires the `signature` generated during the **Get Quote** phase.

By passing this signature back to the server, Blinque ensures that the shipping price paid during checkout matches the price originally quoted by the carrier, preventing "man-in-the-middle" price manipulation in the browser.

### Data Normalization

Blinque includes a built-in **Schema Mapper**. When it receives product data from your Prisma models, it automatically:

* Calculates **Volumetric Weight** vs. **Actual Weight**.
* Formats address objects to meet carrier-specific API requirements.
* Returns "Prisma-ready" objects so your main app can save to the `Delivery` or `Payment` tables immediately.

Todo: 

