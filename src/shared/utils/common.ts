import { FindOptionsWhere, getMetadataArgsStorage } from 'typeorm';

export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => snakeToCamel(item));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      acc[camelKey] = snakeToCamel(value);
      return acc;
    }, {} as any);
  }
  return obj;
}

export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => camelToSnake(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );
      acc[snakeKey] = camelToSnake(value); // Recursively call for nested objects
      return acc;
    }, {} as any);
  }
  return obj;
}

export function toCamelCaseArray(
  snakeCaseArray: Record<string, any>[],
): Record<string, any>[] {
  return snakeCaseArray.map((snakeCaseObject) => {
    return Object.keys(snakeCaseObject).reduce(
      (camelCaseObject, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        camelCaseObject[camelKey] = snakeCaseObject[key];
        return camelCaseObject;
      },
      {} as Record<string, any>,
    );
  });
}

export function getEntityProperties(entity: new () => any) {
  const columns = getMetadataArgsStorage().columns.filter(
    (col) => col.target === entity,
  );
  return columns.map((col) => col.propertyName);
}

export function getAllEntityProperties(entity: new () => any) {
  const properties = new Set<string>();

  while (entity && entity !== Object) {
    // Get columns (including inherited ones)
    const columns = getMetadataArgsStorage().columns.filter(
      (col) => col.target === entity,
    );
    columns.forEach((col) => properties.add(col.propertyName));

    entity = Object.getPrototypeOf(entity); // Move up the prototype chain
  }

  return Array.from(properties).filter((prop) => prop !== 'deletedAt');
}

export function replaceAllCamelCaseToSnakeCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export function mergeWhereConditions<T>(
  existingWhere: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined,
  ...newConditions: FindOptionsWhere<T>[]
): FindOptionsWhere<T>[] {
  const conditionsArray = Array.isArray(existingWhere)
    ? existingWhere
    : existingWhere
      ? [existingWhere]
      : [];

  return [
    ...(conditionsArray as FindOptionsWhere<T>[]),
    ...(newConditions as FindOptionsWhere<T>[]),
  ];
}

export function mergeEachWhereConditions<T>(
  existingWhere: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined,
  newConditions: FindOptionsWhere<T>,
): FindOptionsWhere<T>[] {
  const conditionsArray = Array.isArray(existingWhere)
    ? existingWhere
    : existingWhere
      ? [existingWhere]
      : [newConditions];

  return conditionsArray.map((condition) => ({
    ...condition,
    ...newConditions,
  }));
}
