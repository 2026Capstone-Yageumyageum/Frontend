const fs = require('fs');
const os = require('os');
const path = require('path');

// 1. 현재 PC의 IPv4 주소를 찾는 함수
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4이고 내부망(localhost)이 아닌 IP 반환
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const currentIP = getLocalIP();
const envPath = path.join(__dirname, '.env');

// .env 파일이 존재하는지 확인
if (!fs.existsSync(envPath)) {
  console.log('⚠️ .env 파일이 존재하지 않습니다. 새로 생성합니다.');
  fs.writeFileSync(envPath, `EXPO_PUBLIC_API_URL=http://${currentIP}:8080\n`, 'utf8');
} else {
  let envContent = fs.readFileSync(envPath, 'utf8');

  // 2. EXPO_PUBLIC_API_URL이 이미 있다면 교체, 없다면 추가
  const ipRegex = /EXPO_PUBLIC_API_URL=http:\/\/[0-9.]+:8080/g;
  if (ipRegex.test(envContent)) {
    envContent = envContent.replace(ipRegex, `EXPO_PUBLIC_API_URL=http://${currentIP}:8080`);
  } else {
    // 줄바꿈 확인 후 추가
    const separator = envContent.endsWith('\n') ? '' : '\n';
    envContent += `${separator}EXPO_PUBLIC_API_URL=http://${currentIP}:8080\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
}

console.log(`🚀 [자동화 스크립트] API URL이 현재 PC의 IP (http://${currentIP}:8080) 로 업데이트되었습니다.`);
