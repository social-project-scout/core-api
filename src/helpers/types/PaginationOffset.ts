import { OrderBy } from './OrderBy';

export interface PaginationOffset<T> extends PaginationOffsetParams {
  total: number;
  items: T[];
}
export interface PaginationOffsetParams {
  search?: string;
  page: number;
  limit: number;
  orderBy?: OrderBy;
}
