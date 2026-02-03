## 1. Problem Statement
Currently, users can only upload soil analyses one by one in:
1.  The Farm Create Wizard.
2.  The Soil page of an individual Field.

This process is time-consuming and inefficient for farmers or advisors who manage multiple fields and have a batch of soil analysis reports (PDFs) to process.

## 2. Proposed Solution
Implement a **Bulk Soil Analysis Upload** feature. This will allow users to drag and drop multiple PDF files at once. The system will then process these files, attempt to match them to existing fields, and present a review interface before saving.

### Key Objectives
*   **Efficiency:** Reduce the time required to upload soil data.
*   **Automation:** Automatically match analyses to fields using geometry or name matching.
*   **User Control:** Provide a clear review step where users can verify matches and correct errors before committing data.

## 3. User Flow & UI/UX

### 3.1. Entry Points
1.  **Farm Dashboard:**
    *   **Location:** `fdm-app\app\routes\farm.$b_id_farm._index.tsx`
    *   **Action:** Add a "Bulk Upload Soil Analyses" button.
    *   **Behavior:** Redirects to a new dedicated Bulk Upload page.
2.  **Farm Create Wizard:**
    *   **Location:** Fields step (replacing or complementing the current individual upload).
    *   **Behavior:** Utilize the same shared components to allow bulk upload within the wizard flow.

### 3.2. Bulk Upload Page / Component
*   **Dropzone:** A large area accepting multiple PDF files.
*   **Processing State:** Visual feedback while files are being uploaded and processed by the API.

### 3.3. Review & Match Interface (Table)
After the API returns the processed data, display a table with the following structure:

| Soil Analysis (PDF) | Sampling Date | Lab | Parameters (Insight) | Matched Field |
| :--- | :--- | :--- | :--- | :--- |
| `analysis_A.pdf` | 2023-01-15 | Care4Agro | OM: 4.5%, P-AL: 35... | [Select Field] |

*   **Key Columns:**
    *   **File Info:** Filename.
    *   **Meta Data:** Sampling Date, Lab Name.
    *   **Soil Parameters:** Display key values for quick verification:
        *   `a_som_loi` (Organic Matter)
        *   `a_p_al` (Phosphate)
        *   `a_p_cc`
        *   `a_nmin` (Mineral Nitrogen)
    *   **Matched Field:** A `<Select>` dropdown.
        *   **Auto-selection:** If a match is found (by geometry or name), pre-select the field.
        *   **Manual Selection:** User can override or select a field from the list of farm fields.
        *   **No Match / Empty:** If left empty, this analysis will be **ignored** and not saved.

### 3.4. Finalization
*   **Save Button:** "Save & Link".
*   **Behavior:** Stores the soil analyses in the database and links them to the selected fields. Ignores entries where no field is selected.

## 4. Technical Details

### 4.1. API & Matching Logic
*   **Endpoint:** The NMI endpoint already supports multiple files.
*   **Matching Algorithm:**
    1.  **Geometry Match:** If the PDF data contains geometry (coordinates), perform a spatial intersection with the farm's fields.
    2.  **Name Match:** If no geometry or no intersection, try to fuzzy match the filename or internal ID against Field Names.
    3.  **Fallback:** No match.

### 4.2. Components
*   Refactor the upload and review logic into shared components to ensure consistency between the Dashboard and the Wizard.

## 5. Implementation Tasks

- [x] **UI:** Add "Bulk Upload" button to Farm Dashboard (`farm.$b_id_farm._index.tsx`).
- [x] **UI:** Create new route/page for Bulk Upload.
- [x] **UI:** Implement File Dropzone supporting multiple files.
- [x] **Integration:** Connect Dropzone to NMI API endpoint for multi-file upload.
- [x] **Logic:** Implement matching logic (Geometry > Name) on the client or server side after receiving API response.
- [x] **UI:** Build the Review Table (Analysis details, Parameters, Field Selector).
- [x] **Backend/Store:** Implement "Save" action to persist analyses and link to fields.
- [x] **Refactor:** Extract components and integrate into the Farm Create Wizard.
