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
	}

	public function enqueue_scripts() {
		// Enqueue our script
		wp_enqueue_script(
			'ai-converter',
			AI_CONVERTER_PLUGIN_URL . 'assets/ai-converter.js',
			[],
			AI_CONVERTER_VERSION,
			true
		);
	}
}
