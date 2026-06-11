// NativeWind v2: Babel 플러그인 방식으로 동작하므로 CSS import 불필요
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
// SplashScreen: 앱 초기화가 완료될 때까지 네이티브 스플래시를 강제로 유지시킵니다.
import * as SplashScreen from 'expo-splash-screen';
// NavigationContainer: 전체 앱의 네비게이션 상태를 관리하는 최상위 컴포넌트
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// createNativeStackNavigator: iOS/Android 네이티브 스택 전환 애니메이션 제공
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './src/screens/Login';
import Signup from './src/screens/Signup';

// ✅ 인증 완료 후 진입하는 하단 탭 네비게이터
//    피드(기본) / 카메라 / 마이 탭으로 구성됩니다.
import TabNavigator from './src/navigation/TabNavigator';

// ✅ 타입은 src/types/navigation.ts에서 중앙 관리합니다.
import { RootStackParamList } from './src/types/navigation';

// ─────────────────────────────────────────────
// 📌 핵심: 이 호출은 반드시 컴포넌트 밖(모듈 최상단)에 있어야 합니다.
// 앱이 JS 번들을 불러오기 시작하는 즉시 스플래시를 "잠금" 상태로 만들어,
// 초기화가 끝나기 전에 스플래시가 사라지는 것을 막습니다.
SplashScreen.preventAutoHideAsync();
// ─────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

// 앱 진입점: NavigationContainer로 전체를 감싸야 useNavigation()이 동작합니다.
export default function App() {
  // 앱 초기화(폰트, 설정 등) 완료 여부를 추적하는 상태
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    /**
     * 앱 초기화 작업을 수행하는 비동기 함수.
     * 여기에 폰트 로딩(useFonts), 토큰 검증 등 앱 시작에 필요한 작업을 추가하세요.
     * 모든 작업 완료 후 스플래시를 숨깁니다.
     */
    async function prepareApp() {
      try {
        // 🔧 TODO: 추후 폰트 로딩, 초기 API 호출 등을 여기에 추가하세요.
        // 예: await Font.loadAsync({ ... });
        // 예: await AsyncStorage.getItem('userToken');

        // 현재는 준비 작업이 없으므로 즉시 완료 처리
      } catch (error) {
        // 초기화 중 오류가 발생해도 앱이 멈추지 않도록 콘솔에만 기록합니다.
        console.warn('앱 초기화 중 오류 발생:', error);
      } finally {
        // 성공/실패 여부와 무관하게 항상 준비 완료 상태로 전환
        setIsAppReady(true);
        // hideAsync를 await해야 스플래시 페이드아웃이 완전히 끝난 후 다음 동작으로 넘어갑니다.
        await SplashScreen.hideAsync();
      }
    }

    prepareApp();
  }, []);

  // 초기화가 완료되기 전엔 아무것도 렌더링하지 않습니다.
  // (스플래시가 여전히 화면을 덮고 있으므로 사용자에게는 보이지 않음)
  if (!isAppReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            // 각 화면 상단의 기본 헤더를 숨깁니다
            headerShown: false,
          }}
        >
          {/* 로그인 화면 */}
          <Stack.Screen name="Login" component={Login} />
          {/* 신규 유저 닉네임 등록 화면 */}
          <Stack.Screen name="Signup" component={Signup} />
          {/* 인증 완료 후 메인 앱 (하단 탭: 피드/카메라/마이) */}
          <Stack.Screen name="Home" component={TabNavigator} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
