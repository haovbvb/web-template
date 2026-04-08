import { UserEntity } from '../../domain/user.entity';
import { UserRepository } from '../../domain/user.repository';
import { mongoUserSchema } from '../database/mongo-user.schema';
import { MongoConnectionService } from '../database/mongo.connection';

interface MongoUserRow {
  _id: unknown;
  email: string;
  tenantId: string;
  status: string;
}

export class MongoUserRepository implements UserRepository {
  constructor(private readonly mongoConnection: MongoConnectionService) {}

  async listByTenant(tenantId: string): Promise<UserEntity[]> {
    const connection = this.mongoConnection.getConnection();
    const UserModel = connection.models.User ?? connection.model('User', mongoUserSchema);

    const rows = (await UserModel.find({ tenantId })
      .sort({ createdAt: -1 })
      .lean()) as unknown as MongoUserRow[];

    return rows.map((row) => ({
      id: String(row._id),
      email: row.email,
      tenantId: row.tenantId,
      status: row.status === 'active' ? 'active' : 'inactive',
    }));
  }
}
