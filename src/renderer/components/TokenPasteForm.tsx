// Manual token paste login form (ADR-0014): the four session token fields
// copied from browser DevTools. Presentational stub for now.

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyIcon } from '@phosphor-icons/react';

interface TokenPasteFormProps {
  /** Submit button label, e.g. 保存并添加 / 覆盖保存. */
  submitLabel: string;
}

const TOKEN_FIELDS = [
  {
    id: 'account-token',
    label: '账号 token',
    hint: '请求头 x-account-token 的值',
    placeholder: 'paste x-account-token here',
  },
  {
    id: 'role-token',
    label: '角色 token',
    hint: '请求头 x-role-token 的值',
    placeholder: 'paste x-role-token here',
  },
  {
    id: 'role-server-id',
    label: '角色 server id',
    hint: '请求头 x-role-server-id 的值',
    placeholder: 'paste x-role-server-id here',
  },
  {
    id: 'binding-token',
    label: 'binding token',
    hint: 'binding_list 接口 URL 的 token 参数（可选）',
    placeholder: 'paste binding_token here',
  },
] as const;

export function TokenPasteForm({ submitLabel }: TokenPasteFormProps) {
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <p className="text-muted-foreground">
        从浏览器 DevTools 的 Network
        面板复制以下四字段粘贴进来，程序会直接将其作为会话令牌组落库。
      </p>
      <div className="flex flex-col gap-3">
        {TOKEN_FIELDS.map((field) => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input id={field.id} placeholder={field.placeholder} />
            <p className="text-muted-foreground">{field.hint}</p>
          </div>
        ))}
      </div>
      <Button type="submit" className="w-fit">
        <KeyIcon data-icon="inline-start" />
        {submitLabel}
      </Button>
    </form>
  );
}
