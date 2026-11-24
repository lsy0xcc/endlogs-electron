// Domain types for the renderer. The data interactions that will produce and
// consume them are TBD until the IPC layer lands.

/** 1 = 源石, 2 = 嵌晶玉, 3 = 武库配额 */
export type CurrencyType = 1 | 2 | 3;

/** 1 = 获取, 2 = 消耗 */
export type ChangeType = 1 | 2;

/** active = 正常, archived = 归档（软删除） */
export type AccountStatus = 'active' | 'archived';

export interface Account {
  id: number;
  accountUid: string;
  roleUid: string;
  nickName: string;
  channelName: string;
  serverId: string;
  serverName: string;
  level: number;
  status: AccountStatus;
}

/** One resource change record (table ledger_entries). */
export interface LedgerEntry {
  currencyType: CurrencyType;
  seqId: number;
  changeType: ChangeType;
  changeReason: number;
  /** Always positive; direction is expressed by changeType. */
  changeNum: number;
  /** Balance right after this change. */
  after: number;
  /** Unix seconds (absolute instant, no timezone attached). */
  changeTime: number;
}

/** Cached change reason table (userData/change_reasons.json). */
export interface ReasonTable {
  version: string;
  date: string;
  reasons: Record<string, string>;
}

export const CURRENCY_NAME: Record<CurrencyType, string> = {
  1: '源石',
  2: '嵌晶玉',
  3: '武库配额',
};

export const CURRENCIES: CurrencyType[] = [1, 2, 3];
