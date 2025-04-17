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