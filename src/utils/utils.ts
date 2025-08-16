import { SERVICEBASEURL } from '../config/constants';

type AuthParams = {
  state: string;
};
export function getAuthUrl(authParams: AuthParams) {
  const { state } = authParams;
  return `${SERVICEBASEURL}/public/tips/oauth2/render/?state=${state}`;
}

// Check if any item in the `curErrorArr` contains any of the strings in the `targetErrorStrArr`.
export const hasErrorFlagFn = (curErrorArr: string[], targetErrorStrArr: string[]) => {
  return curErrorArr.some((curErrorStr: string) => {
    let f = targetErrorStrArr.some(targetErrorStr => curErrorStr.toLowerCase().includes(targetErrorStr.toLowerCase()))
    return f
  })
}


export const getErrArrFn = (error: any) => {
  const errorMsg1 = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : typeof (error as any).message === 'string'
        ? (error as any).message
        : JSON.stringify(error);
  const errorMsg2 = typeof error === 'object' ? JSON.stringify(error) : error?.toString();
  const curErrorStrArr = [errorMsg1, errorMsg2]
  return curErrorStrArr
}
export const formatErrFn = (error: any) => {
  let formatError = error
  const curErrorStrArr = getErrArrFn(error)


  // Signer had insufficient balance
  // const requestLImitMsg = "non-200 status code: '429'"
  // if (errStr.indexOf(requestLImitMsg) > -1) {
  //   await sendFn()
  // }
  const userRejectErrStrArr = ['user rejected', 'approval denied']
  const isUserRejected = hasErrorFlagFn(curErrorStrArr, userRejectErrStrArr)
  if (error?.code === 'ACTION_REJECTED' || isUserRejected) {
    formatError = 'user rejected transaction'
  }

  const isNoPendingWithdrawals = hasErrorFlagFn(curErrorStrArr, ['no pending withdrawals'])
  if (isNoPendingWithdrawals) {
    formatError = 'no pending withdrawals'
  }

  const insufficientBalanceErrStrArr = ['insufficient balance', 'INSUFFICIENT_FUNDS', 'The caller does not have enough funds for value transfer.'] // 'unpredictable_gas_limit'
  const isInsufficientBalance = hasErrorFlagFn(curErrorStrArr, insufficientBalanceErrStrArr)
  if (isInsufficientBalance) {
    formatError = 'insufficient balance'
  }

  const alreadyClaimedErrStrArr = ['Already claimed']
  const isAlreadyClaimed = hasErrorFlagFn(curErrorStrArr, alreadyClaimedErrStrArr)
  if (isAlreadyClaimed) {
    formatError = 'already claimed'
  }

  const allClaimedErrStrArr = ['All claimed']
  const isAllClaimed = hasErrorFlagFn(curErrorStrArr, allClaimedErrStrArr)
  if (isAllClaimed) {
    formatError = 'all claimed'
  }
  return formatError
}