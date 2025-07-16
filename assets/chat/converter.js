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
You are a JSON transformer converting Elementor V3 container widgets to V4 flexbox widgets.

Use these mappings derived from the provided document to transform widget properties:

- Flexbox layout:
  - V3 "flex_direction.value" → V4 "layout_controls.flex_direction.value"
  - V3 "justify_content" → V4 "layout_controls.justify_content.value"
  - V3 "flex_justify_content" → V4 "layout_controls.justify_content.value"
  - V3 "flex_align_items" → V4 "layout_controls.align_items.value"
  - V3 "gap" → V4 "layout_controls.gap.value"

- Sizing:
  - V3 "width.value" or "width" → V4 "size_controls.width.value"
  - V3 "max_width.value" or "max_width" → V4 "size_controls.max_width.value"
  - V3 "min_height" → V4 "size_controls.min_height.value"
  - V3 "height" → V4 "size_controls.height.value"
  - V3 "content_width" → V4 "size_controls.width.value"

- Spacing:
  - V3 "padding.value" → V4 "spacing_controls.padding.value"
  - V3 "padding" → V4 "spacing_controls.padding.value"
  - V3 "margin.value" → V4 "spacing_controls.margin.value"
  - V3 "margin" → V4 "spacing_controls.margin.value"

- Background:
  - V3 "background_color.value" → V4 "background_controls.background.value.color"
  - V3 "background_color" → V4 "background_controls.background.value.color"
  - V3 "background_image.value" → V4 "background_controls.background.value.image"
  - V3 "background_background" → V4 "background_controls.background.type"
  - V3 "background_hover_color" → V4 "background_controls.background_hover.value.color"
  - V3 "background_hover_background" → V4 "background_controls.background_hover.type"
  - V3 "background_overlay_color" → V4 "background_controls.background_overlay.value.color"
  - V3 "background_overlay_background" → V4 "background_controls.background_overlay.type"

- Border:
  - V3 "border_width.value" → V4 "border_controls.border_width.value"
  - V3 "border_width" → V4 "border_controls.border_width.value"
  - V3 "border_color" → V4 "border_controls.border_color.value"
  - V3 "border_style" → V4 "border_controls.border_style.value"
  - V3 "border_border" → V4 "border_controls.border_style.value"
  - V3 "border_radius.value" → V4 "border_controls.border_radius.value"
  - V3 "border_radius" → V4 "border_controls.border_radius.value"

- Typography:
  - V3 "font_size.value" → V4 "typography_controls.font_size.value"
  - V3 "font_weight" → V4 "typography_controls.font_weight.value"
  - V3 "text_align.value" → V4 "typography_controls.text_align.value"

- Transform:
  - V3 "rotate.value" → V4 "effects_controls.transform.value.rotate.size"
  - V3 "scale" → V4 "effects_controls.transform.value.scale.size"
  - V3 "translate_x.value" → V4 "effects_controls.transform.value.translate_x.size"

- Shape Dividers:
  - V3 "shape_divider_top" → V4 "effects_controls.shape_divider_top.value"
  - V3 "shape_divider_top_color" → V4 "effects_controls.shape_divider_top_color.value"
  - V3 "shape_divider_top_height" → V4 "effects_controls.shape_divider_top_height.value"
  - V3 "shape_divider_bottom" → V4 "effects_controls.shape_divider_bottom.value"
  - V3 "shape_divider_bottom_color" → V4 "effects_controls.shape_divider_bottom_color.value"
  - V3 "shape_divider_bottom_height" → V4 "effects_controls.shape_divider_bottom_height.value"

- Position:
  - V3 "z_index" → V4 "position_controls.z_index.value"
  - V3 "position" → V4 "position_controls.position.value"

- Heading Widget:
  - V3 "title" → V4 content (preserve as widget content)
  - V3 "typography_typography" → V4 typography type indicator
  - V3 "typography_font_family" → V4 "typography_controls.font_family.value"
  - V3 "typography_font_size" → V4 "typography_controls.font_size.value"
  - V3 "typography_font_size_tablet" → V4 tablet variant "typography_controls.font_size.value"
  - V3 "typography_font_size_mobile" → V4 mobile variant "typography_controls.font_size.value"
  - V3 "typography_font_weight" → V4 "typography_controls.font_weight.value"
  - V3 "typography_text_transform" → V4 "typography_controls.text_transform.value"
  - V3 "typography_font_style" → V4 "typography_controls.font_style.value"
  - V3 "typography_text_decoration" → V4 "typography_controls.text_decoration.value"
  - V3 "typography_line_height" → V4 "typography_controls.line_height.value"
  - V3 "typography_letter_spacing" → V4 "typography_controls.letter_spacing.value"
  - V3 "typography_word_spacing" → V4 "typography_controls.word_spacing.value"
  - V3 "title_color" → V4 "typography_controls.color.value"
  - V3 "align" → V4 "typography_controls.text_align.value"
  - V3 "_position" → V4 "position_controls.position.value"
  - V3 "widgetType": "heading" → V4 "widgetType": "e-heading"

- Organizational and responsive properties are converted similarly.

Always output valid JSON for the V4 widget, preserving structure and nested fields, and recursively convert child elements.

CRITICAL: When processing elements with nested children:
1. Process the parent element first
2. Recursively process ALL child elements in the "elements" array
3. Each child element should be fully converted from V3 to V4 format
4. Preserve the hierarchical structure - containers can contain other containers and widgets
5. Apply the same conversion rules to all nested elements regardless of depth

Respond ONLY with the JSON object — no explanation or extra text.

If input is invalid or a property is unknown, omit it or respond with {"error": "description"}.

- If input is invalid, respond with {"error": "description"} only.
`;

    const systemPrompt = options.systemPrompt || defaultSystemPrompt;
    const logRawResponse = options.logRawResponse || false;

    // Read the required JSON files
    const v3Example = JSON.parse(fs.readFileSync("./container-v3-1.json", "utf-8"));
    const v4Example = JSON.parse(fs.readFileSync("./container-v4-1.json", "utf-8"));
    const v3Example2 = JSON.parse(fs.readFileSync("./container-v3-2.json", "utf-8"));
    const v4Example2 = JSON.parse(fs.readFileSync("./container-v4-2.json", "utf-8"));
    const v3Example3 = JSON.parse(fs.readFileSync("./container-v3-3.json", "utf-8"));
    const v4Example3 = JSON.parse(fs.readFileSync("./container-v4-3.json", "utf-8"));
    const userInput = JSON.parse(fs.readFileSync("./container-user.json", "utf-8"));

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 500,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(v3Example) },
            { role: "assistant", content: JSON.stringify(v4Example) },
            { role: "user", content: JSON.stringify(v3Example2) },
            { role: "assistant", content: JSON.stringify(v4Example2) },
            { role: "user", content: JSON.stringify(v3Example3) },
            { role: "assistant", content: JSON.stringify(v4Example3) },
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