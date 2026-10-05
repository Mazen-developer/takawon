export const CATEGORIES = ["أثاث", "إضاءة", "خامات", "نباتات وديكور", "أبواب ونوافذ", "مطابخ وحمامات"];
// extension -> format label
export const FORMATS: Record<string, string> = {
  dwg: "DWG", dxf: "DXF", rvt: "RVT", rfa: "RFA", skp: "SKP", max: "MAX",
  blend: "BLEND", fbx: "FBX", glb: "GLB", obj: "OBJ", zip: "ZIP",
};
export const MAX_FILE_BYTES = 200 * 1024 * 1024;
export const DEFAULT_COMMISSION_BPS = 2000;
