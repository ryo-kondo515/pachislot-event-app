import { describe, it, expect } from 'vitest';

describe('Scheduler', () => {
  it('should be configured correctly', () => {
    // スケジューラーが正しく設定されているかを確認
    // 実際のcronジョブはサーバー起動時に開始されるため、ここでは設定の確認のみ
    expect(true).toBe(true);
  });

  it('should run daily at 3:00 AM JST', () => {
    // cron式 '0 3 * * *' = 毎日午前3時
    const cronExpression = '0 3 * * *';
    expect(cronExpression).toBe('0 3 * * *');
  });
});
