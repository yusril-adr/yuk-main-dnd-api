import { runSeeders } from 'typeorm-extension';
import datasource from '@infrastructure/databases/main.ds';

(async () => {
  await datasource.initialize();

  await runSeeders(datasource);
})();
