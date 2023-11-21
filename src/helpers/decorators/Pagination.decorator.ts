import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { PaginationOffsetParams } from '../types/PaginationOffset';

export const ReqPagination = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const pagination = {
      page: Number(request.query.page || 0),
      limit: Number(request.query.limit || 10),
      orderBy: request.query.orderBy
        ? JSON.parse(request.query.orderBy)
        : undefined,
    } as PaginationOffsetParams;

    return pagination;
  },
);
