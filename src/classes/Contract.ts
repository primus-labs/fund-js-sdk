import { ethers } from 'ethers';

class Contract {
  address: string;
  provider: any;
  contractInstance: ethers.Contract;

  /**
   * @param chainName The name of the chain, used to identify and differentiate between different chains.
   * @param provider The provider object for the blockchain, used to establish and manage the connection with the blockchain.
   */
  constructor(provider: any, address: string, abiJson: any) {
    if (!provider || !address || !abiJson) {
        throw new Error('provider, address, and abiJson are required');
    }
    this.address = address;
    this.provider = provider;
    const signer = this.provider.getSigner();
    this.contractInstance = new ethers.Contract(this.address, abiJson, signer);
  }
  // Example method to read from the contract
  async callMethod(functionName: string, functionParams: any[]) {
    return new Promise(async (resolve, reject) => {
      if (!this.contractInstance[functionName]) {
        const error = new Error(`Method ${functionName} does not exist on the contract`);
        reject(error)
      }
      try {
        const result = await this.contractInstance[functionName](...functionParams);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
  // Example method to send a transaction
  async sendTransaction(functionName: string, functionParams: any[]) {
    return new Promise(async (resolve, reject) => {
      if (!this.contractInstance[functionName]) {
        const error = new Error(`Method ${functionName} does not exist on the contract`);
        reject(error)
      }
      try {
        console.log('sendTransaction params:',...functionParams)
        const tx = await this.contractInstance[functionName](...functionParams);
        const txreceipt = await tx.wait();
        console.log("txreceipt", txreceipt);
        resolve(txreceipt);
      } catch (error) {
        console.log("sendTransaction error:", error);
        reject(error);
        // try {
        //   await this.contractInstance.callStatic[functionName](
        //     ...functionParams
        //   );
        // } catch (error:any) {
        //   console.log("call caught error:\n",   );
        //   const { errorName } = error;
        //   console.log(errorName);
        // }
      }
    });
  }
}

export default Contract;