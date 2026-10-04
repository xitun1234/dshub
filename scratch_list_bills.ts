import prisma from "./src/lib/prisma";

async function main() {
  const bills = await prisma.bill.findMany({
    include: {
      customer: true,
      details: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`TOTAL BILLS IN DB: ${bills.length}`);
  bills.forEach((b, i) => {
    console.log(`\n--- Bill #${i+1} ---`);
    console.log(`ID: ${b.id}`);
    console.log(`Customer: ${b.customer.name}`);
    console.log(`Region: ${b.region}, Date: ${b.date}`);
    console.log(`Raw Content: \n"${b.rawContent}"`);
    console.log(`Total Investment: ${b.totalInvestment}`);
    console.log(`Status: ${b.status}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
