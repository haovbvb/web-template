import mongoose from 'mongoose';
import { mongoUserSchema } from './mongo-user.schema';

async function main() {
  const mongoUrl = process.env.MONGO_URL ?? 'mongodb://localhost:27017/app';
  await mongoose.connect(mongoUrl);

  const model = mongoose.models.User ?? mongoose.model('User', mongoUserSchema);

  await model.updateOne(
    { email: 'owner@mongo.local' },
    {
      $set: {
        tenantId: 't1',
        status: 'active',
      },
    },
    { upsert: true },
  );

  console.log('MongoDB init completed.');
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
