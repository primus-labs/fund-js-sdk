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
    let formatProvider;
    if (provider instanceof ethers.providers.JsonRpcProvider) {
        // console.log('provider is JsonRpcProvider')
        formatProvider = provider;
    } else {
        // console.log('provider is Web3Provider')
      const web3Provider = new ethers.providers.Web3Provider(provider)
      formatProvider = web3Provider.getSigner();
    }
    this.contractInstance = new ethers.Contract(this.address, abiJson, formatProvider);
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
      const sendFn = async() => {
        try {
            console.log('sendTransaction params:', functionName, ...functionParams)
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
            const errStr = error?.message || error?.toString()?.toLowerCase() || ''
            // Signer had insufficient balance
            const requestLImitMsg = "non-200 status code: '429'"
            if (errStr.indexOf(requestLImitMsg) > -1) {
              await sendFn()
            }
            const userRejectErrStrArr = ['user rejected', 'approval denied']
            const isUserRejected = userRejectErrStrArr.some(str => errStr.indexOf(str) > -1)
            if (error?.code === 'ACTION_REJECTED' || isUserRejected) {
              return reject('user rejected transaction')
            }
            
            const insufficientBalanceErrStrArr = ['insufficient balance', 'unpredictable_gas_limit'] // 'unpredictable_gas_limit'
            const isInsufficientBalance= insufficientBalanceErrStrArr.some(str => errStr.indexOf(str) > -1)
            if (isInsufficientBalance) {
              return reject('insufficient balance')
            }
            if (errStr.indexOf('no pending withdrawals') > -1) {
              return reject('no pending withdrawals')
            }
            // if (error?.reason) {
            //   return reject(error.reason)
            // }
            return reject(error)
          }
      }
      sendFn()
     
    });
  }
}

export default Contract;