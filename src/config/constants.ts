export const DATASOURCETEMPLATESMAP: { [propName: string]: { [propName: string]: string } } = {
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
  },
  xiaohongshu: {
    id: '93c6e6df-63ab-41af-8cba-f2927c0d2f1c',
    field: 'red_id'
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
    contractAddress: "0xcd1Ed9C1595A7e9DADe76808dd5e66aA95940A92",
    redPacketContractAddress: "0x5508fC45d930B5dE36647Dbbe5B9414e43C4F614"
  },  // monad testnet
  97: {
    chainId: 97,
    chainName: 'BNB Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'tBNB',
      symbol: 'tBNB',
    },
    contractAddress: "0x1C5bfc91789DB3130A07a06407E02745945C3218",
    redPacketContractAddress: "0xC75901570dB65070caDEBB74d6702E299Ac8e019"
  },
  56: {
    chainId: 56,
    chainName: 'BNB Chain',
    nativeCurrency: {
      decimals: 18,
      name: 'BNB',
      symbol: 'BNB',
    },
    contractAddress: "0x1fb86db904caF7c12100EA64024E5dfd7505E484",
    redPacketContractAddress: "0x083693C148e30b3A231D325366E76b38293FCa10"
  },
  688688: {
    chainId: 688688,
    chainName: 'Pharos Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'PHRS',
      symbol: 'PHRS',
    },
    contractAddress: "0xD17512B7EC12880Bd94Eca9d774089fF89805F02",
    redPacketContractAddress: '0x673D74d95A35B26804475066d9cD1DA3947f4eC3'
  },
  84532: {
    chainId: 84532,
    chainName: 'Base Sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia Ether',
      symbol: 'ETH',
    },
    contractAddress: "0x4E78940F0019EbAEDc6F4995D7B8ABf060F7a341",
    redPacketContractAddress: '0xA33Ed35460C3d06094693956B2d7Cd1a9e7A39a8'
  },
  8453: {
    chainId: 8453,
    chainName: 'Base',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    contractAddress: "0xa2e0700a269Be3158c81E4739518b324d4398588",
    redPacketContractAddress:"0x50bd377EB8D4236Bb587AB3FB1eeafd888AEeC58"
  },
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
export const SUPPORTEDCHAINIDS: number[] = Object.keys(Fund_CONTRACTS).map(i => Number(i))
export const FundForRedPacket_CONTRACTS: { [chainId: number]: string } = Object.values(SUPPORTEDCHAINIDSMAP).filter(
  (item) => {
    return item.redPacketContractAddress
  }
).reduce((prev, curr) => {
  return {
    ...prev,
    [curr.chainId]: curr.redPacketContractAddress
  }
}, {})
export const SUPPORTEDCHAINIDSForRedPacket: number[] = Object.keys(FundForRedPacket_CONTRACTS).map(i => Number(i))

export const REQUESTTIMEOUT = 10000;
export const SERVICEBASEURL = 'https://api.padolabs.org';