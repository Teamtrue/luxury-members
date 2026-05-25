import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res1 = http.get(`${BASE_URL}/api/health`);
  check(res1, { 'health is 200': (r) => r.status === 200 });

  const res2 = http.get(`${BASE_URL}/privacy`);
  check(res2, { 'privacy is reachable': (r) => r.status === 200 });

  sleep(1);
}
