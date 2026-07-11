import { memo, ReactNode } from 'react';
import { FlatList, FlatListProps, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = {
  children: ReactNode;
  compactTop?: boolean;
  disableAutomaticScrollInsets?: boolean;
  comfortableBottom?: boolean;
};

type ScreenListProps<ItemT> = Omit<FlatListProps<ItemT>, 'renderItem'> & {
  renderItem: FlatListProps<ItemT>['renderItem'];
  compactTop?: boolean;
  comfortableBottom?: boolean;
};

const safeAreaEdges = {
  default: ['top', 'left', 'right'] as const,
  comfortable: ['top', 'left', 'right', 'bottom'] as const,
};

export const ScreenContainer = memo(function ScreenContainer({
  children,
  compactTop = false,
  disableAutomaticScrollInsets = false,
  comfortableBottom = false,
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      edges={comfortableBottom ? safeAreaEdges.comfortable : safeAreaEdges.default}
      style={styles.safeArea}>
      <ScrollView
        automaticallyAdjustContentInsets={!disableAutomaticScrollInsets}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior={disableAutomaticScrollInsets ? 'never' : 'automatic'}>
        <View
          style={[
            styles.inner,
            compactTop && styles.innerCompactTop,
            comfortableBottom && styles.innerComfortableBottom,
          ]}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

export function ScreenList<ItemT>({
  compactTop = false,
  comfortableBottom = false,
  contentContainerStyle,
  ...props
}: ScreenListProps<ItemT>) {
  return (
    <SafeAreaView
      edges={comfortableBottom ? safeAreaEdges.comfortable : safeAreaEdges.default}
      style={styles.safeArea}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          styles.inner,
          compactTop && styles.innerCompactTop,
          comfortableBottom && styles.innerComfortableBottom,
          contentContainerStyle,
        ]}
        {...props}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  content: {
    flexGrow: 1,
  },
  inner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  innerCompactTop: {
    paddingTop: 8,
  },
  innerComfortableBottom: {
    paddingBottom: 24,
  },
});
