import { SERVICEBASEURL } from '../config/constants';

type AuthParams = {
  state: string;
};
export function getAuthUrl(authParams: AuthParams) {
  const { state } = authParams;
  return `${SERVICEBASEURL}/public/tips/oauth2/render/?state=${state}`;
}