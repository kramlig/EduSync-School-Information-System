/**
 * VirtualizedList - Performance-optimized virtual scrolling list for large datasets
 * 
 * Features:
 * - Virtual scrolling (only renders visible items)
 * - Efficient memory usage
 * - Smooth scrolling performance
 * - Dynamic item heights support
 * - Scroll position restoration
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { 
  useRef, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  CSSProperties,
} from 'react';

// =====================================================
// TYPES
// =====================================================

interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Estimated height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels or CSS value */
  containerHeight: number | string;
  /** Render function for each item */
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  /** Optional key extractor function */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Number of items to render above/below visible area */
  overscan?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Optional class name for the container */
  className?: string;
  /** Optional loading state */
  loading?: boolean;
  /** Optional loading component */
  loadingComponent?: React.ReactNode;
  /** Optional empty state component */
  emptyComponent?: React.ReactNode;
  /** Callback when scrolled near bottom */
  onEndReached?: () => void;
  /** Threshold for onEndReached in pixels */
  endReachedThreshold?: number;
}

interface VirtualizedGridProps<T> extends Omit<VirtualizedListProps<T>, 'itemHeight'> {
  /** Number of columns in the grid */
  columns: number;
  /** Height of each row in pixels */
  rowHeight: number;
}

// =====================================================
// VIRTUALIZED LIST COMPONENT
// =====================================================

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 3,
  gap = 0,
  className = '',
  loading = false,
  loadingComponent,
  emptyComponent,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualizedListProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightValue, setContainerHeightValue] = useState(0);
  
  // Calculate container height
  useEffect(() => {
    if (typeof containerHeight === 'number') {
      setContainerHeightValue(containerHeight);
    } else if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeightValue(entry.contentRect.height);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [containerHeight]);

  // Calculate visible range
  const { startIndex, endIndex, visibleCount } = useMemo(() => {
    const effectiveItemHeight = itemHeight + gap;
    const visibleCount = Math.ceil(containerHeightValue / effectiveItemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / effectiveItemHeight) - overscan);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
    
    return { startIndex, endIndex, visibleCount };
  }, [scrollTop, containerHeightValue, itemHeight, gap, items.length, overscan]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return items.length * (itemHeight + gap) - gap;
  }, [items.length, itemHeight, gap]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    
    // Check if near end
    if (onEndReached) {
      const distanceFromEnd = totalHeight - (target.scrollTop + containerHeightValue);
      if (distanceFromEnd < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [totalHeight, containerHeightValue, endReachedThreshold, onEndReached]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const item = items[i];
      const key = keyExtractor ? keyExtractor(item, i) : i;
      const top = i * (itemHeight + gap);
      
      const style: CSSProperties = {
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: itemHeight,
      };
      
      result.push(
        <div key={key} style={style}>
          {renderItem(item, i, style)}
        </div>
      );
    }
    
    return result;
  }, [items, startIndex, endIndex, itemHeight, gap, keyExtractor, renderItem]);

  // Empty state
  if (!loading && items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  // Loading state
  if (loading && items.length === 0 && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  const containerStyle: CSSProperties = {
    height: typeof containerHeight === 'number' ? containerHeight : containerHeight,
    overflow: 'auto',
    position: 'relative',
  };

  const innerStyle: CSSProperties = {
    height: totalHeight,
    position: 'relative',
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onScroll={handleScroll}
    >
      <div style={innerStyle}>
        {visibleItems}
      </div>
      {loading && items.length > 0 && loadingComponent && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

// =====================================================
// VIRTUALIZED GRID COMPONENT
// =====================================================

export function VirtualizedGrid<T>({
  items,
  columns,
  rowHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 2,
  gap = 0,
  className = '',
  loading = false,
  loadingComponent,
  emptyComponent,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualizedGridProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightValue, setContainerHeightValue] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Calculate container dimensions
  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeightValue(
            typeof containerHeight === 'number' 
              ? containerHeight 
              : entry.contentRect.height
          );
          setContainerWidth(entry.contentRect.width);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [containerHeight]);

  // Calculate item width
  const itemWidth = useMemo(() => {
    return (containerWidth - gap * (columns - 1)) / columns;
  }, [containerWidth, columns, gap]);

  // Calculate number of rows
  const rowCount = useMemo(() => {
    return Math.ceil(items.length / columns);
  }, [items.length, columns]);

  // Calculate visible range (in rows)
  const { startRow, endRow } = useMemo(() => {
    const effectiveRowHeight = rowHeight + gap;
    const visibleRows = Math.ceil(containerHeightValue / effectiveRowHeight);
    const startRow = Math.max(0, Math.floor(scrollTop / effectiveRowHeight) - overscan);
    const endRow = Math.min(rowCount - 1, startRow + visibleRows + overscan * 2);
    
    return { startRow, endRow };
  }, [scrollTop, containerHeightValue, rowHeight, gap, rowCount, overscan]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return rowCount * (rowHeight + gap) - gap;
  }, [rowCount, rowHeight, gap]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    
    // Check if near end
    if (onEndReached) {
      const distanceFromEnd = totalHeight - (target.scrollTop + containerHeightValue);
      if (distanceFromEnd < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [totalHeight, containerHeightValue, endReachedThreshold, onEndReached]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    for (let row = startRow; row <= endRow && row < rowCount; row++) {
      const top = row * (rowHeight + gap);
      
      for (let col = 0; col < columns; col++) {
        const itemIndex = row * columns + col;
        if (itemIndex >= items.length) break;
        
        const item = items[itemIndex];
        const key = keyExtractor ? keyExtractor(item, itemIndex) : itemIndex;
        const left = col * (itemWidth + gap);
        
        const style: CSSProperties = {
          position: 'absolute',
          top,
          left,
          width: itemWidth,
          height: rowHeight,
        };
        
        result.push(
          <div key={key} style={style}>
            {renderItem(item, itemIndex, style)}
          </div>
        );
      }
    }
    
    return result;
  }, [items, startRow, endRow, rowCount, columns, rowHeight, itemWidth, gap, keyExtractor, renderItem]);

  // Empty state
  if (!loading && items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  // Loading state
  if (loading && items.length === 0 && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  const containerStyle: CSSProperties = {
    height: typeof containerHeight === 'number' ? containerHeight : containerHeight,
    overflow: 'auto',
    position: 'relative',
  };

  const innerStyle: CSSProperties = {
    height: totalHeight,
    position: 'relative',
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onScroll={handleScroll}
    >
      <div style={innerStyle}>
        {visibleItems}
      </div>
      {loading && items.length > 0 && loadingComponent && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SIMPLE WINDOWED LIST (for tables)
// =====================================================

interface WindowedTableProps<T> {
  /** Array of data rows */
  data: T[];
  /** Height of each row */
  rowHeight: number;
  /** Max height of the table body */
  maxHeight: number;
  /** Render function for table row */
  renderRow: (item: T, index: number) => React.ReactNode;
  /** Optional key extractor */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Number of rows to overscan */
  overscan?: number;
}

export function WindowedTable<T>({
  data,
  rowHeight,
  maxHeight,
  renderRow,
  keyExtractor,
  overscan = 5,
}: WindowedTableProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const visibleCount = Math.ceil(maxHeight / rowHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(data.length - 1, startIndex + visibleCount + overscan * 2);
    
    return { startIndex, endIndex };
  }, [scrollTop, maxHeight, rowHeight, data.length, overscan]);

  // Calculate total height
  const totalHeight = data.length * rowHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Render visible rows
  const visibleRows = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    for (let i = startIndex; i <= endIndex && i < data.length; i++) {
      const item = data[i];
      const key = keyExtractor ? keyExtractor(item, i) : i;
      const top = i * rowHeight;
      
      result.push(
        <div 
          key={key} 
          style={{ 
            position: 'absolute', 
            top, 
            left: 0, 
            right: 0, 
            height: rowHeight,
          }}
        >
          {renderRow(item, i)}
        </div>
      );
    }
    
    return result;
  }, [data, startIndex, endIndex, rowHeight, keyExtractor, renderRow]);

  return (
    <div
      ref={containerRef}
      style={{ height: maxHeight, overflow: 'auto', position: 'relative' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleRows}
      </div>
    </div>
  );
}

export default {
  VirtualizedList,
  VirtualizedGrid,
  WindowedTable,
};
