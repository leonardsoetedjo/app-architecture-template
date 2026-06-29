// application/dtos/pagination.dto.ts
import { Type } from "class-transformer";
import { IsOptional, IsInt, IsString, IsIn } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 0;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  size?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  direction?: "ASC" | "DESC" = "DESC";
}
