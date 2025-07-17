<?php

namespace AiConvertor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

require_once __DIR__ . '/OpenAIConverter.php';
require_once __DIR__ . '/AdminSettings.php';

class Plugin {
	
	public function init(): void {
		$this->register_hooks();
		
		// Initialize admin settings
		if ( is_admin() ) {
			new AdminSettings();
		}
	}

	private function register_hooks() {
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
		add_action( 'elementor/editor/after_enqueue_styles', [ $this, 'enqueue_styles' ] );
		add_action( 'wp_ajax_ai_converter_convert', [ $this, 'handle_conversion' ] );
		add_action( 'wp_ajax_nopriv_ai_converter_convert', [ $this, 'handle_conversion' ] );
		add_action( 'wp_ajax_ai_converter_feedback', [ $this, 'handle_feedback' ] );
		add_action( 'wp_ajax_nopriv_ai_converter_feedback', [ $this, 'handle_feedback' ] );
	}

	public function enqueue_scripts() {
		wp_enqueue_script(
			'ai-converter',
			AI_CONVERTER_PLUGIN_URL . 'assets/ai-converter.js',
			[ 'jquery' ],
			AI_CONVERTER_VERSION,
			true
		);

		wp_localize_script(
			'ai-converter',
			'aiConverter',
			[
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce' => wp_create_nonce( 'ai_converter_nonce' ),
			]
		);
	}

	public function enqueue_styles() {
		wp_enqueue_style(
			'ai-converter-satisfaction',
			AI_CONVERTER_PLUGIN_URL . 'assets/ai-converter-satisfaction.css',
			[],
			AI_CONVERTER_VERSION
		);
	}

	public function handle_conversion() {
		// Verify nonce for security
		if ( ! wp_verify_nonce( $_POST['nonce'], 'ai_converter_nonce' ) ) {
			wp_die( 'Security check failed' );
		}

		// Get the container data from the request
		$container_data = json_decode( stripslashes( $_POST['container_data'] ), true );
		
		if ( ! $container_data ) {
			wp_send_json_error( 'Invalid container data' );
		}

		try {
			$converter = new OpenAIConverter();
			$converted_widget = $converter->convert_widget( $container_data );
			
			wp_send_json_success( $converted_widget );
		} catch ( \Exception $e ) {
			error_log( 'AI Converter Error: ' . $e->getMessage() );
			wp_send_json_error( 'Conversion failed: ' . $e->getMessage() );
		}
	}

	public function handle_feedback() {
		// Verify nonce for security
		if ( ! wp_verify_nonce( $_POST['nonce'], 'ai_converter_nonce' ) ) {
			wp_die( 'Security check failed' );
		}

		// Get the feedback data from the request
		$feedback_data = json_decode( stripslashes( $_POST['feedback_data'] ), true );
		
		if ( ! $feedback_data ) {
			wp_send_json_error( 'Invalid feedback data' );
		}

		// Log feedback to a custom table or file
		$this->log_feedback( $feedback_data );
		
		wp_send_json_success( 'Feedback received' );
	}

	private function log_feedback( $feedback_data ) {
		// Log to WordPress log
		error_log( 'AI Converter Feedback: ' . wp_json_encode( $feedback_data ) );
		
		// Optional: Store in database
		// You could create a custom table to store feedback data
		// $this->store_feedback_in_database( $feedback_data );
	}
}
