/**
 * Utilidades de Descarga Client-Side en el Navegador
 * Conforme a SPEC-05 (pkg/export)
 */

/**
 * Dispara la descarga de un archivo de texto en el navegador
 * mediante un Blob y un enlace virtual temporal.
 *
 * @param content Contenido en texto a descargar
 * @param filename Nombre del archivo a guardar (ej. 'reporte.csv')
 * @param mimeType Tipo MIME (ej. 'text/csv;charset=utf-8;')
 */
export function triggerBrowserDownload(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Entorno de servidor o test (Node.js)
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // Limpiar recursos en memoria
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
