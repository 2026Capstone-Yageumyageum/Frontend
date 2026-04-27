// NativeWind v2: Babel 플러그인 방식으로 동작하므로 CSS import 불필요
import { StatusBar } from 'expo-status-bar';
// NavigationContainer: 전체 앱의 네비게이션 상태를 관리하는 최상위 컴포넌트
import { NavigationContainer } from '@react-navigation/native';
// createNativeStackNavigator: iOS/Android 네이티브 스택 전환 애니메이션 제공
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './src/screens/Login';
import Test from './src/screens/Test';

// ─────────────────────────────────────────────
//  타입 정의: 각 스크린에서 navigation.navigate('스크린명')으로 이동할 때
//  타입 안전성을 보장하기 위해 파라미터 맵을 정의합니다.
// ─────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined; // 파라미터 없음
  Test: undefined;  // 파라미터 없음
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 앱 진입점: NavigationContainer로 전체를 감싸야 useNavigation()이 동작합니다.
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          // 각 화면 상단의 기본 헤더를 숨깁니다 (커스텀 헤더 사용 시)
          headerShown: false,
        }}
      >
        {/* 로그인 화면 */}
        <Stack.Screen name="Login" component={Login} />
        {/* 라우팅 테스트용 화면 */}
        <Stack.Screen name="Test" component={Test} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
