CREATE TABLE beacon_dataset_table (
    id character varying(50) NOT NULL PRIMARY KEY,
    description character varying(800),
    access_type character varying(10),
    reference_genome character varying(50),
    size integer
);

CREATE TABLE beacon_data_table
(
  id serial NOT NULL PRIMARY KEY,
  dataset_id character varying(50) NOT NULL REFERENCES beacon_dataset_table(id),
  chromosome character varying(2) NOT NULL,
  "position" integer NOT NULL,
  alternate character varying(100) NOT NULL,
  UNIQUE (dataset_id, chromosome, "position", alternate)
);

CREATE OR REPLACE VIEW beacon_dataset AS 
    SELECT bdat.id,
        bdat.description,
        bdat.access_type,
        bdat.reference_genome,
        bdat.size
    FROM beacon_dataset_table bdat
    WHERE (bdat.access_type::text = ANY (ARRAY['PUBLIC'::character varying::text, 'REGISTERED'::character varying::text, 'CONTROLLED'::character varying::text])) 
    AND bdat.size > 0 AND bdat.reference_genome::text <> ''::text;

CREATE OR REPLACE VIEW beacon_data AS 
    SELECT bd.dataset_id,
        bd.chromosome,
        bd."position",
        bd.alternate,
        ebdat.reference_genome
    FROM beacon_data_table bd
    INNER JOIN beacon_dataset ebdat ON bd.dataset_id::text = ebdat.id::text;
