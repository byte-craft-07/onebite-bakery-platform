import { connectDatabase, disconnectDatabase } from "./connection.js";
import { UserModel } from "../modules/user/model/user.model.js";
import { hashPassword } from "../modules/auth/utils/password.js";

async function run() {
  console.log("Connecting to MongoDB...");
  await connectDatabase();

  const adminPassword = hashPassword("Admin@123");
  const customerPassword = hashPassword("Customer@123");

  // 1. Update/Set Admin Password
  const admin = await UserModel.findOneAndUpdate(
    {
      $or: [
        { phone: "7897671632" },
        { email: "ajaykterha@gmail.com" },
        { role: "admin" },
      ],
    },
    {
      $set: {
        name: "Ajay Prajapati",
        phone: "7897671632",
        email: "ajaykterha@gmail.com",
        role: "admin",
        password: adminPassword,
        status: "active",
        isVerified: true,
      },
    },
    { new: true, upsert: true }
  );
  console.log(`✅ Admin updated: ${admin.name} (${admin.email}, phone: ${admin.phone}) - Password set to Admin@123`);

  // 2. Update/Set Customer Password
  const customer = await UserModel.findOneAndUpdate(
    {
      $or: [
        { phone: "9876543210" },
        { email: "customer@onebitebakery.local" },
      ],
    },
    {
      $set: {
        name: "Bakery Customer",
        phone: "9876543210",
        email: "customer@onebitebakery.local",
        role: "customer",
        password: customerPassword,
        status: "active",
        isVerified: true,
      },
    },
    { new: true, upsert: true }
  );
  console.log(`✅ Customer updated: ${customer.name} (${customer.email}, phone: ${customer.phone}) - Password set to Customer@123`);

  await disconnectDatabase();
  console.log("Database disconnected. Done!");
}

run().catch((err) => {
  console.error("Error setting passwords:", err);
  process.exit(1);
});
