<?php

namespace AiConvertor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Plugin {
	const N8N_WEBHOOK_URL = 'https://batsirai.app.n8n.cloud/webhook-test/bdf08a9d-9505-4003-983c-1e0dcf93dfc2';

	public function init(): void {
		$this->register_hooks();
	}

	private function register_hooks() {
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	public function enqueue_scripts() {

		wp_enqueue_script(
			'axios',
			'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
			[],
			'1.10.0',
			true
		);

		wp_enqueue_script(
			'ai-converter',
			AI_CONVERTER_PLUGIN_URL . 'assets/ai-converter.js',
			[ 'axios' ],
			AI_CONVERTER_VERSION,
			true
		);

		wp_localize_script(
			'ai-converter',
			'aiConverter',
			[
				'webhookUrl' => self::N8N_WEBHOOK_URL,
			]
		);
	}
}
