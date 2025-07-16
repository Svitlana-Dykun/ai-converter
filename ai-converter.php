<?php

/**
 * Plugin Name: AI Converter
 * Description: The AI Converter plugin seamlessly transforms Elementor V3 widgets into the new V4 widget format.
 * Version: 1.0.0
 * Requires at least: 6.2
 * Author: The Converter's Team
 * Text Domain: ai-converter
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'AI_CONVERTER_PLUGIN_URL', plugins_url( '/', __FILE__ ) );
define( 'AI_CONVERTER_VERSION', '1.0.0' );

require_once __DIR__ . '/vendor/autoload.php';

$plugin = new AiConvertor\Plugin();

$plugin->init();
