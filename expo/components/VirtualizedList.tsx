import React, { memo, useMemo, useCallback } from 'react';
import { FlatList, ListRenderItem } from 'react-native';
import { useStableCallback, createOptimizedListItem } from '@/utils/performance';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  estimatedItemSize?: number;
  horizontal?: boolean;
  showsScrollIndicator?: boolean;
  contentContainerStyle?: any;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  numColumns?: number;
  columnWrapperStyle?: any;
}

function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.5,
  estimatedItemSize = 100,
  horizontal = false,
  showsScrollIndicator = false,
  contentContainerStyle,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
  numColumns,
  columnWrapperStyle,
}: VirtualizedListProps<T>) {
  // Create optimized list item component
  const { ListItem } = useMemo(() => {
    return createOptimizedListItem(
      renderItem,
      keyExtractor,
      (prevProps, nextProps) => {
        // Custom comparison for better performance
        return (
          prevProps.index === nextProps.index &&
          keyExtractor(prevProps.item, prevProps.index) === 
          keyExtractor(nextProps.item, nextProps.index)
        );
      }
    );
  }, [renderItem, keyExtractor]);
  
  // Stable callbacks
  const stableOnEndReached = useStableCallback(onEndReached || (() => {}));
  const stableOnRefresh = useStableCallback(onRefresh || (() => {}));
  
  // Optimized render item
  const optimizedRenderItem: ListRenderItem<T> = useCallback(
    ({ item, index }) => (
      <ListItem item={item} index={index} />
    ),
    [ListItem]
  );
  
  // Get item layout for better performance
  const getItemLayout = useCallback(
    (data: ArrayLike<T> | null | undefined, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }),
    [estimatedItemSize]
  );
  
  return (
    <FlatList
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      onEndReached={onEndReached ? stableOnEndReached : undefined}
      onEndReachedThreshold={onEndReachedThreshold}
      getItemLayout={!horizontal ? getItemLayout : undefined}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={showsScrollIndicator}
      showsVerticalScrollIndicator={showsScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh ? stableOnRefresh : undefined}
      numColumns={numColumns}
      columnWrapperStyle={columnWrapperStyle}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      // Memory optimizations
      disableVirtualization={false}
      legacyImplementation={false}
    />
  );
}

export default memo(VirtualizedList) as typeof VirtualizedList;