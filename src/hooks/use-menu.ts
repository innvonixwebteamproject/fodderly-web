import { MenuItem } from '@/config/types';

type MenuConfig = MenuItem[];

interface UseMenuReturn {
  isActive: (path: string | undefined) => boolean;
  hasActiveChild: (children: MenuItem[] | undefined) => boolean;
  isItemActive: (item: MenuItem) => boolean;
  getCurrentItem: (items: MenuConfig) => MenuItem | undefined;
  getBreadcrumb: (items: MenuConfig) => MenuItem[];
  getChildren: (items: MenuConfig, level: number) => MenuConfig | null;
}

export const useMenu = (pathname: string): UseMenuReturn => {
  const isActive = (path: string | undefined): boolean => {
    if (path && path === '/') {
      return path === pathname;
    } else {
      return !!path && pathname.startsWith(path);
    }
  };

  const hasActiveChild = (children: MenuItem[] | undefined): boolean => {
    if (!children || !Array.isArray(children)) return false;
    return children.some(
      (child: MenuItem) =>
        (child.path && isActive(child.path)) ||
        (child.children && hasActiveChild(child.children)),
    );
  };

  const isItemActive = (item: MenuItem): boolean => {
    return (
      (item.path ? isActive(item.path) : false) ||
      (item.children ? hasActiveChild(item.children) : false)
    );
  };

  /** Prefer the longest matching path so `/admin/orders/foo` does not resolve to `/admin/orders`. */
  const pickLongestPathMatch = (candidates: MenuItem[]): MenuItem | undefined => {
    const withPath = candidates.filter((i) => i.path && isActive(i.path));
    if (withPath.length === 0) return undefined;
    return withPath.reduce((a, b) => (a.path!.length >= b.path!.length ? a : b));
  };

  const getCurrentItem = (items: MenuConfig): MenuItem | undefined => {
    const collectPathMatches = (nodes: MenuItem[]): MenuItem[] => {
      const out: MenuItem[] = [];
      for (const item of nodes) {
        if (item.path && isActive(item.path)) {
          out.push(item);
        }
        if (item.children?.length) {
          out.push(...collectPathMatches(item.children));
        }
      }
      return out;
    };
    return pickLongestPathMatch(collectPathMatches(items));
  };

  const getBreadcrumb = (items: MenuConfig): MenuItem[] => {
    const findBreadcrumb = (
      nodes: MenuItem[],
      breadcrumb: MenuItem[] = [],
    ): MenuItem[] => {
      const bestHere = pickLongestPathMatch(nodes);
      if (bestHere) {
        const hereTrail = [...breadcrumb, bestHere];
        if (bestHere.children?.length) {
          const deeper = findBreadcrumb(bestHere.children, hereTrail);
          if (deeper.length > hereTrail.length) {
            return deeper;
          }
        }
        return hereTrail;
      }

      for (const item of nodes) {
        if (item.children && item.children.length > 0) {
          const currentBreadcrumb = [...breadcrumb, item];
          const childBreadcrumb = findBreadcrumb(item.children, currentBreadcrumb);
          if (childBreadcrumb.length > currentBreadcrumb.length) {
            return childBreadcrumb;
          }
        }
      }
      return breadcrumb;
    };

    const breadcrumb = findBreadcrumb(items);
    return breadcrumb.length > 0 ? breadcrumb : [];
  };

  const getChildren = (items: MenuConfig, level: number): MenuConfig | null => {
    const hasActiveChildAtLevel = (items: MenuConfig): boolean => {
      for (const item of items) {
        if (
          (item.path &&
            (item.path === pathname ||
              (item.path !== '/' &&
                item.path !== '' &&
                pathname.startsWith(item.path)))) ||
          (item.children && hasActiveChildAtLevel(item.children))
        ) {
          return true;
        }
      }
      return false;
    };

    const findChildren = (
      items: MenuConfig,
      targetLevel: number,
      currentLevel: number = 0,
    ): MenuConfig | null => {
      for (const item of items) {
        if (item.children) {
          if (
            targetLevel === currentLevel &&
            hasActiveChildAtLevel(item.children)
          ) {
            return item.children;
          }
          const children = findChildren(
            item.children,
            targetLevel,
            currentLevel + 1,
          );
          if (children) {
            return children;
          }
        } else if (
          targetLevel === currentLevel &&
          item.path &&
          (item.path === pathname ||
            (item.path !== '/' &&
              item.path !== '' &&
              pathname.startsWith(item.path)))
        ) {
          return items;
        }
      }
      return null;
    };

    return findChildren(items, level);
  };

  return {
    isActive,
    hasActiveChild,
    isItemActive,
    getCurrentItem,
    getBreadcrumb,
    getChildren,
  };
};
