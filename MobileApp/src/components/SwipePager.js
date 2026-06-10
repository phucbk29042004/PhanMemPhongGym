import React, { useRef, useCallback } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * SwipePager — danh sách phân trang theo vuốt ngang.
 * Props:
 *   data: any[]             — toàn bộ dữ liệu
 *   pageSize: number        — số item mỗi trang (mặc định 10)
 *   page: number            — trang hiện tại (0-based)
 *   onPageChange: fn(page)  — callback khi đổi trang
 *   renderItem: fn({item})  — render 1 item
 *   keyExtractor: fn(item)  — key
 *   colors: object          — theme colors
 *   ListEmptyComponent      — component khi rỗng
 *   refreshControl          — RefreshControl
 *   contentContainerStyle   — style cho ScrollView bên trong
 */
export default function SwipePager({
  data = [],
  pageSize = 10,
  page = 0,
  onPageChange,
  renderItem,
  keyExtractor,
  colors,
  ListEmptyComponent,
  refreshControl,
  contentContainerStyle,
}) {
  const flatRef = useRef(null);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const pages = Array.from({ length: totalPages }, (_, i) =>
    data.slice(i * pageSize, (i + 1) * pageSize)
  );

  const handleMomentumEnd = useCallback((e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newPage = Math.round(offsetX / SCREEN_WIDTH);
    if (newPage !== page) onPageChange?.(newPage);
  }, [page, onPageChange]);

  const goToPage = useCallback((p) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, p));
    flatRef.current?.scrollToOffset({ offset: clamped * SCREEN_WIDTH, animated: true });
    onPageChange?.(clamped);
  }, [totalPages, onPageChange]);

  if (data.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {refreshControl ? (
          <FlatList
            data={[]}
            renderItem={null}
            refreshControl={refreshControl}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, contentContainerStyle]}
          />
        ) : (
          ListEmptyComponent
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatRef}
        data={pages}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        initialScrollIndex={page}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        refreshControl={page === 0 ? refreshControl : undefined}
        renderItem={({ item: pageItems }) => (
          <View style={{ width: SCREEN_WIDTH }}>
            <FlatList
              data={pageItems}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={contentContainerStyle}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
            />
          </View>
        )}
      />

      {/* Pagination bar */}
      {totalPages > 1 && (
        <View style={[s.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => goToPage(page - 1)}
            disabled={page === 0}
            style={[s.arrowBtn, { opacity: page === 0 ? 0.3 : 1 }]}
          >
            <ChevronLeft color={colors.primary} size={20} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={s.dots}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goToPage(i)}>
                <View style={[
                  s.dot,
                  { backgroundColor: i === page ? colors.primary : colors.border },
                  i === page && s.dotActive,
                ]} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => goToPage(page + 1)}
            disabled={page === totalPages - 1}
            style={[s.arrowBtn, { opacity: page === totalPages - 1 ? 0.3 : 1 }]}
          >
            <ChevronRight color={colors.primary} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  arrowBtn: {
    padding: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    height: 7,
    borderRadius: 4,
  },
});
