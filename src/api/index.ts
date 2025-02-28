import axios from "../utils/request";

export interface Response {
  rc: number;
  mc: string;
  msg: string;
  result: any;
}
//Application signature for developers to temporarily test
export const appSign = (data: string): Promise<Response> => {
  return axios({
    method: "POST",
    url: `/developer-center/app-sign`,
    data,
  });
};