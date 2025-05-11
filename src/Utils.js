
const HEADER__CONTENT_DISPOSITION = "Content-Disposition";
const REGEX__FILENAME = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;


/**
 * @function parseFilename
 * @param {Response} response 
 * @param {string} defaultFilename 
 */
export const getFilenameByHeader = (response, defaultFilename = null) => {
    const disposition = response.headers.get(HEADER__CONTENT_DISPOSITION);
    if (disposition && disposition.indexOf('attachment') !== -1) {
        const matches = REGEX__FILENAME.exec(disposition);
        if (matches != null && matches[1]){
         const filename = matches[1].replace(/['"]/g, '').trim();
         return filename.length > 0 ? filename : defaultFilename
        }
    }
    return defaultFilename;
}