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


-- fdm.zones definition

-- Drop table

-- DROP TABLE zones;

CREATE TABLE zones (
	b_id_zone text NOT NULL,
	b_geometry_zone public.geometry NULL,
	b_name_zone text NULL,
	CONSTRAINT zones_pk PRIMARY KEY (b_id_zone)
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


-- fdm.field_reconfigure definition

-- Drop table

-- DROP TABLE field_reconfigure;

CREATE TABLE field_reconfigure (
	b_id_primary text NOT NULL,
	b_id_secondary text NOT NULL,
	CONSTRAINT field_reconfigure_unique UNIQUE (b_id_primary, b_id_secondary),
	CONSTRAINT field_reconfigure_fields_fk FOREIGN KEY (b_id_primary) REFERENCES fields(b_id),
	CONSTRAINT field_reconfigure_fields_fk_1 FOREIGN KEY (b_id_secondary) REFERENCES fields(b_id)
);


-- fdm.field_zoning definition

-- Drop table

-- DROP TABLE field_zoning;

CREATE TABLE field_zoning (
	b_id_zoning text NOT NULL,
	b_id text NOT NULL,
	CONSTRAINT field_zoning_unique UNIQUE (b_id_zoning, b_id),
	CONSTRAINT field_zoning_fields_fk FOREIGN KEY (b_id) REFERENCES fields(b_id),
	CONSTRAINT field_zoning_zones_fk FOREIGN KEY (b_id_zoning) REFERENCES zones(b_id_zone)
);


-- fdm.managing definition

-- Drop table

-- DROP TABLE managing;

CREATE TABLE managing (
	b_id text NOT NULL,
	b_id_farm text NOT NULL,
	b_manage_start date NULL,
	b_manage_end date NULL,
	b_manage_type text NULL,
	CONSTRAINT acquiring_unique UNIQUE (b_id, b_id_farm, b_manage_start, b_manage_end),
	CONSTRAINT acquiring_farms_fk FOREIGN KEY (b_id_farm) REFERENCES farms(b_id_farm),
	CONSTRAINT acquiring_fields_fk FOREIGN KEY (b_id) REFERENCES fields(b_id)
);


-- fdm.sampling_soil definition

-- Drop table

-- DROP TABLE sampling_soil;

CREATE TABLE sampling_soil (
	a_id_sampling text NOT NULL,
	b_id text NULL,
	a_date_sampling date NULL,
	a_depth numeric NULL,
	a_geometry_sampling public.geometry NULL,
	CONSTRAINT sampling_soil_pk PRIMARY KEY (a_id_sampling),
	CONSTRAINT sampling_soil_fields_fk FOREIGN KEY (b_id) REFERENCES fields(b_id)
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


-- fdm.zone_fertilizing definition

-- Drop table

-- DROP TABLE zone_fertilizing;

CREATE TABLE zone_fertilizing (
	b_id_zone text NOT NULL,
	b_id_fertilizing text NOT NULL,
	p_dose_rate numeric NOT NULL,
	CONSTRAINT zone_fertilizing_unique UNIQUE (b_id_fertilizing, b_id_zone),
	CONSTRAINT zone_fertilizing_fertilizing_fk FOREIGN KEY (b_id_fertilizing) REFERENCES fertilizing(b_id_fertilizing),
	CONSTRAINT zone_fertilizing_zones_fk FOREIGN KEY (b_id_zone) REFERENCES zones(b_id_zone)
);


-- fdm.analyses_fertilizer definition

-- Drop table

-- DROP TABLE analyses_fertilizer;

CREATE TABLE analyses_fertilizer (
	p_id_analysis text NOT NULL,
	p_id text NOT NULL,
	p_date_sampling date NULL,
	p_n_rt numeric NULL,
	p_n_if numeric NULL,
	p_n_of numeric NULL,
	p_p_rt numeric NULL,
	p_k_rt numeric NULL,
	p_dm numeric NULL,
	p_om numeric NULL,
	CONSTRAINT analyses_fertilizer_pk PRIMARY KEY (p_id_analysis),
	CONSTRAINT analyses_fertilizer_fertilizers_fk FOREIGN KEY (p_id) REFERENCES fertilizers(p_id)
);


-- fdm.analyses_soil definition

-- Drop table

-- DROP TABLE analyses_soil;

CREATE TABLE analyses_soil (
	a_id_analysis text NOT NULL,
	a_id_sampling text NOT NULL,
	a_source text NULL,
	a_som_loi numeric NULL,
	a_clay_mi numeric NULL,
	a_c_of numeric NULL,
	a_n_rt numeric NULL,
	a_nmin_cc numeric NULL,
	a_ph_cc numeric NULL,
	CONSTRAINT analyses_soil_pk PRIMARY KEY (a_id_analysis),
	CONSTRAINT analyses_soil_sampling_soil_fk FOREIGN KEY (a_id_sampling) REFERENCES sampling_soil(a_id_sampling)
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