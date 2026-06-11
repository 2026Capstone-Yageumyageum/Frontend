import { useCallback, useRef } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Android 기기에서 뒤로가기 버튼을 두 번 연속으로 눌러야 앱을 종료하게 만드는 커스텀 훅.
 * 이 훅을 호출하는 화면(Screen)이 포커스 되어 있을 때만 뒤로가기 이벤트를 가로챕니다.
 */
export function useDoubleBackExit() {
  const exitAppRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (Platform.OS === 'android') {
          if (exitAppRef.current) {
            BackHandler.exitApp();
            return true;
          }

          exitAppRef.current = true;
          ToastAndroid.show('뒤로가기 버튼을 한 번 더 누르면 종료됩니다.', ToastAndroid.SHORT);

          setTimeout(() => {
            exitAppRef.current = false;
          }, 2000);

          return true; // 기본 뒤로가기 이벤트 가로채기
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );
}
