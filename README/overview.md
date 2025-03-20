
## Overview

To onboard more Web2 users into crypto, Primus has developed a fund process powered by **zkTLS**, enabling you to send crypto directly to anyone’s social account.

For any DApps or projects, simply integrate with the **Primus Fund SDK**, set key parameters such as the token tokenAmount, the receivers’ social accounts, a unique user identifier, and a configurable processing deadline. Submit a transaction to the fund contract, and the process will be handled automatically.

When users want to claim their tokens, they simply need to prove ownership of their social account to gain the right to claim them. For more details on verification and claiming, please refer to the [Receiver Guide](./receiver-guide.md).

### How to Integrate

The workflow for integrating and using the Fund SDK and contract is as follows:

1. **Create a Project**: Create a project on the [Primus Develop Hub](https://dev.primuslabs.xyz/) to obtain a paired appID and appSecret, which are required to use the Fund SDK.
2. **Install the SDK**: Complete the installation of the Primus Fund SDK. Refer to the [Installation Guide](./install.md) for detailed instructions.
3. **Configure Parameters**: Ensure that all key parameters required for the fund contract are configured correctly. Refer to the [Example](./example.md) for guidance.
4. **Execute the Transaction**: Use the Fund SDK via your DApp or project to complete the transaction to the fund contract.
5. **Execute Business Logic**: Upon successful initiation of the fund contract, you can execute relevant business logic, such as notifying receivers to claim their tokens or triggering other operations.
6. **Refund Unclaimed Tokens**: If tokens remain unclaimed after a predefined period, a refund transaction can be initiated to return the remaining tokens to the original wallet address.

### Supported Blockchains and Tokens

The Primus fund contract is compatible with multiple blockchains. Currently, support is available for the testnets and mainnets listed below. More blockchains will be added in the future.

| Testnet | Mainnet  |
| ------- | -------- |
| Monad Testnet    | Ethereum |
| Sepolia |          |

On each blockchain, both native tokens and ERC-20 tokens are supported. ERC-721 support will be available soon.

### Stay Connected

Keep up with the latest Primus developments:

- Star our [GitHub Repository](https://github.com/primus-labs/fund-js-sdk)
- Join our [Discord Community](https://discord.gg/AYGSqCkZTz)
