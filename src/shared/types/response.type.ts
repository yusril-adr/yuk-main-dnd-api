import { TPaginationMeta } from '@shared/types/pagination-meta.type';

export type TResponse<Data = any> = {
  statusCode: number;
  data?: Data | null;
  error?: Error | null;
  message: string;
};

export type TResponsePagination<T> = Omit<TResponse<T>, 'data'> & {
  data: {
    items: T[];
    meta: TPaginationMeta;
  };
};

export type TResponseList<T> = Omit<TResponse<T>, 'data'> & {
  data: {
    items: T[];
    total: number;
  };
};
