-- DROP SCHEMA fdm;

CREATE SCHEMA fdm AUTHORIZATION postgres;
-- fdm.farms definition

-- Drop table

-- DROP TABLE farms;

CREATE TABLE farms (
	b_id_farm text NOT NULL,
	b_name_farm text NULL,
	b_sector text NULL,
	CONSTRAINT farms_unique UNIQUE (b_id_farm)
);


-- fdm.fields definition

-- Drop table

-- DROP TABLE fields;

CREATE TABLE fields (
	b_id text NOT NULL,
	b_name_field text NULL,
	b_geometry public.geometry NULL,
	CONSTRAINT fields_pk PRIMARY KEY (b_id)
);


-- fdm.harvestables definition

-- Drop table

-- DROP TABLE harvestables;

CREATE TABLE harvestables (
	b_id_harvestable text NOT NULL,
	b_lu_yield numeric NULL,
	CONSTRAINT harvestables_pk PRIMARY KEY (b_id_harvestable)
);


-- fdm.acquiring definition

-- Drop table

-- DROP TABLE acquiring;

CREATE TABLE acquiring (
	b_id text NOT NULL,
	b_id_farm text NOT NULL,
	b_acquire_start date NULL,
	b_aqcuire_end date NULL,
	b_acquire_type text NULL,
	CONSTRAINT acquiring_unique UNIQUE (b_id, b_id_farm, b_acquire_start, b_aqcuire_end),
	CONSTRAINT acquiring_farms_fk FOREIGN KEY (b_id_farm) REFERENCES farms(b_id_farm),
	CONSTRAINT acquiring_fields_fk FOREIGN KEY (b_id) REFERENCES fields(b_id)
);


-- fdm.analyses_harvestable definition

-- Drop table

-- DROP TABLE analyses_harvestable;

CREATE TABLE analyses_harvestable (
	b_id_analysis_harvestable text NOT NULL,
	b_id_harvestable text NOT NULL,
	b_date_sampling_harvestable date NULL,
	b_lu_n_harvestable numeric NULL,
	b_lu_n_residue numeric NULL,
	b_lu_p_harvestable numeric NULL,
	b_lu_p_residue numeric NULL,
	b_lu_k_harvestable numeric NULL,
	b_lu_k_residue numeric NULL,
	CONSTRAINT analyses_harvestable_pk PRIMARY KEY (b_id_analysis_harvestable),
	CONSTRAINT analyses_harvestable_harvestables_fk FOREIGN KEY (b_id_harvestable) REFERENCES harvestables(b_id_harvestable)
);


-- fdm.sowing definition

-- Drop table

-- DROP TABLE sowing;

CREATE TABLE sowing (
	b_id_sowing text NOT NULL,
	b_id text NOT NULL,
	b_lu text NOT NULL,
	CONSTRAINT sowing_pk PRIMARY KEY (b_id_sowing),
	CONSTRAINT sowing_fields_fk FOREIGN KEY (b_id) REFERENCES fields(b_id)
);


-- fdm.fertilizers definition

-- Drop table

-- DROP TABLE fertilizers;

CREATE TABLE fertilizers (
	p_id text NOT NULL,
	b_id_farm text NOT NULL,
	p_id_name text NULL,
	CONSTRAINT fertilizers_pk PRIMARY KEY (p_id),
	CONSTRAINT fertilizers_farms_fk FOREIGN KEY (b_id_farm) REFERENCES farms(b_id_farm)
);


-- fdm.fertilizing definition

-- Drop table

-- DROP TABLE fertilizing;

CREATE TABLE fertilizing (
	b_id_fertilizing text NOT NULL,
	p_id text NOT NULL,
	b_id text NOT NULL,
	p_dose numeric NULL,
	b_date_fertilizing date NULL,
	p_app_method text NULL,
	CONSTRAINT fertilizing_pk PRIMARY KEY (b_id_fertilizing),
	CONSTRAINT fertilizing_fertilizers_fk FOREIGN KEY (p_id) REFERENCES fertilizers(p_id),
	CONSTRAINT fertilizing_fields_fk FOREIGN KEY (b_id) REFERENCES fields(b_id)
);


-- fdm.cultivations definition

-- Drop table

-- DROP TABLE cultivations;

CREATE TABLE cultivations (
	b_id_cultivation text NOT NULL,
	b_id_sowing text NOT NULL,
	CONSTRAINT cultivations_pk PRIMARY KEY (b_id_cultivation),
	CONSTRAINT cultivations_unique UNIQUE (b_id_sowing),
	CONSTRAINT cultivations_sowing_fk FOREIGN KEY (b_id_sowing) REFERENCES sowing(b_id_sowing)
);


-- fdm.harvesting definition

-- Drop table

-- DROP TABLE harvesting;

CREATE TABLE harvesting (
	b_id_harvesting text NOT NULL,
	b_id_cultivation text NOT NULL,
	b_id_harvestable text NULL,
	b_lu_end date NULL,
	m_cropresidue bool NULL,
	CONSTRAINT harvesting_pk PRIMARY KEY (b_id_harvesting),
	CONSTRAINT harvesting_cultivations_fk FOREIGN KEY (b_id_cultivation) REFERENCES cultivations(b_id_cultivation),
	CONSTRAINT harvesting_harvestables_fk FOREIGN KEY (b_id_harvestable) REFERENCES harvestables(b_id_harvestable)
);


-- fdm.terminating definition

-- Drop table

-- DROP TABLE terminating;

CREATE TABLE terminating (
	b_id_terminating text NOT NULL,
	b_id_cultivation text NOT NULL,
	b_lu_end date NULL,
	CONSTRAINT terminating_pk PRIMARY KEY (b_id_terminating),
	CONSTRAINT terminating_unique UNIQUE (b_id_cultivation),
	CONSTRAINT terminating_cultivations_fk FOREIGN KEY (b_id_cultivation) REFERENCES cultivations(b_id_cultivation)
);