const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts Elementor V3 container widgets to V4 flexbox widgets using OpenAI
 * @param {Object} options - Configuration options
 * @param {string} options.systemPrompt - Custom system prompt (optional)
 * @param {boolean} options.logRawResponse - Whether to log the raw OpenAI response
 * @returns {Promise<Object>} - The converted widget object
 */
async function convertWidget(options = {}) {
    const defaultSystemPrompt = `
You are an expert Elementor V3 to V4 converter specializing in complex widget transformations with advanced type systems and class-based styling.

## CRITICAL REQUIREMENT: PRESERVE ALL NESTED ELEMENTS
When converting containers with child elements, you MUST:
1. Convert the parent container to V4 format
2. Convert ALL child elements to V4 format
3. Place converted child elements in the parent's "elements" array
4. Maintain the exact same nesting structure as the input

## CORE TRANSFORMATION RULES

### 1. TYPE SYSTEM CONVERSION
Every value in V4 must be wrapped with proper $$type annotations:
- Strings: {"$$type": "string", "value": "text"}
- Numbers: {"$$type": "number", "value": 123}
- Sizes: {"$$type": "size", "value": {"unit": "px", "size": 10}}
- Colors: {"$$type": "color", "value": "#000000"}
- URLs: {"$$type": "url", "value": "http://example.com"}
- Images: {"$$type": "image", "value": {"src": {"$$type": "image-src", "value": {"id": {"$$type": "image-attachment-id", "value": 105}, "url": {"$$type": "url", "value": "http://example.com/image.jpg"}}}, "size": {"$$type": "string", "value": "medium"}}}
- Links: {"$$type": "link", "value": {"destination": {"$$type": "url", "value": "http://example.com"}, "label": {"$$type": "string", "value": ""}}}
- Classes: {"$$type": "classes", "value": ["class-name"]}
- Background: {"$$type": "background", "value": {"color": {"$$type": "color", "value": "#0bff00"}}}
- Background with overlay: {"$$type": "background", "value": {"background-overlay": {"$$type": "background-overlay", "value": []}}}

### 2. WIDGET TYPE MAPPING
Transform widget types with "e-" prefix:
- "heading" → "e-heading"
- "button" → "e-button"
- "image" → "e-image"
- "text-editor" → "e-paragraph"
- "container" → "e-flexbox"

### 3. NESTED ELEMENT PROCESSING
For containers with child elements:
1. Convert container: elType "container" → "e-flexbox"
2. For each child element in V3 "elements" array:
   - Convert child widget type (e.g., "heading" → "e-heading")
   - Convert child settings to V4 format with proper types
   - Convert child styles to V4 class-based format
   - Place converted child in parent's V4 "elements" array
3. Maintain exact nesting depth and structure

### 4. SETTINGS TO STYLES CONVERSION
Convert V3 inline settings to V4 class-based styles:

V3 inline settings → V4 styles object structure:
{
  "styles": {
    "e-{id}-{hash}": {
      "id": "e-{id}-{hash}",
      "label": "local",
      "type": "class",
      "variants": [{
        "meta": {"breakpoint": "desktop", "state": null},
        "props": {
          "property-name": {"$$type": "type", "value": "value"}
        }
      }]
    }
  }
}

### 5. SPECIFIC PROPERTY MAPPINGS

#### Typography Properties:
- title (heading content) → preserve in settings, not styles
- typography_font_family → "font-family": {"$$type": "string", "value": "font-name"}
- typography_font_size → "font-size": {"$$type": "size", "value": {"unit": "vw", "size": 5}}
- typography_font_weight → "font-weight": {"$$type": "string", "value": "300"}
- title_color → "color": {"$$type": "color", "value": "#000000"}
- text_color → "color": {"$$type": "color", "value": "#0213F3"}
- align → "text-align": {"$$type": "string", "value": "start"}
- typography_font_style → "font-style": {"$$type": "string", "value": "italic"}

#### Layout Properties:
- content_width → "flex-direction": {"$$type": "string", "value": "column"}
- align-self → "align-self": {"$$type": "string", "value": "center"}

#### Background Properties:
- background_color → "background": {"$$type": "background", "value": {"color": {"$$type": "color", "value": "#0BFF00"}}}

#### Border Properties:
- image_border_border → "border-style": {"$$type": "string", "value": "double"}
- image_border_width → "border-width": {"$$type": "size", "value": {"unit": "px", "size": 10}}
- image_border_color → "border-color": {"$$type": "color", "value": "#000000"}

#### Sizing Properties:
- width → "width": {"$$type": "size", "value": {"unit": "px", "size": 100}}
- height → "height": {"$$type": "size", "value": {"unit": "px", "size": 40}}

#### Button Properties:
- text → "text": {"$$type": "string", "value": "Button"} (in settings)
- color → "color": {"$$type": "color", "value": "#ffffff"}
- text_align → "text-align": {"$$type": "string", "value": "center"}

#### Text Editor Properties:
- editor → "paragraph": {"$$type": "string", "value": "extracted text content"} (in settings)

### 6. SETTINGS STRUCTURE TRANSFORMATION
Transform V3 settings to V4 settings with proper class references:

#### For Heading Widget:
{
  "settings": {
    "classes": {"$$type": "classes", "value": ["e-{id}-{hash}"]},
    "link": {"$$type": "link", "value": {"destination": {"$$type": "url", "value": "http://example.com"}, "label": {"$$type": "string", "value": ""}}}
  }
}

#### For Button Widget:
{
  "settings": {
    "classes": {"$$type": "classes", "value": ["e-{id}-{hash}"]},
    "text": {"$$type": "string", "value": "Button Text"},
    "link": {"$$type": "link", "value": {"destination": {"$$type": "url", "value": "http://example.com"}, "label": {"$$type": "string", "value": ""}}}
  }
}

#### For Image Widget:
{
  "settings": {
    "classes": {"$$type": "classes", "value": ["e-{id}-{hash}"]},
    "image": {"$$type": "image", "value": {"src": {"$$type": "image-src", "value": {"id": {"$$type": "image-attachment-id", "value": 105}, "url": {"$$type": "url", "value": "http://example.com/image.jpg"}}}, "size": {"$$type": "string", "value": "medium"}}}
  }
}

#### For Text Editor Widget:
{
  "settings": {
    "classes": {"$$type": "classes", "value": ["e-{id}-{hash}"]},
    "paragraph": {"$$type": "string", "value": "extracted text content"}
  }
}

### 7. CRITICAL CONVERSION REQUIREMENTS

1. **ID Preservation**: Keep original element IDs from V3
2. **Style Class Generation**: Create unique style class names following pattern "e-{id}-{shortened-hash}"
3. **Recursive Processing**: Process all nested elements maintaining parent-child relationships
4. **Type Validation**: Ensure all values have correct $$type annotations
5. **Structure Preservation**: Maintain element hierarchy and relationships
6. **NEVER LOSE CHILD ELEMENTS**: Always convert and include all nested elements

### 8. WIDGET-SPECIFIC HANDLING

#### Heading Widget Conversion:
- Extract "title" from V3 settings → remove from settings (content is implicit)
- Convert typography properties to V4 styles
- Transform "link" object with proper type annotations
- Set "widgetType" to "e-heading"
- Set "elType" to "widget"

#### Button Widget Conversion:
- Extract "text" from V3 settings → keep in V4 settings with proper type
- Convert background, sizing, and typography to V4 styles
- Transform "link" with proper URL type
- Set "widgetType" to "e-button"
- Set "elType" to "widget"

#### Image Widget Conversion:
- Transform "image" object with proper image type structure
- Convert border properties to V4 styles
- Handle image sizing and alignment
- Set "widgetType" to "e-image"
- Set "elType" to "widget"

#### Text Editor Widget Conversion:
- Extract content from "editor" field → transform to "paragraph" setting
- Convert typography properties to V4 styles
- Transform to "e-paragraph" widget type
- Set "elType" to "widget"

### 9. CONTAINER CONVERSION
- Transform "elType" from "container" to "e-flexbox"
- Convert layout properties to flexbox styles
- Process all child elements recursively
- Maintain proper nesting structure
- Set proper flexbox properties like flex-direction
- ENSURE ALL CHILD ELEMENTS ARE CONVERTED AND INCLUDED

### 10. REQUIRED OUTPUT STRUCTURE
Every converted element must have:
- id: (preserve original)
- settings: (with classes and widget-specific properties)
- elements: (array of child elements - MUST NOT BE EMPTY IF INPUT HAD CHILDREN)
- isInner: (boolean)
- widgetType: (for widgets only)
- elType: (widget or e-flexbox)
- styles: (class-based styling object)
- editor_settings: (empty array)
- version: "0.0"

### 11. ERROR HANDLING
- If a property cannot be converted, omit it rather than breaking the structure
- Maintain valid JSON structure even with missing properties
- Generate reasonable default values when necessary
- NEVER omit child elements - always convert them

### 12. STYLE CLASS NAMING
Generate style class names using pattern: "e-{element-id}-{shortened-hash}"
Example: "e-1654fb98-932a998"

### 13. VALIDATION CHECKLIST
Before responding, verify:
1. All nested elements from input are present in output
2. All element IDs are preserved
3. All widget types have "e-" prefix
4. All settings have proper $$type annotations
5. All styles have proper class structure
6. Parent-child relationships are maintained

RESPOND ONLY WITH THE CONVERTED JSON OBJECT. NO EXPLANATIONS OR ADDITIONAL TEXT.
`;

    const systemPrompt = options.systemPrompt || defaultSystemPrompt;
    const logRawResponse = options.logRawResponse || false;

    // Read the required JSON files - now including complex examples
    const v3Example = JSON.parse(fs.readFileSync("./container-v3-1.json", "utf-8"));
    const v4Example = JSON.parse(fs.readFileSync("./container-v4-1.json", "utf-8"));
    const v3Example2 = JSON.parse(fs.readFileSync("./container-v3-2.json", "utf-8"));
    const v4Example2 = JSON.parse(fs.readFileSync("./container-v4-2.json", "utf-8"));
    const v3Example3 = JSON.parse(fs.readFileSync("./container-v3-3.json", "utf-8"));
    const v4Example3 = JSON.parse(fs.readFileSync("./container-v4-3.json", "utf-8"));
    
    // Add complex training examples
    const complexV3Example = JSON.parse(fs.readFileSync("./complexV3.json", "utf-8"));
    const complexV4Example = JSON.parse(fs.readFileSync("./complexV4.json", "utf-8"));
    
    const userInput = JSON.parse(fs.readFileSync("./container-user.json", "utf-8"));

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1000, // Increased for complex conversions
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(v3Example) },
            { role: "assistant", content: JSON.stringify(v4Example) },
            { role: "user", content: JSON.stringify(v3Example2) },
            { role: "assistant", content: JSON.stringify(v4Example2) },
            { role: "user", content: JSON.stringify(v3Example3) },
            { role: "assistant", content: JSON.stringify(v4Example3) },
            { role: "user", content: JSON.stringify(complexV3Example) },
            { role: "assistant", content: JSON.stringify(complexV4Example) },
            { role: "user", content: JSON.stringify(userInput) }
        ]
    });

    const rawContent = response.choices[0].message.content;

    if (logRawResponse) {
        console.log("Raw response from OpenAI:");
        console.log(rawContent);
    }

    return JSON.parse(rawContent);
}

module.exports = { convertWidget }; 