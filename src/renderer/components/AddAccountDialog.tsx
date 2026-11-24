// 添加账号 modal: browser login or manual token paste (R1). Logic is stubbed.

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenPasteForm } from '@/renderer/components/TokenPasteForm';
import { GlobeIcon, UserPlusIcon } from '@phosphor-icons/react';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({
  open,
  onOpenChange,
}: AddAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon data-icon="inline-start" />
            添加新用户
          </DialogTitle>
          <DialogDescription>
            选择一种登录方式完成第一个账号的添加，多账号数据完全隔离。
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="browser">
          <TabsList className="w-full">
            <TabsTrigger value="browser">浏览器登录</TabsTrigger>
            <TabsTrigger value="paste">粘贴 token</TabsTrigger>
          </TabsList>
          <TabsContent value="browser" className="pt-4">
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground">
                将打开浏览器窗口并进入客服中心的登录页面。完成登录后，程序会自动捕获会话所需的令牌组。
              </p>
              <Button className="w-fit">
                <GlobeIcon data-icon="inline-start" />
                打开浏览器并登录
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="paste" className="pt-4">
            <TokenPasteForm submitLabel="保存并添加" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
