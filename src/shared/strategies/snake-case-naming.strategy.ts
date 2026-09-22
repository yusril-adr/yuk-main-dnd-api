import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';
import { pluralize } from 'inflection';

export class SnakeCaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(targetName: string, userSpecifiedName?: string): string {
    return userSpecifiedName ?? pluralize(snakeCase(targetName));
  }

  columnName(
    propertyName: string,
    customName?: string,
    embeddedPrefixes?: string[],
  ): string {
    return snakeCase(
      embeddedPrefixes?.join('_') + (customName || propertyName),
    );
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return `${snakeCase(relationName)}_${snakeCase(referencedColumnName)}`;
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return `${firstTableName}_${secondTableName}`;
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return `${snakeCase(propertyName)}_${columnName || 'id'}`;
  }
}
