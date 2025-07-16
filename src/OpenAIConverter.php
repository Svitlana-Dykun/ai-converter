<?php

namespace AiConvertor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

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
		
		return $converted_widget;
	}
	
	private function call_openai_api( $messages ) {
		$data = [
			'model' => 'gpt-4o-mini',
			'temperature' => 0,
			'max_tokens' => 500,
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
		';
	}
	
	private function get_training_examples() {
		$examples = [];
		
		// Load training examples from JSON files (same as Node.js)
		$plugin_dir = plugin_dir_path( __DIR__ );
		
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
		
		return $examples;
	}
} 