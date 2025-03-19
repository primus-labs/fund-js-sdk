
## Overview

When integrating the tipping solution with your DApp (especially  **web-based DApps** DApps), you can use the Primus Tip SDK.

With the Tip SDK, donors can send tips to specific users, and the recipients can claim the tips after verifying their identity. For example, influencers with many fans can tip their followers. The followers generate proof, verify their identity, and then claim the tip. To verify the user's identity, follow these simple steps:

- **Install Primus Extension**: [Primus Extension](https://chromewebstore.google.com/detail/pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)

- **Create a Template**: Use the [Primus Develop Hub](https://dev.primuslabs.xyz) to easily set up a data verification template. This template includes the target data items, allowing you to test the verification process.

- **Create a Project**: Use the [Primus Develop Hub](https://dev.primuslabs.xyz) to obtain a paired appID and appSecret.

For more details on creating templates and setting up your project, refer to the [Developer Hub](https://docs.primuslabs.xyz/data-verification/developer-hub).

### How to Integrate

Here's a simplified flow of how Primus Tip SDK integrates with a web-based DApp:

**1. Install Primus Extension:** [Primus Extension](https://chromewebstore.google.com/detail/pado/oeiomhmbaapihbilkfkhmlajkeegnjhe)

**2. Create/Search Template:** Login to the [Primus Develop Hub](https://dev.primuslabs.xyz) to create or search for a Template containing the data you need to verify. This is a key step in integrating the Tip SDK into your DApp.

**3. Create Project:** Create a Project on the [Primus Develop Hub](https://dev.primuslabs.xyz) to obtain a paired appID and appSecret, which are required to use the Tip SDK.

**4. Tip :** Donors send tips to specific users. Refer to the [production example](./production) for guidance.

**5. Verify :** Recipients verifying their identity. Refer to the [production example](./production) for guidance.

**6. Claim :** Recipients claim the tips. Refer to the [production example](./production) for guidance.

### Quick Start for Beginners

1. [Installation](./install) Get the SDK set up in your project.

2. [Production Example](./production) Understand how to use the Tip SDK.


### Stay Connected

Keep up with the latest Primus developments:

- Star our [GitHub Repository](https://github.com/primus-labs/zktls-js-sdk)
- Join our [Discord Community](https://discord.gg/AYGSqCkZTz)
