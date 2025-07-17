<?php

namespace AiConvertor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class WidgetMappings {
	
	/**
	 * Get comprehensive widget-specific property mappings
	 * 
	 * @return array Widget mappings organized by widget type
	 */
	public static function get_mappings() {
		return [
			'heading' => [
				'widget_type' => 'e-heading',
				'properties' => [
					'title' => [
						'type' => 'content',
						'action' => 'remove_from_settings' // Content is implicit in V4
					],
					'typography_font_family' => [
						'target' => 'styles.props.font-family',
						'type' => 'string'
					],
					'typography_font_size' => [
						'target' => 'styles.props.font-size',
						'type' => 'size'
					],
					'typography_font_weight' => [
						'target' => 'styles.props.font-weight',
						'type' => 'string'
					],
					'title_color' => [
						'target' => 'styles.props.color',
						'type' => 'color'
					],
					'align' => [
						'target' => 'styles.props.text-align',
						'type' => 'string'
					],
					'typography_font_style' => [
						'target' => 'styles.props.font-style',
						'type' => 'string'
					],
					'link' => [
						'target' => 'settings.link',
						'type' => 'link'
					]
				]
			],
			'button' => [
				'widget_type' => 'e-button',
				'properties' => [
					'text' => [
						'target' => 'settings.text',
						'type' => 'string'
					],
					'background_color' => [
						'target' => 'styles.props.background',
						'type' => 'background'
					],
					'button_box_shadow_box_shadow_type' => [
						'target' => 'styles.props.box-shadow',
						'type' => 'shadow'
					],
					'width' => [
						'target' => 'styles.props.width',
						'type' => 'size'
					],
					'height' => [
						'target' => 'styles.props.height',
						'type' => 'size'
					],
					'color' => [
						'target' => 'styles.props.color',
						'type' => 'color'
					],
					'text_align' => [
						'target' => 'styles.props.text-align',
						'type' => 'string'
					],
					'align' => [
						'target' => 'styles.props.text-align',
						'type' => 'string'
					],
					'typography_font_family' => [
						'target' => 'styles.props.font-family',
						'type' => 'string'
					],
					'typography_font_size' => [
						'target' => 'styles.props.font-size',
						'type' => 'size'
					],
					'typography_font_weight' => [
						'target' => 'styles.props.font-weight',
						'type' => 'string'
					],
					'_margin' => [
						'target' => 'styles.props.margin',
						'type' => 'spacing'
					],
					'_padding' => [
						'target' => 'styles.props.padding',
						'type' => 'spacing'
					],
					'_element_width' => [
						'target' => 'styles.props.width',
						'type' => 'size'
					],
					'_element_custom_width' => [
						'target' => 'styles.props.width',
						'type' => 'size'
					],
					'_flex_align_self' => [
						'target' => 'styles.props.align-self',
						'type' => 'string'
					],
					'link' => [
						'target' => 'settings.link',
						'type' => 'link'
					]
				]
			],
			'image' => [
				'widget_type' => 'e-image',
				'properties' => [
					'image' => [
						'target' => 'settings.image',
						'type' => 'image'
					],
					'image_size' => [
						'target' => 'settings.image.size',
						'type' => 'string'
					],
					'image_border_border' => [
						'target' => 'styles.props.border-style',
						'type' => 'string'
					],
					'image_border_width' => [
						'target' => 'styles.props.border-width',
						'type' => 'size'
					],
					'image_border_color' => [
						'target' => 'styles.props.border-color',
						'type' => 'color'
					],
					'align' => [
						'target' => 'styles.props.align-self',
						'type' => 'string'
					]
				]
			],
			'text-editor' => [
				'widget_type' => 'e-paragraph',
				'properties' => [
					'editor' => [
						'target' => 'settings.paragraph',
						'type' => 'string',
						'action' => 'extract_text_content'
					],
					'typography_font_family' => [
						'target' => 'styles.props.font-family',
						'type' => 'string'
					],
					'typography_font_weight' => [
						'target' => 'styles.props.font-weight',
						'type' => 'string'
					],
					'text_color' => [
						'target' => 'styles.props.color',
						'type' => 'color'
					],
					'typography_font_style' => [
						'target' => 'styles.props.font-style',
						'type' => 'string'
					]
				]
			],
			'container' => [
				'widget_type' => 'e-flexbox',
				'properties' => [
					'content_width' => [
						'target' => 'styles.props.flex-direction',
						'type' => 'string',
						'value_map' => [
							'full' => 'column'
						]
					],
					'flex_direction' => [
						'target' => 'styles.props.flex-direction',
						'type' => 'string'
					],
					'justify_content' => [
						'target' => 'styles.props.justify-content',
						'type' => 'string'
					],
					'align_items' => [
						'target' => 'styles.props.align-items',
						'type' => 'string'
					],
					'gap' => [
						'target' => 'styles.props.gap',
						'type' => 'size'
					],
					'padding' => [
						'target' => 'styles.props.padding',
						'type' => 'spacing'
					],
					'margin' => [
						'target' => 'styles.props.margin',
						'type' => 'spacing'
					],
					'background_color' => [
						'target' => 'styles.props.background',
						'type' => 'background'
					]
				]
			]
		];
	}
	
	/**
	 * Get type system mappings for V4 format
	 * 
	 * @return array Type system mappings
	 */
	public static function get_type_mappings() {
		return [
			'string' => [
				'structure' => '{"$$type": "string", "value": "VALUE"}'
			],
			'size' => [
				'structure' => '{"$$type": "size", "value": {"unit": "UNIT", "size": SIZE}}'
			],
			'color' => [
				'structure' => '{"$$type": "color", "value": "VALUE"}'
			],
			'url' => [
				'structure' => '{"$$type": "url", "value": "VALUE"}'
			],
			'image' => [
				'structure' => '{"$$type": "image", "value": {"src": {"$$type": "image-src", "value": {"id": {"$$type": "image-attachment-id", "value": ID}, "url": {"$$type": "url", "value": "URL"}}}, "size": {"$$type": "string", "value": "SIZE"}}}'
			],
			'link' => [
				'structure' => '{"$$type": "link", "value": {"destination": {"$$type": "url", "value": "URL"}, "label": {"$$type": "string", "value": "LABEL"}}}'
			],
			'classes' => [
				'structure' => '{"$$type": "classes", "value": ["CLASS_NAME"]}'
			],
			'background' => [
				'structure' => '{"$$type": "background", "value": {"color": {"$$type": "color", "value": "COLOR"}}}'
			],
			'background_overlay' => [
				'structure' => '{"$$type": "background", "value": {"background-overlay": {"$$type": "background-overlay", "value": []}}}'
			],
			'spacing' => [
				'structure' => '{"$$type": "size", "value": {"unit": "UNIT", "size": SIZE}}'
			],
			'shadow' => [
				'structure' => '{"$$type": "shadow", "value": {"horizontal": HORIZONTAL, "vertical": VERTICAL, "blur": BLUR, "spread": SPREAD, "color": "COLOR"}}'
			]
		];
	}
	
	/**
	 * Get style class structure template
	 * 
	 * @param string $class_id
	 * @return array Style class structure
	 */
	public static function get_style_class_structure( $class_id ) {
		return [
			'id' => $class_id,
			'label' => 'local',
			'type' => 'class',
			'variants' => [
				[
					'meta' => [
						'breakpoint' => 'desktop',
						'state' => null
					],
					'props' => []
				]
			]
		];
	}
	
	/**
	 * Get required output structure template
	 * 
	 * @param string $element_id
	 * @param string $widget_type
	 * @param string $el_type
	 * @return array Output structure template
	 */
	public static function get_output_structure( $element_id, $widget_type = null, $el_type = 'widget' ) {
		$structure = [
			'id' => $element_id,
			'settings' => [],
			'elements' => [],
			'isInner' => false,
			'elType' => $el_type,
			'styles' => [],
			'editor_settings' => [],
			'version' => '0.0'
		];
		
		if ( $widget_type ) {
			$structure['widgetType'] = $widget_type;
		}
		
		return $structure;
	}
	
	/**
	 * Generate style class name
	 * 
	 * @param string $element_id
	 * @param string $hash Optional hash
	 * @return string Style class name
	 */
	public static function generate_style_class_name( $element_id, $hash = null ) {
		if ( ! $hash ) {
			$hash = substr( md5( $element_id . time() ), 0, 7 );
		}
		
		return "e-{$element_id}-{$hash}";
	}
	
	/**
	 * Extract text content from HTML editor field
	 * 
	 * @param string $html_content
	 * @return string Plain text content
	 */
	public static function extract_text_content( $html_content ) {
		// Remove HTML tags and decode entities
		$text = wp_strip_all_tags( $html_content );
		$text = html_entity_decode( $text, ENT_QUOTES, 'UTF-8' );
		
		return trim( $text );
	}
	
	/**
	 * Convert V3 link format to V4 format
	 * 
	 * @param array $v3_link
	 * @return array V4 link format
	 */
	public static function convert_link_format( $v3_link ) {
		$url = isset( $v3_link['url'] ) ? $v3_link['url'] : '';
		$label = isset( $v3_link['label'] ) ? $v3_link['label'] : '';
		
		// Handle www. prefix
		if ( strpos( $url, 'www.' ) === 0 ) {
			$url = 'http://' . $url;
		}
		
		return [
			'$$type' => 'link',
			'value' => [
				'destination' => [
					'$$type' => 'url',
					'value' => $url
				],
				'label' => [
					'$$type' => 'string',
					'value' => $label
				]
			]
		];
	}
	
	/**
	 * Convert V3 image format to V4 format
	 * 
	 * @param array $v3_image
	 * @return array V4 image format
	 */
	public static function convert_image_format( $v3_image ) {
		$image_id = isset( $v3_image['id'] ) ? $v3_image['id'] : 0;
		$image_url = isset( $v3_image['url'] ) ? $v3_image['url'] : '';
		$image_size = isset( $v3_image['size'] ) ? $v3_image['size'] : 'medium';
		
		return [
			'$$type' => 'image',
			'value' => [
				'src' => [
					'$$type' => 'image-src',
					'value' => [
						'id' => [
							'$$type' => 'image-attachment-id',
							'value' => $image_id
						],
						'url' => [
							'$$type' => 'url',
							'value' => $image_url
						]
					]
				],
				'size' => [
					'$$type' => 'string',
					'value' => $image_size
				]
			]
		];
	}
} 