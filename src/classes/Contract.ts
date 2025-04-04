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
        return reject(`Method ${functionName} does not exist on the contract`)
      }
      try {
        const result = await this.contractInstance[functionName](...functionParams);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }
  // Example method to send a transaction
  async sendTransaction(functionName: string, functionParams: any[]) {
    return new Promise(async (resolve, reject) => {
      if (!this.contractInstance[functionName]) {
        return reject(`Method ${functionName} does not exist on the contract`)
      }
      try {
        console.log('sendTransaction params:', ...functionParams)
        const tx = await this.contractInstance[functionName](...functionParams);
        const txreceipt = await tx.wait();
        console.log("txreceipt", txreceipt);
        resolve(txreceipt);
      } catch (error: any) {
        console.log("sendTransaction error:", error);
        // console.log('error-message',error?.message)
        // console.log('error-message',error?.toString()?.toLowerCase().indexOf('user rejected') > -1)
        // console.log('error-reason',error?.reason)
        // console.log('error-data-message', error?.data?.message)
        const errStr = error?.toString()?.toLowerCase() || ''
        if (error?.code === 'ACTION_REJECTED' || errStr.indexOf('user rejected') > -1 || errStr.indexOf('approval denied') > -1) {
          return reject('user rejected transaction')
        }
        if (error?.reason) {
          return reject(error.reason)
        }
        if (error?.data?.message === 'insufficient balance') {
          return reject(error?.data?.message)
        }
        return reject(error)
      }
    });
  }
}

export default Contract;