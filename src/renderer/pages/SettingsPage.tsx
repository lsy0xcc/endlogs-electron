// 设置页: lookback limit display, CSV import entry, account management
// table (archive/restore mutates local view state only — no data source yet)
// and the reason table card.

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArchiveIcon,
  ArrowsCounterClockwiseIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FilePlusIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  UploadSimpleIcon,
  UserPlusIcon,
} from '@phosphor-icons/react';
import type { Account, ReasonTable } from '@/renderer/types';

interface SettingsPageProps {
  /** All accounts, archived included. */
  accounts: Account[];
  reasonTable: ReasonTable;
  maxLookbackDays: number;
  onAddAccount: () => void;
  onImportCsv: () => void;
  onExportCsv: (account: Account) => void;
  onUpdateToken: (account: Account) => void;
  onArchive: (account: Account) => void;
  onRestore: (account: Account) => void;
}

export function SettingsPage({
  accounts,
  reasonTable,
  maxLookbackDays,
  onAddAccount,
  onImportCsv,
  onExportCsv,
  onUpdateToken,
  onArchive,
  onRestore,
}: SettingsPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Lookback limit */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <CardHeader>
          <CardTitle>最多可获取天数</CardTitle>
          <CardDescription>
            客服中心只能获取约该天数之前的历史记录，更早的数据不会返回；此值由官方页面文案自动检测，默认值为90天。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <span className="font-heading text-2xl font-medium tabular-nums">
            {maxLookbackDays}
          </span>
          <span className="ml-1.5 text-muted-foreground">天</span>
        </CardContent>
      </Card>

      {/* CSV import */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <CardHeader>
          <CardTitle>从备份文件恢复</CardTitle>
          <CardDescription>
            换电脑或重装后，可以用之前导出的备份文件（CSV）把流水记录找回来；支持本应用导出的文件，也支持从
            <a
              href="https://github.com/wPtilopsis/endlogs"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              endlogs
            </a>
            导出的文件。导入前会先列出将要恢复的内容，已经存在的记录会自动跳过，不会产生重复。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onImportCsv}>
            <UploadSimpleIcon data-icon="inline-start" />
            选择备份文件
          </Button>
        </CardContent>
      </Card>

      {/* Account management */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>
            角色资料来自服务器；归档账号从主页下拉框隐藏，流水与同步进度保留、仍可导出。
          </CardDescription>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Button variant="outline" onClick={onAddAccount}>
              <UserPlusIcon data-icon="inline-start" />
              添加账号
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>昵称</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>区服</TableHead>
                <TableHead>渠道</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-10 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow
                  key={account.id}
                  className={account.status === 'archived' ? 'opacity-60' : ''}
                >
                  <TableCell className="font-medium">
                    {account.nickName}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {account.roleUid}
                  </TableCell>
                  <TableCell>{account.serverName}</TableCell>
                  <TableCell>{account.channelName}</TableCell>
                  <TableCell className="tabular-nums">
                    Lv.{account.level}
                  </TableCell>
                  <TableCell>
                    {account.status === 'active' ? (
                      <Badge variant="secondary">正常</Badge>
                    ) : (
                      <Badge variant="outline">归档</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="账号操作"
                          />
                        }
                      >
                        <DotsThreeIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onUpdateToken(account)}
                        >
                          <KeyIcon />
                          更新 token
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportCsv(account)}>
                          <DownloadSimpleIcon />
                          导出 CSV
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {account.status === 'active' ? (
                          <DropdownMenuItem onClick={() => onArchive(account)}>
                            <ArchiveIcon />
                            归档
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onRestore(account)}>
                            <ArrowsCounterClockwiseIcon />
                            恢复
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-16 text-center text-muted-foreground"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FilePlusIcon className="size-4" />
                      暂无账号
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reason table */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <CardHeader>
          <CardTitle>变动原因对照</CardTitle>
          <CardDescription>
            流水里每笔变动都带有原因编号，这里维护编号与文字说明的对照，让每笔资源的来龙去脉都看得懂。对照表会自动保持最新，也可以手动检查；游戏新增、尚未收录的编号会显示为「未知原因(编号)」。
          </CardDescription>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Button variant="outline">
              <MagnifyingGlassIcon data-icon="inline-start" />
              检查更新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
            <span>
              当前版本：
              <span className="text-foreground tabular-nums">
                v{reasonTable.version}
              </span>
            </span>
            <span>
              更新日期：
              <span className="text-foreground tabular-nums">
                {reasonTable.date}
              </span>
            </span>
            <span>
              已收录说明：
              <span className="text-foreground tabular-nums">
                {Object.keys(reasonTable.reasons).length} 条
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
