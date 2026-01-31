import { publicProcedure, router } from "./_core/trpc";
import { runAllScrapers } from "./scrapers/index";

export const scraperRouter = router({
  /**
   * スクレイピングを手動で実行
   */
  run: publicProcedure.mutation(async () => {
    const result = await runAllScrapers();
    return result;
  }),

  /**
   * スクレイピングの状態を取得
   */
  status: publicProcedure.query(async () => {
    return {
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "idle",
    };
  }),
});
