import prisma from "./src/lib/prisma";

async function main() {
  const results = await prisma.lotteryResult.findMany({
    where: {
      drawDate: '2026-05-30'
    }
  });

  console.log(`Results for 2026-05-30:`);
  results.forEach(r => {
    console.log(`Station: ${r.stationCode}`);
    console.log(`Winning Numbers:`, JSON.parse(r.winningNumbers));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
