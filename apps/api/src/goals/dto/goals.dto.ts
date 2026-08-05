import { IsEnum, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { GoalKind } from '../../generated/prisma/client.js';

export class CreateGoalDto {
  @IsEnum(GoalKind)
  kind: GoalKind;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  title: string;

  /** Сколько нужно всего, рублей. */
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  target: number;
}

export class ContributeDto {
  /** Сколько рублей кладём в копилку. */
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  amount: number;
}
