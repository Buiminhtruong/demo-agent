import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export async function resetDb(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const [{ db: dbName }] = await dataSource.query(
    'SELECT current_database() AS db',
  );
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `resetDb từ chối chạy: database "${dbName}" không phải DB test (tên phải kết thúc bằng _test)`,
    );
  }
  const tables = dataSource.entityMetadatas
    .map((meta) => `"${meta.tableName}"`)
    .join(', ');
  if (!tables) return;
  await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}
