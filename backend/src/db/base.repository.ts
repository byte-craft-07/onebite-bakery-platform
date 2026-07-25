import type {
  ClientSession,
  FilterQuery,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";

import type { SoftDeletableDocument } from "./types/base-document.types.js";

interface FindManyOptions<TEntity> {
  filter?: FilterQuery<TEntity>;
  projection?: ProjectionType<TEntity>;
  options?: QueryOptions<TEntity>;
}

interface WriteOptions {
  session?: ClientSession;
}

export abstract class BaseRepository<
  TEntity extends { _id: Types.ObjectId },
> {
  protected constructor(protected readonly model: Model<TEntity>) {}

  public async create(
    data: Partial<TEntity>,
    options: WriteOptions = {},
  ): Promise<HydratedDocument<TEntity>> {
    const documents = await this.model.create([data], {
      session: options.session,
    });

    const document = documents[0];

    if (!document) {
      throw new Error("Document creation failed.");
    }

    return document;
  }

  public async findById(
    id: Types.ObjectId,
    projection?: ProjectionType<TEntity>,
    options?: QueryOptions<TEntity>,
  ): Promise<HydratedDocument<TEntity> | null> {
    return this.model.findById(id, projection, options).exec();
  }

  public async findOne(
    filter: FilterQuery<TEntity>,
    projection?: ProjectionType<TEntity>,
    options?: QueryOptions<TEntity>,
  ): Promise<HydratedDocument<TEntity> | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  public async findMany(
    options: FindManyOptions<TEntity> = {},
  ): Promise<Array<HydratedDocument<TEntity>>> {
    return this.model
      .find(options.filter ?? {}, options.projection, options.options)
      .exec();
  }

  public async update(
    filter: FilterQuery<TEntity>,
    update: UpdateQuery<TEntity>,
    options: QueryOptions<TEntity> & WriteOptions = {},
  ): Promise<HydratedDocument<TEntity> | null> {
    return this.model
      .findOneAndUpdate(filter, update, {
        ...options,
        new: true,
        runValidators: true,
      })
      .exec();
  }

  public async softDelete(
    filter: FilterQuery<TEntity>,
    deletedBy?: Types.ObjectId,
    options: WriteOptions = {},
  ): Promise<HydratedDocument<TEntity> | null> {
    return this.model
      .findOneAndUpdate(
        filter,
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            ...(deletedBy ? { deletedBy } : {}),
          },
        } satisfies UpdateQuery<TEntity & SoftDeletableDocument>,
        {
          session: options.session,
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  public async restore(
    filter: FilterQuery<TEntity>,
    options: WriteOptions = {},
  ): Promise<HydratedDocument<TEntity> | null> {
    return this.model
      .findOneAndUpdate(
        filter,
        {
          $set: {
            isDeleted: false,
          },
          $unset: {
            deletedAt: "",
            deletedBy: "",
          },
        } satisfies UpdateQuery<TEntity & SoftDeletableDocument>,
        {
          session: options.session,
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }
}

