// 认证信息
export interface ICredentials {
    AccountID?: string;
    AccessKeyID?: string;
    AccessKeySecret?: string;
    SecurityToken?: string;
    SecretID?: string;
    SecretKey?: string;
    SecretAccessKey?: string;
    KeyVaultName?: string;
    TenantID?: string;
    ClientID?: string;
    ClientSecret?: string;
    PrivateKeyData?: string
}

// 服务列表
export enum ServiceType {
    APIG = 'apig',
    IAM = 'iam',
    FUNCTIONGRAPH = 'functiongraph'
}