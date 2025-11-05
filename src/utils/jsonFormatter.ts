/**
 * Utility functions for JSON formatting with proper decimal handling
 */

// Properties that should remain as integers (no .0 suffix)
const INTEGER_PROPERTIES = [
  'balance_card_variant',
  'autoSlideInterval',
  'count',
  'menuStyle',
  'carouselHeight'
];

// Properties that should be integers only in specific contexts
const CONTEXTUAL_INTEGER_PROPERTIES = {
  'width': ['frame'], // width should be integer only in frame context
  'height': ['frame'] // height should be integer in frame context
};

/**
 * Formats JSON with proper decimal notation
 * Converts all numeric properties to floating point (.0) except for specified integer properties
 */
export const formatJSONWithDecimals = (obj: any, space?: number): string => {
  const jsonStr = JSON.stringify(obj, null, space);
  
  // Replace integer numbers with decimal notation for all properties except the integer ones
  return jsonStr.replace(/"(\w+)":\s*(\d+)(?=\s*[,}])/g, (match, key, value) => {
    // Skip properties that should remain as integers
    if (INTEGER_PROPERTIES.includes(key)) {
      return match;
    }
    
    // Check for contextual integer properties
    if (CONTEXTUAL_INTEGER_PROPERTIES[key as keyof typeof CONTEXTUAL_INTEGER_PROPERTIES]) {
      // Look for the context in the surrounding JSON structure
      const beforeMatch = jsonStr.substring(0, jsonStr.indexOf(match));
      const contexts = CONTEXTUAL_INTEGER_PROPERTIES[key as keyof typeof CONTEXTUAL_INTEGER_PROPERTIES];
      
      for (const context of contexts) {
        if (context === 'frame' && beforeMatch.includes('"frame"')) {
          return match; // Keep as integer for frame
        }
      }
    }
    
    // Convert all other numeric properties to floating point
    return `"${key}": ${value}.0`;
  });
};

/**
 * Formats JSON for API requests (no pretty printing)
 */
export const formatJSONForAPI = (obj: any): string => {
  return formatJSONWithDecimals(obj);
};

/**
 * Formats JSON for export/download (with pretty printing)
 */
export const formatJSONForExport = (obj: any): string => {
  return formatJSONWithDecimals(obj, 2);
};
