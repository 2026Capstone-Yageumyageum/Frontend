import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/common/Button';

export default function Test() {
    const navigation = useNavigation();

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 justify-center items-center px-6">

                {/* 테스트 확인용 텍스트 */}
                <Text className="text-2xl font-bold text-gray-800 mb-4">
                    라우팅 성공!
                </Text>
                <Text className="text-base text-gray-600 mb-10 text-center">
                    로그인 버튼을 눌러 Test 화면으로 넘어왔습니다.{"\n"}
                    이곳은 라우팅 테스트를 위한 임시 화면입니다.
                </Text>

                {/* 뒤로 가기 버튼 (직접 만드신 Button 컴포넌트 활용) */}
                <View className="w-full">
                    <Button
                        size="long"
                        variant="primary" // 테스트용이므로 눈에 띄게 파란색 primary 사용
                        label="다시 로그인 화면으로 (뒤로 가기)"
                        onPress={() => navigation.goBack()}
                    />
                </View>

            </View>
        </SafeAreaView>
    );
}