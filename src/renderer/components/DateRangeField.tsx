// 日期区间选择: single-trigger range picker — one Popover wrapping a
// Calendar in mode="range" (the shadcn "Range Picker" composition). Picking
// "from" then "to" happens inside the same calendar; future dates stay
// unselectable. The chosen range will feed the tab filtering once those
// views are designed.

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDateObject } from '@/renderer/lib/time';
import { CalendarBlankIcon } from '@phosphor-icons/react';
import type { DateRange } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';

interface DateRangeFieldProps {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

export function DateRangeField({ range, onChange }: DateRangeFieldProps) {
  // Future dates are meaningless for a ledger lookback window.
  const today = new Date();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="日期范围"
            className="justify-start px-2.5 font-normal"
          />
        }
      >
        <CalendarBlankIcon data-icon="inline-start" />
        {range?.from ? (
          range.to ? (
            <>
              {formatDateObject(range.from)} – {formatDateObject(range.to)}
            </>
          ) : (
            formatDateObject(range.from)
          )
        ) : (
          <span className="text-muted-foreground">选择日期范围</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-1">
        <Calendar
          mode="range"
          locale={zhCN}
          numberOfMonths={2}
          defaultMonth={range?.from}
          selected={range}
          onSelect={onChange}
          disabled={{ after: today }}
        />
      </PopoverContent>
    </Popover>
  );
}
