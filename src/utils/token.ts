import * as SecureStore from 'expo-secure-store';

/**
 * [token.ts]
 * 토큰(AccessToken, RefreshToken)을 기기의 안전한 저장소(SecureStore)에 
 * 저장하고 관리하는 유틸리티입니다.
 */

const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';

/**
 * 토큰 저장
 */
export async function saveTokens(accessToken: string, refreshToken: string) {
    try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        console.log('[TokenStore] 토큰 저장 완료');
    } catch (error) {
        console.error('[TokenStore] 토큰 저장 실패:', error);
    }
}

/**
 * Access Token 조회
 */
export async function getAccessToken() {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/**
 * Refresh Token 조회
 */
export async function getRefreshToken() {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * 모든 토큰 삭제 (로그아웃 시 사용)
 */
export async function clearTokens() {
    try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        console.log('[TokenStore] 토큰 삭제 완료');
    } catch (error) {
        console.error('[TokenStore] 토큰 삭제 실패:', error);
    }
}
