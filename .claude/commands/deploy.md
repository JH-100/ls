# 배포 스킬

PM2를 사용한 서버 배포를 관리합니다.

## 지시사항
1. PM2 설치 확인: `npm list -g pm2`
2. 서버 시작: `pm2 start server.js --name likeslack`
3. 서버 재시작: `pm2 restart likeslack`
4. 로그 확인: `pm2 logs likeslack`
5. 상태 확인: `pm2 status`
6. 서버 중지: `pm2 stop likeslack`

## PM2 설정 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'likeslack',
    script: 'server.js',
    watch: false,
    max_memory_restart: '500M',
    env: { PORT: 3333 }
  }]
};
```
