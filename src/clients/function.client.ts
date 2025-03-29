import { BasicCredentials } from "@huaweicloud/huaweicloud-sdk-core";
import { FunctionGraphClient } from "@huaweicloud/huaweicloud-sdk-functiongraph";
import { UserOptions } from "@huaweicloud/huaweicloud-sdk-core/UserOptions";
import { getEndpoint } from "../utils/util";
import { ICredentials, ServiceType } from "./client.interface";

const ObsClient = require('esdk-obs-nodejs');

export class FunctionClient {

  private __fgsClient: FunctionGraphClient; // 函数SDK实例
  private __projectId: string; // 局点项目ID
  private __obsIns: any; // OBS SDK 实例

  get projectId(): string {
    return this.__projectId;
  }
  get fgsClient(): FunctionGraphClient {
    return this.__fgsClient;
  }
  get obsIns() {
    return this.__obsIns;
  }

  build(credentials: ICredentials, region = 'cn-north-4', projectId = '') {
    const options: UserOptions = {
      axiosRequestConfig: {
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    };
    this.__projectId = projectId;
    const basicCredentials = new BasicCredentials()
      .withAk(credentials.AccessKeyID)
      .withSk(credentials.SecretAccessKey)
      .withProjectId(projectId);
    this.__fgsClient = FunctionGraphClient.newBuilder()
      .withCredential(basicCredentials)
      .withEndpoint(getEndpoint(region, ServiceType.FUNCTIONGRAPH))
      .withOptions(options)
      .build();
    this.__obsIns = new ObsClient({
      access_key_id: credentials.AccessKeyID, // 配置AK
      secret_access_key: credentials.SecretAccessKey, // 配置SK
      server: `obs.${region}.myhuaweicloud.com`, // 配置服务地址
    });
    return this;
  }
}