// App shell: sidebar navigation between 主页 and 设置页, plus the shared
// dialogs. There is no data source yet — the UI holds only its own view
// state, and data wiring (the IPC layer) is TBD.

import { AddAccountDialog } from '@/renderer/components/AddAccountDialog';
import { ExportCsvDialog } from '@/renderer/components/ExportCsvDialog';
import { UpdateTokenDialog } from '@/renderer/components/UpdateTokenDialog';
import { builtinReasonTable, MAX_LOOKBACK_DAYS } from '@/renderer/lib/builtin';
import { HomePage } from '@/renderer/pages/HomePage';
import { SettingsPage } from '@/renderer/pages/SettingsPage';
import type { Account } from '@/renderer/types';
import { GearSixIcon, HouseIcon } from '@phosphor-icons/react';
import { cn } from 'cn';
import { useEffect, useState } from 'react';

type Page = 'home' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [exportDialog, setExportDialog] = useState<{
    open: boolean;
    accountId: number | null;
  }>({ open: false, accountId: null });
  const [tokenAccount, setTokenAccount] = useState<Account | null>(null);

  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const currentAccount =
    activeAccounts.find((a) => a.id === currentAccountId) ??
    activeAccounts[0] ??
    null;

  // 无任何账号时弹出添加账号 modal 引导用户（ui.md）。
  useEffect(() => {
    if (accounts.length === 0) setAddDialogOpen(true);
  }, [accounts.length]);

  const handleArchive = (account: Account) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, status: 'archived' } : a)),
    );
  };

  const handleRestore = (account: Account) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, status: 'active' } : a)),
    );
  };

  const navItems: { id: Page; label: string; icon: typeof HouseIcon }[] = [
    { id: 'home', label: '主页', icon: HouseIcon },
    { id: 'settings', label: '设置', icon: GearSixIcon },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-52 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 border-b px-4 py-4">
          {/* Logo placeholder: plain black square, artwork to be replaced. */}
          <div className="size-8 shrink-0 bg-black" aria-hidden />
          <div className="flex flex-col">
            <span className="font-heading text-sm leading-tight font-medium">
              终末地资源日志
            </span>
            <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
              endlogs
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors outline-none',
                page === id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t p-4">
          <p className="text-muted-foreground text-[10px] leading-relaxed">
            码表 v{builtinReasonTable.version}
          </p>
        </div>
      </aside>

      {/* Pages */}
      {page === 'home' ? (
        <HomePage
          accounts={activeAccounts}
          currentAccount={currentAccount}
          onSelectAccount={setCurrentAccountId}
          onAddAccount={() => setAddDialogOpen(true)}
          onExportCsv={() =>
            setExportDialog({
              open: true,
              accountId: currentAccount?.id ?? null,
            })
          }
        />
      ) : (
        <SettingsPage
          accounts={accounts}
          reasonTable={builtinReasonTable}
          maxLookbackDays={MAX_LOOKBACK_DAYS}
          onAddAccount={() => setAddDialogOpen(true)}
          onImportCsv={() => {
            // CSV import entry stub — dialog flow lands with the data layer.
          }}
          onExportCsv={(account) =>
            setExportDialog({ open: true, accountId: account.id })
          }
          onUpdateToken={setTokenAccount}
          onArchive={handleArchive}
          onRestore={handleRestore}
        />
      )}

      {/* Shared dialogs */}
      <AddAccountDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <ExportCsvDialog
        open={exportDialog.open}
        onOpenChange={(open) => setExportDialog((prev) => ({ ...prev, open }))}
        accounts={accounts}
        defaultAccountId={exportDialog.accountId}
      />
      <UpdateTokenDialog
        account={tokenAccount}
        open={tokenAccount !== null}
        onOpenChange={(open) => {
          if (!open) setTokenAccount(null);
        }}
      />
    </div>
  );
}
