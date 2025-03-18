
## Overview

When integrating the tipping solution with your DApp (especially  **web-based DApps** DApps), you can use the Primus Tip SDK.

With the Tip SDK, donors can send tips to specific users, and the recipients can claim the tips after verifying their identity. For example, influencers with many fans can tip their followers. The followers generate proof, verify their identity, and then claim the tip. To verify the user's identity, follow these simple steps:

- **Create a Template**: Use the [Primus Develop Hub](https://dev.primuslabs.xyz) to easily set up a data verification template. This template includes the target data items, allowing you to test the verification process.

- **Create a Project**: Obtain a paired appID and appSecret, then configure them in your DApp to integrate the [zkTLS SDK](/data-verification/zk-tls-sdk/test) and APIs.

For more details on creating templates and setting up your project, refer to the [Developer Hub](/data-verification/developer-hub).

### How to Integrate

Here's a simplified flow of how Primus Tip SDK integrates with a web-based DApp:

**1. Create/Search Template:** Login to the [Primus Develop Hub](https://dev.primuslabs.xyz) to create or search for a Template containing the data you need to verify. This is a key step in integrating the zkTLS SDK into your DApp.

**2. Create Project:** Create a Project on the [Primus Develop Hub](https://dev.primuslabs.xyz) to obtain a paired appID and appSecret, which are required to use the zkTLS SDK.

**3. Configure Verification Parameters:** Ensure the SDK parameters are configured correctly. Refer to the [production example](/data-verification/zk-tls-sdk/production) for guidance.

**4. Tip :** Donors send tips to specific users.

**5. Verify :** Recipients verifying their identity.

**6. Claim :** Recipients claim the tips.

### Quick Start for Beginners

1. [Installation](/data-verification/zk-tls-sdk/install) Get the SDK set up in your project.

2. [Production Example](/data-verification/zk-tls-sdk/production) Understand how to use the Tip SDK.


### Stay Connected

Keep up with the latest Primus developments:

- Star our [GitHub Repository](https://github.com/primus-labs/zktls-js-sdk)
- Join our [Discord Community](https://discord.gg/AYGSqCkZTz)
