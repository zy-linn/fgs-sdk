import { DeleteFunctionRequest, FunctionGraphClient, ShowFunctionConfigRequest, ShowFunctionConfigResponse } from "@huaweicloud/huaweicloud-sdk-functiongraph";
import { Logger } from "./logger.service";
import { handlerResponse } from "../utils/util";

export class FunctionService {
  private __logger: Logger;

  constructor(
    public readonly client: FunctionGraphClient,
    public readonly props: any = {},
  ) {
    this.__logger = Logger.getIns();
    this.__logger.debug(`functionService props -> ${JSON.stringify(props)}`);
  }

  /**
 * 部署函数
 * 1. 判断当前函数是否存在
 * 2. 函数存在，执行更新
 * 3. 不存在，执行创建
 */
  async deploy() {
    if (!this.props.name) { // 函数不存在
      this.__logger.error('First configure the function in the yml.');
      throw new Error('First configure the function in the yml.');
    }
    if (this.props.vpcId && !this.props.agencyName && !this.props.xrole) { // 配置了vpc但是没有配置委托
      this.__logger.error('First configure the xrole field in the yml file.');
      throw new Error('First configure the xrole field in the yml file.');
    }
    if (!this.props.vpcId && this.props.subnetId) { // 配置了子网但是没有配置vpc
      this.__logger.error('First configure the vpcId field in the yml file.');
      throw new Error('First configure the vpcId field in the yml file.');
    }
    if (this.props.codeType === "obs" && !this.props.codeUrl) { // 没有配置obs地址
      this.__logger.error('First configure the codeUrl field in the yml file.');
      throw new Error('First configure the codeUrl field in the yml file.');
    }
    this.__logger.spinStart(`Start deploying function[${this.props.name}].`);
    try {
      const infos = await this.getFunctionconfig();
      this.__logger.debug(`current function -> ${JSON.stringify(infos)}`);
      const response: any = infos ? await this.update(infos) : await this.create();
      return this.handleResponse(response.func_urn ? response : infos);
    } catch (err) {
      this.__logger.spinStop();
      throw err;
    }
  }

  /**
   * 删除函数
   */
  async remove() {
    this.__logger.spinStart(`Start deleting function[${this.props.name}].`);
    try {
      const request = new DeleteFunctionRequest().withFunctionUrn(this.props.urn);
      const result: any = await this.client.deleteFunction(request);
      handlerResponse(result);
      this.__logger.spinSuccess(`Function [${this.props.name}] deleted.`);
    } catch (error) {
      this.__logger.spinError(`Function [${this.props.name}] deleted.`);
      throw error;
    }
  }

  async info() { }

  /**
   * 校验函数是否存在
   * @param props
   * @returns
   */
  private async getFunctionconfig(): Promise<ShowFunctionConfigResponse> {
    try {
      const request = new ShowFunctionConfigRequest().withFunctionUrn(this.props.urn);
      const result: any = await this.client.showFunctionConfig(request);
      handlerResponse(result ?? {});
      return result
    } catch (err) {
      return null;
    }
  }

  private async create() {

  }

  private async update(infos) { }

  /**
   *  处理函数信息输出
   * @param response
   * @returns
   */
  private handleResponse(response: any) {
    const content = [
      { desc: "Function Name", example: `${response.func_name}` },
      { desc: "Function URN", example: `${response.func_urn}` },
      { desc: "Project name", example: `${response.project_name}` },
      { desc: "Runtime", example: `${response.runtime}` },
      { desc: "Handler", example: `${response.handler}` },
      { desc: "Code size", example: `${response.code_size}` },
      { desc: "Timeout", example: `${response.timeout}` },
      {
        desc: "Description",
        example: `${response.description || "No description"}`,
      },
      {
        desc: "More",
        example:
          "https://console.huaweicloud.com/functiongraph/#/serverless/dashboard",
      },
    ];

    this.__logger.debug(`Function handle response: ${JSON.stringify(content)}`);
    return {
      res: [
        {
          header: "Function",
          content,
        },
      ],
      functionUrn: response.func_urn,
    };
  }
}