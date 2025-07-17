<?php

namespace AiConvertor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once __DIR__ . '/WidgetMappings.php';

class OpenAIConverter {
	
	private $api_key;
	private $api_url = 'https://api.openai.com/v1/chat/completions';
	
	public function __construct() {
		// Get OpenAI API key from WordPress options or environment
		$this->api_key = get_option( 'ai_converter_openai_key', '' );
		
		if ( empty( $this->api_key ) ) {
			throw new \Exception( 'OpenAI API key not configured' );
		}
	}
	
	public function convert_widget( $container_data ) {
		// Use the ACTUAL container data from Elementor (not hardcoded file)
		// But keep the same OpenAI API structure as Node.js version
		
		$system_prompt = $this->get_system_prompt();
		$examples = $this->get_training_examples();
		
		// Build the messages array exactly like Node.js version
		$messages = [
			[ 'role' => 'system', 'content' => $system_prompt ]
		];
		
		// Add training examples exactly like Node.js
		foreach ( $examples as $example ) {
			$messages[] = [ 'role' => 'user', 'content' => json_encode( $example['v3'] ) ];
			$messages[] = [ 'role' => 'assistant', 'content' => json_encode( $example['v4'] ) ];
		}
		
		// Add the ACTUAL container data from Elementor (not hardcoded file)
		$messages[] = [ 'role' => 'user', 'content' => json_encode( $container_data ) ];
		
		$response = $this->call_openai_api( $messages );
		
		if ( ! $response ) {
			throw new \Exception( 'Failed to get response from OpenAI API' );
		}
		
		$converted_widget = json_decode( $response, true );
		
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			throw new \Exception( 'Invalid JSON response from OpenAI API' );
		}
		
		// Validate that nested elements are properly converted
		$this->validate_nested_conversion( $converted_widget );
		
		return $converted_widget;
	}
	
	private function validate_nested_conversion( $element ) {
		// Ensure the element has the basic V4 structure
		if ( ! isset( $element['elType'] ) ) {
			throw new \Exception( 'Converted element missing elType' );
		}
		
		// Validate basic required fields
		$required_fields = ['id', 'settings', 'elements', 'isInner', 'elType', 'styles', 'editor_settings', 'version'];
		foreach ( $required_fields as $field ) {
			if ( ! isset( $element[$field] ) ) {
				throw new \Exception( "Converted element missing required field: {$field}" );
			}
		}
		
		// Validate widget-specific requirements
		if ( $element['elType'] === 'widget' ) {
			if ( ! isset( $element['widgetType'] ) ) {
				throw new \Exception( 'Widget element missing widgetType' );
			}
			
			// Check if widget type has "e-" prefix
			if ( strpos( $element['widgetType'], 'e-' ) !== 0 ) {
				throw new \Exception( 'Widget type should have "e-" prefix: ' . $element['widgetType'] );
			}
			
			// Validate widget-specific settings
			$this->validate_widget_settings( $element );
		}
		
		// Validate settings structure
		if ( isset( $element['settings'] ) && is_array( $element['settings'] ) ) {
			$this->validate_settings_structure( $element['settings'] );
		}
		
		// Validate styles structure
		if ( isset( $element['styles'] ) && is_array( $element['styles'] ) ) {
			$this->validate_styles_structure( $element['styles'] );
		}
		
		// If element has children, validate them recursively
		if ( isset( $element['elements'] ) && is_array( $element['elements'] ) ) {
			foreach ( $element['elements'] as $child ) {
				$this->validate_nested_conversion( $child );
			}
		}
		
		return true;
	}
	
	private function validate_widget_settings( $element ) {
		$widget_type = str_replace( 'e-', '', $element['widgetType'] );
		$mappings = WidgetMappings::get_mappings();
		
		// If we don't have specific mappings for this widget type, skip validation
		if ( ! isset( $mappings[$widget_type] ) ) {
			return true;
		}
		
		$settings = $element['settings'];
		
		// Validate that classes are properly formatted
		if ( isset( $settings['classes'] ) ) {
			if ( ! $this->validate_type_structure( $settings['classes'], 'classes' ) ) {
				throw new \Exception( 'Invalid classes structure in settings' );
			}
		}
		
		// Validate widget-specific settings
		switch ( $widget_type ) {
			case 'heading':
				// Heading should have link if present
				if ( isset( $settings['link'] ) && ! $this->validate_type_structure( $settings['link'], 'link' ) ) {
					throw new \Exception( 'Invalid link structure in heading settings' );
				}
				break;
				
			case 'button':
				// Button should have text and link
				if ( isset( $settings['text'] ) && ! $this->validate_type_structure( $settings['text'], 'string' ) ) {
					throw new \Exception( 'Invalid text structure in button settings' );
				}
				if ( isset( $settings['link'] ) && ! $this->validate_type_structure( $settings['link'], 'link' ) ) {
					throw new \Exception( 'Invalid link structure in button settings' );
				}
				break;
				
			case 'image':
				// Image should have proper image structure
				if ( isset( $settings['image'] ) && ! $this->validate_type_structure( $settings['image'], 'image' ) ) {
					throw new \Exception( 'Invalid image structure in image settings' );
				}
				break;
				
			case 'paragraph':
				// Paragraph should have text content
				if ( isset( $settings['paragraph'] ) && ! $this->validate_type_structure( $settings['paragraph'], 'string' ) ) {
					throw new \Exception( 'Invalid paragraph structure in text settings' );
				}
				break;
		}
		
		return true;
	}
	
	private function validate_settings_structure( $settings ) {
		foreach ( $settings as $key => $value ) {
			if ( is_array( $value ) && isset( $value['$$type'] ) ) {
				if ( ! $this->validate_type_structure( $value, $value['$$type'] ) ) {
					throw new \Exception( "Invalid type structure for setting: {$key}" );
				}
			}
		}
		
		return true;
	}
	
	private function validate_styles_structure( $styles ) {
		foreach ( $styles as $class_name => $style_data ) {
			// Check if style class has proper structure
			$required_style_fields = ['id', 'label', 'type', 'variants'];
			foreach ( $required_style_fields as $field ) {
				if ( ! isset( $style_data[$field] ) ) {
					throw new \Exception( "Style class {$class_name} missing required field: {$field}" );
				}
			}
			
			// Validate variants structure
			if ( isset( $style_data['variants'] ) && is_array( $style_data['variants'] ) ) {
				foreach ( $style_data['variants'] as $variant ) {
					if ( ! isset( $variant['meta'] ) || ! isset( $variant['props'] ) ) {
						throw new \Exception( "Style variant missing meta or props in class: {$class_name}" );
					}
					
					// Validate props have proper type structures
					if ( is_array( $variant['props'] ) ) {
						foreach ( $variant['props'] as $prop_name => $prop_value ) {
							if ( is_array( $prop_value ) && isset( $prop_value['$$type'] ) ) {
								if ( ! $this->validate_type_structure( $prop_value, $prop_value['$$type'] ) ) {
									throw new \Exception( "Invalid type structure for style property: {$prop_name}" );
								}
							}
						}
					}
				}
			}
		}
		
		return true;
	}
	
	private function validate_type_structure( $data, $expected_type ) {
		if ( ! is_array( $data ) || ! isset( $data['$$type'] ) || ! isset( $data['value'] ) ) {
			return false;
		}
		
		if ( $data['$$type'] !== $expected_type ) {
			return false;
		}
		
		// Type-specific validation
		switch ( $expected_type ) {
			case 'string':
				return is_string( $data['value'] );
				
			case 'size':
				return is_array( $data['value'] ) 
					&& isset( $data['value']['unit'] ) 
					&& isset( $data['value']['size'] );
					
			case 'color':
				return is_string( $data['value'] ) && preg_match( '/^#[0-9a-fA-F]{6}$/', $data['value'] );
				
			case 'url':
				return is_string( $data['value'] ) && filter_var( $data['value'], FILTER_VALIDATE_URL );
				
			case 'classes':
				return is_array( $data['value'] );
				
			case 'link':
				return is_array( $data['value'] ) 
					&& isset( $data['value']['destination'] ) 
					&& isset( $data['value']['label'] );
					
			case 'image':
				return is_array( $data['value'] ) 
					&& isset( $data['value']['src'] ) 
					&& isset( $data['value']['size'] );
					
			case 'background':
				return is_array( $data['value'] );
				
			default:
				return true; // Allow unknown types
		}
	}
	
	private function call_openai_api( $messages ) {
		$data = [
			'model' => 'gpt-4o-mini',
			'temperature' => 0,
			'max_tokens' => 1000, // Increased for complex conversions
			'messages' => $messages
		];
		
		$args = [
			'headers' => [
				'Content-Type' => 'application/json',
				'Authorization' => 'Bearer ' . $this->api_key,
			],
			'body' => json_encode( $data ),
			'timeout' => 30,
		];
		
		$response = wp_remote_post( $this->api_url, $args );
		
		if ( is_wp_error( $response ) ) {
			throw new \Exception( 'HTTP request failed: ' . $response->get_error_message() );
		}
		
		$response_body = wp_remote_retrieve_body( $response );
		$response_data = json_decode( $response_body, true );
		
		if ( ! isset( $response_data['choices'][0]['message']['content'] ) ) {
			throw new \Exception( 'Invalid response format from OpenAI API' );
		}
		
		return $response_data['choices'][0]['message']['content'];
	}
	
	private function get_system_prompt() {
		return '
You are an expert Elementor V3 to V4 converter specializing in complex widget transformations with advanced type systems and class-based styling.

## CRITICAL REQUIREMENT: PRESERVE ALL NESTED ELEMENTS
When converting containers with child elements, you MUST:
1. Convert the parent container to V4 format
2. Convert ALL child elements to V4 format
3. Place converted child elements in the parent\'s "elements" array
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
   - Place converted child in parent\'s V4 "elements" array
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
		';
	}
	
	private function get_training_examples() {
		$examples = [];
		
		// Load training examples from JSON files (same as Node.js)
		$plugin_dir = plugin_dir_path( __DIR__ );
		
		// Load original training examples
		for ( $i = 1; $i <= 3; $i++ ) {
			$v3_file = $plugin_dir . "assets/chat/container-v3-{$i}.json";
			$v4_file = $plugin_dir . "assets/chat/container-v4-{$i}.json";
			
			if ( file_exists( $v3_file ) && file_exists( $v4_file ) ) {
				$v3_data = json_decode( file_get_contents( $v3_file ), true );
				$v4_data = json_decode( file_get_contents( $v4_file ), true );
				
				if ( $v3_data && $v4_data ) {
					$examples[] = [
						'v3' => $v3_data,
						'v4' => $v4_data
					];
				}
			}
		}
		
		// Load complex training examples
		$complex_v3_file = $plugin_dir . "assets/chat/complexV3.json";
		$complex_v4_file = $plugin_dir . "assets/chat/complexV4.json";
		
		if ( file_exists( $complex_v3_file ) && file_exists( $complex_v4_file ) ) {
			$complex_v3_data = json_decode( file_get_contents( $complex_v3_file ), true );
			$complex_v4_data = json_decode( file_get_contents( $complex_v4_file ), true );
			
			if ( $complex_v3_data && $complex_v4_data ) {
				$examples[] = [
					'v3' => $complex_v3_data,
					'v4' => $complex_v4_data
				];
			}
		}
		
		// Load container heading button training examples
		$container_heading_button_v3_file = $plugin_dir . "assets/chat/ContainerHeadingButtonV3-1.json";
		$container_heading_button_v4_file = $plugin_dir . "assets/chat/ContainerHeadingButtonV4-1.json";
		
		if ( file_exists( $container_heading_button_v3_file ) && file_exists( $container_heading_button_v4_file ) ) {
			$container_heading_button_v3_data = json_decode( file_get_contents( $container_heading_button_v3_file ), true );
			$container_heading_button_v4_data = json_decode( file_get_contents( $container_heading_button_v4_file ), true );
			
			if ( $container_heading_button_v3_data && $container_heading_button_v4_data ) {
				$examples[] = [
					'v3' => $container_heading_button_v3_data,
					'v4' => $container_heading_button_v4_data
				];
			}
		}
		
		return $examples;
	}
} 