import * as schema from './db/schema'

export interface getSoilAnalysisType {
    a_id: schema.soilAnalysisTypeSelect['a_id'];
    a_date: schema.soilAnalysisTypeSelect['a_date'];
    a_source: schema.soilAnalysisTypeSelect['a_source'];
    a_p_al: schema.soilAnalysisTypeSelect['a_p_al'];
    a_p_cc: schema.soilAnalysisTypeSelect['a_p_cc'];
    a_som_loi: schema.soilAnalysisTypeSelect['a_som_loi'];
    b_gwl_class: schema.soilAnalysisTypeSelect['b_gwl_class'];
    b_soiltype_agr: schema.soilAnalysisTypeSelect['b_soiltype_agr'];
    b_id_sampling: schema.soilSamplingTypeSelect['b_id_sampling'];
    b_depth: schema.soilSamplingTypeSelect['b_depth'];
    b_sampling_date: schema.soilSamplingTypeSelect['b_sampling_date'];
    b_sampling_geometry: schema.soilSamplingTypeSelect['b_sampling_geometry'];
}