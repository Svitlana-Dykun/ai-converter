<?php

namespace AiConvertor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Plugin {
	public function init(): void {
		$this->register_hooks();
	}

	private function register_hooks() {
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
		add_action( 'wp_ajax_ai_convert_container', [ $this, 'handle_ai_convert_container' ] );
	}

	public function enqueue_scripts() {
		// Enqueue axios
		wp_enqueue_script(
			'axios',
			'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
			[],
			'1.6.0',
			true
		);

		// Enqueue our script
		wp_enqueue_script(
			'ai-converter',
			AI_CONVERTER_PLUGIN_URL . 'assets/ai-converter.js',
			[ 'axios' ],
			AI_CONVERTER_VERSION,
			true
		);

		// Localize script with nonce and AJAX URL
		wp_localize_script(
			'ai-converter',
			'aiConverter',
			[
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'ai_converter_nonce' ),
			]
		);
	}

	public function handle_ai_convert_container() {
		// Verify nonce
		if ( ! wp_verify_nonce( $_POST['nonce'], 'ai_converter_nonce' ) ) {
			wp_die( 'Security check failed' );
		}

		// Get the container data
		$container_data = $_POST['container_data'] ?? [];

		// Log the received data (for debugging)
		error_log( 'AI Converter - Container data: ' . print_r( $container_data, true ) );

		// Here you can process the container data
		// Example: Send to AI API, convert to V3 format, etc.
		
		$response = [
			'success' => true,
			'message' => 'Container conversion started',
			'data'    => $container_data
		];

		wp_send_json_success( $response );
	}
}
