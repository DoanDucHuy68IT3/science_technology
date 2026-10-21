export const environment = {
  production: false,
  /** Spring Boot REST API */
  apiUrl: 'http://localhost:8080/api',
  /** WebSocket thuần (Spring WebSocket) - nhận realtime cảm biến, cảnh báo AI */
  wsUrl: 'ws://localhost:8080/ws',
  /** true: dùng dữ liệu giả để chạy giao diện khi chưa có server */

  /** use hls connect */
  hlsUrl : 'http://localhost:3000/hls',
  useMock: false,
};
