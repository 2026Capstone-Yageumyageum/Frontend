// NativeWind v2: Babel 플러그인 방식으로 동작하므로 CSS import 불필요
import { StatusBar } from 'expo-status-bar';
// import ComponentShowcase from './src/screens/ComponentShowcase';
import Login from './src/screens/Login';

// 앱 진입점: 컴포넌트 쇼케이스 화면을 렌더링
export default function App() {
  return (
    <>
      <Login />
      <StatusBar style="auto" />
    </>
  );
}
