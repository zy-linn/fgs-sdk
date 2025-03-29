import {
  CreateFunctionTriggerRequest,
  CreateFunctionTriggerRequestBody,
  DeleteFunctionTriggerRequest,
  ListFunctionTriggersRequest,
  UpdateTriggerRequest,
  UpdateTriggerRequestBody
} from "@huaweicloud/huaweicloud-sdk-functiongraph";
import { FunctionClient } from "../clients";
import {
  IEventData,
  ILtsProps,
  IObsProps,
  ITimerProps,
  ITriggerProps,
  TriggerStatus,
  TypeCode
} from "../models/interface";
import {
  handlerResponse,
  humpToUnderline,
  isString,
  randomLenChar
} from "../utils/util";
import { Logger } from "./logger.service";

export class TriggerService {

  private __logger: Logger;

  private triggerIns: Trigger;
  private triggerInsMap = {
    [TypeCode.APIG]: (client, props, functionUrn) => new ApigTrigger(client, props, functionUrn),
    [TypeCode.CTS]: (client, props, functionUrn) => new CtsTrigger(client, props, functionUrn),
    [TypeCode.DEDICATEDGATEWAY]: (client, props, functionUrn) => new DedicatedgatewayTrigger(client, props, functionUrn),
    [TypeCode.DIS]: (client, props, functionUrn) => new DisTrigger(client, props, functionUrn),
    [TypeCode.OBS]: (client, props, functionUrn) => new ObsTrigger(client, props, functionUrn),
    [TypeCode.TIMER]: (client, props, functionUrn) => new TimerTrigger(client, props, functionUrn),
    [TypeCode.LTS]: (client, props, functionUrn) => new LtsTrigger(client, props, functionUrn),
    [TypeCode.KAFKA]: (client, props, functionUrn) => new KafkaTrigger(client, props, functionUrn),
    [TypeCode.SMN]: (client, props, functionUrn) => new SmnTrigger(client, props, functionUrn),
  };

  private supportEdit = [TypeCode.TIMER, TypeCode.DDS, TypeCode.KAFKA, TypeCode.LTS, TypeCode.DIS];

  constructor(
    public readonly client: FunctionClient,
    public readonly functionUrn,
  ) {
    this.__logger = Logger.getIns();
  }

  init(props: any) {
    this.triggerIns = this.triggerInsMap[props.triggerTypeCode?.toUpperCase()]?.(this.client, props, this.functionUrn);
  }

  /**
   * 部署触发器
   * 1. 判断触发器是否存在
   * 2. 如果存在且状态不一致，更新触发器状态，如果状态一致，触发器没有更新，直接返回结果
   * 3. 如果不存在，创建触发器
   * @returns 
   */
  async deploy() {
    if (!this.triggerIns) {
      return;
    }
    this.__logger.spinStart(`Start deploying trigger[${this.triggerIns.triggerType}].`);
    try {
      const trigger = await this.getTrigger();
      this.__logger.debug(`current trigger -> ${JSON.stringify(trigger)}`);
      if (!trigger) {
        return await this.create();
      }
      if (trigger.trigger_status !== this.triggerIns.triggerStatus
        && this.supportEdit.includes(this.triggerIns.triggerType)
      ) {
        return await this.update(trigger.trigger_id);
      }
      this.__logger.spinStop();
      this.__logger.info(`The trigger[${this.triggerIns.triggerType}] cannot be updated.`);
      return null;
    } catch (error) {
      this.__logger.spinError(`Failed to deploy trigger[${this.triggerIns.triggerType}].`);
      throw error;
    }
  }

  /**
   * 删除触发器
   * 1. 先判断触发器是否存在
   * 2. 不存在，提示不存在
   * 3. 存在的话，删除触发器
   * @returns 
   */
  async remove() {
    this.__logger.spinStart(`Start deleting trigger[${this.triggerIns.triggerType}].`);
    try {
      const trigger = await this.getTrigger();
      if (!trigger) { // 触发器不存在
        this.__logger.spinStop();
        this.__logger.info(`The trigger[${this.triggerIns.triggerType}] does not exist.`);
        return null;
      }
      const request = this.triggerIns.getDeleteRequest(trigger.trigger_id);
      const result: any = await this.client.fgsClient.deleteFunctionTrigger(request);
      handlerResponse(result ?? {});
      this.__logger.spinSuccess(`Trigger[${this.triggerIns.triggerType}] is deleted successfully.`);
      return result;
    } catch (error) {
      this.__logger.spinError(`Failed to delete trigger[${this.triggerIns.triggerType}].`);
      throw error;
    }
  }

  /**
   * 创建触发器
   * @returns 
   */
  private async create() {
    const request = await this.triggerIns.getCreateRequest();
    this.__logger.debug(`create body -> ${JSON.stringify(request)}`);
    const result: any = await this.client.fgsClient.createFunctionTrigger(request);
    handlerResponse(result ?? {});
    this.__logger.spinSuccess(`Trigger[${this.triggerIns.triggerType}] is created successfully.`);
    return this.handleResponse(result);
  }

  /**
   * 更新触发器
   * @param triggerId 
   * @returns 
   */
  private async update(triggerId = '') {
    const request = this.triggerIns.getUpdateRequest(triggerId);
    this.__logger.debug(`update body -> ${JSON.stringify(request)}`);
    const result: any = await this.client.fgsClient.updateTrigger(request);
    handlerResponse(result ?? {});
    this.__logger.spinSuccess(`Trigger[${this.triggerIns.triggerType}] is updated successfully.`);
    return this.handleResponse(result);
  }

  /**
   * 校验触发器是否存在
   * 1. 获取本地存储的触发器ID
   * 2. 获取当前函数的触发器列表
   * 3. 触发器ID存在，通过ID获取对应的触发器
   * 4. 触发器ID不存在，通过EventData的内容判断触发器是否存在
   * @returns 
   */
  private async getTrigger() {
    try {
      const request = new ListFunctionTriggersRequest().withFunctionUrn(this.functionUrn);
      const result: any = await this.client.fgsClient.listFunctionTriggers(request);
      handlerResponse(result ?? {});
      return result.filter(res => res.trigger_type_code === this.triggerIns.triggerType)
        .find(t => this.triggerIns.isEqual(t.event_data));
    } catch (err) {
      return null;
    }
  }

  /**
   *  处理函数信息输出
   * @param response
   * @returns
   */
  private handleResponse(response: any) {
    const triggerInfo = [
      {
        desc: "TriggerId",
        example: response.trigger_id,
      },
      {
        desc: "TriggerTypeCode",
        example: response.trigger_type_code,
      },
      {
        desc: "TriggerStatus",
        example: response.trigger_status,
      },
    ];
    const eventDataInfo = Object.keys(response.event_data || {}).map(key => {
      return {
        desc: key,
        example: response.event_data[key]
      }
    }).filter(key => isString(key.example));

    return [
      {
        header: "Trigger",
        content: triggerInfo,
      },
      {
        header: "Trigger event data",
        content: eventDataInfo,
      },
    ];
  }
}

export class Trigger {

  protected triggerInfo: ITriggerProps;

  constructor(
    public readonly client: FunctionClient,
    public readonly props: any = {},
    public readonly functionUrn = ''
  ) {
    this.handlerInputs(props);
  }

  /**
   * 获取触发器类型
   * @returns 
   */
  get triggerType() {
    return this.triggerInfo.triggerTypeCode;
  }

  /**
   * 获取触发器状态
   * @returns 
   */
  get triggerStatus(): TriggerStatus {
    return this.triggerInfo.status ?? TriggerStatus.ACTIVE;
  }

  get triggerName(): string {
    return this.triggerInfo.eventData.name;
  }

  /**
   * 封装创建触发器请求体
   * @returns 
   */
  async getCreateRequest(): Promise<CreateFunctionTriggerRequest> {
    const eventData: any = this.getEventData();
    const body = new CreateFunctionTriggerRequestBody()
      .withEventData(eventData)
      .withTriggerStatus(this.triggerStatus)
      .withEventTypeCode(this.triggerType)
      .withTriggerTypeCode(this.triggerType);
    return new CreateFunctionTriggerRequest()
      .withBody(body)
      .withFunctionUrn(this.functionUrn);
  }

  /**
   * 封装更新触发器的请求体
   * @param triggerId 触发器ID
   * @returns 
   */
  getUpdateRequest(triggerId = ''): UpdateTriggerRequest {
    const body = new UpdateTriggerRequestBody()
      .withTriggerStatus(this.triggerStatus);
    return new UpdateTriggerRequest()
      .withFunctionUrn(this.functionUrn)
      .withTriggerId(triggerId)
      .withBody(body)
      .withTriggerTypeCode(this.triggerType);
  }

  /**
   *  封装删除触发器的请求体
   * @param triggerId 触发器ID
   * @returns 
   */
  getDeleteRequest(triggerId = ''): DeleteFunctionTriggerRequest {
    return new DeleteFunctionTriggerRequest()
      .withFunctionUrn(this.functionUrn)
      .withTriggerId(triggerId)
      .withTriggerTypeCode(this.triggerInfo.triggerTypeCode);
  }

  /**
   * 判断触发器内容是否相等
   * @param trigger 
   * @returns 
   */
  isEqual(trigger: IEventData): boolean {
    return !!trigger;
  }

  /**
   * 获取触发器数据
   * @returns 
   */
  protected getEventData(): IEventData {
    return this.triggerInfo.eventData;
  };

  /**
   * 获取参数信息，默认配置参数支持小驼峰和下划线两种格式
   * @param eventData 配置的数据
   * @param key 参数属性值
   * @returns 值
   */
  protected getEventValue(eventData: IEventData = {}, key = ''): any {
    const ulkey = humpToUnderline(key);
    return eventData[key] ?? eventData[ulkey];
  }

  /**
   * 处理数据
   * @param props 
   */
  private handlerInputs(props: any) {
    this.triggerInfo = {
      triggerId: this.getEventValue(props, 'triggerId'),
      triggerTypeCode: this.getEventValue(props, 'triggerTypeCode')?.toUpperCase() as TypeCode,
      status: props.status ?? TriggerStatus.ACTIVE,
      eventTypeCode: this.getEventValue(props, 'eventTypeCode'),
      eventData: this.getEventValue(props, 'eventData') || {}
    };
  }
}

/**
 * APIG 触发器
 */
export class ApigTrigger extends Trigger {
  /**
  * 获取触发器状态
  * @returns 
  */
  get triggerStatus() {
    return TriggerStatus.ACTIVE;
  }

  /**
   * 获取APIG触发器的EventData
   * 1. 先获取API分组
   * 2. 如果分组存在，默认取第一个分组
   * 3. 如果不存在，先创建一个分组
   * @returns 
   */
  protected getEventData(): IEventData {
    const eventData: IEventData = this.triggerInfo.eventData;
    const urns = this.functionUrn.split(":");
    const functionName = urns[6];
    const groupId = this.getEventValue(eventData, 'groupId');
    return {
      name: eventData.name ?? functionName.replace(/-/ig, '_'),
      env_name: this.getEventValue(eventData, 'envName') ?? 'RELEASE',
      env_id: this.getEventValue(eventData, 'envId') ?? 'DEFAULT_ENVIRONMENT_RELEASE_ID',
      protocol: eventData.protocol?.toUpperCase() ?? 'HTTPS',
      group_id: groupId,
      sl_domain: this.getEventValue(eventData, 'slDomain') ?? `${groupId}.apig.${urns[2]}.huaweicloudapis.com`,
      match_mode: this.getEventValue(eventData, 'matchMode')?.toUpperCase() ?? 'SWA',
      req_method: this.getEventValue(eventData, 'reqMethod')?.toUpperCase() ?? 'GET',
      auth: eventData.auth?.toUpperCase() ?? 'IAM',
      backend_type: 'FUNCTION',
      instance_id: this.getEventValue(eventData, 'instanceId'),
      type: 1,
      path: eventData.path?.startsWith('/') ? eventData.path : `/${eventData.path ?? functionName}`,
      function_info: {
        timeout: eventData.timeout ?? 5000
      },
    };
  };

  isEqual(trigger: IEventData): boolean {
    const eventData = this.getEventData();
    return trigger && eventData.name === trigger.name
      && eventData.group_id === trigger.group_id
      && eventData.env_id === trigger.env_id;
  }
}

/**
* DEDICATEDGATEWAY 触发器
*/
export class DedicatedgatewayTrigger extends ApigTrigger {

  isEqual(trigger: IEventData): boolean {
    const eventData: IEventData = this.getEventData();
    return trigger && eventData.name === trigger.name
      && eventData.instance_id === trigger.instance_id
      && eventData.path === trigger.path
      && eventData.group_id === trigger.group_id
      && eventData.env_id === trigger.env_id;
  }
}

/**
* OBS 触发器
*/
export class ObsTrigger extends Trigger {
  get triggerName() {
    return this.triggerInfo.eventData.bucket;
  }

  /**
  * 获取触发器状态
  * @returns 
  */
  get triggerStatus() {
    return TriggerStatus.ACTIVE;
  }

  getEventData(): IEventData {
    const eventData: IObsProps = this.triggerInfo.eventData;
    return {
      bucket: eventData.bucket,
      events: eventData.events,
      name: eventData.name ?? `obs-event-${randomLenChar(6)}`,
      prefix: eventData.prefix ?? null,
      suffix: eventData.suffix ?? null
    };
  }

  isEqual(trigger: IEventData): boolean {
    const { bucket, events = [] } = this.getEventData();
    return bucket === trigger?.bucket
      && this.checkEvents(trigger?.events, events);
  }

  private checkEvents(orgEvents = [], newEvents = []) {
    return this.checkEventByKey(orgEvents, newEvents)
      || this.checkEventByKey(orgEvents, newEvents, 's3:ObjectRemoved');
  }

  private checkEventByKey(orgEvents = [], newEvents = [], key = 's3:ObjectCreated') {
    if ((orgEvents.includes(`${key}:*`) && newEvents.find(e => e.startsWith(key)))
      || (newEvents.includes(`${key}:*`) && orgEvents.find(e => e.startsWith(key)))
    ) {
      return true;
    }
    return !!orgEvents.find(o => newEvents.includes(o));
  }
}

/**
* CTS 触发器
*/
export class CtsTrigger extends Trigger {

  getEventData(): IEventData {
    const eventData: ITimerProps = this.triggerInfo.eventData;
    return {
      name: eventData.name ?? `cts_${randomLenChar(6)}`,
      operations: eventData.operations
    };
  }

  isEqual(trigger: IEventData): boolean {
    const { name, operations = [] } = this.getEventData();
    return name === trigger?.name
      && this.handlerOpers(trigger.operations, operations)
  }

  private handlerOpers(triggerOpers = [], configOpers = []) {
    const cOpers = configOpers.reduce((prev, next) => {
      const [type, ...list] = next.split(':');
      prev[type] = list.map(l => l.split(';'));
      return prev;
    }, {})
    const tOpers = triggerOpers.map(t => t.split(':'));
    return tOpers.find(t => {
      const list = cOpers[t[0]];
      let f = list?.length > 0;
      list?.forEach((l, i) => f = f && !!l.find(ll => t[i + 1].includes(ll)));
      return f;
    });
  }
}

/**
* Dis 触发器
*/
export class DisTrigger extends Trigger {

  /**
  * 封装更新触发器的请求体
  * @param triggerId 触发器ID
  * @returns 
  */
  getUpdateRequest(triggerId = ''): UpdateTriggerRequest {
    const body = new UpdateTriggerRequestBody()
      .withTriggerStatus(this.triggerStatus);
    return new UpdateTriggerRequest()
      .withFunctionUrn(this.functionUrn)
      .withTriggerId(triggerId)
      .withBody(body)
      .withTriggerTypeCode(this.triggerType);
  }

  getEventData(): IEventData {
    const eventData: IEventData = this.triggerInfo.eventData;
    return {
      stream_name: this.getEventValue(eventData, 'streamName'),
      sharditerator_type: this.getEventValue(eventData, 'sharditeratorType') ?? 'TRIM_HORIZON',
      polling_interval: this.getEventValue(eventData, 'pollingInterval') ?? 30,
      polling_unit: this.getEventValue(eventData, 'pollingUnit') ?? 's',
      is_serial: this.getEventValue(eventData, 'isSerial') ?? true,
      max_fetch_bytes: this.getEventValue(eventData, 'maxFetchBytes') ?? 1048576,
      batch_size: this.getEventValue(eventData, 'batchSize'),
    };
  }

  isEqual(trigger: IEventData): boolean {
    const eventData: IEventData = this.getEventData();
    return eventData.stream_name === trigger?.stream_name
      && eventData.sharditerator_type === trigger?.sharditerator_type
  }
}

/**
* TIMER 触发器
*/
export class TimerTrigger extends Trigger {

  getEventData(): IEventData {
    const eventData: ITimerProps = this.triggerInfo.eventData;
    return {
      name: eventData.name ?? `Timer-${randomLenChar(6)}`,
      schedule: eventData.schedule ?? '3m',
      schedule_type: this.getEventValue(eventData, 'scheduleType') ?? 'Rate',
      user_event: this.getEventValue(eventData, 'userEvent')
    };
  }

  isEqual(trigger: IEventData): boolean {
    const { name, schedule, schedule_type } = this.getEventData();
    return name === trigger?.name
      && schedule === trigger?.schedule
      && schedule_type === trigger?.schedule_type;
  }
}

/**
* LTS 触发器
*/
export class LtsTrigger extends Trigger {

  getEventData(): IEventData {
    const eventData: ILtsProps = this.triggerInfo.eventData;
    return {
      log_group_id: this.getEventValue(eventData, 'logGroupId'),
      log_topic_id: this.getEventValue(eventData, 'logTopicId')
    };
  }

  isEqual(trigger: IEventData): boolean {
    const { log_group_id, log_topic_id } = this.getEventData();
    return log_group_id === trigger?.log_group_id
      && log_topic_id === trigger?.log_topic_id
  }
}


/**
* KAFKA 触发器
*/
export class KafkaTrigger extends Trigger {

  getEventData(): IEventData {
    const eventData: IEventData = this.triggerInfo.eventData;
    return {
      batch_size: this.getEventValue(eventData, 'batchSize') || 100,
      instance_id: this.getEventValue(eventData, 'instanceId'),
      topic_ids: this.getEventValue(eventData, 'topicIds'),
      kafka_user: this.getEventValue(eventData, 'kafkaUser'),
      kafka_password: this.getEventValue(eventData, 'kafkaPassword'),
    };
  }

  isEqual(trigger: IEventData): boolean {
    const { instance_id, topic_ids = [] } = this.getEventData();
    return instance_id === trigger?.instance_id
      && !!trigger?.topic_ids.find(id => topic_ids.includes(id));
  }
}

/**
* SMN 触发器
*/
export class SmnTrigger extends Trigger {

  getEventData(): IEventData {
    const eventData: IEventData = this.triggerInfo.eventData;
    return {
      topic_urn: this.getEventValue(eventData, 'topicUrn')
    };
  }

  isEqual(trigger: IEventData): boolean {
    const { topic_urn } = this.getEventData();
    return topic_urn === trigger?.topic_urn;
  }
}