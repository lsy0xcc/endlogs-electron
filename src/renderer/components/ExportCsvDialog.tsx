// 导出 CSV dialog: account + multi-currency checkboxes + optional date range
// (default all). Export is one file per selected currency (csv-format.md); the
// button itself is a stub until the data layer lands.

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CURRENCIES,
  CURRENCY_NAME,
  type Account,
  type CurrencyType,
} from '@/renderer/types';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

interface ExportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All accounts (archived included — their data stays exportable). */
  accounts: Account[];
  /** Account preselected when opening the dialog. */
  defaultAccountId: number | null;
}

export function ExportCsvDialog({
  open,
  onOpenChange,
  accounts,
  defaultAccountId,
}: ExportCsvDialogProps) {
  const [accountId, setAccountId] = useState<string | null>(
    defaultAccountId === null ? null : String(defaultAccountId),
  );
  // Every currency is checked by default: one export file per selected type.
  const [currencies, setCurrencies] = useState<Set<CurrencyType>>(
    () => new Set(CURRENCIES),
  );

  // Keep the preselected account in sync with the caller's current selection
  // whenever the dialog opens (the `open` prop can be toggled directly).
  useEffect(() => {
    if (!open) return;
    setAccountId(defaultAccountId === null ? null : String(defaultAccountId));
  }, [open, defaultAccountId]);

  const selectedAccount =
    accounts.find((a) => String(a.id) === accountId) ?? null;
  // The filename example uses the first selected currency.
  const exampleCurrency = CURRENCIES.find((type) => currencies.has(type)) ?? 1;

  const toggleCurrency = (type: CurrencyType, checked: boolean) => {
    setCurrencies((prev) => {
      const next = new Set(prev);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导出 CSV</DialogTitle>
          <DialogDescription>
            11 列 camelCase 格式，直接读取本地流水库、不会重新拉取。日期范围留空
            = 导出全部。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>账号</Label>
            <Select
              value={accountId}
              onValueChange={(v) => setAccountId(v)}
              items={accounts.map((a) => ({
                value: String(a.id),
                label: a.nickName,
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择账号" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.nickName}
                    <span className="text-muted-foreground">
                      UID {account.roleUid}
                    </span>
                    {account.status === 'archived' && (
                      <span className="text-muted-foreground">（归档）</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>币种（每个币种导出一个文件）</Label>
            <div className="flex flex-col gap-2">
              {CURRENCIES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`export-currency-${type}`}
                    checked={currencies.has(type)}
                    onCheckedChange={(checked) => toggleCurrency(type, checked)}
                  />
                  <Label htmlFor={`export-currency-${type}`}>
                    {CURRENCY_NAME[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="export-start">开始日期</Label>
              <Input id="export-start" type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="export-end">结束日期</Label>
              <Input id="export-end" type="date" />
            </div>
          </div>
          {selectedAccount && (
            <p className="text-muted-foreground">
              {`将导出 ${currencies.size} 个文件，文件名如 endfield_${exampleCurrency}_2026-11-01_2026-11-23_uid${selectedAccount.roleUid}.csv`}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button disabled={currencies.size === 0}>
            <DownloadSimpleIcon data-icon="inline-start" />
            导出 {currencies.size} 个文件
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
