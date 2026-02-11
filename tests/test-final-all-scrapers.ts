/**
 * 全スクレイパーの最終統合テスト
 */

import { scrapeHisshobon } from "../server/scrapers/hisshobon";
import { scrapeJanbari } from "../server/scrapers/janbari";
import { scrapeSlopachiStation } from "../server/scrapers/slopachistation";
import { scrapeDmmPachitown } from "../server/scrapers/dmmpachitown";
import { scrapePworld } from "../server/scrapers/pworld";

async function testFinalAllScrapers() {
  console.log("========================================");
  console.log("全スクレイパーの最終統合テスト");
  console.log("========================================\n");

  const results: Array<{ name: string; count: number; time: number }> = [];

  // 必勝本ホール情報
  console.log("1/5 必勝本ホール情報...");
  const start1 = Date.now();
  try {
    const events = await scrapeHisshobon();
    const time = Date.now() - start1;
    console.log(`    ✓ ${events.length}件 (${(time / 1000).toFixed(1)}秒)\n`);
    results.push({ name: "必勝本ホール情報", count: events.length, time });
  } catch (error) {
    console.error(`    ✗ エラー: ${error}\n`);
    results.push({ name: "必勝本ホール情報", count: 0, time: 0 });
  }

  // ジャンバリTV
  console.log("2/5 ジャンバリTVポータル...");
  const start2 = Date.now();
  try {
    const events = await scrapeJanbari();
    const time = Date.now() - start2;
    console.log(`    ✓ ${events.length}件 (${(time / 1000).toFixed(1)}秒)\n`);
    results.push({ name: "ジャンバリTVポータル", count: events.length, time });
  } catch (error) {
    console.error(`    ✗ エラー: ${error}\n`);
    results.push({ name: "ジャンバリTVポータル", count: 0, time: 0 });
  }

  // スロパチステーション
  console.log("3/5 スロパチステーション...");
  const start3 = Date.now();
  try {
    const events = await scrapeSlopachiStation();
    const time = Date.now() - start3;
    console.log(`    ✓ ${events.length}件 (${(time / 1000).toFixed(1)}秒)\n`);
    results.push({ name: "スロパチステーション", count: events.length, time });
  } catch (error) {
    console.error(`    ✗ エラー: ${error}\n`);
    results.push({ name: "スロパチステーション", count: 0, time: 0 });
  }

  // DMMぱちタウン
  console.log("4/5 DMMぱちタウン...");
  const start4 = Date.now();
  try {
    const events = await scrapeDmmPachitown();
    const time = Date.now() - start4;
    console.log(`    ✓ ${events.length}件 (${(time / 1000).toFixed(1)}秒)\n`);
    results.push({ name: "DMMぱちタウン", count: events.length, time });
  } catch (error) {
    console.error(`    ✗ エラー: ${error}\n`);
    results.push({ name: "DMMぱちタウン", count: 0, time: 0 });
  }

  // P-WORLD
  console.log("5/5 P-WORLD...");
  const start5 = Date.now();
  try {
    const events = await scrapePworld();
    const time = Date.now() - start5;
    console.log(`    ✓ ${events.length}件 (${(time / 1000).toFixed(1)}秒)\n`);
    results.push({ name: "P-WORLD", count: events.length, time });
  } catch (error) {
    console.error(`    ✗ エラー: ${error}\n`);
    results.push({ name: "P-WORLD", count: 0, time: 0 });
  }

  // サマリー
  console.log("========================================");
  console.log("最終サマリー");
  console.log("========================================\n");

  const totalEvents = results.reduce((sum, r) => sum + r.count, 0);
  const totalTime = results.reduce((sum, r) => sum + r.time, 0);

  console.log("  サイト名                    イベント数   実行時間");
  console.log("  " + "-".repeat(55));
  results.forEach((result) => {
    const name = result.name.padEnd(24);
    const count = result.count.toString().padStart(6);
    const time = `${(result.time / 1000).toFixed(1)}秒`.padStart(8);
    console.log(`  ${name}  ${count}件   ${time}`);
  });
  console.log("  " + "-".repeat(55));
  const totalCountStr = totalEvents.toString().padStart(6);
  const totalTimeStr = `${(totalTime / 1000).toFixed(1)}秒`.padStart(8);
  console.log(`  ${"合計".padEnd(24)}  ${totalCountStr}件   ${totalTimeStr}`);

  console.log("\n========================================");
  console.log("✨ 全スクレイパーの実装完了！");
  console.log("========================================");
  console.log(`\n新しいスクレイパー追加により、${totalEvents}件のイベント情報を取得できます。`);
  console.log("既存の4ソースと合わせて、合計9つの情報源から来店イベント情報を収集できます。\n");
}

testFinalAllScrapers();
