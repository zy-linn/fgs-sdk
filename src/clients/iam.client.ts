import { GlobalCredentials } from "@huaweicloud/huaweicloud-sdk-core";
import { IamClient, KeystoneListProjectsRequest } from '@huaweicloud/huaweicloud-sdk-iam';
import { getEndpoint } from "../utils/util";
import { ICredentials, ServiceType } from "./client.interface";

export class IAMClient {
  private __iamClient: IamClient;

  build(credentials: ICredentials): IAMClient {
    const globalCredentials = new GlobalCredentials()
      .withAk(credentials.AccessKeyID)
      .withSk(credentials.SecretAccessKey);
    this.__iamClient = IamClient.newBuilder()
      .withCredential(globalCredentials)
      .withEndpoint(getEndpoint('', ServiceType.IAM))
      .build();
    return this;
  }

  async getProject(region = 'cn-north-4'): Promise<string> {
    try {
      const request = new KeystoneListProjectsRequest().withName(region);
      const result = await this.__iamClient.keystoneListProjects(request);
      const curProject = (result?.projects || []).find(pro => pro.name === region);
      return curProject?.id ?? null;
    } catch (err) {
      return null;
    }
  }
}
