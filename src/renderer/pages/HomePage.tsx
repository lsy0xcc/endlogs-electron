// 主页: action row (account picker, pull buttons, CSV export) + the data
// display card for the current account. The card is UI-only this round: the
// dimension tab views land with the data layer.

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeField } from '@/renderer/components/DateRangeField';
import type { Account } from '@/renderer/types';
import {
  ArrowsClockwiseIcon,
  CalendarIcon,
  ChartPieIcon,
  ClockCounterClockwiseIcon,
  DownloadSimpleIcon,
  TableIcon,
  TagIcon,
  TrayIcon,
  UserPlusIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

interface HomePageProps {
  /** Active accounts only (archived ones are hidden from the dropdown). */
  accounts: Account[];
  currentAccount: Account | null;
  onSelectAccount: (id: number) => void;
  onAddAccount: () => void;
  onExportCsv: () => void;
}

/** Dimension tabs: names taken from the implemented display dimensions. */
const TABS = [
  { value: 'summary', label: '汇总', icon: ChartPieIcon },
  { value: 'reason', label: '按原因', icon: TagIcon },
  { value: 'day', label: '按日', icon: CalendarIcon },
  { value: 'detail', label: '明细', icon: TableIcon },
] as const;

export function HomePage({
  accounts,
  currentAccount,
  onSelectAccount,
  onAddAccount,
  onExportCsv,
}: HomePageProps) {
  // Date range picked in the display header; feeds the tab filtering later.
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  if (accounts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="flex size-16 items-center justify-center border">
          <TrayIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-base font-medium">还没有任何账号</h2>
          <p className="max-w-80 text-muted-foreground">
            添加第一个账号后，即可开始累积并查看该账号的资源流水。
          </p>
        </div>
        <Button size="lg" onClick={onAddAccount}>
          <UserPlusIcon data-icon="inline-start" />
          添加账号
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Action row */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={currentAccount ? String(currentAccount.id) : null}
            onValueChange={(value) => {
              if (value === '__add__') {
                onAddAccount();
                return;
              }
              if (value !== null) onSelectAccount(Number(value));
            }}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="选择账号">
                {currentAccount ? (
                  <span className="flex items-baseline gap-2">
                    <span className="font-medium">
                      {currentAccount.nickName}
                    </span>
                    <span className="text-muted-foreground">
                      UID {currentAccount.roleUid}
                    </span>
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={String(account.id)}>
                  <span className="font-medium">{account.nickName}</span>
                  <span className="text-muted-foreground">
                    UID {account.roleUid}
                  </span>
                  <span className="text-muted-foreground">
                    {account.serverName}
                  </span>
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="__add__">
                <UserPlusIcon className="text-muted-foreground" />
                添加新用户
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline">
              <ArrowsClockwiseIcon data-icon="inline-start" />
              同步数据
            </Button>
            <Button variant="outline">
              <ClockCounterClockwiseIcon data-icon="inline-start" />
              获取全部历史数据
            </Button>
            <Button onClick={onExportCsv}>
              <DownloadSimpleIcon data-icon="inline-start" />
              导出 CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Display card: account basics + date range header, dimension tabs below */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            {currentAccount ? currentAccount.nickName : '未选择账号'}
          </CardTitle>
          {currentAccount && (
            <CardDescription>
              UID {currentAccount.roleUid} · {currentAccount.serverName} ·{' '}
              {currentAccount.channelName} · Lv.{currentAccount.level}
            </CardDescription>
          )}
          <CardAction>
            <DateRangeField range={dateRange} onChange={setDateRange} />
          </CardAction>
        </CardHeader>
        <Separator className="mx-(--card-spacing)" />
        <CardContent>
          <Tabs defaultValue="summary">
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="pt-4">
                <TbdPlaceholder icon={tab.icon} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/** Uniform 「待定」 placeholder for the not-yet-designed tab views. */
function TbdPlaceholder({ icon: Icon }: { icon: typeof ChartPieIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center border">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">此页内容待设计</p>
    </div>
  );
}
