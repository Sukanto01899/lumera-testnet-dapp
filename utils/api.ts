import { REST_AI_URL } from "@/constant/network";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const uploadHeaders = {
  "Content-Type": "multipart/form-data",
  Accept: "application/json",
};

type RequestBody = Record<string, unknown> | FormData;

const customFetch = async <T = AxiosResponse>(
  url: string,
  method: string,
  body: RequestBody = {},
  isUpload = false
): Promise<T> => {
  const options: AxiosRequestConfig = {
    url: `${REST_AI_URL}${url}`,
    method: method as AxiosRequestConfig["method"],
    headers: isUpload ? uploadHeaders : headers,
  };

  if (method === "GET" && body && !(body instanceof FormData)) {
    options.params = body;
  } else if (method === "POST" || method === "PUT" || method === "DELETE") {
    options.data = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const res = await axios.request(options);
    return res as T;
  } catch (error) {
    const axiosError = error as AxiosError;
    const { response } = axiosError;
    if (!response) {
      throw {
        status: "unknown",
        message: "unknown error",
      };
    }
    if (response.status === 401) {
      throw {
        statusCode: response.status,
        statusText: response.statusText,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (response.data as any)?.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: (response.data as any)?.message,
      };
    }
    throw {
      statusCode: response.status,
      statusText: response.statusText,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: (response.data as any)?.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: (response.data as any)?.message,
    };
  }
};

export const get = (path: string) => customFetch(path, "GET");
export const post = (path: string, body: RequestBody) =>
  customFetch(path, "POST", body);
export const put = (path: string, body: RequestBody) =>
  customFetch(path, "PUT", body);
export const remove = (path: string, body: RequestBody) =>
  customFetch(path, "DELETE", body);
export const upload = (path: string, body: FormData) =>
  customFetch(path, "POST", body, true);
