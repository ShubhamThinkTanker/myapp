import { DataSourceRegistry } from '@kottster/server';
import postgresDataSource from './postgres';
import { Knex } from 'knex';

export const dataSourceRegistry = new DataSourceRegistry([
  postgresDataSource
]);

export type DataSourceContextToClientMap = {
  knex: Knex
};