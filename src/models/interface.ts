
export enum MethodType {
    DEPLOY,
    REMOVE
}

export interface ILogger {
    debug?: Function;
    info?: Function;
    error?: Function;
    success?: Function;
}

export enum CommandType {
    ALL = 'all',
    FUNCTION = 'function',
    TRIGGER = 'trigger'
}

export interface IFunctionProps {
    func_name: string; // 函数名称
    func_urn?: string;
    package: string; // 函数所属的分组Package
    runtime: string; // 运行时
    timeout: number; // 函数执行超时时间
    handler: string; // 函数执行入口
    memory_size: number; // 函数消耗的内存
    code_type?: string; // 函数代码类型
    code_filename?: string; // 函数的文件名
    func_code?: IFuncCode; // FuncCode结构返回体。
    description?: string; // 函数描述
    initializer_handler?: string; // 函数初始化入口
    initializer_timeout?: number; // 初始化超时时间
    enterprise_project_id?: string; // 企业项目ID
    type?: string; // 函数版本
    user_data?: string; // 用户自定义的name/value信息
    encrypted_user_data?: string; // 用户自定义的name/value信息，用于需要加密的配置。
    app_xrole?: string; // 函数使用的权限委托名称
    xrole?: string; // 函数使用的权限委托名称
    depend_version_list?: Array<string>; // 依赖版本id列表
    code?: {
        codeUri: string;
    },
}

export interface IFunctionResult {
    func_name: string; // 函数名称
    func_urn?: string;
    package: string; // 函数所属的分组Package
    runtime: string; // 运行时
    timeout: number; // 函数执行超时时间
    handler: string; // 函数执行入口
    memory_size: number; // 函数消耗的内存
    namespace?: string;
    project_name?: string;
    code_type?: string; // 函数代码类型
    code_filename?: string; // 函数的文件名
    func_code?: IFuncCode; // FuncCode结构返回体。
    description?: string; // 函数描述
    initializer_handler?: string; // 函数初始化入口
    initializer_timeout?: number; // 初始化超时时间
    enterprise_project_id?: string; // 企业项目ID
    type?: string; // 函数版本
    user_data?: string; // 用户自定义的name/value信息
    encrypted_user_data?: string; // 用户自定义的name/value信息，用于需要加密的配置。
    app_xrole?: string; // 函数使用的权限委托名称
    xrole?: string; // 函数使用的权限委托名称
    depend_version_list?: Array<string>; // 依赖版本id列表
    func_vpc?: IVpc;
    strategy_config: IStrategyConfig;
    version: string;
    code?: {
        codeUri: string;
    };
    network_controller: {
        disable_public_network?: boolean;
        trigger_access_vpcs?: any[];
    };
    domain_names: string;
    log_group_id: string;
    log_stream_id: string;
    enable_dynamic_memory: boolean;
}

export interface IFunctionConfig
    extends BasicConfig,
    PermissionConfig,
    NetConfig,
    ConcurrencyConfig,
    LogConfig,
    AdvancedConfig {
    functionName: string; // 函数名称
    runtime: string; // 运行时
    codeType: string; // 函数代码类型
    package?: string;
    codeUrl?: string;
    tags?: Array<{ [prop: string]: string }>; // 标签
    environment?: { [prop: string]: any };
    dependVersionList?: Array<string>; // 依赖版本id列表
    code?: {
        codeUri: string;
    };
    userData?: any;
    encryptedUserData?: any;
    extend?: { [prop: string]: any }; // 扩展字段
}

export interface BasicConfig {
    memorySize?: number;
    timeout?: number;
    handler?: string;
    description?: string;
    enterpriseProjectId?: string;
}

export interface PermissionConfig {
    xrole?: string;
    appXrole?: string;
    /**
     * @deprecated 使用xrole代替
     */
    agencyName?: string;
}

export interface NetConfig {
    networkController?: any;
    /**
     * @deprecated 使用funcVpc下配置
     */
    vpcId?: string;
    /**
     * @deprecated 使用funcVpc下配置
     */
    subnetId?: string;
    domainNames?: any[];
    funcVpc: {
        vpcName?: string;
        vpcId: string;
        subnetName?: string;
        subnetId?: string;
        cidr?: string;
        gateway?: string;
    };
}

export interface ConcurrencyConfig {
    concurreny?: number;
    concurrentNum?: number;
}

export interface LogConfig {
    ltsGroupId?: string;
    ltsStreamId?: string;
    ltsGroupName?: string;
    ltsStreamName: string; // 当前SDK需要此值存在
}

export interface AdvancedConfig {
    initializerHandler?: string;
    initializerTimeout?: number;
    enableDynamicMemory: boolean;
    preStopHandler?: string;
    preStopTimeout?: number;
}

export interface IVpc {
    vpc_id: string;
    vpc_name: string;
    subnet_id: string;
    subnet_name: string;
    cidr: string;
    gateway: string;
}

export interface IStrategyConfig {
    concurrency: number;
    concurrent_num: number;
}

export interface IFuncCode {
    file: string;
    link: string;
}

export enum Auth {
    IAM = 'IAM',
    App = 'App',
    NONE = 'None'
}

export enum protocol {
    HTTP = 'HTTP',
    HTTPS = 'HTTPS'
}

export enum ScheduleType {
    RATE = 'Rate',
    CRON = 'Cron'
}

export interface IApigProps extends IEventData {
    name?: string;
    groupName?: string;
    auth?: Auth;
    protocol?: protocol;
    timeout?: number;
}

export interface IObsProps extends IEventData {
    bucket?: string;
    events?: Array<string>;
    name?: string;
    prefix?: string;
    suffix?: string;
}

export interface ITimerProps extends IEventData {
    name?: string;
    scheduleType?: ScheduleType;
    schedule?: string;
    userEvent?: string;
}

export interface ILtsProps extends IEventData {
    logGroupId?: string;
    logTopicId?: string;
}

export enum TypeCode {
    APIG = 'APIG',
    CTS = 'CTS',
    DDS = 'DDS',
    DEDICATEDGATEWAY='DEDICATEDGATEWAY',
    DIS = 'DIS',
    LTS = 'LTS',
    KAFKA = 'KAFKA',
    OPENSOURCEKAFKA = 'OPENSOURCEKAFKA',
    OBS = 'OBS',
    RABBITMQ='RABBITMQ',
    SMN = 'SMN',
    TIMER = 'TIMER'
}

export enum TriggerStatus {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED'
}

export interface ITriggerProps {
    triggerId?: string;
    triggerTypeCode: TypeCode; // 触发器类型。
    status?: TriggerStatus; // 触发器状态，取值为ACTIVE,DISABLED。
    eventTypeCode?: string; // 消息代码。
    eventData: IObsProps | ITimerProps | IApigProps | IEventData; // 事件结构体。
}

export interface ITrigger {
    trigger_id?: string;
    trigger_type_code: string; // 触发器类型。
    trigger_status?: string; // 触发器状态，取值为ACTIVE,DISABLED。
    event_type_code?: string; // 消息代码。
    event_data: IEventData; // 事件结构体。
}

export interface IEventData {
    [key: string]: any
}
