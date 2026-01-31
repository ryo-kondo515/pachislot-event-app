// 修正した日付計算ロジックをテストする

const now = new Date();
console.log(`Current time (UTC): ${now.toISOString()}`);

const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
const jstDate = new Date(now.getTime() + jstOffset);
console.log(`Current time (JST): ${jstDate.toISOString()}`);
console.log(`JST Date components: Year=${jstDate.getUTCFullYear()}, Month=${jstDate.getUTCMonth()}, Date=${jstDate.getUTCDate()}`);

// 修正後のロジック
const todayStart = new Date(Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate()) - jstOffset);
const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

console.log(`\nFixed date range:`);
console.log(`  Start: ${todayStart.toISOString()}`);
console.log(`  End: ${todayEnd.toISOString()}`);

// テストケース
const testDates = [
  new Date('2026-02-01T00:00:00.000Z'),  // 2月1日 00:00 UTC (JST 09:00)
  new Date('2026-02-01T14:59:59.999Z'),  // 2月1日 14:59 UTC (JST 23:59)
  new Date('2026-02-01T15:00:00.000Z'),  // 2月1日 15:00 UTC (JST 2月2日 00:00)
  new Date('2026-01-31T23:59:59.999Z'),  // 1月31日 23:59 UTC (JST 2月1日 08:59)
];

console.log(`\nTest cases:`);
testDates.forEach((testDate) => {
  const isInRange = testDate.getTime() >= todayStart.getTime() && testDate.getTime() < todayEnd.getTime();
  console.log(`  ${testDate.toISOString()}: ${isInRange ? 'IN RANGE' : 'OUT OF RANGE'}`);
});

process.exit(0);
