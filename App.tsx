// NativeWind v2: Babel 플러그인 방식으로 동작하므로 CSS import 불필요
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
// SplashScreen: 앱 초기화가 완료될 때까지 네이티브 스플래시를 강제로 유지시킵니다.
import * as SplashScreen from 'expo-splash-screen';
// useFonts: expo-font에서 제공하는 훅으로, 로컬 폰트를 비동기 로드합니다.
import { useFonts } from 'expo-font';
// NavigationContainer: 전체 앱의 네비게이션 상태를 관리하는 최상위 컴포넌트
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// createNativeStackNavigator: iOS/Android 네이티브 스택 전환 애니메이션 제공
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './src/screens/Login';
import Signup from './src/screens/Signup';
import AnalysisLoadingScreen from './src/features/report/screens/AnalysisLoadingScreen';
import ReportScreen from './src/features/report/screens/ReportScreen';

// ✅ 인증 완료 후 진입하는 하단 탭 네비게이터
//    피드(기본) / 카메라 / 마이 탭으로 구성됩니다.
import TabNavigator from './src/navigation/TabNavigator';

// ✅ 타입은 src/types/navigation.ts에서 중앙 관리합니다.
import { RootStackParamList } from './src/types/navigation';

// 자동 로그인에 필요한 것들
import { getRefreshToken, clearTokens } from './src/utils/token';
import { refreshTokens } from './src/api/tokenRefresher';
import { isConnectionError } from './src/api/apiError';
// API 레이어가 화면 밖에서 로그인 화면으로 되돌릴 수 있게 하는 참조
import { navigationRef } from './src/navigation/navigationRef';

// ─────────────────────────────────────────────
// 📌 핵심: 이 호출은 반드시 컴포넌트 밖(모듈 최상단)에 있어야 합니다.
// 앱이 JS 번들을 불러오기 시작하는 즉시 스플래시를 "잠금" 상태로 만들어,
// 폰트 로딩이 끝나기 전에 스플래시가 사라지는 것을 막습니다.
SplashScreen.preventAutoHideAsync();
// ─────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

/** 부트스트랩 결과: 앱이 어느 화면에서 시작해야 하는가 */
type InitialRoute = 'Login' | 'Home';

// 앱 진입점: NavigationContainer로 전체를 감싸야 useNavigation()이 동작합니다.
export default function App() {
  // ─── Pretendard 폰트 로딩 ───────────────────────────────────────────────
  // useFonts: 훅 내부에서 Font.loadAsync를 비동기 처리하며,
  //           fontsLoaded가 true가 될 때까지 스플래시를 유지합니다.
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });

  // ─── 자동 로그인 (부트스트랩) ──────────────────────────────────────────
  // 결정이 끝나기 전에는 null. 이 값이 정해질 때까지 스플래시를 유지하므로,
  // 로그인 화면이 잠깐 보였다가 홈으로 튕기는 깜빡임이 생기지 않습니다.
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);

  useEffect(() => {
    let cancelled = false;
    const decide = (route: InitialRoute) => {
      if (!cancelled) setInitialRoute(route);
    };

    (async () => {
      const refreshToken = await getRefreshToken();
      // 한 번도 로그인하지 않았거나 로그아웃한 상태. 서버를 부를 필요가 없습니다.
      if (!refreshToken) {
        decide('Login');
        return;
      }

      try {
        // 저장된 리프레시 토큰으로 새 토큰 한 쌍을 받아 저장합니다.
        // 서버가 리프레시 토큰도 함께 새로 발급하므로(일회용), 14일 안에 앱을 한 번씩
        // 열기만 하면 로그인이 계속 이어집니다.
        await refreshTokens();
        decide('Home');
      } catch (error) {
        // 네트워크가 끊겨서 갱신하지 못한 것뿐이라면 로그인 정보를 지우면 안 됩니다.
        // 저장된 토큰을 그대로 두고 홈으로 들어가, 각 화면이 자기 에러를 보여주게 합니다.
        if (isConnectionError(error)) {
          decide('Home');
          return;
        }
        // 리프레시 토큰이 만료(14일 경과)됐거나 위조된 경우. 회복 불가이므로 정리합니다.
        await clearTokens();
        decide('Login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── 준비가 모두 끝나면 스플래시 숨김 ─────────────────────────────────
  // 폰트와 부트스트랩 중 하나라도 남아 있으면 스플래시를 유지합니다.
  const isReady = fontsLoaded && initialRoute !== null;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // 준비 전엔 null을 반환합니다.
  // 스플래시가 화면을 덮고 있으므로 사용자에게 빈 화면이 보이지 않습니다.
  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {/* navigationRef: authFetch가 세션 종료 시 로그인 화면으로 되돌릴 때 사용합니다. */}
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={initialRoute}
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
          {/* 영상 등록 후 분석 대기 화면 */}
          <Stack.Screen name="AnalysisLoading" component={AnalysisLoadingScreen} />
          {/* 영상 등록 후 렌더링되는 AI 분석 결과 화면 */}
          <Stack.Screen name="Report" component={ReportScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
