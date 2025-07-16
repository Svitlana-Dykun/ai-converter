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
  - V3 "gap" → V4 "layout_controls.gap.value"

- Sizing:
  - V3 "width.value" or "width" → V4 "size_controls.width.value"
  - V3 "max_width.value" or "max_width" → V4 "size_controls.max_width.value"
  - V3 "min_height" → V4 "size_controls.min_height.value"

- Spacing:
  - V3 "padding.value" → V4 "spacing_controls.padding.value"
  - V3 "margin.value" → V4 "spacing_controls.margin.value"

- Background:
  - V3 "background_color.value" → V4 "background_controls.background.value.color"
  - V3 "background_image.value" → V4 "background_controls.background.value.image"

- Border:
  - V3 "border_width.value" → V4 "border_controls.border_width.value"
  - V3 "border_color" → V4 "border_controls.border_color.value"
  - V3 "border_radius.value" → V4 "border_controls.border_radius.value"

- Typography:
  - V3 "font_size.value" → V4 "typography_controls.font_size.value"
  - V3 "font_weight" → V4 "typography_controls.font_weight.value"
  - V3 "text_align.value" → V4 "typography_controls.text_align.value"

- Transform:
  - V3 "rotate.value" → V4 "effects_controls.transform.value.rotate.size"
  - V3 "scale" → V4 "effects_controls.transform.value.scale.size"
  - V3 "translate_x.value" → V4 "effects_controls.transform.value.translate_x.size"

- Organizational and responsive properties are converted similarly.

Always output valid JSON for the V4 widget, preserving structure and nested fields, and recursively convert child elements.

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