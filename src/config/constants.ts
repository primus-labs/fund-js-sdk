



export const DATASOURCETEMPLATESMAP:{[propName:string]: {[propName:string]: string}} = {
  x: {
    id: "2e3160ae-8b1e-45e3-8c59-426366278b9d",
    field: 'screen_name'
  },
  tiktok: {
    id: "2b22c9f8-686d-4482-a0cf-c9c43c1181ad",
    field: 'username'
  },
  'google account': {
    id: "3bad8a55-4415-4bec-9b47-a4c7bbe93518",
    field: '2'
  }
};

export const SUPPORTEDSOCIALPLATFORMS: string[] = Object.keys(DATASOURCETEMPLATESMAP)


export const SUPPORTEDCHAINIDSMAP = {
  10143: {
    chainId: 10143,
    chainName: "Monad testnet",
    nativeCurrency: {
      name: "MON",
      symbol: "MON",
      decimals: 18,
    },
    contractAddress: "0xcd1Ed9C1595A7e9DADe76808dd5e66aA95940A92"
  },  // monad testnet
};



export const NATIVETOKENS: Record<number, string> = Object.values(SUPPORTEDCHAINIDSMAP).reduce((prev, curr) => {
  return {
    ...prev,
    [curr.chainId]: curr.nativeCurrency.symbol
  }
}, {})
export const CHAINNAMES: Record<number, string> = Object.values(SUPPORTEDCHAINIDSMAP).reduce((prev, curr) => {
  return {
    ...prev,
    [curr.chainId]: curr.chainName
  }
}, {})

/**
 * chainId=> contractAddress
 */
export const Fund_CONTRACTS: { [chainId: number]: string } = Object.values(SUPPORTEDCHAINIDSMAP).reduce((prev, curr) => {
  return {
    ...prev,
    [curr.chainId]: curr.contractAddress
  }
}, {})
export const SUPPORTEDCHAINIDS:number[] = Object.keys(Fund_CONTRACTS).map(i => Number(i))


export const REQUESTTIMEOUT = 10000;
export const SERVICEBASEURL = 'https://api.padolabs.org';