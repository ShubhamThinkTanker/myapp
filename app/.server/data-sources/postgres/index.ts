import { DataSourceType } from '@kottster/common';
import { createDataSource, KnexPgAdapter } from '@kottster/server';
import knex from 'knex';

const dataSource = createDataSource({
  type: DataSourceType.postgres,
  ctxPropName: 'knex',
  databaseSchemas: ['public'],
  init: () => {
    /**
     * Replace the following with your connection options.
     * Read more at https://knexjs.org/guide/#configuration-options
     */
    const client = knex({
      client: 'pg',
      connection: 'postgres://postgres:1234@localhost:5432/Myapp',
      searchPath: ['public'],
    });

    return new KnexPgAdapter(client);
  },
});

export default dataSource;
