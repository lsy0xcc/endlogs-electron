// 更新 token dialog: re-paste the session token group to overwrite the
// existing one (the only editable item of an account).

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TokenPasteForm } from '@/renderer/components/TokenPasteForm';
import type { Account } from '@/renderer/types';

interface UpdateTokenDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateTokenDialog({
  account,
  open,
  onOpenChange,
}: UpdateTokenDialogProps) {
  return (
    <Dialog
      open={open && account !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更新 token</DialogTitle>
          <DialogDescription>
            为账号 {account?.nickName}（UID {account?.roleUid}
            ）重新粘贴令牌组，保存后覆盖现有 token，流水与同步进度不受影响。
          </DialogDescription>
        </DialogHeader>
        <TokenPasteForm submitLabel="覆盖保存" />
      </DialogContent>
    </Dialog>
  );
}
