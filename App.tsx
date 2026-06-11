// NativeWind v2: Babel 플러그인 방식으로 동작하므로 CSS import 불필요
import { useEffect } from 'react';
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

// ✅ 인증 완료 후 진입하는 하단 탭 네비게이터
//    피드(기본) / 카메라 / 마이 탭으로 구성됩니다.
import TabNavigator from './src/navigation/TabNavigator';

// ✅ 타입은 src/types/navigation.ts에서 중앙 관리합니다.
import { RootStackParamList } from './src/types/navigation';

// ─────────────────────────────────────────────
// 📌 핵심: 이 호출은 반드시 컴포넌트 밖(모듈 최상단)에 있어야 합니다.
// 앱이 JS 번들을 불러오기 시작하는 즉시 스플래시를 "잠금" 상태로 만들어,
// 폰트 로딩이 끝나기 전에 스플래시가 사라지는 것을 막습니다.
SplashScreen.preventAutoHideAsync();
// ─────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

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

  // ─── 폰트 로딩 완료 시 스플래시 숨김 ───────────────────────────────────
  // fontsLoaded가 true로 바뀌는 시점에 딱 한 번 hideAsync()를 호출합니다.
  useEffect(() => {
    if (fontsLoaded) {
      // hideAsync를 await해야 스플래시 페이드아웃이 완전히 끝난 후 앱 UI가 표시됩니다.
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 폰트 로딩이 완료되기 전엔 null을 반환합니다.
  // 스플래시가 화면을 덮고 있으므로 사용자에게 빈 화면이 보이지 않습니다.
  if (!fontsLoaded) {
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

