// NativeWind v2: Babel 플러그인 방식으로 동작하므로 CSS import 불필요
import { StatusBar } from 'expo-status-bar';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

// 앱 진입점: NavigationContainer로 전체를 감싸야 useNavigation()이 동작합니다.
export default function App() {
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
