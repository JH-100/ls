== KK 데스크톱 앱 ==

[Windows]
1. KK.exe 다운로드
2. config.json을 같은 폴더에 다운로드
3. KK.exe 더블클릭으로 실행

[Mac]
맥에서는 직접 빌드가 필요합니다:
1. Node.js 설치 (https://nodejs.org)
2. 터미널에서:
   git clone https://github.com/JH-100/ls.git
   cd ls/desktop
   npm install
   npm run build:mac
3. dist/ 폴더에 KK-mac-*.zip 파일 생성됨
4. 압축 해제 후 KK.app 옆에 config.json 배치
5. 우클릭 → "열기" → "열기" (최초 1회)

config.json 내용:
{"serverUrl": "http://서버IP:3333"}
