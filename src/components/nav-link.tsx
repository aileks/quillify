import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  /** Render icon only, for the collapsed sidebar */
  iconOnly?: boolean;
  /** Called after navigation starts, e.g. to close the mobile menu */
  onClick?: () => void;
  className?: string;
}

export function NavLink({
  href,
  icon: Icon,
  label,
  active,
  iconOnly,
  onClick,
  className,
}: NavLinkProps) {
  return (
    <Button
      variant='ghost'
      asChild
      className={cn(
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground',
        iconOnly && 'justify-center px-2',
        className
      )}
      title={iconOnly ? label : undefined}
    >
      <Link href={href} aria-current={active ? 'page' : undefined} onClick={onClick}>
        <Icon />
        {!iconOnly && <span>{label}</span>}
      </Link>
    </Button>
  );
}
