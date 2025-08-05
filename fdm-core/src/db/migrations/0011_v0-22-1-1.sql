ALTER TABLE "fdm"."soil_analysis" ALTER COLUMN "b_gwl_class" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "fdm"."b_gwl_class";--> statement-breakpoint
CREATE TYPE "fdm"."b_gwl_class" AS ENUM('I', 'Ia', 'Ic', 'II', 'IIa', 'IIb', 'IIc', 'III', 'IIIa', 'IIIb', 'IV', 'IVu', 'IVc', 'V', 'Va', 'Vao', 'Vad', 'Vb', 'Vbo', 'Vbd', 'sV', 'sVb', 'VI', 'VIo', 'VId', 'VII', 'VIIo', 'VIId', 'VIII', 'VIIIo', 'VIIId');--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ALTER COLUMN "b_gwl_class" SET DATA TYPE "fdm"."b_gwl_class" USING "b_gwl_class"::"fdm"."b_gwl_class";--> statement-breakpoint
DROP INDEX "fdm"."b_id_derogation_idx";