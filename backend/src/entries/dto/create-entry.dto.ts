import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEntryDto {
  @IsDateString({ strict: true }, { message: 'La fecha debe ser una fecha válida.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener el formato YYYY-MM-DD.' })
  date!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  wellbeing!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  sleep!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  energy!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  stress!: number;

  @IsArray()
  @IsString({ each: true })
  symptoms!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
