// Visual identity for the three currencies + shared presentation helpers.

import type { CurrencyType } from '@/renderer/types';
import { DiamondIcon, SparkleIcon, WrenchIcon } from '@phosphor-icons/react';
import type { ComponentType, SVGProps } from 'react';

const CURRENCY_ICONS: Record<
  CurrencyType,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  1: DiamondIcon,
  2: SparkleIcon,
  3: WrenchIcon,
};

export function CurrencyIcon({
  currency,
  className,
}: {
  currency: CurrencyType;
  className?: string;
}) {
  const Icon = CURRENCY_ICONS[currency];
  return <Icon className={className} />;
}

/** Text color for a signed amount. */
export function signClass(n: number): string {
  if (n > 0) return 'text-success';
  if (n === 0) return 'text-muted-foreground';
  // Negative amounts (consumption) use the default foreground color.
  return '';
}
