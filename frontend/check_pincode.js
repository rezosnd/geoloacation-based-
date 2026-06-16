const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPincode() {
  const c = await prisma.customer.findFirst({
    where: { pincode: { not: null } }
  });
  console.log(c);
  await prisma.$disconnect();
}
checkPincode();
