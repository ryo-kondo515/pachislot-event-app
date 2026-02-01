import cron from 'node-cron';
import { runAllScrapers } from './scrapers/index.js';

/**
 * スクレイピングスケジューラー
 * 毎日午前0時1分にスクレイピングを実行します
 */
export function startScheduler() {
  // 毎日午前0時1分に実行（日本時間）
  // cron形式: 分 時 日 月 曜日
  // '1 0 * * *' = 毎日午前0時1分
  const task = cron.schedule('1 0 * * *', async () => {
    console.log('[Scheduler] Starting daily scraping at', new Date().toISOString());
    
    try {
      const result = await runAllScrapers();
      console.log('[Scheduler] Scraping completed successfully:', result);
      
      // 演者ランキングを再計算
      console.log('[Scheduler] Calculating actor rankings...');
      const { calculateActorRankings } = await import('./ranking.js');
      const rankingResult = await calculateActorRankings();
      console.log('[Scheduler] Actor rankings calculated:', rankingResult);
    } catch (error) {
      console.error('[Scheduler] Daily job failed:', error);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });

  task.start();
  console.log('[Scheduler] Daily scraping scheduled at 0:01 AM JST');
  
  return task;
}

/**
 * 開発用: 5分ごとにスクレイピングを実行
 */
export function startDevScheduler() {
  const task = cron.schedule('*/5 * * * *', async () => {
    console.log('[Dev Scheduler] Starting scraping at', new Date().toISOString());
    
    try {
      const result = await runAllScrapers();
      console.log('[Dev Scheduler] Scraping completed:', result);
      
      // 演者ランキングを再計算
      console.log('[Dev Scheduler] Calculating actor rankings...');
      const { calculateActorRankings } = await import('./ranking.js');
      const rankingResult = await calculateActorRankings();
      console.log('[Dev Scheduler] Actor rankings calculated:', rankingResult);
    } catch (error) {
      console.error('[Dev Scheduler] Job failed:', error);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });

  task.start();
  console.log('[Dev Scheduler] Scraping scheduled every 5 minutes');
  
  return task;
}
